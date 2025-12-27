import React, { useState, useEffect } from "react";
import axios from "axios";

import { Heading2 } from "../Headings.jsx";
import { NextButton, YesNoButton } from "../Buttons.jsx";

export function WorkshopCreateForm() {

    const steps = [
        { key: 'workshopName', label: 'What\'s the name of the Workshop?' },
        { key: 'workshopDescription', label: 'What are we doing?' },
        { key: 'workshopDate', label: 'When? (YYYY-MM-DD)' },
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

    const handleSubmit = async () => {
        try {
            
            const accessToken = localStorage.getItem('accessToken');

            console.log(accessToken);

            console.log(workshopForm);
            
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/workshops`,
            { 
                workshop_name: workshopForm['workshopName'], 
                workshop_description: workshopForm['workshopDescription'], 
                workshop_location: workshopForm['workshopLocation'], 
                workshop_date: workshopForm['workshopDate'],
                workshop_public: workshopForm['workshopPublic']
            },
            { headers: {'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`} }
            );
            console.log(response.data);
            setSubmitted(true);
        } catch (error) {
            console.log(`Internal Server Error ${error}`)
        }
    }

    const handleNext = () => {
        if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            handleSubmit();
            console.log(`Workshop Created: ${workshopForm['workshopName']}`);
        }
    }
    const handleChange = (event) => {
        setWorkshopForm({...workshopForm, [steps[stepIndex].key]: event.target.value})
    }

    const handleYesClick = () => {
        setWorkshopForm({...workshopForm, [steps[stepIndex].key]: 1})
    }

    useEffect(() => {
        if (workshopForm['workshopPublic'] === 1) {
            handleSubmit();
            console.log(`Workshop Created: ${workshopForm['workshopName']}`);
        }
    }, [workshopForm['workshopPublic']]);

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
    
            {
                isPublicKey ? (
                    <YesNoButton onClickYes={handleYesClick} onClickNo={handleSubmit}/>
                ) : (
                    <>
                        <input 
                        onChange={handleChange} 
                        value={workshopForm[steps[stepIndex].key]} 
                        type={steps[stepIndex].type || "text"} 
                        onKeyDown={(event) => event.key === "Enter" && handleNext()}
                        className="textInput" />
            
                        <NextButton onClick={handleNext} />
                    </>
                )
            }
        </>
    );
}