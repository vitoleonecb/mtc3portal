import React, { useState } from "react";
import axios from "axios";
import { useNavigate, useSearchParams } from "react-router-dom";

import { Heading1, Heading2 } from "../Headings.jsx";
import { validatePassword, validateConfirmPassword } from "../utils/validation.js";

export function ResetPasswordPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [error, setError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({ password: '', confirm: '' });

    if (!token) {
        return (
            <>
                <Heading1 text="Reset Password" style={{ textAlign: "center" }}/>
                <p className="loginError">Invalid or missing reset link.</p>
            </>
        );
    }

    const handleSubmit = async (event) => {
        event.preventDefault();

        const passwordError = validatePassword(newPassword);
        const confirmError = validateConfirmPassword(confirmPassword, newPassword);

        if (passwordError || confirmError) {
            setFieldErrors({ password: passwordError, confirm: confirmError });
            setError('');
            return;
        }

        setFieldErrors({ password: '', confirm: '' });

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/users/reset-password`,
                { token, newPassword },
                { headers: { 'Content-Type': 'application/json' } }
            );

            if (response.data.accessToken) {
                localStorage.setItem('accessToken', response.data.accessToken);
            }

            navigate('/showcases');
        } catch (err) {
            console.log(`Server Error: ${err}`);
            const message = err.response?.data?.error || 'Something went wrong. Please try again.';
            setError(message);
        }
    };

    return (
        <>
            <Heading1 text="Reset Password" style={{ textAlign: "center" }}/>
            <form className="logInForm" onSubmit={handleSubmit}>
                <Heading2 text="New Password"/>
                <input
                    onChange={(e) => {
                        setNewPassword(e.target.value);
                        if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: '' }));
                        if (error) setError('');
                    }}
                    value={newPassword}
                    className={`passwordInput ${fieldErrors.password ? 'textInputError' : ''}`}
                    type="password"
                />
                {fieldErrors.password && <p className="loginError">{fieldErrors.password}</p>}

                <Heading2 text="Confirm Password"/>
                <input
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (fieldErrors.confirm) setFieldErrors(prev => ({ ...prev, confirm: '' }));
                        if (error) setError('');
                    }}
                    value={confirmPassword}
                    className={`passwordInput ${fieldErrors.confirm ? 'textInputError' : ''}`}
                    type="password"
                />
                {fieldErrors.confirm && <p className="loginError">{fieldErrors.confirm}</p>}

                {error && <p className="loginError">{error}</p>}

                <div className="logInButtonContainer">
                    <button type="submit" className="logInButton">Reset Password</button>
                </div>
            </form>
        </>
    );
}
