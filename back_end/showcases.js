import express from 'express';
import { authenticateToken, authenticateTokenAdmin, connection } from './app.js';
import notificationQueue from './queues/notificationQueue.js';

export const showcasesRouter = express.Router();

// ── GET /api/showcases ─────────────────────────────────────
// List all showcases with the current user's ticket status.
showcasesRouter.get('', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.user_id;

        const [rows] = await connection.query(
            `SELECT s.*,
                    st.ticket_id,
                    st.ticket_type,
                    st.ticket_status
             FROM showcases s
             LEFT JOIN showcase_tickets st
                    ON s.showcase_id = st.showcase_id AND st.user_id = ?
             ORDER BY s.showcase_date DESC`,
            [userId]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('GET showcases error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── GET /api/showcases/:showcaseId ─────────────────────────
// Single showcase with its linked workshops.
showcasesRouter.get('/:showcaseId', authenticateToken, async (req, res) => {
    try {
        const { showcaseId } = req.params;
        const userId = req.user.user_id;

        const [[showcase]] = await connection.query(
            `SELECT s.*,
                    st.ticket_id,
                    st.ticket_type,
                    st.ticket_status
             FROM showcases s
             LEFT JOIN showcase_tickets st
                    ON s.showcase_id = st.showcase_id AND st.user_id = ?
             WHERE s.showcase_id = ?`,
            [userId, showcaseId]
        );

        if (!showcase) {
            return res.status(404).json({ error: 'Showcase not found' });
        }

        const [workshops] = await connection.query(
            'SELECT * FROM workshops WHERE showcase_id = ? ORDER BY workshop_date ASC',
            [showcaseId]
        );

        return res.status(200).json({ ...showcase, workshops });
    } catch (error) {
        console.error('GET showcase error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /api/showcases (admin) ────────────────────────────
showcasesRouter.post('', authenticateTokenAdmin, async (req, res) => {
    try {
        const { showcase_name, showcase_description, showcase_date, showcase_location } = req.body;

        const [result] = await connection.query(
            'INSERT INTO showcases (showcase_name, showcase_description, showcase_date, showcase_location) VALUES (?, ?, ?, ?)',
            [showcase_name, showcase_description, showcase_date, showcase_location]
        );

        const newShowcaseId = result.insertId;

        // Notify non-subscribers about the new showcase
        try {
            await notificationQueue.add('newShowcase', { showcaseId: newShowcaseId });
        } catch (notifErr) {
            console.error('Failed to enqueue newShowcase notification:', notifErr.message);
        }

        // Check if there's a pending monthly showcase notification for this month
        try {
            await notificationQueue.add('showcaseCreatedFallback', { showcaseId: newShowcaseId });
        } catch (notifErr) {
            console.error('Failed to enqueue showcaseCreatedFallback:', notifErr.message);
        }

        return res.status(201).json({ showcase_id: newShowcaseId });
    } catch (error) {
        console.error('POST showcase error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── PUT /api/showcases/:showcaseId (admin) ─────────────────
showcasesRouter.put('/:showcaseId', authenticateTokenAdmin, async (req, res) => {
    try {
        const { showcaseId } = req.params;
        const { showcase_name, showcase_description, showcase_date, showcase_location, showcase_status } = req.body;

        await connection.execute(
            `UPDATE showcases
             SET showcase_name = COALESCE(?, showcase_name),
                 showcase_description = COALESCE(?, showcase_description),
                 showcase_date = COALESCE(?, showcase_date),
                 showcase_location = COALESCE(?, showcase_location),
                 showcase_status = COALESCE(?, showcase_status)
             WHERE showcase_id = ?`,
            [showcase_name, showcase_description, showcase_date, showcase_location, showcase_status, showcaseId]
        );

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('PUT showcase error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── PUT /api/showcases/:showcaseId/workshops/:workshopId (admin)
// Assign an existing workshop to a showcase.
showcasesRouter.put('/:showcaseId/workshops/:workshopId', authenticateTokenAdmin, async (req, res) => {
    try {
        const { showcaseId, workshopId } = req.params;

        const [result] = await connection.execute(
            'UPDATE workshops SET showcase_id = ? WHERE workshop_id = ?',
            [showcaseId, workshopId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Workshop not found' });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('PUT assign workshop error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── DELETE /api/showcases/:showcaseId/workshops/:workshopId (admin)
// Unlink a workshop from a showcase.
showcasesRouter.delete('/:showcaseId/workshops/:workshopId', authenticateTokenAdmin, async (req, res) => {
    try {
        const { showcaseId, workshopId } = req.params;

        await connection.execute(
            'UPDATE workshops SET showcase_id = NULL WHERE workshop_id = ? AND showcase_id = ?',
            [workshopId, showcaseId]
        );

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('DELETE unlink workshop error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── DELETE /api/showcases/:showcaseId (admin) ──────────────
showcasesRouter.delete('/:showcaseId', authenticateTokenAdmin, async (req, res) => {
    try {
        const { showcaseId } = req.params;

        // Unlink workshops first (ON DELETE SET NULL handles this via FK,
        // but being explicit is clearer)
        await connection.execute(
            'UPDATE workshops SET showcase_id = NULL WHERE showcase_id = ?',
            [showcaseId]
        );

        await connection.execute(
            'DELETE FROM showcases WHERE showcase_id = ?',
            [showcaseId]
        );

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('DELETE showcase error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /api/showcases/:showcaseId/batch-tickets (admin) ──
// Batch-create unconfirmed membership tickets for all active
// subscribers who don't already have a ticket for this showcase.
showcasesRouter.post('/:showcaseId/batch-tickets', authenticateTokenAdmin, async (req, res) => {
    try {
        const { showcaseId } = req.params;

        // Verify showcase exists
        const [[showcase]] = await connection.query(
            'SELECT showcase_id FROM showcases WHERE showcase_id = ?',
            [showcaseId]
        );
        if (!showcase) {
            return res.status(404).json({ error: 'Showcase not found' });
        }

        // Find active subscribers without a ticket for this showcase
        const [eligibleUsers] = await connection.query(
            `SELECT us.user_id
             FROM user_subscriptions us
             WHERE us.status = 'active'
               AND us.user_id NOT IN (
                   SELECT st.user_id FROM showcase_tickets st
                   WHERE st.showcase_id = ? AND st.ticket_status != 'cancelled'
               )`,
            [showcaseId]
        );

        if (eligibleUsers.length === 0) {
            return res.status(200).json({ ok: true, ticketsCreated: 0 });
        }

        const values = eligibleUsers.map(u => [showcaseId, u.user_id, 'membership', 'unconfirmed', 0.00]);

        await connection.query(
            `INSERT INTO showcase_tickets (showcase_id, user_id, ticket_type, ticket_status, price_paid)
             VALUES ?`,
            [values]
        );

        // Enqueue showcase RSVP unconfirmed notification for the new ticket holders
        try {
            const userIds = eligibleUsers.map(u => u.user_id);
            await notificationQueue.add('showcaseRsvpUnconfirmed', { showcaseId: Number(showcaseId), userIds });
        } catch (notifErr) {
            console.error('Failed to enqueue showcaseRsvpUnconfirmed:', notifErr.message);
        }

        return res.status(201).json({ ok: true, ticketsCreated: eligibleUsers.length });
    } catch (error) {
        console.error('batch-tickets error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── GET /api/showcases/:showcaseId/tickets (admin) ─────────
showcasesRouter.get('/:showcaseId/tickets', authenticateTokenAdmin, async (req, res) => {
    try {
        const { showcaseId } = req.params;

        const [rows] = await connection.query(
            `SELECT st.*, u.username, u.first_name, u.last_name, u.email
             FROM showcase_tickets st
             JOIN users u ON st.user_id = u.user_id
             WHERE st.showcase_id = ?
             ORDER BY st.created_at DESC`,
            [showcaseId]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('GET tickets error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── GET /api/showcases/:showcaseId/my-ticket ───────────────
showcasesRouter.get('/:showcaseId/my-ticket', authenticateToken, async (req, res) => {
    try {
        const { showcaseId } = req.params;
        const userId = req.user.user_id;

        const [[ticket]] = await connection.query(
            'SELECT * FROM showcase_tickets WHERE showcase_id = ? AND user_id = ?',
            [showcaseId, userId]
        );

        if (!ticket) {
            return res.status(200).json({ ticket: null });
        }

        res.status(200).json({ ticket });
    } catch (error) {
        console.error('GET my-ticket error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── GET /api/showcases/:showcaseId/attendees ─────────────
showcasesRouter.get('/:showcaseId/attendees', authenticateToken, async (req, res) => {
    try {
        const { showcaseId } = req.params;

        const [rows] = await connection.query(
            `SELECT u.user_id, u.username, u.first_name, u.avatar_config
             FROM showcase_tickets st
             JOIN users u ON st.user_id = u.user_id
             WHERE st.showcase_id = ? AND st.ticket_status = 'confirmed'
             ORDER BY st.created_at ASC`,
            [showcaseId]
        );

        res.status(200).json(rows);
    } catch (error) {
        console.error('GET attendees error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── PUT /api/showcases/tickets/:ticketId/confirm ───────────────
showcasesRouter.put('/tickets/:ticketId/confirm', authenticateToken, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user.user_id;

        const [result] = await connection.execute(
            `UPDATE showcase_tickets
             SET ticket_status = 'confirmed'
             WHERE ticket_id = ? AND user_id = ? AND ticket_status = 'unconfirmed'`,
            [ticketId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ticket not found or already confirmed' });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('PUT confirm ticket error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── PUT /api/showcases/tickets/:ticketId/unconfirm ─────────────
showcasesRouter.put('/tickets/:ticketId/unconfirm', authenticateToken, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user.user_id;

        const [result] = await connection.execute(
            `UPDATE showcase_tickets
             SET ticket_status = 'unconfirmed'
             WHERE ticket_id = ? AND user_id = ? AND ticket_status = 'confirmed'`,
            [ticketId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ticket not found or already unconfirmed' });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('PUT unconfirm ticket error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── POST /api/showcases/:showcaseId/claim-membership-ticket ────
// Active subscribers can self-create a free membership ticket.
showcasesRouter.post('/:showcaseId/claim-membership-ticket', authenticateToken, async (req, res) => {
    try {
        const { showcaseId } = req.params;
        const userId = req.user.user_id;

        // Verify active subscription
        const [[sub]] = await connection.query(
            'SELECT subscription_id FROM user_subscriptions WHERE user_id = ? AND status = "active"',
            [userId]
        );
        if (!sub) {
            return res.status(403).json({ error: 'Active membership required' });
        }

        // Verify showcase exists
        const [[showcase]] = await connection.query(
            'SELECT showcase_id FROM showcases WHERE showcase_id = ?',
            [showcaseId]
        );
        if (!showcase) {
            return res.status(404).json({ error: 'Showcase not found' });
        }

        // Check for existing ticket (any status)
        const [[existing]] = await connection.query(
            'SELECT ticket_id, ticket_status FROM showcase_tickets WHERE showcase_id = ? AND user_id = ?',
            [showcaseId, userId]
        );

        if (existing) {
            // Already confirmed — nothing to do
            if (existing.ticket_status === 'confirmed') {
                return res.status(200).json({ ticket: existing });
            }
            // Cancelled or unconfirmed — reactivate
            await connection.execute(
                `UPDATE showcase_tickets SET ticket_status = 'confirmed' WHERE ticket_id = ?`,
                [existing.ticket_id]
            );
            return res.status(200).json({
                ticket: { ...existing, ticket_status: 'confirmed' }
            });
        }

        const [result] = await connection.query(
            `INSERT INTO showcase_tickets (showcase_id, user_id, ticket_type, ticket_status, price_paid)
             VALUES (?, ?, 'membership', 'confirmed', 0.00)`,
            [showcaseId, userId]
        );

        return res.status(201).json({
            ticket: { ticket_id: result.insertId, ticket_status: 'confirmed', ticket_type: 'membership' }
        });
    } catch (error) {
        console.error('claim-membership-ticket error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// ── PUT /api/showcases/tickets/:ticketId/cancel ────────────────
// Cancel (unclaim) a ticket — sets status to 'cancelled'.
showcasesRouter.put('/tickets/:ticketId/cancel', authenticateToken, async (req, res) => {
    try {
        const { ticketId } = req.params;
        const userId = req.user.user_id;

        const [result] = await connection.execute(
            `UPDATE showcase_tickets
             SET ticket_status = 'cancelled'
             WHERE ticket_id = ? AND user_id = ? AND ticket_status != 'cancelled'`,
            [ticketId, userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Ticket not found or already cancelled' });
        }

        return res.status(200).json({ ok: true });
    } catch (error) {
        console.error('PUT cancel ticket error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
