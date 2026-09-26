import React, { useState } from "react";
import axios from "axios";

import { Heading2 } from "../Headings.jsx";
import { NextButton, YesNoButton } from "../Buttons.jsx";

function isRealDateValue(value) {
    if (typeof value !== "string") return false;
    const trimmed = value.trim();
    const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;

    const [, yearText, monthText, dayText] = match;
    const year = Number(yearText);
    const month = Number(monthText);
    const day = Number(dayText);

    if (year < 1000 || month < 1 || month > 12 || day < 1) return false;

    const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
    return day <= daysInMonth;
}

export function WorkshopCreateForm() {

    const steps = [
        { key: 'workshopName', label: 'What\'s the name of the Workshop?' },
        { key: 'workshopDescription', label: 'What are we doing?' },
        { key: 'workshopDate', label: 'When?' },
        { key: 'workshopLocation', label: 'Where?' },
        { key: 'workshopPublic', label: 'Is it happening in public?' }
    ];

    const [stepIndex, setStepIndex] = useState(0);
    const [workshopForm, setWorkshopForm] = useState({
        workshopName: '',
        workshopDescription: '',
        workshopDate: '',
        workshopLocation: '',
        workshopPublic: 0
    });

    const [submitted, setSubmitted] = useState(false);
    const [formError, setFormError] = useState("");

    const isCurrentStepValid = () => {
        const step = steps[stepIndex];
        const value = workshopForm[step.key];

        if (step.key === "workshopDate") return isRealDateValue(value);
        if (step.key === "workshopPublic") return true;
        return String(value ?? "").trim().length > 0;
    };

    const handleSubmit = async (workshopPublic = workshopForm.workshopPublic) => {
        if (!isRealDateValue(workshopForm.workshopDate)) {
            setFormError("Choose a real workshop date before creating the workshop.");
            setStepIndex(2);
            return;
        }

        try {
            setFormError("");
            const accessToken = localStorage.getItem('accessToken');

            console.log(accessToken);

            console.log(workshopForm);
            
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/workshops`,
            { 
                workshop_name: workshopForm['workshopName'], 
                workshop_description: workshopForm['workshopDescription'], 
                workshop_location: workshopForm['workshopLocation'], 
                workshop_date: workshopForm['workshopDate'],
                workshop_public: workshopPublic
            },
            { headers: {'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`} }
            );
            console.log(response.data);
            setSubmitted(true);
        } catch (error) {
            setFormError(error?.response?.data?.error || "Workshop could not be created.");
            console.log(`Internal Server Error ${error}`)
        }
    }

    const handleNext = () => {
        if (!isCurrentStepValid()) {
            setFormError(steps[stepIndex].key === "workshopDate"
                ? "Choose a real workshop date before continuing."
                : "Complete this step before continuing."
            );
            return;
        }
        setFormError("");
        if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            handleSubmit();
            console.log(`Workshop Created: ${workshopForm['workshopName']}`);
        }
    }
    const handleChange = (event) => {
        if (formError) setFormError("");
        setWorkshopForm({...workshopForm, [steps[stepIndex].key]: event.target.value})
    }

    const handleYesClick = () => {
        setWorkshopForm({...workshopForm, [steps[stepIndex].key]: 1});
        handleSubmit(1);
    }

    const isPublicKey = steps[stepIndex].key === 'workshopPublic';
    
    if (submitted) {
        return (
            <div className="workshopcreatecomplete">
                <Heading2 text={`Workshop: "${workshopForm['workshopName']}" has been created!`} />
            </div>
        )
    }
    
    return (
        <>

            <Heading2 text={steps[stepIndex].label}/>
            {formError && <p className="registrationError">{formError}</p>}
    
            {
                isPublicKey ? (
                    <YesNoButton onClickYes={handleYesClick} onClickNo={() => handleSubmit(0)}/>
                ) : (
                    <>
                        <input 
                        onChange={handleChange} 
                        value={workshopForm[steps[stepIndex].key]} 
                        type={steps[stepIndex].key === "workshopDate" ? "date" : "text"} 
                        onKeyDown={(event) => event.key === "Enter" && handleNext()}
                        className={`textInput ${formError && steps[stepIndex].key === "workshopDate" ? "textInputError" : ""}`} />
            
                        <NextButton onClick={handleNext} />
                    </>
                )
            }
        </>
    );
}
