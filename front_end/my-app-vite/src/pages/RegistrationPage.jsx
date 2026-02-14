import React, { useState } from "react";
import axios from "axios";

// UI Components
import { Heading2 } from "../Headings.jsx";
import { NextButton } from "../Buttons.jsx";
import { AvatarCircle, AVATAR_COLORS } from "../Icons.jsx";

// Validation helper functions
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

const validateEmail = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Email address is required';
    if (trimmed.length > 254) return 'Email address is too long';
    // Basic email regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) return 'Please enter a valid email address';
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
    if (digits.length < 10 || digits.length > 15) {
        return 'Please enter a valid phone number (10-15 digits)';
    }
    return '';
};

const validatePassword = (value) => {
    if (!value) return 'Password is required';
    if (value.length < 8) return 'Password must be at least 8 characters';
    if (value.length > 128) return 'Password must be 128 characters or less';
    if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter';
    if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter';
    if (!/[0-9]/.test(value)) return 'Password must contain at least one number';
    if (!/[!@#$%^&*()_+\-=[\]{}|;:',.<>?/]/.test(value)) {
        return 'Password must contain at least one special character';
    }
    return '';
};

const validateConfirmPassword = (value, password) => {
    if (!value) return 'Please confirm your password';
    if (value !== password) return 'Passwords do not match';
    return '';
};

export function RegistrationPage() {

    // List of objects to keep track, display and update form field responses.
    
    const steps = [
        {key: 'firstName', label: 'first name'},
        {key: 'lastName', label: 'last name'},
        {key: 'email', label: 'email', type: 'email'},
        {key: 'userName', label: 'username'},
        {key: 'avatar', label: 'choose your avatar'},
        {key: 'userPhone', label: 'Phone Number (optional, used for text updates)'},
        {key: 'userPassword1', label: 'Choose a password', type: 'password'},
        {key: 'userPassword2', label: 'Confirm your password', type: 'password'}
    ];

    const handleSubmit = async () => {
        try {
            // Debug: log the exact avatar_config we are about to persist
            console.log('[Registration] Submitting avatar_config:', avatarConfig);

            await axios.post(`${import.meta.env.VITE_API_URL}/users/registration`,
            {
                username: formData['userName'],
                email: formData['email'],
                first_name: formData['firstName'],
                last_name: formData['lastName'],
                user_password: formData['userPassword1'],
                user_type: formData['userType'],
                user_phone: formData['userPhone'],
                // Persist avatar configuration as JSON on the user record
                avatar_config: avatarConfig,
            },
            { headers: {'Content-Type': 'application/json'} });
            console.log(`User Created: ${formData['userName']}`);
        }
        catch (error) {
            console.log(`Internal Server Error: ${error}`);
        }
    }

    const [formData, setFormData] = useState(
        {firstName: '', lastName: '' , email:'', userName: '', userType: 'user', 
        userPassword1: '', userPassword2: '', userPhone: ''}
        );
    const [stepIndex, setStepIndex] = useState(0);
    const [error, setError] = useState('');
    const [isValidating, setIsValidating] = useState(false);

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
            case 'userPhone':
                return validatePhone(value);
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

    return (
        <>
            <Heading2 text={currentStep.label}/>

            {currentStep.key === 'avatar' ? (
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
