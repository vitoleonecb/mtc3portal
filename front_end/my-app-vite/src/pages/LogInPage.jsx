import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

import { Heading1, Heading2 } from "../Headings.jsx";
import { LogInButton } from "../Buttons.jsx";
import { validateEmail } from "../utils/validation.js";

export function LogInPage() {
    
    const [password, setPassword] = useState('');
    const [emailOrUsername, setEmailOrUsername] = useState('');
    const [error, setError] = useState('');
    const [isForgotPassword, setIsForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotSuccess, setForgotSuccess] = useState(false);
    const navigate = useNavigate();

    const handlePasswordChange = (event) => {
        setPassword(event.target.value);
        if (error) setError('');
    }

    const handleEmailOrUsernameChange = (event) => {
        setEmailOrUsername(event.target.value);
        if (error) setError('');
    }

    const handleForgotEmailChange = (event) => {
        setForgotEmail(event.target.value);
        if (error) setError('');
        if (forgotSuccess) setForgotSuccess(false);
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
            navigate('/showcases');
        } catch (error) {
            console.log(`Server Error: ${error}`);
            if (error.response?.status === 401) {
                setError('Invalid email/username or password');
            } else {
                setError('Something went wrong. Please try again.');
            }
        }
    }

    const handleForgotSubmit = async (event) => {
        event.preventDefault();

        const emailError = validateEmail(forgotEmail);
        if (emailError) {
            setError(emailError);
            return;
        }

        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/users/forgot-password`,
                { email: forgotEmail.trim() },
                { headers: { 'Content-Type': 'application/json' } });
            setError('');
            setForgotSuccess(true);
        } catch (err) {
            console.log(`Server Error: ${err}`);
            setError('Something went wrong. Please try again.');
        }
    }

    const exitForgotPassword = () => {
        setIsForgotPassword(false);
        setForgotEmail('');
        setForgotSuccess(false);
        setError('');
    }

    if (isForgotPassword) {
        return (
            <>
                <div className="forgotPasswordHeader">
                    <Heading1 text="Forgot Password" style={{ textAlign: "center" }}/>
                    <button
                        type="button"
                        className="cancelButton forgotPasswordClose"
                        onClick={exitForgotPassword}
                        title="Back to login"
                    >
                        ×
                    </button>
                </div>
                <form className="logInForm" onSubmit={handleForgotSubmit}>
                    <Heading2 text="Enter Your Email"/>
                    <input
                        onChange={handleForgotEmailChange}
                        value={forgotEmail}
                        className={`textInput ${error ? 'textInputError' : ''}`}
                        type="text"
                    />
                    {error && <p className="loginError">{error}</p>}
                    {forgotSuccess && <p className="forgotSuccessMessage">Check your email for a reset link</p>}
                    <div className="logInButtonContainer">
                        <button type="submit" className="logInButton">Submit</button>
                    </div>
                </form>
            </>
        );
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
                <div className="loginButtonRow">
                    <button
                        type="button"
                        className="forgotPasswordLink"
                        onClick={() => setIsForgotPassword(true)}
                    >
                        Forgot Password?
                    </button>
                    <LogInButton />
                </div>
            </form>    
        </>
    )
}
