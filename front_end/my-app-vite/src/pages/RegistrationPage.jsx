import React, { useState } from "react";
import axios from "axios";

// UI Components
import { Heading2 } from "../Headings.jsx";
import { NextButton } from "../Buttons.jsx";

export function RegistrationPage() {

    // List of objects to keep track, display and update form field responses.
    
    const steps = [
        {key: 'firstName', label: 'first name'},
        {key: 'lastName', label: 'last name'},
        {key: 'email', label: 'email', type: 'email'},
        {key: 'userName', label: 'username'},
        {key: 'userPhone', label: 'Phone Number'},
        {key: 'userPassword1', label: 'Choose a password', type: 'password'}
    ];

    const handleSubmit = async () => {
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/registration`,
            { username: formData['userName'], email: formData['email'], first_name: formData['firstName'], last_name: formData['lastName'], user_password: formData['userPassword1'], user_type: formData['userType'], user_phone: formData['userPhone'] },
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

    return (
        <>
                
                <Heading2 text={steps[stepIndex].label}/>
                
                
                    <>
                        <input 
                            onChange={handleChange} 
                            value={formData[steps[stepIndex].key]} 
                            type={steps[stepIndex].type || "text"} 
                            onKeyDown={(event) => event.key === "Enter" && handleNext()}
                            className="textInput"
                        />
                        <NextButton onClick={handleNext}></NextButton>
                    </>
        </>
    )
}