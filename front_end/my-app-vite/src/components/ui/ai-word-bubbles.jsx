"use client";

import React, { useMemo } from "react";

// Props:
// {
//   analysis: {
//     word_bubbles?: {
//       phrases?: { text: string; weight: number }[];
//       keywords?: { text: string; weight: number }[];
//     };
//   };
// }

function buildLayoutItems(wordBubbles) {
  const phrases = wordBubbles?.phrases ?? [];
  const keywords = wordBubbles?.keywords ?? [];

  const combined = [
    ...phrases.map((p) => ({ ...p, kind: "phrase" })),
    ...keywords.map((k) => ({ ...k, kind: "keyword" })),
  ];

  // Show only the most salient items to keep the cloud readable.
  const MAX_ITEMS = 15;
  const limited = combined
    .slice()
    .sort((a, b) => (b.weight || 0) - (a.weight || 0))
    .slice(0, MAX_ITEMS);

  // Compute min/max within the limited set so relative differences are
  // visually exaggerated even when all weights are in a narrow band.
  const weights = limited.map((i) => (typeof i.weight === "number" ? i.weight : 0));
  const maxW = Math.max(...weights, 0);
  const minW = Math.min(...weights, 0);
  const span = Math.max(maxW - minW, 0.05); // avoid divide-by-zero, keep some variation
  const count = limited.length || 1;

  const styled = limited.map((item, index) => {
    const rawWeight = typeof item.weight === "number" ? item.weight : 0;
    const clamped = Math.min(1, Math.max(0, rawWeight));

    // Normalize to 0–1 within the top-N band, so the lightest and heaviest
    // items in the cloud are clearly differentiated.
    const norm = (clamped - minW) / span;

    // Also incorporate rank so the very top terms are guaranteed to be largest
    // even if weights are tightly clustered.
    const rankNorm = count > 1 ? (count - 1 - index) / (count - 1) : 1;

    // Blend weight-based and rank-based importance.
    const score = Math.min(1, Math.max(0, 0.7 * norm + 0.3 * rankNorm));

    // Map score -> visual scale with a wide range for strong contrast.
    // Keep max size the same, but let the smallest bubbles be smaller
    // so the difference between min and max is more dramatic.
    const minFont = 0.2;
    const maxFont = 3.0;
    const fontSize = minFont + score * (maxFont - minFont);

    // Reduce base padding for the lightest tags.
    const padY = 0.05 + score * 0.45;   // vertical padding
    const padX = 0.35 + score * 0.95;   // horizontal padding

    // Stable pseudo-random rotation & small vertical jitter based on text hash
    const hash = Array.from(item.text || "")
      .reduce((acc, ch) => acc + ch.charCodeAt(0), 0) + index * 17;
    const rotation = (hash % 9) - 4; // -4..4 degrees
    const offsetY = ((hash >> 3) % 9) - 4; // -4..4 px

    return {
      key: `${item.kind}-${item.text}-${index}`,
      text: item.text,
      kind: item.kind,
      fontSize,
      padY,
      padX,
      rotation,
      offsetY,
    };
  });

  // Randomize visual order of bubbles (sizes stay tied to importance).
  return styled.sort(() => Math.random() - 0.5);
}

export function AiWordBubbles({ analysis }) {
  const wordBubbles = analysis?.word_bubbles;

  const layoutItems = useMemo(() => {
    if (!wordBubbles) return [];
    return buildLayoutItems(wordBubbles);
  }, [wordBubbles]);

  if (!layoutItems.length) return null;

  return (
    <div className="AiWordBubblesContainer">
      <div className="AiWordBubblesHeader">
      </div>
      <div className="AiWordBubblesCloud">
        {layoutItems.map((b) => (
          <span
            key={b.key}
            className="AiWordBubble"
            style={{
              fontSize: `${b.fontSize}rem`,
              padding: `${b.padY}rem ${b.padX}rem`,
              transform: `translateY(${b.offsetY}px) rotate(${b.rotation}deg)`
            }}
          >
            {b.text}
          </span>
        ))}
      </div>
    </div>
  );
}
