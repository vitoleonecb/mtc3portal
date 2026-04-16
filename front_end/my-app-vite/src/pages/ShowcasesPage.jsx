import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { Link, useLocation } from "react-router-dom";

import { Heading1, Heading2 } from "../Headings.jsx";
import { CreateButton } from "../Buttons.jsx";
import { ShowcaseCard } from "../components/ShowcaseCard.jsx";
import { MysqlDateInput } from "../DateInput.jsx";
import { RAW_CHARACTERS } from "../components/card-characters.jsx";
import { createRng, pickFrom } from "../utils/random.js";

export function ShowcasesPage() {
    const [showcases, setShowcases] = useState([]);
    const [isAdmin, setIsAdmin] = useState(false);
    const { key: locationKey } = useLocation();

    // ── Showcase creation form state ──
    const [showcaseFormOpen, setShowcaseFormOpen] = useState(false);
    const [showcaseStep, setShowcaseStep] = useState(0);
    const [showcaseSubmitting, setShowcaseSubmitting] = useState(false);
    const [showcaseForm, setShowcaseForm] = useState({
        showcaseName: '',
        showcaseDescription: '',
        showcaseDate: '',
        showcaseLocation: '',
    });

    const accessToken = localStorage.getItem("accessToken");

    let decodedToken = null;
    if (typeof accessToken === "string" && accessToken.trim() !== "") {
        try { decodedToken = jwtDecode(accessToken); }
        catch (err) { console.error("Invalid token:", err); }
    }
    const userId = decodedToken?.user_id;

    // ── Fetch showcases ──
    useEffect(() => {
        const fetchShowcases = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_API_URL}/showcases`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                setShowcases(res.data);
            } catch (err) {
                console.error("Fetch showcases error:", err);
            }
        };
        fetchShowcases();
    }, []);

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

    // ── Group showcases: current (nearest future), upcoming (other future), past ──
    const { currentShowcase, upcomingShowcases, pastShowcases } = useMemo(() => {
        const now = new Date();
        const future = showcases
            .filter(s => new Date(s.showcase_date) >= now)
            .sort((a, b) => new Date(a.showcase_date) - new Date(b.showcase_date));
        const past = showcases
            .filter(s => new Date(s.showcase_date) < now)
            .sort((a, b) => new Date(b.showcase_date) - new Date(a.showcase_date));

        return {
            currentShowcase: future[0] || null,
            upcomingShowcases: future.slice(1),
            pastShowcases: past,
        };
    }, [showcases]);

    // ── Showcase creation helpers ──
    const showcaseSteps = [
        { key: 'showcaseName', label: 'Name it' },
        { key: 'showcaseDescription', label: 'Describe it' },
        { key: 'showcaseDate', label: 'When?' },
        { key: 'showcaseLocation', label: 'Where?' },
    ];

    function handleShowcaseFieldChange(e) {
        const { name, value } = e.target;
        setShowcaseForm(prev => ({ ...prev, [name]: value }));
    }

    function handleShowcaseDateChange(nextValue) {
        setShowcaseForm(prev => ({ ...prev, showcaseDate: nextValue }));
    }

    function isShowcaseStepValid(idx) {
        switch (idx) {
            case 0: return showcaseForm.showcaseName.trim().length > 0;
            case 1: return showcaseForm.showcaseDescription.trim().length > 0;
            case 2: return showcaseForm.showcaseDate?.trim().length > 0;
            case 3: return showcaseForm.showcaseLocation.trim().length > 0;
            default: return true;
        }
    }

    function showcaseNext() {
        if (!isShowcaseStepValid(showcaseStep)) return;
        setShowcaseStep(s => Math.min(s + 1, showcaseSteps.length - 1));
    }

    function showcaseBack() {
        setShowcaseStep(s => Math.max(s - 1, 0));
    }

    async function createShowcase() {
        if (!isShowcaseStepValid(showcaseStep)) return;
        setShowcaseSubmitting(true);
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/showcases`,
                {
                    showcase_name: showcaseForm.showcaseName,
                    showcase_description: showcaseForm.showcaseDescription,
                    showcase_date: showcaseForm.showcaseDate,
                    showcase_location: showcaseForm.showcaseLocation,
                },
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            const listRes = await axios.get(
                `${import.meta.env.VITE_API_URL}/showcases`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );
            setShowcases(listRes.data);
            setShowcaseFormOpen(false);
            setShowcaseStep(0);
            setShowcaseForm({ showcaseName: '', showcaseDescription: '', showcaseDate: '', showcaseLocation: '' });
        } catch (err) {
            console.error('Create showcase error:', err);
        } finally {
            setShowcaseSubmitting(false);
        }
    }

    // ── Random card decorations (same pattern as WorkshopsPage) ──
    const showcaseDecorations = useMemo(() => {
        const DECORATION_PROB = 0.25;
        const placements = [
            "cardDecoration-top-right",
            "cardDecoration-top-left",
            "cardDecoration-edge-right",
            "cardDecoration-edge-left",
        ];
        const map = {};
        showcases.forEach((showcase) => {
            const rng = createRng(`showcase-${showcase.showcase_id}-${locationKey}`);
            if (rng() < DECORATION_PROB) {
                const placement = pickFrom(rng, placements);
                if (!placement) return;
                const RawChar = pickFrom(rng, RAW_CHARACTERS);
                if (RawChar) {
                    const bigChance = 0.1;
                    let scale;
                    if (rng() < bigChance) {
                        const t = rng();
                        scale = 1.4 + t * 1.0;
                    } else {
                        const t = rng();
                        scale = 0.2 + (t * t) * 1.0;
                    }
                    map[showcase.showcase_id] = (
                        <div
                            className={`cardDecoration ${placement}`}
                            style={{ transform: `scale(${scale})`, transformOrigin: "center center" }}
                        >
                            <RawChar />
                        </div>
                    );
                }
            }
        });
        return map;
    }, [showcases, locationKey]);

    const renderShowcaseCard = (showcase) => (
        <div key={showcase.showcase_id} className="cardLink">
            <Link to={`/showcases/${showcase.showcase_id}`} className="linkNoUnderLine">
                <ShowcaseCard showcase={showcase} decoration={showcaseDecorations[showcase.showcase_id] || null} />
            </Link>
        </div>
    );

    return (
        <>
            <Heading1 text="Showcases" />

            {currentShowcase && (
                <>
                    <Heading2 text="Current" />
                    {renderShowcaseCard(currentShowcase)}
                </>
            )}

            {upcomingShowcases.length > 0 && (
                <>
                    <Heading2 text="Upcoming" />
                    {upcomingShowcases.map(renderShowcaseCard)}
                </>
            )}

            {!currentShowcase && upcomingShowcases.length === 0 && pastShowcases.length === 0 && !showcaseFormOpen && (
                <Heading2 text="No showcases yet" />
            )}

            {isAdmin && <CreateButton handleClick={() => setShowcaseFormOpen(true)} />}

            {showcaseFormOpen && (
                <>
                    {showcaseStep === 0 && (
                        <>
                            <Heading2 text="Name it" />
                            <input type="text" name="showcaseName" value={showcaseForm.showcaseName}
                                onChange={handleShowcaseFieldChange} className="textInput" maxLength={60}
                                placeholder="e.g., March Showcase" autoFocus />
                        </>
                    )}
                    {showcaseStep === 1 && (
                        <>
                            <Heading2 text="Describe it" />
                            <textarea name="showcaseDescription" value={showcaseForm.showcaseDescription}
                                onChange={handleShowcaseFieldChange} className="OpenResponse"
                                placeholder="What's happening at this showcase?" rows={5} />
                        </>
                    )}
                    {showcaseStep === 2 && (
                        <>
                            <Heading2 text="When?" />
                            <MysqlDateInput value={showcaseForm.showcaseDate} onChange={handleShowcaseDateChange} />
                        </>
                    )}
                    {showcaseStep === 3 && (
                        <>
                            <Heading2 text="Where?" />
                            <input type="text" name="showcaseLocation" value={showcaseForm.showcaseLocation}
                                onChange={handleShowcaseFieldChange} className="textInput" maxLength={80}
                                placeholder="Venue / Address" />
                        </>
                    )}

                    <div className="createWorkshopButtonContainer">
                        <button type="button" onClick={showcaseBack} className="createButton" disabled={showcaseStep === 0}>
                            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <polyline points="12.75 2.75 5.25 9 12.75 15.25" stroke="black" fill="none" />
                            </svg>
                        </button>
                        {showcaseStep < showcaseSteps.length - 1 ? (
                            <button type="button" onClick={showcaseNext} className="createButton" disabled={!isShowcaseStepValid(showcaseStep)}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <polyline points="5.25 2.75 12.75 9 5.25 15.25" stroke="black" fill="none" />
                                </svg>
                            </button>
                        ) : (
                            <button type="button" className="createButton" onClick={createShowcase} disabled={showcaseSubmitting || !isShowcaseStepValid(showcaseStep)}>
                                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <polyline points="3.25 9.5 7.5 14.5 14.75 3.25" stroke="black" fill="none" />
                                </svg>
                            </button>
                        )}
                    </div>

                    <div style={{ marginTop: 24 }}>
                        <ShowcaseCard showcase={{
                            showcase_name: showcaseForm.showcaseName || '—',
                            showcase_description: showcaseForm.showcaseDescription || '—',
                            showcase_date: showcaseForm.showcaseDate || null,
                            showcase_location: showcaseForm.showcaseLocation || '—',
                        }} />
                    </div>
                </>
            )}

            {pastShowcases.length > 0 && (
                <>
                    <Heading2 text="Archive" />
                    {pastShowcases.map(renderShowcaseCard)}
                </>
            )}
        </>
    );
}
