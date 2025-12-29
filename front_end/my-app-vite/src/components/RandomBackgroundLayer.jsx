import React, { useMemo } from "react";
import { createRng, pickFrom } from "../utils/random.js";
import { FADED_BG_SHAPES } from "./background-shapes.jsx";

function getDensityCount(density) {
  if (typeof density === "number") return Math.max(1, Math.floor(density));
  switch (density) {
    case "low":
      return 2;
    case "high":
      return 7;
    case "medium":
    default:
      return 4;
  }
}

function generateElements(variant, density, seed) {
  const count = getDensityCount(density);
  const rand = createRng(seed ?? `${variant}-${density}`);

  const elements = [];
  const positions = [];
  const minDist = 0.22; // normalized distance to keep shapes from clustering too tightly
  const minDistSq = minDist * minDist;

  for (let i = 0; i < count; i += 1) {
    let x = 0;
    let y = 0;
    let tries = 0;
    let ok = false;

    // Try a few times to find a spot not too close to existing shapes
    while (tries < 8 && !ok) {
      x = rand(); // 0-1
      y = rand();
      let tooClose = false;
      for (let j = 0; j < positions.length; j += 1) {
        const dx = x - positions[j].x;
        const dy = y - positions[j].y;
        if (dx * dx + dy * dy < minDistSq) {
          tooClose = true;
          break;
        }
      }
      if (!tooClose) ok = true;
      tries += 1;
    }

    if (!ok) continue; // give up on this element if we couldn't place it nicely

    positions.push({ x, y });

    // Smaller scale on average but still visible
    const scale = 0.4 + rand() * 0.4; // 0.4 - 0.8
    const rotation = 0;               // no rotation – just location + scale
    // Use full opacity so dark fills and drop shadows stay true black
    const opacity = 1;

    const ShapeComponent =
      Array.isArray(FADED_BG_SHAPES) && FADED_BG_SHAPES.length
        ? pickFrom(rand, FADED_BG_SHAPES)
        : null;

    elements.push({
      key: `${variant}-${i}`,
      x,
      y,
      scale,
      rotation,
      opacity,
      ShapeComponent,
    });
  }

  return elements;
}
/**
 * RandomBackgroundLayer
 *
 * A reusable SVG background that can render different decorative variants
 * (e.g. dotted haze, soft abstract shapes) with deterministic randomness.
 *
 * It does not assume any specific layout integration – consumers can either:
 * - let it render as a full-screen fixed overlay (asFullScreen = true), or
 * - pass their own className/style and position it inside a container.
 */
export function RandomBackgroundLayer({
  variant = "dots-haze",
  density = "medium",
  mode = "behind", // future hook for z-index semantics
  seed,
  asFullScreen = false,
  className = "",
  style = {},
}) {
  const elements = useMemo(
    () => generateElements(variant, density, seed),
    [variant, density, seed]
  );

  const baseStyle = asFullScreen
    ? {
        position: "fixed",
        inset: 0,
        zIndex: mode === "behind" ? -3 : 1000,
        pointerEvents: "none",
      }
    : {
        position: "absolute",
        inset: 0,
        zIndex: mode === "behind" ? -3 : 1000,
        pointerEvents: "none",
      };

  return (
    <svg
      aria-hidden="true"
      role="presentation"
      className={className}
      style={{ ...baseStyle, ...style }}
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid slice"
    >
      {elements.map((el) => {
        const cx = el.x * 100;
        const cy = el.y * 100;
        const Shape = el.ShapeComponent;

        return (
    <g
      key={el.key}
      transform={`translate(${cx} ${cy}) rotate(${el.rotation}) scale(${el.scale})`}
      opacity={el.opacity}
    >
            {Shape ? (
              <Shape />
            ) : (
              <circle cx={0} cy={0} r={4} fill="rgba(210, 164, 120, 0.6)" />
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default RandomBackgroundLayer;
