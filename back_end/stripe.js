import express from 'express';
import Stripe from 'stripe';
import { authenticateToken, connection } from './app.js';
import notificationQueue from './queues/notificationQueue.js';

let _stripe;
function getStripe() {
    if (!_stripe) _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    return _stripe;
}

export const stripeRouter = express.Router();

// ────────────────────────────────────────────────────────────
// Helper: get-or-create a Stripe Customer for the current user
// ────────────────────────────────────────────────────────────
async function getOrCreateStripeCustomer(userId, email) {
    const [[user]] = await connection.query(
        'SELECT stripe_customer_id FROM users WHERE user_id = ?',
        [userId]
    );

    if (user?.stripe_customer_id) {
        return user.stripe_customer_id;
    }

    const customer = await getStripe().customers.create({ email, metadata: { user_id: String(userId) } });

    await connection.execute(
        'UPDATE users SET stripe_customer_id = ? WHERE user_id = ?',
        [customer.id, userId]
    );

    return customer.id;
}

// ────────────────────────────────────────────────────────────
// POST /api/stripe/create-subscription
// Step 1: Creates a SetupIntent so the frontend can collect
// payment details via Stripe Elements.  The actual subscription
// is created in /activate-subscription after the user's card is
// saved.
// ────────────────────────────────────────────────────────────
stripeRouter.post('/create-subscription', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const email = req.user.email;

        // Prevent double-subscribing
        const [[existing]] = await connection.query(
            'SELECT subscription_id, status FROM user_subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );
        if (existing) {
            return res.status(400).json({ error: 'You already have an active subscription.' });
        }

        const customerId = await getOrCreateStripeCustomer(userId, email);

        // Create a SetupIntent to collect the payment method
        const setupIntent = await getStripe().setupIntents.create({
            customer: customerId,
            payment_method_types: ['card'],
            metadata: { user_id: String(userId) },
        });

        return res.status(200).json({
            clientSecret: setupIntent.client_secret,
            type: 'setup',
        });
    } catch (error) {
        console.error('create-subscription error:', error);
        return res.status(500).json({ error: 'Failed to start subscription setup' });
    }
});

// ────────────────────────────────────────────────────────────
// POST /api/stripe/activate-subscription
// Step 2: Called by the frontend after the SetupIntent succeeds.
// Creates the actual subscription using the customer's saved
// payment method, which charges immediately.
// ────────────────────────────────────────────────────────────
stripeRouter.post('/activate-subscription', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const email = req.user.email;

        // Prevent double-subscribing
        const [[existing]] = await connection.query(
            'SELECT subscription_id, status FROM user_subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );
        if (existing) {
            return res.status(400).json({ error: 'You already have an active subscription.' });
        }

        const customerId = await getOrCreateStripeCustomer(userId, email);

        // Retrieve the customer's most recent payment method
        const paymentMethods = await getStripe().paymentMethods.list({
            customer: customerId,
            type: 'card',
            limit: 1,
        });

        if (paymentMethods.data.length === 0) {
            return res.status(400).json({ error: 'No payment method found. Please try again.' });
        }

        const paymentMethodId = paymentMethods.data[0].id;

        // Set the default payment method on the customer
        await getStripe().customers.update(customerId, {
            invoice_settings: { default_payment_method: paymentMethodId },
        });

        // Create the subscription — charges immediately using the saved card
        const subscription = await getStripe().subscriptions.create({
            customer: customerId,
            items: [{ price: process.env.STRIPE_MEMBERSHIP_PRICE_ID }],
        });

        // Upsert local record
        await connection.query(
            `INSERT INTO user_subscriptions
                (user_id, stripe_customer_id, stripe_subscription_id, status)
             VALUES (?, ?, ?, 'active')
             ON DUPLICATE KEY UPDATE
                stripe_customer_id = VALUES(stripe_customer_id),
                stripe_subscription_id = VALUES(stripe_subscription_id),
                status = 'active'`,
            [userId, customerId, subscription.id]
        );

        return res.status(200).json({ ok: true, subscriptionId: subscription.id });
    } catch (error) {
        console.error('activate-subscription error:', error);
        return res.status(500).json({ error: 'Failed to activate subscription' });
    }
});

