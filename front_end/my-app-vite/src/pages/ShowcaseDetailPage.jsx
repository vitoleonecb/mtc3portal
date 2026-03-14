import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import { format } from "date-fns";

import { Heading1, Heading2, CurrentWorkshopHeading, UpcomingWorkshopsHeading, PastWorkshopsHeading } from "../Headings.jsx";
import { WorkshopCard, CreateButton, WhenWhereRow } from "../Buttons.jsx";
import { DropDown } from "../Buttons.jsx";
import { ClockIcon, LocationIcon } from "../Icons.jsx";
import { RAW_CHARACTERS } from "../components/card-characters.jsx";
import { createRng, pickFrom } from "../utils/random.js";
import { MysqlDateInput } from "../DateInput.jsx";
import { useOverlay } from "../context/OverlayContext.jsx";
import { ErrorOverlay } from "../components/ErrorOverlay.jsx";
import { classifyError } from "../errors/errorRegistry.js";

export function ShowcaseDetailPage() {
    const { showcaseId } = useParams();
    const { key: locationKey } = useLocation();
    const navigate = useNavigate();

    const [showcase, setShowcase] = useState(null);
    const [workshops, setWorkshops] = useState([]);
    const [ticket, setTicket] = useState(null);
    const [isMember, setIsMember] = useState(false);
    const [loading, setLoading] = useState(true);
    const [currentRsvpStatus, setCurrentRsvpStatus] = useState(null);
    const [isAdmin, setIsAdmin] = useState(false);

    // ── Workshop creation form state ──
    const [createFormSelected, setCreateFormSelected] = useState(false);
    const [currentStep, setCurrentStep] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [workshopCreateForm, setWorkshopCreateForm] = useState({
        workshopName: '',
        workshopDescription: '',
        workshopTime: '',
        workshopLocation: '',
        workshopStyle: '',
    });

    const { show } = useOverlay();
    const accessToken = localStorage.getItem("accessToken");

    let decodedToken = null;
    if (typeof accessToken === "string" && accessToken.trim() !== "") {
        try { decodedToken = jwtDecode(accessToken); }
        catch (err) { console.error("Invalid token:", err); }
    }
    const userId = decodedToken?.user_id;

    // ── Fetch showcase detail + workshops + subscription status ──
    const fetchDetail = async () => {
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
            const data = showcaseRes.data;
            setShowcase(data);
            setWorkshops(data.workshops || []);
            setTicket(ticketRes.data.ticket);
            setIsMember(subRes.data?.subscribed === true);
        } catch (err) {
            console.error("Fetch showcase detail error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchDetail(); }, [showcaseId]);

    // ── Admin check ──
    useEffect(() => {
        if (!userId) return;
        const fetchAdmin = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/users/${userId}/isadmin`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (res.data > 0) setIsAdmin(true);
            } catch (err) {
                console.error("Admin check error:", err);
            }
        };
        fetchAdmin();
    }, [userId]);

    // ── Workshop groups ──
    const { currentWorkshop, upcomingWorkshops, pastWorkshops } = useMemo(() => {
        const now = new Date();
        const future = workshops
            .filter(w => new Date(w.workshop_date) >= now)
            .sort((a, b) => new Date(a.workshop_date) - new Date(b.workshop_date));
        const past = workshops
            .filter(w => new Date(w.workshop_date) < now)
            .sort((a, b) => new Date(b.workshop_date) - new Date(a.workshop_date));

        return {
            currentWorkshop: future[0] || null,
            upcomingWorkshops: future.slice(1),
            pastWorkshops: past,
        };
    }, [workshops]);

    // ── RSVP status for current workshop ──
    useEffect(() => {
        if (!currentWorkshop || !userId) { setCurrentRsvpStatus(null); return; }
        const fetchRsvp = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/workshops/${currentWorkshop.workshop_id}/rsvp/${userId}/status`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                if (res.data?.length === 1) {
                    setCurrentRsvpStatus(
                        res.data[0].rsvp_confirmation_status === "confirmed" ? "confirmed" : "unconfirmed"
                    );
                } else {
                    setCurrentRsvpStatus(null);
                }
            } catch { setCurrentRsvpStatus(null); }
        };
        fetchRsvp();
    }, [currentWorkshop, userId]);

    const formatDate = (datetime) => format(new Date(datetime), "EEEE 'at' h:mm a | MM-dd-yyyy");

    function previewDate(d) {
        if (!d) return "—";
        const dt = new Date(d);
        if (Number.isNaN(+dt)) return d;
        return format(dt, "EEEE 'at' h:mm a | MM-dd-yyyy");
    }

    // ── Workshop creation helpers ──
    function handleFieldChange(e) {
        const { name, value } = e.target;
        setWorkshopCreateForm(prev => ({ ...prev, [name]: value }));
    }

    function handleDateChange(nextValue) {
        setWorkshopCreateForm(prev => ({ ...prev, workshopTime: nextValue }));
    }

    function handleStyleSelect(option) {
        setWorkshopCreateForm(prev => ({ ...prev, workshopStyle: option }));
    }

    function isWorkshopDateValid() {
        if (!workshopCreateForm.workshopTime?.trim()) return false;
        if (!showcase?.showcase_date) return true;
        return new Date(workshopCreateForm.workshopTime) <= new Date(showcase.showcase_date);
    }

    function isStepValid(stepIndex) {
        switch (stepIndex) {
            case 0: return workshopCreateForm.workshopName.trim().length > 0;
            case 1: return workshopCreateForm.workshopDescription.trim().length > 0;
            case 2: return isWorkshopDateValid();
            case 3: return workshopCreateForm.workshopLocation.trim().length > 0;
            case 4: return workshopCreateForm.workshopStyle.trim().length > 0;
            default: return true;
        }
    }

    function next() {
        if (!isStepValid(currentStep)) return;
        setCurrentStep(s => Math.min(s + 1, 4));
    }

    function back() {
        setCurrentStep(s => Math.max(s - 1, 0));
    }

    async function createWorkshop() {
        if (!isStepValid(currentStep)) return;
        setSubmitting(true);
        try {
            const payload = {
                workshop_name: workshopCreateForm.workshopName,
                workshop_description: workshopCreateForm.workshopDescription,
                workshop_date: workshopCreateForm.workshopTime,
                workshop_location: workshopCreateForm.workshopLocation,
                workshop_public: workshopCreateForm.workshopStyle === 'public' ? 1 : 0,
                showcase_id: Number(showcaseId),
            };

            await axios.post(
                `${import.meta.env.VITE_API_URL}/workshops`,
                payload,
                { headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` } }
            );

            // Re-fetch showcase detail to refresh workshops list
            await fetchDetail();

            setWorkshopCreateForm({ workshopName: '', workshopDescription: '', workshopTime: '', workshopLocation: '', workshopStyle: '' });
            setCurrentStep(0);
            setCreateFormSelected(false);
        } catch (err) {
            const classification = classifyError(err, { hint: "WORKSHOP_CREATE_FAILED" });
            show(<ErrorOverlay classification={classification} />);
        } finally {
            setSubmitting(false);
        }
    }

    // ── Workshop decorations ──
    const workshopDecorations = useMemo(() => {
        const DECORATION_PROB = 0.25;
        const placements = [
            "cardDecoration-top-right", "cardDecoration-top-left",
            "cardDecoration-edge-right", "cardDecoration-edge-left",
        ];
        const map = {};
        workshops.forEach((workshop) => {
            const rng = createRng(`workshop-${workshop.workshop_id}-${locationKey}`);
            if (rng() < DECORATION_PROB) {
                const placement = pickFrom(rng, placements);
                if (!placement) return;
                const RawChar = pickFrom(rng, RAW_CHARACTERS);
                if (RawChar) {
                    const t = rng();
                    const scale = rng() < 0.1 ? 1.4 + t * 1.0 : 0.2 + (t * t) * 1.0;
                    map[workshop.workshop_id] = (
                        <div className={`cardDecoration ${placement}`}
                            style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}>
                            <RawChar />
                        </div>
                    );
                }
            }
        });
        return map;
    }, [workshops, locationKey]);

    const getDecoration = (id) => workshopDecorations[id] || null;

    // ── Cancel (unclaim) ticket ──
    const handleCancelTicket = async () => {
        if (!ticket) return;
        try {
            await axios.put(
                `${import.meta.env.VITE_API_URL}/showcases/tickets/${ticket.ticket_id}/cancel`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setTicket(null);
        } catch (err) {
            console.error("Cancel ticket error:", err);
        }
    };

    // ── Claim membership ticket (for active subscribers with no ticket) ──
    const handleClaimMembershipTicket = async () => {
        try {
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/showcases/${showcaseId}/claim-membership-ticket`,
                {},
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setTicket(res.data.ticket);
        } catch (err) {
            console.error("Claim membership ticket error:", err);
        }
    };

    if (loading) return <div>Loading…</div>;
    if (!showcase) return <Heading1 text="Showcase not found" />;

    const showcaseDateLabel = showcase.showcase_date
        ? formatDate(showcase.showcase_date)
        : '—';

    const hasTicket = ticket && ticket.ticket_status !== 'cancelled';

    // Derive card background color based on ticket state
    const showcaseCardColor = hasTicket ? '#57A15E' : isMember ? '#D2A478' : '#994242';

    // ── Container click handler ──
    const handleCardClick = () => {
        if (hasTicket) {
            navigate(`/showcases/${showcaseId}/ticket/view`);
        } else if (isMember) {
            handleClaimMembershipTicket();
        } else {
            navigate(`/showcases/${showcaseId}/ticket`);
        }
    };

    return (
        <>
            <Heading1 text={showcase.showcase_name} />

            {/* ── Showcase info + ticket ── */}
            <div
                className="workshopCardContainer showcaseDetailCard"
                style={{ display: 'flex', flexDirection: 'row', alignItems: 'stretch', gap: '1rem', backgroundColor: showcaseCardColor }}
                onClick={handleCardClick}
            >
                {/* Left column: details */}
                <div style={{ flex: 1, padding: '0 1rem' }}>
                    <WhenWhereRow icon={<ClockIcon size={14} />} label={showcaseDateLabel} />
                    {showcase.showcase_location && (
                        <WhenWhereRow icon={<LocationIcon size={14} />} label={showcase.showcase_location} />
                    )}
                </div>

                {/* Right column: ticket action */}
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'stretch', gap: '0.5rem', padding: '0 1rem' }}>
                    {hasTicket ? (
                        <button
                            className="logInButton"
                            style={{ width: '100%' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/showcases/${showcaseId}/ticket/view`); }}
                        >
                            View Ticket
                        </button>
                    ) : isMember ? (
                        <button className="logInButton" onClick={(e) => { e.stopPropagation(); handleClaimMembershipTicket(); }}>
                            Confirm Ticket
                        </button>
                    ) : (
                        <button
                            className="logInButton"
                            style={{ width: '100%' }}
                            onClick={(e) => { e.stopPropagation(); navigate(`/showcases/${showcaseId}/ticket`); }}
                        >
                            Get Ticket
                        </button>
                    )}
                </div>
            </div>

            {/* ── Workshops section ── */}
            <Heading1 text="Workshops" />

            {currentWorkshop && (
                <>
                    <CurrentWorkshopHeading rsvpStatus={currentRsvpStatus} />
                    <div className="cardLink">
                        <Link to={`/workshops/${currentWorkshop.workshop_id}/modules`} className="linkNoUnderLine">
                            <WorkshopCard
                                workshopName={currentWorkshop.workshop_name}
                                workshopDescription={currentWorkshop.workshop_description}
                                workshopDate={formatDate(currentWorkshop.workshop_date)}
                                workshopLocation={currentWorkshop.workshop_location}
                                workshopPublic={!!currentWorkshop.workshop_public}
                                decoration={getDecoration(currentWorkshop.workshop_id)}
                            />
                        </Link>
                    </div>
                </>
            )}

            {upcomingWorkshops.length > 0 && (
                <>
                    <UpcomingWorkshopsHeading />
                    {upcomingWorkshops.map((workshop) => (
                        <div key={workshop.workshop_id} className="cardLink">
                            <Link to={`/workshops/${workshop.workshop_id}/modules`} className="linkNoUnderLine">
                                <WorkshopCard
                                    workshopName={workshop.workshop_name}
                                    workshopDescription={workshop.workshop_description}
                                    workshopDate={formatDate(workshop.workshop_date)}
                                    workshopLocation={workshop.workshop_location}
                                    workshopPublic={!!workshop.workshop_public}
                                    decoration={getDecoration(workshop.workshop_id)}
                                />
                            </Link>
                        </div>
                    ))}
                </>
            )}

            {workshops.length === 0 && !createFormSelected && (
                <Heading2 text="No workshops assigned to this showcase yet" />
            )}

            {isAdmin && <CreateButton handleClick={() => setCreateFormSelected(true)} />}

            {createFormSelected && (
                <>
                    {currentStep === 0 && (
                        <>
                            <Heading2 text="Name it" />
                            <input
                                type="text"
                                name="workshopName"
                                value={workshopCreateForm.workshopName}
                                onChange={handleFieldChange}
                                className="textInput"
                                maxLength={60}
                                placeholder="e.g., Movement Lab: Breath & Balance"
                                autoFocus
                            />
                        </>
                    )}

                    {currentStep === 1 && (
                        <>
                            <Heading2 text="Describe it" />
                            <textarea
                                name="workshopDescription"
                                value={workshopCreateForm.workshopDescription}
                                onChange={handleFieldChange}
                                className="OpenResponse"
                                placeholder="What happens in this workshop? Who is it for?"
                                rows={5}
                            />
                        </>
                    )}

                    {currentStep === 2 && (
                        <>
                            <Heading2 text="When?" />
                            <MysqlDateInput
                                value={workshopCreateForm.workshopTime}
                                onChange={handleDateChange}
                            />
                            {workshopCreateForm.workshopTime?.trim() && !isWorkshopDateValid() && (
                                <span style={{ color: 'red', fontSize: '0.85rem', marginTop: '0.5rem', display: 'block' }}>
                                    Workshop date cannot be after the showcase date ({formatDate(showcase.showcase_date)})
                                </span>
                            )}
                        </>
                    )}

                    {currentStep === 3 && (
                        <>
                            <Heading2 text="Where?" />
                            <input
                                type="text"
                                name="workshopLocation"
                                value={workshopCreateForm.workshopLocation}
                                onChange={handleFieldChange}
                                className="textInput"
                                maxLength={80}
                                placeholder="Studio / Venue / Address"
                            />
                        </>
                    )}

                    {currentStep === 4 && (
                        <>
                            <Heading2 text="Style" />
                            <DropDown
                                reset={false}
                                onSelect={handleStyleSelect}
                                options={["Public", "Private"]}
                            />
                        </>
                    )}

                    <div className="createWorkshopButtonContainer">
                        <button type="button" onClick={back} className="createButton" disabled={currentStep === 0}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="12.75 2.75 5.25 9 12.75 15.25" stroke="black" fill="none" />
                            </svg>
                        </button>
                        {currentStep < 4 ? (
                            <button type="button" onClick={next} className="createButton" disabled={!isStepValid(currentStep)}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <polyline points="5.25 2.75 12.75 9 5.25 15.25" stroke="black" fill="none" />
                                </svg>
                            </button>
                        ) : (
                            <button
                                type="button"
                                className="createButton"
                                onClick={createWorkshop}
                                disabled={submitting || !isStepValid(4)}
                            >
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <polyline points="3.25 9.5 7.5 14.5 14.75 3.25" stroke="black" fill="none" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <WorkshopCard
                            workshopName={workshopCreateForm.workshopName || "—"}
                            workshopDescription={workshopCreateForm.workshopDescription || "—"}
                            workshopDate={previewDate(workshopCreateForm.workshopTime)}
                            workshopLocation={workshopCreateForm.workshopLocation || "—"}
                        />
                    </div>
                </>
            )}

            {pastWorkshops.length > 0 && (
                <>
                    <PastWorkshopsHeading />
                    {pastWorkshops.map((workshop) => (
                        <div key={workshop.workshop_id} className="cardLink">
                            <Link to={`/workshops/${workshop.workshop_id}/modules`} className="linkNoUnderLine">
                                <WorkshopCard
                                    workshopName={workshop.workshop_name}
                                    workshopDescription={workshop.workshop_description}
                                    workshopDate={formatDate(workshop.workshop_date)}
                                    workshopLocation={workshop.workshop_location}
                                    workshopPublic={!!workshop.workshop_public}
                                    decoration={getDecoration(workshop.workshop_id)}
                                />
                            </Link>
                        </div>
                    ))}
                </>
            )}
        </>
    );
}
