import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { Heading1, Heading2 } from "../Headings.jsx";
import { LogInButton } from "../Buttons.jsx";

export function LogInPage() {
    
    const [password, setPassword] = useState('');
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
        if (error) setError('');
    }

    const handleEmailOrUsernameChange = (event) => {
        setEmailOrUsername(event.target.value);
        if (error) setError('');
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        
        // Basic validation
        if (!emailOrUsername.trim()) {
            setError('Please enter your email or username');
            return;
        }
        if (!password) {
            setError('Please enter your password');
            return;
        }
        
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/users/login`,
            { email: emailOrUsername.trim(), password: password },
            { headers: {'Content-Type': 'application/json'}});
            console.log(`Log In Response: ${JSON.stringify(response.data)}`);
            localStorage.setItem('accessToken', response.data.accessToken);
            navigate('/workshops');
        } catch (error) {
            console.log(`Server Error: ${error}`);
            if (error.response?.status === 401) {
                setError('Invalid email/username or password');
            } else {
                setError('Something went wrong. Please try again.');
            }
        }
    }

    return (
        <>
            <Heading1 text="Log In" style={{ textAlign: "center" }}/>
            <form className="logInForm" onSubmit={handleSubmit}>
                <Heading2 text="Email or Username"/>
                <input 
                    onChange={handleEmailOrUsernameChange} 
                    value={emailOrUsername} 
                    className={`textInput ${error ? 'textInputError' : ''}`} 
                    type="text"
                />
                <Heading2 text="Password"/>
                <input 
                    onChange={handlePasswordChange} 
                    value={password} 
                    className={`passwordInput ${error ? 'textInputError' : ''}`} 
                    type="password"
                />
                {error && <p className="loginError">{error}</p>}
                <LogInButton />
            </form>    
        </>
    )
}
