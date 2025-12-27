import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { Heading1, Heading2 } from "../Headings.jsx";
import { LogInButton } from "../Buttons.jsx";

export function LogInPage() {
    
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const navigate = useNavigate();

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
    }

    const handleEmailChange = (event) => {
        setEmail(event.target.value);
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/login`,
            { email: email, password: password },
            { headers: {'Content-Type': 'application/json'}});
            console.log(`Log In Response: ${JSON.stringify(response.data)}`);
            localStorage.setItem('accessToken', response.data.accessToken);
	    navigate('/workshops');
        } catch (error) {
            console.log(`Server Error: ${error}`);
        }
        
        
    }

    return (
        <>
            <Heading1 text="Log In" style={{ textAlign: "center" }}/>
            <form className="logInForm" onSubmit={handleSubmit}>
                <Heading2 text="Email"/>
                <input onChange={handleEmailChange} value={email} className="textInput" type="email">
                </input>
                <Heading2 text="Password"/>
                <input onChange={handlePasswordChange} value={password} className="passwordInput" type="password">
                </input>
	        <LogInButton />
            </form>    
        </>
    )
}