// ────────────────────────────────────────────────────────────
// POST /api/stripe/buy-ticket/:showcaseId
// Creates a PaymentIntent ($30) for a one-off showcase ticket.
// The actual ticket row is created by the webhook when payment
// succeeds.
// ────────────────────────────────────────────────────────────
stripeRouter.post('/buy-ticket/:showcaseId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const email = req.user.email;
        const { showcaseId } = req.params;

        // Check showcase exists
        const [[showcase]] = await connection.query(
            'SELECT showcase_id FROM showcases WHERE showcase_id = ?',
            [showcaseId]
        );
        if (!showcase) {
            return res.status(404).json({ error: 'Showcase not found' });
        }

        // Check user doesn't already have a ticket
        const [[existingTicket]] = await connection.query(
            'SELECT ticket_id FROM showcase_tickets WHERE showcase_id = ? AND user_id = ? AND ticket_status != "cancelled"',
            [showcaseId, userId]
        );
        if (existingTicket) {
            return res.status(400).json({ error: 'You already have a ticket for this showcase.' });
        }

        const customerId = await getOrCreateStripeCustomer(userId, email);

        const paymentIntent = await getStripe().paymentIntents.create({
            amount: 3000, // $30.00
            currency: 'usd',
            customer: customerId,
            metadata: {
                type: 'showcase_ticket',
                showcase_id: String(showcaseId),
                user_id: String(userId),
            },
        });

        return res.status(200).json({
            clientSecret: paymentIntent.client_secret,
        });
    } catch (error) {
        console.error('buy-ticket error:', error);
        return res.status(500).json({ error: 'Failed to create payment' });
    }
});

// ────────────────────────────────────────────────────────────
// POST /api/stripe/confirm-ticket/:showcaseId
// Called by the frontend after the PaymentIntent succeeds on
// the client side.  Creates the ticket row immediately so the
// user doesn't have to wait for the async webhook.
// Idempotent — the webhook's INSERT IGNORE will be a no-op.
// ────────────────────────────────────────────────────────────
stripeRouter.post('/confirm-ticket/:showcaseId', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;
        const { showcaseId } = req.params;
        const { paymentIntentId } = req.body;

        // Check for existing non-cancelled ticket
        const [[existing]] = await connection.query(
            'SELECT ticket_id, ticket_status, ticket_type FROM showcase_tickets WHERE showcase_id = ? AND user_id = ? AND ticket_status != "cancelled"',
            [showcaseId, userId]
        );
        if (existing) {
            return res.status(200).json({ ticket: existing });
        }

        const [result] = await connection.query(
            `INSERT IGNORE INTO showcase_tickets
                (showcase_id, user_id, ticket_type, ticket_status, stripe_payment_intent_id, price_paid)
             VALUES (?, ?, 'one_off', 'confirmed', ?, 30.00)`,
            [showcaseId, userId, paymentIntentId || null]
        );

        return res.status(201).json({
            ticket: { ticket_id: result.insertId, ticket_status: 'confirmed', ticket_type: 'one_off' }
        });
    } catch (error) {
        console.error('confirm-ticket error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ────────────────────────────────────────────────────────────
// GET /api/stripe/subscription-status
// Returns the current user's subscription info.
// ────────────────────────────────────────────────────────────
stripeRouter.get('/subscription-status', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [[sub]] = await connection.query(
            'SELECT plan, status, current_period_end FROM user_subscriptions WHERE user_id = ?',
            [userId]
        );

        if (!sub) {
            return res.status(200).json({ subscribed: false });
        }

        return res.status(200).json({
            subscribed: sub.status === 'active',
            plan: sub.plan,
            status: sub.status,
            currentPeriodEnd: sub.current_period_end,
        });
    } catch (error) {
        console.error('subscription-status error:', error);
        return res.status(500).json({ error: 'Failed to fetch subscription status' });
    }
});

