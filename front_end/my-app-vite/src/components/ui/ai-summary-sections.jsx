"use client";

import React from "react";

// Props:
// {
//   analysis: {
//     concise_summary?: string;
//     free_text_summary?: {
//       tones?: string[];
//       motifs?: string[];
//       absences?: string[];
//       questions?: string[];
//     };
//   };
// }

export function AiSummarySections({ analysis }) {
  const summary = (analysis?.concise_summary || '').trim();
  const details = analysis?.free_text_summary || {};

  const hasDetails =
    (details.tones && details.tones.length) ||
    (details.motifs && details.motifs.length) ||
    (details.absences && details.absences.length) ||
    (details.questions && details.questions.length);

  if (!summary && !hasDetails) return null;

  return (
    <div className="AiSummaryContainer">
      {summary && (
        <p className="AiSummaryParagraph">
          {summary}
        </p>
      )}
      {/* Optional: keep detailed sections behind a collapsible if needed later */}
      {false && hasDetails && (
        <details className="AiSummaryDetails">
          <summary>View detailed patterns</summary>
          {/* Render detailed tones/motifs/absences/questions here if desired */}
        </details>
      )}
    </div>
  );
}
