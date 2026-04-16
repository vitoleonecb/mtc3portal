import React, { useState, useMemo } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

// UI Components
import { Heading1, Heading2 } from "../Headings.jsx";
import { NextButton } from "../Buttons.jsx";
import { AvatarCircle, AVATAR_COLORS } from "../Icons.jsx";
import { useOverlay } from "../context/OverlayContext.jsx";

// Shared validation helpers
import { validateEmail, validatePassword, validateConfirmPassword } from "../utils/validation.js";

// Local validation helpers
const validateName = (value, fieldName) => {
    const trimmed = value.trim();
    if (!trimmed) return `${fieldName} is required`;
    if (trimmed.length > 50) return `${fieldName} must be 50 characters or less`;
    // Allow letters (including unicode), spaces, hyphens, apostrophes
    if (!/^[\p{L}\s'-]+$/u.test(trimmed)) {
        return `${fieldName} can only contain letters, spaces, hyphens, and apostrophes`;
    }
    return '';
};

const validateUsername = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Username is required';
    if (trimmed.length < 3) return 'Username must be at least 3 characters';
    if (trimmed.length > 30) return 'Username must be 30 characters or less';
    if (!/^[a-zA-Z][a-zA-Z0-9_]*$/.test(trimmed)) {
        if (!/^[a-zA-Z]/.test(trimmed)) return 'Username must start with a letter';
        return 'Username can only contain letters, numbers, and underscores';
    }
    return '';
};

const validatePhone = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return ''; // Optional field
    // Strip non-digits
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length !== 10) {
        return 'Please enter a valid 10-digit phone number';
    }
    return '';
};

// Notification sub-option definitions (mirrors Settings.jsx)
const NOTIF_SUB_OPTIONS = [
    { key: 'module_open', label: 'Module opened' },
    { key: 'last_day_reminder', label: 'Last day to submit' },
    { key: 'materials_ready', label: 'Materials ready' },
    { key: 'workshop_rsvp', label: 'Workshop RSVP' },
    { key: 'showcase_announcements', label: 'New showcases' },
    { key: 'showcase_ticket', label: 'Showcase ticket confirmation' },
];

const DEFAULT_NOTIF_SETTINGS = {
    channel: 'email',
    module_open: true,
    last_day_reminder: true,
    materials_ready: true,
    workshop_rsvp: true,
    showcase_announcements: true,
    showcase_ticket: true,
};

const ALL_STEPS = [
    {key: 'firstName', label: 'first name'},
    {key: 'lastName', label: 'last name'},
    {key: 'email', label: 'email', type: 'email'},
    {key: 'userName', label: 'username'},
    {key: 'avatar', label: 'choose your avatar'},
    {key: 'notifications', label: 'notification preferences'},
    {key: 'userPassword1', label: 'Choose a password', type: 'password'},
    {key: 'userPassword2', label: 'Confirm your password', type: 'password'}
];