// ────────────────────────────────────────────────────────────
// POST /api/stripe/cancel-subscription
// Cancels the subscription at period end.
// ────────────────────────────────────────────────────────────
stripeRouter.post('/cancel-subscription', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [[sub]] = await connection.query(
            'SELECT stripe_subscription_id FROM user_subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );

        if (!sub?.stripe_subscription_id) {
            return res.status(400).json({ error: 'No active subscription found.' });
        }

        await getStripe().subscriptions.update(sub.stripe_subscription_id, {
            cancel_at_period_end: true,
        });

        return res.status(200).json({ ok: true, message: 'Subscription will cancel at period end.' });
    } catch (error) {
        console.error('cancel-subscription error:', error);
        return res.status(500).json({ error: 'Failed to cancel subscription' });
    }
});

// ────────────────────────────────────────────────────────────
// POST /api/stripe/webhook
// Stripe webhook handler.  IMPORTANT: this must receive the
// raw body (not JSON-parsed) for signature verification.
// The raw-body middleware is set up in app.js for this route.
// ────────────────────────────────────────────────────────────
stripeRouter.post('/webhook', async (req, res) => {
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = getStripe().webhooks.constructEvent(
            req.body, // must be raw Buffer
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        switch (event.type) {
            // ── Subscription paid (first or recurring) ─────────
            case 'invoice.paid': {
                const invoice = event.data.object;
                const stripeCustomerId = invoice.customer;
                const subscriptionId = invoice.subscription;

                if (!subscriptionId) break; // not a subscription invoice

                const subscription = await getStripe().subscriptions.retrieve(subscriptionId);
                const periodEnd = new Date(subscription.current_period_end * 1000);

                await connection.execute(
                    `UPDATE user_subscriptions
                     SET status = 'active', current_period_end = ?
                     WHERE stripe_subscription_id = ?`,
                    [periodEnd, subscriptionId]
                );

                console.log(`[webhook] invoice.paid — subscription ${subscriptionId} now active until ${periodEnd.toISOString()}`);
                break;
            }

            // ── Subscription deleted ──────────────────────────
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                await connection.execute(
                    `UPDATE user_subscriptions SET status = 'cancelled' WHERE stripe_subscription_id = ?`,
                    [sub.id]
                );
                console.log(`[webhook] subscription.deleted — ${sub.id} cancelled`);
                break;
            }

            // ── Subscription updated (e.g. past_due) ─────────
            case 'customer.subscription.updated': {
                const sub = event.data.object;
                const statusMap = {
                    active: 'active',
                    past_due: 'past_due',
                    canceled: 'cancelled',
                    incomplete: 'incomplete',
                    incomplete_expired: 'cancelled',
                    unpaid: 'past_due',
                };
                const localStatus = statusMap[sub.status] || 'incomplete';

                await connection.execute(
                    `UPDATE user_subscriptions SET status = ? WHERE stripe_subscription_id = ?`,
                    [localStatus, sub.id]
                );
                console.log(`[webhook] subscription.updated — ${sub.id} → ${localStatus}`);
                break;
            }

            // ── One-off ticket payment succeeded ──────────────
            case 'payment_intent.succeeded': {
                const pi = event.data.object;

                if (pi.metadata?.type !== 'showcase_ticket') break;

                const showcaseId = Number(pi.metadata.showcase_id);
                const userId = Number(pi.metadata.user_id);

                // Idempotent insert (UNIQUE KEY on showcase_id + user_id)
                await connection.query(
                    `INSERT IGNORE INTO showcase_tickets
                        (showcase_id, user_id, ticket_type, ticket_status, stripe_payment_intent_id, price_paid)
                     VALUES (?, ?, 'one_off', 'confirmed', ?, 30.00)`,
                    [showcaseId, userId, pi.id]
                );
                console.log(`[webhook] payment_intent.succeeded — ticket created for showcase ${showcaseId}, user ${userId}`);

                // Notify user about their new ticket
                try {
                    await notificationQueue.add('showcaseTicket', { showcaseId, userId });
                } catch (notifErr) {
                    console.error('Failed to enqueue showcaseTicket notification:', notifErr.message);
                }
                break;
            }

            default:
                console.log(`[webhook] Unhandled event type: ${event.type}`);
        }
    } catch (err) {
        console.error(`[webhook] Error processing ${event.type}:`, err);
        // Still return 200 so Stripe doesn't retry
    }

    return res.status(200).json({ received: true });
});
