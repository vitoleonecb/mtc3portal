import React from "react";

import { Link } from "react-router-dom";

import { Heading1, Heading2 } from "../Headings.jsx";

import { NextButton } from "../Buttons.jsx";

export function HomePage() {
    return (
        <>
            <Heading1 text="Machine Theater Collective" style={{ textAlign: "center" }}/>
            <Heading2 text="A theater company powered by community imagination and software."/>
            <NextButton text="Try Module"/>
            <Link to="login" className="linkNoUnderLine cardLink">
                <NextButton text="Log In"/>
            </Link>
            <Link to="register" className="linkNoUnderLine cardLink">
                <NextButton text="Sign Up"/>
            </Link>
        </>
    )
}