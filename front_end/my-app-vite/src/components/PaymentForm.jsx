import React, { useState } from 'react';
import { PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

/**
 * Reusable payment form using Stripe's Payment Element.
 *
 * Props:
 *   onSuccess   – callback after successful confirmation
 *   onError     – callback with error message
 *   submitLabel – text on the pay button (default "Pay")
 *   returnUrl   – URL Stripe redirects to after 3DS / redirect flows
 *   intentType  – "payment" (default) or "setup" — determines which
 *                 Stripe confirm method to call
 */
export function PaymentForm({ onSuccess, onError, submitLabel = 'Pay', returnUrl, intentType = 'payment' }) {
    const stripe = useStripe();
    const elements = useElements();
    const [processing, setProcessing] = useState(false);
    const [errorMessage, setErrorMessage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) return;

        setProcessing(true);
        setErrorMessage(null);

        const confirmFn = intentType === 'setup'
            ? stripe.confirmSetup.bind(stripe)
            : stripe.confirmPayment.bind(stripe);

        const { error } = await confirmFn({
            elements,
            confirmParams: {
                return_url: returnUrl || `${window.location.origin}/showcases`,
            },
            redirect: 'if_required',
        });

        if (error) {
            setErrorMessage(error.message);
            onError?.(error.message);
            setProcessing(false);
        } else {
            onSuccess?.();
            setProcessing(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="paymentForm">
            <PaymentElement options={{ layout: 'tabs' }} />

            {errorMessage && (
                <p className="paymentError" style={{ color: '#ff4444', marginTop: '0.75rem' }}>
                    {errorMessage}
                </p>
            )}

            <button
                type="submit"
                disabled={!stripe || processing}
                className="logInButton"
                style={{ marginTop: '1rem', width: '100%' }}
            >
                {processing ? 'Processing…' : submitLabel}
            </button>
        </form>
    );
}
