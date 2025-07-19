import React, { useState } from 'react';

export function Heading1({text, style = { textAlign: 'left'}}) {

    return (
        <h1 className="Heading1" style={style}>{text}</h1>
    )
}

export function Heading2({text = "No Text Provided", style = {}}) {
    return (
        <h1 className="Heading2" style={style}>{text}</h1>
    )
}

export function PromptInstruction(props) {
    return (
        <>
            <h1 className="Heading1">{props.question}</h1>
        </>
    )
}

export function OpenHeading() {
    return (
        <div className="OpenHeading">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="8" height="8" rx="4" fill="#57A15E"/>
            </svg>
            <h2 className="OpenText">Open</h2>
        </div>
    )
}

export function ProcessingHeading() {
    return (
        <div className="ProcessingHeading">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="8" height="8" rx="4" fill="#D2A478"/>
            </svg>
            <h2 className="ProcessingText">Processing</h2>
        </div>
    )
}

export function Completedheading() {
    return (
        <div className="CompletedHeading">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="8" height="8" rx="4" fill="#994242"/>
            </svg>
            <h2 className="CompletedText">Completed</h2>
        </div>
    )
}

export function PendingHeading() {
    return (
        <div className="PendingHeading">
            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect width="8" height="8" rx="4" fill="#000000"/>
            </svg>
            <h2 className="PendingText">Pending</h2>
        </div>
    )
}