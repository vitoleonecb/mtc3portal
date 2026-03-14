import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';

import { Heading1, Heading2 } from '../Headings.jsx';
import { StripeElements } from '../context/StripeContext.jsx';
import { PaymentForm } from '../components/PaymentForm.jsx';

export function TicketPurchasePage() {
    const { showcaseId } = useParams();
    const navigate = useNavigate();

    const [showcase, setShowcase] = useState(null);
    const [clientSecret, setClientSecret] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [purchased, setPurchased] = useState(false);
    const [isMember, setIsMember] = useState(false);

    const accessToken = localStorage.getItem('accessToken');

    // Load showcase info + check existing ticket + membership
    useEffect(() => {
        const fetchShowcase = async () => {
            try {
                const [showcaseRes, ticketRes, subRes] = await Promise.all([
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/showcases/${showcaseId}`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    ),
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/showcases/${showcaseId}/my-ticket`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    ),
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/stripe/subscription-status`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    ),
                ]);
                setShowcase(showcaseRes.data);
                setIsMember(subRes.data?.subscribed === true);

                const ticket = ticketRes.data.ticket;
                if (ticket && ticket.ticket_status !== 'cancelled') {
                    setPurchased(true);
                }
            } catch (err) {
                console.error('Fetch showcase error:', err);
                setError('Could not load showcase details.');
            } finally {
                setLoading(false);
            }
        };
        fetchShowcase();
    }, [showcaseId]);

    const handleBuyTicket = async () => {
        setError(null);
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/stripe/buy-ticket/${showcaseId}`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setClientSecret(res.data.clientSecret);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to initiate payment');
        }
    };

    const handlePaymentSuccess = async () => {
        setClientSecret(null);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/stripe/confirm-ticket/${showcaseId}`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
        } catch (err) {
            console.error('confirm-ticket error:', err);
        }
        setPurchased(true);
    };

    if (loading) return <div>Loading…</div>;

    const stackStyle = { display: 'flex', flexDirection: 'column', alignItems: 'stretch' };

    if (purchased) {
        return (
            <>
                <Heading1 text="Showcase Ticket" />
                <div className="EdgeBox" style={stackStyle}>
                    <Heading2 text="You've got a ticket!" />
                    <p className="RSVPDetailText">
                        {showcase?.showcase_name} — your ticket is ready.
                    </p>
                    <div className="logInButtonContainer" style={{ marginTop: '1rem' }}>
                        <button className="logInButton" onClick={() => navigate(`/showcases/${showcaseId}/ticket/view`)}>
                            View Ticket
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (isMember) {
        return (
            <>
                <Heading1 text="Showcase Ticket" />
                <div className="EdgeBox" style={stackStyle}>
                    <Heading2 text="Included with Membership" />
                    <p className="RSVPDetailText">
                        {showcase?.showcase_name} — your membership includes showcase tickets.
                    </p>
                    <div className="logInButtonContainer" style={{ marginTop: '1rem' }}>
                        <button className="logInButton" onClick={() => navigate(`/showcases/${showcaseId}`)}>
                            Back to Showcase
                        </button>
                    </div>
                </div>
            </>
        );
    }

    if (clientSecret) {
        return (
            <>
                <Heading1 text="Showcase Ticket" />
                <div className="EdgeBox" style={stackStyle}>
                    <Heading2 text={showcase?.showcase_name || 'Showcase'} />
                    <p className="RSVPDetailText" style={{ marginBottom: '1rem' }}>
                        One-time ticket — $30.00
                    </p>
                    <StripeElements clientSecret={clientSecret}>
                        <PaymentForm
                            submitLabel="Buy Ticket — $30"
                            onSuccess={handlePaymentSuccess}
                            onError={(msg) => setError(msg)}
                        />
                    </StripeElements>
                    {error && <p style={{ color: '#ff4444', marginTop: '0.5rem' }}>{error}</p>}
                </div>
            </>
        );
    }

    return (
        <>
            <Heading1 text="Showcase Ticket" />
            <div className="EdgeBox" style={stackStyle}>
                <Heading2 text={showcase?.showcase_name || 'Showcase'} />
                {showcase?.showcase_date && (
                    <p className="RSVPDetailText">
                        {new Date(showcase.showcase_date).toLocaleDateString('en-US', {
                            weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
                        })}
                    </p>
                )}
                {showcase?.showcase_location && (
                    <p className="RSVPDetailText">{showcase.showcase_location}</p>
                )}

                <p className="RSVPDetailText" style={{ marginTop: '1rem' }}>
                    Single showcase ticket — <strong>$30.00</strong>
                </p>

                <div className="logInButtonContainer" style={{ marginTop: '1rem' }}>
                    <button className="logInButton" onClick={handleBuyTicket}>
                        Buy Ticket
                    </button>
                </div>

                {error && <p style={{ color: '#ff4444', marginTop: '0.5rem' }}>{error}</p>}
            </div>
        </>
    );
}
