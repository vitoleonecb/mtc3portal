import React, { useState } from "react";
import axios from "axios";

// UI Components
import { Heading2 } from "../Headings.jsx";
import { NextButton } from "../Buttons.jsx";
import { AvatarCircle, AVATAR_COLORS } from "../Icons.jsx";

export function RegistrationPage() {

    // List of objects to keep track, display and update form field responses.
    
    const steps = [
        {key: 'firstName', label: 'first name'},
        {key: 'lastName', label: 'last name'},
        {key: 'email', label: 'email', type: 'email'},
        {key: 'userName', label: 'username'},
        {key: 'avatar', label: 'choose your avatar'},
        {key: 'userPhone', label: 'Phone Number'},
        {key: 'userPassword1', label: 'Choose a password', type: 'password'}
    ];

    const handleSubmit = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/registration`,
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
        userPassword1: '', userPhone: ''}
        );
    const [stepIndex, setStepIndex] = useState(0);

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

    const handleNext = () => {
        console.log('Next Clicked. Current Step:', stepIndex);
        if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            console.log('Submitted:', formData);
            handleSubmit();
        }
    }
    
    const handleChange = (event) => {
        setFormData({ ...formData, [steps[stepIndex].key]: event.target.value });
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
                        onKeyDown={(event) => event.key === "Enter" && handleNext()}
                        className="textInput"
                    />

                    <NextButton onClick={handleNext}></NextButton>
                </>
            )}
        </>
    )
}