export function RegistrationPage() {
    const navigate = useNavigate();
    const { show, hide } = useOverlay();
    const [searchParams] = useSearchParams();

    // Guest-upgrade mode: detect ?guest=<userId>
    const guestUserId = searchParams.get('guest');
    const isGuestUpgrade = !!guestUserId;

    // Pre-fill email from sessionStorage (homepage runner) or URL param (email link fallback)
    const guestEmail = useMemo(() => {
        const fromSession = sessionStorage.getItem('guestEmail');
        if (fromSession) return fromSession;
        return searchParams.get('email') || '';
    }, []);

    // In guest-upgrade mode, skip the email step (already set on the guest record)
    const steps = useMemo(() => {
        if (isGuestUpgrade) {
            return ALL_STEPS.filter(s => s.key !== 'email');
        }
        return ALL_STEPS;
    }, [isGuestUpgrade]);

    const handleSubmit = async () => {
        try {
            console.log('[Registration] Submitting avatar_config:', avatarConfig);

            // Use guest email for upgrade mode, otherwise use form email
            const submittedEmail = isGuestUpgrade ? guestEmail : formData['email'];

            // Derive phone from notification step
            const phone = notifSettings.channel === 'sms' || notifSettings.channel === 'both'
                ? formData['userPhone'] || ''
                : '';

            await axios.post(`${import.meta.env.VITE_API_URL}/users/registration`,
            {
                username: formData['userName'],
                email: submittedEmail,
                first_name: formData['firstName'],
                last_name: formData['lastName'],
                user_password: formData['userPassword1'],
                user_type: formData['userType'],
                user_phone: phone,
                avatar_config: avatarConfig,
                notification_settings: notifSettings,
            },
            { headers: {'Content-Type': 'application/json'} });
            console.log(`User Created: ${formData['userName']}`);

            // Auto-login with the credentials just used to register
            const loginResponse = await axios.post(
                `${import.meta.env.VITE_API_URL}/users/login`,
                { email: submittedEmail, password: formData['userPassword1'] },
                { headers: { 'Content-Type': 'application/json' } }
            );
            localStorage.setItem('accessToken', loginResponse.data.accessToken);

            // Submit any stashed guest responses from the homepage runner
            try {
                const stashed = sessionStorage.getItem('guestResponses');
                if (stashed) {
                    const { workshopId, responses } = JSON.parse(stashed);
                    if (Array.isArray(responses) && responses.length > 0) {
                        const token = loginResponse.data.accessToken;
                        for (const r of responses) {
                            try {
                                await axios.post(
                                    `${import.meta.env.VITE_API_URL}/workshops/${workshopId}/modules/0/prompts/${r.promptId}/response`,
                                    { workshop_response_content: r.content, prompt_template_id: r.templateId },
                                    { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } }
                                );
                            } catch (respErr) {
                                console.error('Failed to save stashed response:', r.promptId, respErr);
                            }
                        }
                    }
                    sessionStorage.removeItem('guestResponses');
                }
            } catch (stashErr) {
                console.error('Error processing stashed responses:', stashErr);
            }

            // Clean up guest sessionStorage
            sessionStorage.removeItem('guestEmail');

            // Show success overlay
            show(
                <div className="ErrorOverlayContent">
                    <Heading1 text="Account Created" />
                    <Heading2 text={`Welcome, ${formData['firstName']}!`} />
                    <div className="ErrorOverlayButtons">
                        <button
                            type="button"
                            className="logInButton"
                            onClick={() => { hide(); navigate('/showcases'); }}
                        >
                            Go to Showcases
                        </button>
                    </div>
                </div>
            );
        }
        catch (error) {
            console.log(`Internal Server Error: ${error}`);

            const serverMsg = error.response?.data?.message
                || error.response?.data?.error
                || 'Something went wrong. Please try again.';

            show(
                <div className="ErrorOverlayContent">
                    <Heading1 text="Registration Failed" />
                    <Heading2 text={serverMsg} />
                    <div className="ErrorOverlayButtons">
                        <button
                            type="button"
                            className="logInButton"
                            onClick={() => hide()}
                        >
                            Okay
                        </button>
                    </div>
                </div>
            );
        }
    }

    const [formData, setFormData] = useState(
        {firstName: '', lastName: '' , email:'', userName: '', userType: 'user', 
        userPassword1: '', userPassword2: '', userPhone: ''}
        );
    const [stepIndex, setStepIndex] = useState(0);
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);
    const [notifSettings, setNotifSettings] = useState(DEFAULT_NOTIF_SETTINGS);

    // Avatar config: random initial selection, adjustable via counters
    const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const MAX_RINGS = 6;

