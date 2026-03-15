import React, { useState } from "react";

const TABS = [
  {
    label: "Workshops",
    body: "Workshops are collaborative sessions where participants engage with creative prompts across multiple modules. Each module is a self-contained set of interactive activities — from brainstorming to scene-building — that build on each other over the course of the workshop.",
    diagramLabel: "Workshop → Modules → Prompts → Responses",
  },
  {
    label: "Prompts",
    body: "Prompts come in many forms: multiple choice, checklists, drag-and-drop staging, script annotation, star ratings, open-ended writing, and more. Each template type captures a different dimension of creative thinking, from analytical to expressive.",
    diagramLabel: "7 Template Types × Infinite Configurations",
  },
  {
    label: "Community",
    body: "Every response becomes part of a shared dataset. Community analytics show how the group thinks collectively — agreement patterns, divergent ideas, emerging themes — all visualized through interactive charts and AI-powered analysis.",
    diagramLabel: "Responses → Analytics → Insights → Charts",
  },
  {
    label: "Showcases",
    body: "Showcases are live events where the community gathers to present and celebrate work born from the workshop process. RSVP, get your digital ticket, check in with a QR code, and experience theater shaped by collective imagination.",
    diagramLabel: "Workshop ↔ Showcase ↔ Community",
  },
];

export function DescriptionTabs() {
  const [active, setActive] = useState(0);

  return (
    <div className="descriptionTabsContainer">
      {/* Tab buttons */}
      <div className="descriptionTabBar">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            type="button"
            className={`logInButton descriptionTab${i === active ? " logInButton--pressed" : ""}`}
            onClick={() => setActive(i)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content panels — cross-fade via CSS */}
      <div className="descriptionContentArea">
        {TABS.map((tab, i) => (
          <div
            key={tab.label}
            className="descriptionPanel"
            style={{
              opacity: i === active ? 1 : 0,
              pointerEvents: i === active ? "auto" : "none",
              transform: i === active ? "translateY(0)" : "translateY(8px)",
            }}
          >
            <p className="descriptionBody">{tab.body}</p>
            {/* Placeholder diagram box — swap with real drawings later */}
            <div className="descriptionDiagram">
              <span className="descriptionDiagramText">{tab.diagramLabel}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
