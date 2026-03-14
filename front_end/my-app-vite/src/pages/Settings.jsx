import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { jwtDecode } from "jwt-decode";

import { Heading1, Heading2 } from "../Headings.jsx";

const DEFAULT_NOTIF_SETTINGS = {
    channel: "none",
    module_open: true,
    last_day_reminder: true,
    materials_ready: true,
    workshop_rsvp: true,
    showcase_announcements: true,
    showcase_ticket: true,
};

const NOTIF_SUB_OPTIONS = [
    { key: "module_open", label: "Module opened" },
    { key: "last_day_reminder", label: "Last day to submit" },
    { key: "materials_ready", label: "Materials ready" },
    { key: "workshop_rsvp", label: "Workshop RSVP" },
    { key: "showcase_announcements", label: "New showcases" },
    { key: "showcase_ticket", label: "Showcase ticket confirmation" },
];

export function Settings() {
    const [user, setUser] = useState(null);
    const [subscription, setSubscription] = useState(null);
    const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIF_SETTINGS);
    const [loading, setLoading] = useState(true);

    const accessToken = localStorage.getItem("accessToken");
    const navigate = useNavigate();

    useEffect(() => {
        if (!accessToken) { navigate("/login"); return; }

        const decoded = jwtDecode(accessToken);
        setUser(decoded);

        const headers = { Authorization: `Bearer ${accessToken}` };

        const fetchSub = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/stripe/subscription-status`,
                    { headers }
                );
                setSubscription(res.data);
            } catch (err) {
                console.error("subscription-status error:", err);
            }
        };

        const fetchNotif = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/users/${decoded.user_id}/notification-settings`,
                    { headers }
                );
                if (res.data && res.data.channel) {
                    setNotifSettings(res.data);
                }
            } catch (err) {
                console.error("notification-settings fetch error:", err);
            }
        };

        Promise.all([fetchSub(), fetchNotif()]).finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("accessToken");
        navigate("/login");
    };

    /* ── notification helpers ──────────────────────── */
    const notificationsEnabled = notifSettings.channel !== "none";

    const persistSettings = (updated) => {
        if (!user) return;
        axios.put(
            `${import.meta.env.VITE_API_URL}/users/${user.user_id}/notification-settings`,
            updated,
            { headers: { Authorization: `Bearer ${accessToken}` } }
        ).catch(err => console.error("notification-settings save error:", err));
    };

    const updateNotifSetting = (key, value) => {
        setNotifSettings(prev => {
            const updated = { ...prev, [key]: value };
            persistSettings(updated);
            return updated;
        });
    };

    const handleChannelToggle = () => {
        updateNotifSetting("channel", notificationsEnabled ? "none" : "email");
    };

    const cycleChannel = () => {
        const order = ["email", "sms", "both"];
        const idx = order.indexOf(notifSettings.channel);
        updateNotifSetting("channel", order[(idx + 1) % order.length]);
    };

    if (loading) return <div>Loading…</div>;

    return (
        <>
            <Heading1 text="Profile" />

            {/* ── Account info ────────────────────────── */}
            <div className="EdgeBox" style={{ display: "block" }}>
                <Heading2 text="Account" />
                {user && (
                    <>
                        <p className="RSVPDetailText">
                            Email: <strong>{user.email}</strong>
                        </p>
                        <p className="RSVPDetailText">
                            Role: <strong>{user.is_admin ? "Admin" : "Member"}</strong>
                        </p>
                    </>
                )}
            </div>

            {/* ── Subscription status ─────────────────── */}
            <div className="EdgeBox" style={{ marginTop: "1rem", display: "block" }}>
                <Heading2 text="Membership" />
                {subscription?.subscribed ? (
                    <>
                        <p className="RSVPDetailText">
Status: <strong style={{ color: "hsl(125.75, 29.32%, 48.82%)" }}>{subscription.status}</strong>
                        </p>
                        {subscription.currentPeriodEnd && (
                            <p className="RSVPDetailText">
                                Renews:{" "}
                                <strong>
                                    {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                                </strong>
                            </p>
                        )}
                        <Link to="/membership" className="linkNoUnderLine">
                            <div className="logInButtonContainer" style={{ marginTop: "0.5rem" }}>
                                <button className="logInButton">Manage Membership</button>
                            </div>
                        </Link>
                    </>
                ) : (
                    <>
                        <p className="RSVPDetailText">You don't have an active membership.</p>
                        <Link to="/membership" className="linkNoUnderLine">
                            <div className="logInButtonContainer" style={{ marginTop: "0.5rem" }}>
                                <button className="logInButton">Subscribe — $20/mo</button>
                            </div>
                        </Link>
                    </>
                )}
            </div>

            {/* ── Notifications ─────────────────────── */}
            <div className="EdgeBox" style={{ marginTop: "1rem", display: "block" }}>
                <Heading2 text="Notifications" />

                {/* Master on/off */}
                <div className="notifRow">
                    <span className="RSVPDetailText" style={{ marginBottom: 0 }}>Enable notifications</span>
                    <button
                        className={`notifToggle ${notificationsEnabled ? "notifToggle--on" : ""}`}
                        onClick={handleChannelToggle}
                        aria-label="Toggle notifications"
                    >
                        <span className="notifToggleThumb" />
                    </button>
                </div>

                {notificationsEnabled && (
                    <>
                        {/* Channel selector */}
                        <div className="notifRow">
                            <span className="RSVPDetailText" style={{ marginBottom: 0 }}>Delivery method</span>
                            <button className="logInButton notifChannelBtn" onClick={cycleChannel}>
                                {notifSettings.channel === "email" && "Email only"}
                                {notifSettings.channel === "sms" && "Text only"}
                                {notifSettings.channel === "both" && "Email & Text"}
                            </button>
                        </div>

                        {/* Sub-option toggles */}
                        {NOTIF_SUB_OPTIONS.map(({ key, label }) => (
                            <div className="notifRow" key={key}>
                                <span className="RSVPDetailText" style={{ marginBottom: 0 }}>{label}</span>
                                <button
                                    className={`notifToggle ${notifSettings[key] ? "notifToggle--on" : ""}`}
                                    onClick={() => updateNotifSetting(key, !notifSettings[key])}
                                    aria-label={`Toggle ${label}`}
                                >
                                    <span className="notifToggleThumb" />
                                </button>
                            </div>
                        ))}

                    </>
                )}
            </div>

            {/* ── Logout ──────────────────────────────── */}
            <div className="logInButtonContainer" style={{ marginTop: "1.5rem" }}>
                <button className="logInButton" onClick={handleLogout}>Log Out</button>
            </div>
        </>
    );
}