const [avatarConfig, setAvatarConfig] = useState(() => {
        const defaultRings = randomInt(1, 4);
        const ringColorIndices = Array.from({ length: MAX_RINGS }, () =>
            randomInt(0, AVATAR_COLORS.length - 1)
        );
        return {
            rings: defaultRings,
            strokeWidth: randomInt(1, 4),
            backgroundColorIndex: randomInt(0, AVATAR_COLORS.length - 1),
            ringColorIndices,
            centerColorIndex: randomInt(0, AVATAR_COLORS.length - 1),
        };
    });

    // Async validation function that checks all rules for the current step
    const validateStep = async (stepKey, value) => {
        switch (stepKey) {
            case 'firstName':
                return validateName(value, 'First name');
            case 'lastName':
                return validateName(value, 'Last name');
            case 'email': {
                const formatError = validateEmail(value);
                if (formatError) return formatError;
                // Check uniqueness
                try {
                    const res = await axios.get(
                        `${import.meta.env.VITE_API_URL}/users/email/${encodeURIComponent(value.trim())}/exists`
                    );
                    if (res.data.exists) return 'This email is already registered';
                } catch (err) {
                    console.error('Email check failed:', err);
                    // Allow to proceed if check fails (backend will catch it)
                }
                return '';
            }
            case 'userName': {
                const formatError = validateUsername(value);
                if (formatError) return formatError;
                // Check uniqueness
                try {
                    const res = await axios.get(
                        `${import.meta.env.VITE_API_URL}/users/username/${encodeURIComponent(value.trim())}/exists`
                    );
                    if (res.data.exists) return 'This username is already taken';
                } catch (err) {
                    console.error('Username check failed:', err);
                }
                return '';
            }
            case 'avatar':
                return ''; // Always valid
            case 'notifications': {
                // If text updates enabled, validate phone
                if (notifSettings.channel === 'sms' || notifSettings.channel === 'both') {
                    return validatePhone(formData.userPhone);
                }
                return '';
            }
            case 'userPassword1':
                return validatePassword(value);
            case 'userPassword2':
                return validateConfirmPassword(value, formData.userPassword1);
            default:
                return '';
        }
    };

    const handleNext = async () => {
        console.log('Next Clicked. Current Step:', stepIndex);
        
        // Validate current step
        setIsValidating(true);
        const currentValue = formData[currentStep.key] || '';
        const validationError = await validateStep(currentStep.key, currentValue);
        setIsValidating(false);
        
        if (validationError) {
            setError(validationError);
            return;
        }
        
        // Clear error and proceed
        setError('');
        
        if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            console.log('Submitted:', formData);
            handleSubmit();
        }
    }
    
    const handleChange = (event) => {
        setFormData({ ...formData, [steps[stepIndex].key]: event.target.value });
        // Clear error when user starts typing
        if (error) setError('');
    }

    const currentStep = steps[stepIndex];

    // Helpers to tweak avatar config within safe ranges
    const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

    const updateAvatarField = (field, delta, { min, max, wrap } = { min: 0, max: 10, wrap: false }) => {
        setAvatarConfig((prev) => {
            let nextValue = (prev[field] ?? 0) + delta;
            if (wrap) {
                const length = max + 1; // inclusive max treated as length-1
                nextValue = ((nextValue % length) + length) % length;
            } else {
                nextValue = clamp(nextValue, min, max);
            }
            return { ...prev, [field]: nextValue };
        });
    };

    const updateRingColor = (index, delta) => {
        setAvatarConfig((prev) => {
            const next = { ...prev };
            const arr = [...(next.ringColorIndices || [])];
            const length = AVATAR_COLORS.length;
            const current = arr[index] ?? 0;
            const raw = current + delta;
            const wrapped = ((raw % length) + length) % length;
            arr[index] = wrapped;
            next.ringColorIndices = arr;
            return next;
        });
    };

    const avatarSeed = formData.userName || `${formData.firstName} ${formData.lastName}` || formData.email;

    const backgroundColor = AVATAR_COLORS[avatarConfig.backgroundColorIndex % AVATAR_COLORS.length];
    const ringColors = Array.from({ length: avatarConfig.rings }, (_, i) => {
        const idx = avatarConfig.ringColorIndices?.[i] ?? 0;
        return AVATAR_COLORS[idx % AVATAR_COLORS.length];
    });
    const centerColor = AVATAR_COLORS[avatarConfig.centerColorIndex % AVATAR_COLORS.length];

    // Notification step helpers
    const notificationsEnabled = notifSettings.channel !== 'none';
    const textEnabled = notifSettings.channel === 'sms' || notifSettings.channel === 'both';

    const toggleNotifications = () => {
        setNotifSettings(prev => ({
            ...prev,
            channel: prev.channel === 'none' ? 'email' : 'none',
        }));
    };

    const toggleTextUpdates = () => {
        setNotifSettings(prev => {
            if (prev.channel === 'both' || prev.channel === 'sms') {
                // Turn off text → email only
                return { ...prev, channel: 'email' };
            } else {
                // Turn on text → both
                return { ...prev, channel: 'both' };
            }
        });
    };

    const toggleSubOption = (key) => {
        setNotifSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <>
            <Heading2 text={currentStep.label}/>

            {currentStep.key === 'notifications' ? (
                <>
                    <div className="EdgeBox" style={{ display: 'block' }}>
                        {/* Master on/off */}
                        <div className="notifRow">
                            <span className="RSVPDetailText" style={{ marginBottom: 0 }}>Enable notifications</span>
                            <button
                                className={`notifToggle ${notificationsEnabled ? 'notifToggle--on' : ''}`}
                                onClick={toggleNotifications}
                                type="button"
                                aria-label="Toggle notifications"
                            >
                                <span className="notifToggleThumb" />
                            </button>
                        </div>

                        {notificationsEnabled && (
                            <>
                                {/* Text updates toggle */}
                                <div className="notifRow">
                                    <span className="RSVPDetailText" style={{ marginBottom: 0 }}>Receive text updates too?</span>
                                    <button
                                        className={`notifToggle ${textEnabled ? 'notifToggle--on' : ''}`}
                                        onClick={toggleTextUpdates}
                                        type="button"
                                        aria-label="Toggle text updates"
                                    >
                                        <span className="notifToggleThumb" />
                                    </button>
                                </div>

                                {/* Phone input (shown when text enabled) */}
                                {textEnabled && (
                                    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                                        <input
                                            className={`textInput ${error ? 'textInputError' : ''}`}
                                            type="tel"
                                            placeholder="Phone number (10 digits)"
                                            value={formData.userPhone}
                                            onChange={(e) => {
                                                setFormData(prev => ({ ...prev, userPhone: e.target.value }));
                                                if (error) setError('');
                                            }}
                                        />
                                    </div>
                                )}

                                {/* Sub-option toggles */}
                                {NOTIF_SUB_OPTIONS.map(({ key, label }) => (
                                    <div className="notifRow" key={key}>
                                        <span className="RSVPDetailText" style={{ marginBottom: 0 }}>{label}</span>
                                        <button
                                            className={`notifToggle ${notifSettings[key] ? 'notifToggle--on' : ''}`}
                                            onClick={() => toggleSubOption(key)}
                                            type="button"
                                            aria-label={`Toggle ${label}`}
                                        >
                                            <span className="notifToggleThumb" />
                                        </button>
                                    </div>
                                ))}
                            </>
                        )}
                    </div>

                    {error && <p className="registrationError">{error}</p>}
                    <NextButton onClick={handleNext} />
                </>
            ) : currentStep.key === 'avatar' ? (
                <>
                    <div className="RegistrationAvatarBuilder">
                        <div className="RegistrationAvatarPreview">
                            <AvatarCircle
                                seed={avatarSeed}
                                size={72}
                                rings={avatarConfig.rings}
                                strokeWidth={avatarConfig.strokeWidth}
                                backgroundColor={backgroundColor}
                                ringColors={ringColors}
                                centerColor={centerColor}
                            />
                        </div>
                        <div className="RegistrationAvatarControls">
                            <div className="RegistrationAvatarControlRow">
                                <span className="RegistrationAvatarControlLabel">Circles</span>
                                <button
                                    type="button"
                                    className="RegistrationAvatarCounterButton"
                                    onClick={() => updateAvatarField('rings', -1, { min: 1, max: MAX_RINGS, wrap: false })}
                                >
                                    -
                                </button>
                                <span className="RegistrationAvatarCounterValue">{avatarConfig.rings}</span>
                                <button
                                    type="button"
                                    className="RegistrationAvatarCounterButton"
                                    onClick={() => updateAvatarField('rings', +1, { min: 1, max: MAX_RINGS, wrap: false })}
                                >
                                    +
                                </button>
                            </div>

                            <div className="RegistrationAvatarControlRow">
                                <span className="RegistrationAvatarControlLabel">Thickness</span>
                                <button
                                    type="button"
                                    className="RegistrationAvatarCounterButton"
                                    onClick={() => updateAvatarField('strokeWidth', -1, { min: 1, max: 6, wrap: false })}
                                >
                                    -
                                </button>
                                <span className="RegistrationAvatarCounterValue">{avatarConfig.strokeWidth}</span>
                                <button
                                    type="button"
                                    className="RegistrationAvatarCounterButton"
                                    onClick={() => updateAvatarField('strokeWidth', +1, { min: 1, max: 6, wrap: false })}
                                >
                                    +
                                </button>
                            </div>

                            {/* Background color selector (outer disc) */}
                            <div className="RegistrationAvatarControlRow">
                                <span className="RegistrationAvatarControlLabel">Background</span>
                                <button
                                    type="button"
                                    className="RegistrationAvatarCounterButton"
                                    onClick={() => updateAvatarField('backgroundColorIndex', -1, { min: 0, max: AVATAR_COLORS.length - 1, wrap: true })}
                                >
                                    ◀
                                </button>
                                <div
                                    className="RegistrationAvatarColorSwatch"
                                    style={{ backgroundColor: backgroundColor }}
                                />
                                <button
                                    type="button"
                                    className="RegistrationAvatarCounterButton"
                                    onClick={() => updateAvatarField('backgroundColorIndex', +1, { min: 0, max: AVATAR_COLORS.length - 1, wrap: true })}
                                >
                                    ▶
                                </button>
                            </div>

                            {/* Per-ring color selectors (one row per active circle) */}
                            {ringColors.map((color, idx) => (
                                <div key={idx} className="RegistrationAvatarControlRow">
                                    <span className="RegistrationAvatarControlLabel">Circle {idx + 1}</span>
                                    <button
                                        type="button"
                                        className="RegistrationAvatarCounterButton"
                                        onClick={() => updateRingColor(idx, -1)}
                                    >
                                        ◀
                                    </button>
                                    <div
                                        className="RegistrationAvatarColorSwatch"
                                        style={{ backgroundColor: color }}
                                    />
                                    <button
                                        type="button"
                                        className="RegistrationAvatarCounterButton"
                                        onClick={() => updateRingColor(idx, +1)}
                                    >
                                        ▶
                                    </button>
                                </div>
                            ))}

                            {/* Center circle color selector (small filled circle) */}
                            <div className="RegistrationAvatarControlRow">
                                <span className="RegistrationAvatarControlLabel">Center</span>
                                <button
                                    type="button"
                                    className="RegistrationAvatarCounterButton"
                                    onClick={() => updateAvatarField('centerColorIndex', -1, { min: 0, max: AVATAR_COLORS.length - 1, wrap: true })}
                                >
                                    ◀
                                </button>
                                <div
                                    className="RegistrationAvatarColorSwatch"
                                    style={{ backgroundColor: centerColor }}
                                />
                                <button
                                    type="button"
                                    className="RegistrationAvatarCounterButton"
                                    onClick={() => updateAvatarField('centerColorIndex', +1, { min: 0, max: AVATAR_COLORS.length - 1, wrap: true })}
                                >
                                    ▶
                                </button>
                            </div>
                        </div>
                    </div>

                    <NextButton onClick={handleNext}></NextButton>
                </>
            ) : (
                <>
                    <input 
                        onChange={handleChange} 
                        value={formData[currentStep.key]} 
                        type={currentStep.type || "text"} 
                        onKeyDown={(event) => event.key === "Enter" && !isValidating && handleNext()}
                        className={`textInput ${error ? 'textInputError' : ''}`}
                        disabled={isValidating}
                    />
                    {error && <p className="registrationError">{error}</p>}

                    <div className="registrationButtonRow">
                        {error && currentStep.key === 'userPassword2' && (
                            <NextButton 
                                onClick={() => { setError(''); setStepIndex(stepIndex - 1); }} 
                                text="Back"
                            />
                        )}
                        <NextButton onClick={handleNext} disabled={isValidating}>
                            {isValidating ? '...' : undefined}
                        </NextButton>
                    </div>
                </>
            )}
        </>
    )
}
