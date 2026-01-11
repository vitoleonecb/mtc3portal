import React, { useMemo, useEffect, useState } from "react";
import { createRng, pickFrom } from "../utils/random.js";
import { FADED_BG_SHAPES } from "./background-shapes.jsx";

// How many tiles to generate based on a simple density label.
// We keep the counts modest so the scroll-linked background stays
// lightweight even on lower-powered devices.
function getDensityCount(density) {
  if (typeof density === "number") return Math.max(1, Math.floor(density));
  switch (density) {
    case "low":
      return 3;
    case "high":
      return 8;
    case "medium":
    default:
      return 5;
  }
}

// X positions are biased toward the left/right gutters so they peek
// out from behind the centered content column.
function sampleEdgeCoord(rand) {
  const LEFT_MAX = 0.25;
  const RIGHT_MIN = 0.75;
  const sideIsLeft = rand() < 0.5;
  return sideIsLeft ? rand() * LEFT_MAX : RIGHT_MIN + rand() * (1 - RIGHT_MIN);
}

// Pre-generate a set of tiles in document-relative coordinates.
function generateDocumentTiles(variant, density, seed) {
  const count = getDensityCount(density);
  const rand = createRng(seed ?? `${variant}-${density}`);

  const tiles = [];

  for (let i = 0; i < count; i += 1) {
    const xNorm = sampleEdgeCoord(rand); // 0..1 across width
    const yDocNorm = rand();             // 0..1 down the full page

    const scale = 0.4 + rand() * 0.4;    // 0.4 - 0.8
    const rotation = 0;
    const opacity = 1;

    const ShapeComponent =
      Array.isArray(FADED_BG_SHAPES) && FADED_BG_SHAPES.length
        ? pickFrom(rand, FADED_BG_SHAPES)
        : null;

    tiles.push({
      key: `${variant}-${i}`,
      xNorm,
      yDocNorm,
      scale,
      rotation,
      opacity,
      ShapeComponent,
    });
  }

  return tiles;
}

// Scroll-linked background that is drawn in a fixed 100x100 SVG
// overlay but whose tiles are anchored to the full document height.
export function ScrollBackgroundLayer({
  variant = "dots-haze",
  density = "medium",
  seed,
  className = "",
  style = {},
}) {
  const tiles = useMemo(
    () => generateDocumentTiles(variant, density, seed),
    [variant, density, seed]
  );

  // Scroll position is a single number updated on scroll; viewport
  // dimensions are updated only on resize. This avoids re-computing
  // document height on every scroll frame and keeps React work small.
  const [scrollY, setScrollY] = useState(() =>
    typeof window === "undefined" ? 0 : window.scrollY || 0
  );
  const [viewport, setViewport] = useState(() => {
    if (typeof window === "undefined" || typeof document === "undefined") {
      return { viewH: 1, docH: 1 };
    }
    const doc = document.documentElement;
    return {
      viewH: window.innerHeight || 1,
      docH: doc.scrollHeight || 1,
    };
  });

  // Scroll listener: only updates scrollY (cheap) and is throttled
  // with requestAnimationFrame.
  useEffect(() => {
    if (typeof window === "undefined") return;

    let frame = null;

    const update = () => {
      frame = null;
      setScrollY(window.scrollY || 0);
    };

    const onScroll = () => {
      if (frame != null) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame != null) window.cancelAnimationFrame(frame);
    };
  }, []);

  // Resize listener: updates viewport height and total document
  // height, but runs much less frequently than scroll.
  useEffect(() => {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    const updateViewport = () => {
      const doc = document.documentElement;
      setViewport({
        viewH: window.innerHeight || 1,
        docH: doc.scrollHeight || 1,
      });
    };

    window.addEventListener("resize", updateViewport);
    updateViewport();
    return () => window.removeEventListener("resize", updateViewport);
  }, []);

  const { viewH, docH } = viewport;

  // Guard against division by zero.
  const safeViewH = viewH || 1;
  const safeDocH = docH || 1;

  // Map tiles from document space to the current viewport in a 0..100
  // logical coordinate system.
  const logicalHeight = 100;

  const inViewTiles = tiles
    .map((tile) => {
      const docY = tile.yDocNorm * safeDocH;
      const delta = docY - scrollY; // position relative to viewport top (px)

      // cull tiles far outside the viewport (+/- 1 viewport height as buffer)
      if (delta < -safeViewH || delta > safeViewH * 2) return null;

      const screenYNorm = delta / safeViewH; // 0..1 (ish)
      const cy = screenYNorm * logicalHeight;
      const cx = tile.xNorm * 100;

      return { ...tile, cx, cy };
    })
    .filter(Boolean);

  return (
    <svg
      aria-hidden="true"
      role="presentation"
      className={className}
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: -3,
        ...style,
      }}
      viewBox={`0 0 100 ${logicalHeight}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {inViewTiles.map((el) => {
        const Shape = el.ShapeComponent;
        return (
          <g
            key={el.key}
            transform={`translate(${el.cx} ${el.cy}) rotate(${el.rotation}) scale(${el.scale})`}
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

export default ScrollBackgroundLayer;
