import React, { useEffect, useState } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";

import { Heading1, Heading2 } from "../Headings.jsx";

export function ConfirmEmailPage() {
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");
    const navigate = useNavigate();

    const [status, setStatus] = useState("loading"); // loading | success | error
    const [error, setError] = useState("");

    // Resend state
    const [resendEmail, setResendEmail] = useState("");
    const [resendStatus, setResendStatus] = useState(""); // "" | sending | sent | resendError

    useEffect(() => {
        if (!token) {
            setStatus("error");
            setError("Invalid or missing confirmation link.");
            return;
        }

        axios
            .get(`${import.meta.env.VITE_API_URL}/users/confirm-email`, {
                params: { token },
            })
            .then(() => setStatus("success"))
            .catch((err) => {
                setStatus("error");
                setError(
                    err.response?.data?.error ||
                        "Something went wrong. The link may have expired."
                );
            });
    }, [token]);

    const handleResend = async (e) => {
        e.preventDefault();
        if (!resendEmail) return;
        setResendStatus("sending");
        try {
            await axios.post(
                `${import.meta.env.VITE_API_URL}/users/resend-confirm-email`,
                { email: resendEmail },
                { headers: { "Content-Type": "application/json" } }
            );
            setResendStatus("sent");
        } catch {
            setResendStatus("resendError");
        }
    };

    return (
        <>
            <Heading1
                text="Email Confirmation"
                style={{ textAlign: "center" }}
            />

            {status === "loading" && (
                <p style={{ textAlign: "center" }}>Confirming your email…</p>
            )}

            {status === "success" && (
                <>
                    <p style={{ textAlign: "center" }}>
                        Your email has been confirmed!
                    </p>
                    <div className="logInButtonContainer">
                        <button
                            className="logInButton"
                            onClick={() => navigate("/login")}
                        >
                            Log In
                        </button>
                    </div>
                </>
            )}

            {status === "error" && (
                <>
                    <p className="loginError" style={{ textAlign: "center" }}>
                        {error}
                    </p>

                    {resendStatus === "sent" ? (
                        <p style={{ textAlign: "center" }}>
                            If that email is in our system, a new confirmation
                            link has been sent. Please check your inbox.
                        </p>
                    ) : (
                        <form className="logInForm" onSubmit={handleResend}>
                            <Heading2 text="Resend confirmation email" />
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={resendEmail}
                                onChange={(e) => setResendEmail(e.target.value)}
                                className="passwordInput"
                            />
                            {resendStatus === "resendError" && (
                                <p className="loginError">
                                    Failed to resend. Please try again.
                                </p>
                            )}
                            <div className="logInButtonContainer">
                                <button
                                    type="submit"
                                    className="logInButton"
                                    disabled={resendStatus === "sending"}
                                >
                                    {resendStatus === "sending"
                                        ? "Sending…"
                                        : "Resend"}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}
        </>
    );
}
