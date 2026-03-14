import React, { useState, useEffect } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useParams, useNavigate } from "react-router-dom";
import { format } from "date-fns";
import QRCode from "react-qr-code";

import { Heading1 } from "../Headings.jsx";
import { ClockIcon, LocationIcon, AvatarCircle, AVATAR_COLORS } from "../Icons.jsx";
import { WhenWhereRow, AttendeeAvatarStrip } from "../Buttons.jsx";

export function ShowcaseTicketViewPage() {
    const { showcaseId } = useParams();
    const navigate = useNavigate();

    const [showcase, setShowcase] = useState(null);
    const [ticket, setTicket] = useState(null);
    const [attendees, setAttendees] = useState([]);
    const [confirmed, setConfirmed] = useState(false);
    const [loading, setLoading] = useState(true);

    const accessToken = localStorage.getItem("accessToken");

    let decodedToken = null;
    if (typeof accessToken === "string" && accessToken.trim() !== "") {
        try { decodedToken = jwtDecode(accessToken); }
        catch (err) { console.error("Invalid token:", err); }
    }
    const userId = decodedToken?.user_id;
    const firstName = decodedToken?.first_name || null;
    const username = decodedToken?.username || null;

    const formatDate = (datetime) =>
        format(new Date(datetime), "EEEE 'at' h:mm a | MM-dd-yyyy");

    // ── Fetch showcase, ticket, attendees ──
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [showcaseRes, ticketRes, attendeesRes] = await Promise.all([
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/showcases/${showcaseId}`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    ),
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/showcases/${showcaseId}/my-ticket`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    ),
                    axios.get(
                        `${import.meta.env.VITE_API_URL}/showcases/${showcaseId}/attendees`,
                        { headers: { Authorization: `Bearer ${accessToken}` } }
                    ),
                ]);
                setShowcase(showcaseRes.data);
                const t = ticketRes.data.ticket;
                setTicket(t);
                setConfirmed(t?.ticket_status === "confirmed");
                setAttendees(attendeesRes.data || []);
            } catch (err) {
                console.error("Fetch ticket view error:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [showcaseId]);

    // ── Confirm / unconfirm toggle ──
    const handleToggleConfirm = async () => {
        if (!ticket) return;
        try {
            if (confirmed) {
                // Unconfirming also cancels the ticket, returning user to claim state
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/showcases/tickets/${ticket.ticket_id}/cancel`,
                    {},
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                navigate(`/showcases/${showcaseId}`);
            } else {
                await axios.put(
                    `${import.meta.env.VITE_API_URL}/showcases/tickets/${ticket.ticket_id}/confirm`,
                    {},
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                setConfirmed(true);

                // Refresh attendees after confirming
                const attendeesRes = await axios.get(
                    `${import.meta.env.VITE_API_URL}/showcases/${showcaseId}/attendees`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                setAttendees(attendeesRes.data || []);
            }
        } catch (err) {
            console.error("Toggle confirm error:", err);
        }
    };

    if (loading) return <div>Loading…</div>;
    if (!showcase || !ticket) return <Heading1 text="Ticket not found" />;

    const titleText = firstName
        ? `${firstName}'s Ticket for ${showcase.showcase_name}`
        : `Ticket for ${showcase.showcase_name}`;

    const showcaseDateLabel = showcase.showcase_date
        ? formatDate(showcase.showcase_date)
        : "—";

    // QR code value — ticket ID based URL
    const ticketUrl = `${window.location.origin}/showcases/${showcaseId}/ticket/view`;

    // ── Avatar from token's avatar_config (if present) ──
    const avatarSeed = username || firstName || String(userId || "");
    let avatarProps = {};
    if (decodedToken?.avatar_config) {
        try {
            const config = typeof decodedToken.avatar_config === "string"
                ? JSON.parse(decodedToken.avatar_config)
                : decodedToken.avatar_config;
            const palette = AVATAR_COLORS;
            const maxRings = 6;
            const safeRings = Math.max(1, Math.min(config.rings ?? 1, maxRings));
            avatarProps = {
                rings: safeRings,
                strokeWidth: config.strokeWidth ?? 2,
                backgroundColor: palette[(config.backgroundColorIndex ?? 0) % palette.length],
                ringColors: Array.from({ length: safeRings }, (_, i) => {
                    const idx = config.ringColorIndices?.[i] ?? 0;
                    return palette[idx % palette.length];
                }),
                centerColor: palette[(config.centerColorIndex ?? 0) % palette.length],
            };
        } catch { /* ignore bad config */ }
    }

    return (
        <>
            <div className="EdgeBox">
                {/* Row 1: title + avatar */}
                <div className="RSVPTextBlock" style={{ gridColumn: "1 / 3", gridRow: "1" }}>
                    <h1 className="workshopCardName RSVPTitle">{titleText}</h1>
                </div>

                <div style={{ gridColumn: "3", gridRow: "1", justifySelf: "end", alignSelf: "start" }}>
                    <AvatarCircle seed={avatarSeed} size={40} {...avatarProps} />
                </div>

                {/* Row 2: showcase details */}
                <div className="RSVPTextBlock" style={{ gridColumn: "1 / 4", gridRow: "2" }}>
                    {showcase.showcase_description && (
                        <p className="RSVPDetailText">{showcase.showcase_description}</p>
                    )}
                    <WhenWhereRow icon={<ClockIcon size={14} />} label={showcaseDateLabel} />
                    {showcase.showcase_location && (
                        <WhenWhereRow
                            icon={<LocationIcon size={14} />}
                            label={showcase.showcase_location}
                        />
                    )}
                </div>

                {/* Row 3: QR code */}
                <div
                    style={{
                        gridColumn: "1 / 4",
                        gridRow: "3",
                        marginTop: "15px",
                        marginBottom: "15px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-start",
                        gap: "0.5rem",
                    }}
                >
                    <div style={{ maxWidth: 192, marginLeft: "auto", marginRight: "auto" }}>
                        <QRCode
                            value={ticketUrl}
                            size={192}
                            style={{ width: "100%", height: "auto" }}
                        />
                    </div>
                </div>

                {/* Row 4: attendees + confirm/unconfirm */}
                <div
                    style={{
                        gridColumn: "1 / 4",
                        gridRow: "4",
                        marginTop: "0.75rem",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                    }}
                >
                    <AttendeeAvatarStrip attendees={attendees} currentUserId={Number(userId)} />

                    {ticket.ticket_type !== 'one_off' && (
                        <div className="RSVPConfirmButtonContainer">
                            <button
                                onClick={handleToggleConfirm}
                                className={confirmed ? "logInButton logInButton--pressed" : "logInButton"}
                                type="button"
                            >
                                {confirmed ? "Unconfirm" : "Confirm"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
