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

  // We want most shapes to hug the left/right gutters so they peek out
  // from behind the centered content column instead of sitting in the
  // middle of the page.
  const sampleEdgeCoord = () => {
    // Approximate central content band as x in [0.3, 0.7]. We place
    // background tiles either in [0, 0.22] or [0.78, 1].
    const LEFT_MAX = 0.25;
    const RIGHT_MIN = 0.75;
    const sideIsLeft = rand() < .5;
    return sideIsLeft
      ? rand() * LEFT_MAX
      : RIGHT_MIN + rand() * (1 - RIGHT_MIN);
  };

  for (let i = 0; i < count; i += 1) {
    let x = 0;
    let y = 0;
    let tries = 0;
    let ok = false;

    // Try a few times to find a spot not too close to existing shapes
    while (tries < 8 && !ok) {
      x = sampleEdgeCoord(); // biased toward left/right borders
      // Vertical placement anywhere in [0,1] within the viewport.
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

    // All shapes use full opacity; visual variation comes only from
    // the underlying SVG artwork, not from per-instance alpha.
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
  heightFactor = 1,
}) {
  const elements = useMemo(
    () => generateElements(variant, density, seed),
    [variant, density, seed]
  );

  // Logical height is scaled by the observed aspect of the scrollable
  // body. This only affects the SVG's internal coordinate system; the
  // background remains absolutely positioned and does not change page
  // height.
  const logicalHeight = 100 * (heightFactor && heightFactor > 0 ? heightFactor : 1);

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
      viewBox={`0 0 100 ${logicalHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {elements.map((el) => {
        const cx = el.x * 100;
        const cy = el.y * logicalHeight;
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
