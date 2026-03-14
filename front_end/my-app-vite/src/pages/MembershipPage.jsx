import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

import { Heading1, Heading2 } from '../Headings.jsx';
import { StripeElements } from '../context/StripeContext.jsx';
import { PaymentForm } from '../components/PaymentForm.jsx';

export function MembershipPage() {
    const [subscriptionStatus, setSubscriptionStatus] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [intentType, setIntentType] = useState('payment');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const accessToken = localStorage.getItem('accessToken');
    const navigate = useNavigate();

    // Fetch current subscription status
    useEffect(() => {
        const fetchStatus = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/stripe/subscription-status`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                setSubscriptionStatus(res.data);
            } catch (err) {
                console.error('Fetch subscription status error:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStatus();
    }, []);

    const handleSubscribe = async () => {
        setError(null);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/stripe/create-subscription`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setClientSecret(res.data.clientSecret);
            setIntentType(res.data.type || 'payment');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to start subscription');
        }
    };

    const handleCancel = async () => {
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/stripe/cancel-subscription`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setSubscriptionStatus(prev => ({ ...prev, status: 'cancelling' }));
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to cancel subscription');
        }
    };

    const handlePaymentSuccess = async () => {
        // Card is now saved on the customer — create the actual subscription
        setError(null);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/stripe/activate-subscription`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setClientSecret(null);
            setSubscriptionStatus({ subscribed: true, plan: 'member', status: 'active' });
        } catch (err) {
            setError(err.response?.data?.error || 'Card saved but subscription activation failed. Please try again.');
        }
    };

    if (loading) return <div>Loading…</div>;

    const stackStyle = { display: 'flex', flexDirection: 'column', alignItems: 'stretch' };

    // Active subscriber view
    if (subscriptionStatus?.subscribed) {
        return (
            <>
                <Heading1 text="Membership" />
                <div className="EdgeBox" style={stackStyle}>
                    <Heading2 text="You're a member" />
                    <p className="RSVPDetailText">
                        Plan: <strong>{subscriptionStatus.plan}</strong>
                    </p>
                    <p className="RSVPDetailText">
                        Status: <strong>{subscriptionStatus.status}</strong>
                    </p>
                    {subscriptionStatus.currentPeriodEnd && (
                        <p className="RSVPDetailText">
                            Current period ends:{' '}
                            <strong>
                                {new Date(subscriptionStatus.currentPeriodEnd).toLocaleDateString()}
                            </strong>
                        </p>
                    )}

                    <div className="logInButtonContainer" style={{ marginTop: '1rem' }}>
                        <button className="logInButton" onClick={handleCancel}>
                            Cancel Membership
                        </button>
                    </div>

                    {error && <p style={{ color: '#ff4444', marginTop: '0.5rem' }}>{error}</p>}
                </div>
            </>
        );
    }

    // Payment form visible after clicking Subscribe
    if (clientSecret) {
        return (
            <>
                <Heading1 text="Membership" />
                <div className="EdgeBox" style={stackStyle}>
                    <Heading2 text="Complete Payment" />
                    <p className="RSVPDetailText" style={{ marginBottom: '1rem' }}>
                        $20.00 / month — includes showcase tickets and workshop access.
                    </p>
                    <StripeElements clientSecret={clientSecret}>
                        <PaymentForm
                            submitLabel="Subscribe — $20/mo"
                            onSuccess={handlePaymentSuccess}
                            onError={(msg) => setError(msg)}
                            intentType={intentType}
                        />
                    </StripeElements>
                    {error && <p style={{ color: '#ff4444', marginTop: '0.5rem' }}>{error}</p>}
                </div>
            </>
        );
    }

    // Default: show membership offer
    return (
        <>
            <Heading1 text="Membership" />
            <div className="EdgeBox" style={stackStyle}>
                <Heading2 text="$20 / month" />
                <p className="RSVPDetailText">
                    As a member you get a showcase ticket every month, access to all workshops,
                    and become part of the creative community.
                </p>

                <div className="logInButtonContainer" style={{ marginTop: '1rem' }}>
                    <button className="logInButton" onClick={handleSubscribe}>
                        Subscribe
                    </button>
                </div>

                {error && <p style={{ color: '#ff4444', marginTop: '0.5rem' }}>{error}</p>}
            </div>
        </>
    );
}
