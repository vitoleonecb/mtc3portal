import React from "react";
import { Archive, CalendarDays } from "lucide-react";

export function ArchiveViewToggle({ value, onChange, currentLabel = "Current" }) {
    return (
        <div className="archiveViewToggle" role="group" aria-label="Choose current or archive view">
            <button
                type="button"
                className={`archiveViewToggleButton ${value === "current" ? "archiveViewToggleButton--active" : ""}`}
                onClick={() => onChange("current")}
                aria-pressed={value === "current"}
            >
                <CalendarDays size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>{currentLabel}</span>
            </button>
            <button
                type="button"
                className={`archiveViewToggleButton ${value === "archive" ? "archiveViewToggleButton--active" : ""}`}
                onClick={() => onChange("archive")}
                aria-pressed={value === "archive"}
            >
                <Archive size={17} strokeWidth={1.8} aria-hidden="true" />
                <span>Archive</span>
            </button>
        </div>
    );
}
