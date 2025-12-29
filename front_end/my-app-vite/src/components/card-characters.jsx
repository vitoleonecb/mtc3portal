import React from "react";

import { BG_PALETTE } from "./background-shapes.jsx";
import { createRng, pickFrom } from "../utils/random.js";

// BODY_VARIANTS holds full SVG body silhouettes (possibly multi-path),
// each tagged with a logical color key so we can trend shapes by color.
// Add new variants by appending objects with { id, colorKey, render }.
export const BODY_VARIANTS = [
  {
    id: "tan-main-1",
    colorKey: "tan",
    render: () => {
      const scale = 120 / 558; // based on original viewBox height 558
      const offsetX = (80 - 207 * scale) / 2; // center in 80-wide viewBox
      return (
        <g transform={`translate(${offsetX} 0) scale(${scale})`}>
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M132.799 61.6128C303.087 2.37032 -28.0337 -33.1033 45.4191 63.7875C45.7855 64.2708 46.1586 64.7551 46.5362 65.2452C53.9922 74.924 63.4159 87.157 66.5872 150.371C54.1099 186.572 44.8946 209.081 38.6985 224.215C30.4697 244.315 27.5662 251.407 29.4195 260.288C27.4192 280.288 27.4192 319.609 27.4192 361.788C27.4192 492.032 87.9443 553.058 103.087 553.863C103.087 553.863 103.113 553.864 103.15 553.865C103.174 553.866 103.201 553.867 103.231 553.868C103.264 553.869 103.3 553.87 103.331 553.871C103.351 553.871 103.369 553.871 103.385 553.871C118.013 553.871 180.587 475.486 180.587 344.371C172.279 289.586 153.617 249.9 137.837 216.342C123.229 185.278 111.09 159.464 111.919 131.784C112.073 126.663 111.44 122.21 110.826 117.887C108.835 103.879 107.038 91.2303 132.799 61.6128ZM103.385 340.375V553.871C108.549 513.721 115.778 415.944 103.385 340.375Z"
            fill="#D2A478"
          />
          <path
            d="M46.5362 65.2452C46.1586 64.7551 45.7855 64.2708 45.4191 63.7875C33.2426 110.102 -31.9131 368.871 29.4195 260.288C27.5662 251.407 30.4697 244.315 38.6985 224.215C44.8946 209.081 54.1099 186.572 66.5872 150.371C63.4159 87.157 53.9922 74.924 46.5362 65.2452Z"
            fill="#D2A478"
          />
          <path
            d="M46.5362 65.2452C46.1586 64.7551 45.7855 64.2708 45.4191 63.7875M46.5362 65.2452C53.9922 74.924 63.4159 87.157 66.5872 150.371C54.1099 186.572 44.8946 209.081 38.6985 224.215C30.4697 244.315 27.5662 251.407 29.4195 260.288M46.5362 65.2452C46.5126 65.2146 46.489 65.184 46.4654 65.1534M45.4191 63.7875C-28.0337 -33.1033 303.087 2.37032 132.799 61.6128C107.038 91.2303 108.835 103.879 110.826 117.887C111.44 122.21 112.073 126.663 111.919 131.784M45.4191 63.7875C33.2426 110.102 -31.9131 368.871 29.4195 260.288M111.919 131.784C111.09 159.464 123.229 185.278 137.837 216.342C153.617 249.9 172.279 289.586 180.587 344.371M111.919 131.784C226.18 36.1723 207.254 155.047 190.968 257.342C185.636 290.831 180.587 322.543 180.587 344.371M180.587 344.371C180.587 475.486 118.013 553.871 103.385 553.871M103.385 553.871C108.549 513.721 115.778 415.944 103.385 340.375V553.871ZM103.385 553.871C103.369 553.871 103.351 553.871 103.331 553.871M103.385 553.871L103.331 553.871M29.4195 260.288C27.4192 280.288 27.4192 319.609 27.4192 361.788C27.4192 492.032 87.9443 553.058 103.087 553.863M122.804 33.3711C127.135 28.2065 135.198 20.9761 132.799 33.3711M103.087 553.863C103.087 553.863 103.113 553.864 103.15 553.865M103.087 553.863L103.15 553.865M103.331 553.871C103.3 553.87 103.264 553.869 103.231 553.868C103.201 553.867 103.174 553.866 103.15 553.865M103.331 553.871L103.15 553.865"
            stroke="black"
            strokeWidth="7"
          />
        </g>
      );
    },
  },
  {
    id: "red-main-1",
    colorKey: "red",
    render: () => {
      const scale = 120 / 638; // original viewBox height 638
      const offsetX = (80 - 324 * scale) / 2; // width 324
      return (
        <g transform={`translate(${offsetX} 0) scale(${scale})`}>
          <path
            d="M158.051 396.843C158.051 527.958 146.192 634.247 131.564 634.247C116.936 634.247 105.078 527.958 105.078 396.843C105.078 354.664 88.5084 359.011 84.513 339.866C81.2643 324.298 89.5519 373.025 118.6 288.747C102.307 278.528 87.5906 188.459 79.9884 178.431C31.2922 114.196 285.283 -10.2778 317.6 4.74681C339.6 16.7655 187.124 107.231 131.564 159.439C144.838 164.639 148.369 180.708 147.719 202.421C145.995 260.003 114.866 357.282 158.051 396.843Z"
            fill="#994242"
          />
          <path
            d="M158.051 396.843C158.051 527.958 146.192 634.247 131.564 634.247M158.051 396.843C114.866 357.282 145.995 260.003 147.719 202.421M158.051 396.843C313.1 339.866 148.165 230.077 147.719 202.421M131.564 634.247C116.936 634.247 105.078 527.958 105.078 396.843C105.078 354.664 88.5084 359.011 84.513 339.866M131.564 634.247C136.729 594.096 143.958 494.903 131.564 419.334M79.9884 178.431C87.5906 188.459 102.307 278.528 118.6 288.747C89.5519 373.025 81.2643 324.298 84.513 339.866M79.9884 178.431C-13.9004 75.247 -31.4 98.2469 84.513 339.866M79.9884 178.431C31.2922 114.196 285.283 -10.2778 317.6 4.74681C339.6 16.7655 187.124 107.231 131.564 159.439C144.838 164.639 148.369 180.708 147.719 202.421M144.558 110.459C148.889 105.295 156.951 98.0643 154.552 110.459"
            stroke="black"
            strokeWidth="7"
          />
        </g>
      );
    },
  },
  {
    id: "black-main-1",
    colorKey: "black",
    render: () => {
      const scale = 120 / 570; // original viewBox height 570
      const offsetX = (80 - 125 * scale) / 2; // width 125
      return (
        <g transform={`translate(${offsetX} 0) scale(${scale})`}>
          <path
            d="M96.4509 329.096C96.4509 460.211 84.5926 566.5 69.9645 566.5C55.3365 566.5 43.4782 460.211 43.4782 329.096C43.4782 286.917 26.9085 291.264 22.9131 272.119C19.6643 256.551 24.7295 225.45 53.7775 141.172C37.4847 130.953 25.9906 120.712 18.3884 110.684C-55.0645 13.7931 234.81 -63.2077 69.9645 91.6917C83.2383 96.8923 86.7695 112.961 86.1194 134.674C84.3954 192.256 53.2657 289.536 96.4509 329.096Z"
            fill="black"
          />
          <path
            d="M96.4509 329.096C96.4509 460.211 84.5926 566.5 69.9645 566.5M96.4509 329.096C53.2657 289.536 84.3954 192.256 86.1194 134.674M96.4509 329.096C89.2547 239.932 86.5648 162.33 86.1194 134.674M69.9645 566.5C55.3365 566.5 43.4782 460.211 43.4782 329.096C43.4782 286.917 26.9085 291.264 22.9131 272.119M69.9645 566.5C75.1286 526.35 82.3584 427.156 69.9645 351.587M18.3884 110.684C25.9906 120.712 37.4847 130.953 53.7775 141.172C24.7295 225.45 19.6643 256.551 22.9131 272.119M18.3884 110.684C-55.0645 13.7931 234.81 -63.2077 69.9645 91.6917C83.2383 96.8923 86.7695 112.961 86.1194 134.674M18.3884 110.684C6.21187 156.998 -9.93038 254.126 22.9131 272.119"
            stroke="white"
          />
          <path
            d="M96.4509 329.096C96.4509 460.211 84.5926 566.5 69.9645 566.5C55.3365 566.5 43.4782 460.211 43.4782 329.096C43.4782 286.917 26.9085 291.264 22.9131 272.119C19.6643 256.551 24.7295 225.45 53.7775 141.172C37.4847 130.953 25.9906 120.712 18.3884 110.684C-55.0645 13.7931 234.81 -63.2077 69.9645 91.6917C83.2383 96.8923 86.7695 112.961 86.1194 134.674C84.3954 192.256 53.2657 289.536 96.4509 329.096Z"
            fill="black"
          />
          <path
            d="M96.4509 329.096C96.4509 460.211 84.5926 566.5 69.9645 566.5M96.4509 329.096C53.2657 289.536 84.3954 192.256 86.1194 134.674M96.4509 329.096C89.2547 239.932 86.5648 162.33 86.1194 134.674M69.9645 566.5C55.3365 566.5 43.4782 460.211 43.4782 329.096C43.4782 286.917 26.9085 291.264 22.9131 272.119M69.9645 566.5C75.1286 526.35 82.3584 427.156 69.9645 351.587M18.3884 110.684C25.9906 120.712 37.4847 130.953 53.7775 141.172C24.7295 225.45 19.6643 256.551 22.9131 272.119M18.3884 110.684C-55.0645 13.7931 234.81 -63.2077 69.9645 91.6917C83.2383 96.8923 86.7695 112.961 86.1194 134.674M18.3884 110.684C6.21187 156.998 -9.93038 254.126 22.9131 272.119"
            stroke="white"
            strokeWidth="7"
          />
          <path d="M79.5 36.5C82.6667 31.3333 88.8 24.1 88 36.5" stroke="white" />
        </g>
      );
    },
  },
  {
    id: "green-main-1",
    colorKey: "green",
    render: () => {
      const scale = 120 / 599; // original viewBox height 599
      const offsetX = (80 - 166 * scale) / 2; // width 166
      return (
        <g transform={`translate(${offsetX} 0) scale(${scale})`}>
          <path
            d="M76.1309 357.889C76.1309 489.004 87.9891 595.293 102.617 595.293C117.245 595.293 129.104 489.004 129.104 357.889C129.104 315.71 145.673 320.057 149.669 300.912C152.917 285.344 147.852 254.243 118.804 169.965C135.097 159.746 118.48 41.3209 126.082 31.293C177.727 -36.831 27.8234 38.5614 4.58151 63.7929C-5.23285 74.4475 53.6748 74.4951 102.617 120.485C89.3434 125.685 85.8122 141.754 86.4623 163.467C88.1863 221.049 119.316 318.329 76.1309 357.889Z"
            fill="#57A15E"
          />
          <path
            d="M76.1309 357.889C76.1309 489.004 87.9891 595.293 102.617 595.293M76.1309 357.889C119.316 318.329 88.1863 221.049 86.4623 163.467M76.1309 357.889C83.327 268.725 86.0169 191.123 86.4623 163.467M102.617 595.293C117.245 595.293 129.104 489.004 129.104 357.889C129.104 315.71 145.673 320.057 149.669 300.912M102.617 595.293C97.4531 555.142 90.2234 455.949 102.617 380.38M126.082 31.293C118.48 41.3209 135.097 159.746 118.804 169.965C147.852 254.243 152.917 285.344 149.669 300.912M126.082 31.293C138.258 77.6076 182.512 282.919 149.669 300.912M126.082 31.293C177.727 -36.831 27.8234 38.5614 4.58151 63.7929C-5.23285 74.4475 53.6748 74.4951 102.617 120.485C89.3434 125.685 85.8122 141.754 86.4623 163.467M96.4572 38.293C92.1261 33.1284 84.0636 25.898 86.4623 38.293"
            stroke="black"
            strokeWidth="7"
          />
        </g>
      );
    },
  },
];

// Helper to pick a body variant using a stable seeded RNG, optionally
// restricted by colorKey.
function pickBodyVariant({ seed, colorKey }) {
  if (!Array.isArray(BODY_VARIANTS) || BODY_VARIANTS.length === 0) return null;

  let pool = BODY_VARIANTS;
  if (colorKey) {
    const byColor = BODY_VARIANTS.filter((v) => v.colorKey === colorKey);
    if (byColor.length > 0) pool = byColor;
  }

  const rng = createRng(`body-${seed ?? "default"}`);
  const choice = pickFrom(rng, pool);
  return choice || BODY_VARIANTS[0];
}

// A soft wing / cape-like secondary shape that can sit behind the body.
const WING_PATH = `M30 20
  C22 18 16 20 12 24
  C8 28 6 34 7 40
  C8 46 12 50 18 54
  C24 57 30 56 34 54`;

function CharacterSvg({
  children,
  width,
  height,
  className,
  style,
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 80 120"
      aria-hidden="true"
      role="presentation"
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

/**
 * Character leaning against the left edge of a card.
 * Good for module / navigation cards where the figure feels propped up.
 */
export function CharacterLeanLeft({
  bodyColor = BG_PALETTE.red,
  wingColor = "#FFFFFF",
  width = 80,
  height = 120,
  className = "",
  style = {},
  bodySeed,
}) {
  const colorKey =
    bodyColor === BG_PALETTE.tan
      ? "tan"
      : bodyColor === BG_PALETTE.red
      ? "red"
      : bodyColor === BG_PALETTE.green
      ? "green"
      : bodyColor === BG_PALETTE.black
      ? "black"
      : null;

  const variant = pickBodyVariant({ seed: bodySeed ?? "lean-left", colorKey });

  return (
    <CharacterSvg width={width} height={height} className={className} style={style}>
      {/* Wing behind the body */}
      <path
        d={WING_PATH}
        fill={wingColor}
        stroke={BG_PALETTE.black}
        strokeWidth="1.5"
        transform="translate(4 6)"
      />

      {/* Main body leaning slightly right, anchored near left edge */}
      {variant && (
        <g transform="translate(16 6) rotate(8 18 70)">{variant.render({})}</g>
      )}
    </CharacterSvg>
  );
}

/**
 * Character sitting / lying on top of a card.
 * Works well when the SVG is positioned so the bottom edge aligns with
 * the top border of the card.
 */
export function CharacterOnTop({
  bodyColor = BG_PALETTE.black,
  wingColor = BG_PALETTE.tan,
  width = 80,
  height = 120,
  className = "",
  style = {},
  bodySeed,
}) {
  const colorKey =
    bodyColor === BG_PALETTE.tan
      ? "tan"
      : bodyColor === BG_PALETTE.red
      ? "red"
      : bodyColor === BG_PALETTE.green
      ? "green"
      : bodyColor === BG_PALETTE.black
      ? "black"
      : null;

  const variant = pickBodyVariant({ seed: bodySeed ?? "on-top", colorKey });

  return (
    <CharacterSvg width={width} height={height} className={className} style={style}>
      {/* Wing slightly behind, stretched horizontally */}
      <path
        d={WING_PATH}
        fill={wingColor}
        stroke={BG_PALETTE.black}
        strokeWidth="1.5"
        transform="translate(10 0) scale(1.2 0.9)"
      />

      {/* Body rotated and lowered so it feels like it's resting on the rim */}
      {variant && (
        <g transform="translate(30 4) rotate(-18 18 70)">{variant.render({})}</g>
      )}
    </CharacterSvg>
  );
}

/**
 * Jumping / launching character  positioned to feel like it's just
 * jumped off the right side of a card.
 */
export function CharacterJumpOff({
  bodyColor = BG_PALETTE.green,
  wingColor = "#FFFFFF",
  width = 80,
  height = 120,
  className = "",
  style = {},
  bodySeed,
}) {
  const colorKey =
    bodyColor === BG_PALETTE.tan
      ? "tan"
      : bodyColor === BG_PALETTE.red
      ? "red"
      : bodyColor === BG_PALETTE.green
      ? "green"
      : bodyColor === BG_PALETTE.black
      ? "black"
      : null;

  const variant = pickBodyVariant({ seed: bodySeed ?? "jump-off", colorKey });

  return (
    <CharacterSvg width={width} height={height} className={className} style={style}>
      {/* Wing trailing behind the motion */}
      <path
        d={WING_PATH}
        fill={wingColor}
        stroke={BG_PALETTE.black}
        strokeWidth="1.5"
        transform="translate(18 8) rotate(-20 24 32)"
      />

      {/* Body rotated further, lifted toward the top-right */}
      {variant && (
        <g transform="translate(30 0) rotate(-32 18 70)">{variant.render({})}</g>
      )}
    </CharacterSvg>
  );
}

/**
 * Hanging character  meant to be placed so the top of the SVG lines up
 * with the top edge of the card, with the figure hanging downward.
 */
export function CharacterHangOff({
  bodyColor = BG_PALETTE.red,
  wingColor = BG_PALETTE.gray,
  width = 80,
  height = 120,
  className = "",
  style = {},
  bodySeed,
}) {
  const colorKey =
    bodyColor === BG_PALETTE.tan
      ? "tan"
      : bodyColor === BG_PALETTE.red
      ? "red"
      : bodyColor === BG_PALETTE.green
      ? "green"
      : bodyColor === BG_PALETTE.black
      ? "black"
      : null;

  const variant = pickBodyVariant({ seed: bodySeed ?? "hang-off", colorKey });

  return (
    <CharacterSvg width={width} height={height} className={className} style={style}>
      {/* Wing above the body, suggesting the shoulders at the card rim */}
      <path
        d={WING_PATH}
        fill={wingColor}
        stroke={BG_PALETTE.black}
        strokeWidth="1.5"
        transform="translate(14 -4) scale(1 0.9)"
      />

      {/* Body flipped vertically to hang down from the rim */}
      {variant && (
        <g transform="translate(26 110) scale(1 -1) rotate(6 18 70)">{variant.render({})}</g>
      )}
    </CharacterSvg>
  );
}

/**
 * Cluster of three figures in different colors, echoing the multi-body
 * compositions from your explorations.
 */
export function CharacterClusterRight({
  width = 120,
  height = 120,
  className = "",
  style = {},
  bodySeed,
}) {
  const baseSeed = bodySeed ?? "cluster-right";

  const redVariant = pickBodyVariant({ seed: `${baseSeed}-red`, colorKey: "red" });
  const tanVariant = pickBodyVariant({ seed: `${baseSeed}-tan`, colorKey: "tan" });
  const greenVariant = pickBodyVariant({ seed: `${baseSeed}-green`, colorKey: "green" });

  return (
    <CharacterSvg width={width} height={height} className={className} style={style}>
      {redVariant && (
        <g transform="translate(10 10) scale(0.8 0.8) rotate(10 18 70)">
          {redVariant.render({})}
        </g>
      )}
      {tanVariant && (
        <g transform="translate(34 4) scale(0.85 0.85) rotate(-4 18 70)">
          {tanVariant.render({})}
        </g>
      )}
      {greenVariant && (
        <g transform="translate(58 14) scale(0.9 0.9) rotate(18 18 70)">
          {greenVariant.render({})}
        </g>
      )}
    </CharacterSvg>
  );
}

/**
 * Mirrored cluster leaning left.
 */
export function CharacterClusterLeft({
  width = 120,
  height = 120,
  className = "",
  style = {},
  bodySeed,
}) {
  const baseSeed = bodySeed ?? "cluster-left";

  const greenVariant = pickBodyVariant({ seed: `${baseSeed}-green`, colorKey: "green" });
  const redVariant = pickBodyVariant({ seed: `${baseSeed}-red`, colorKey: "red" });
  const tanVariant = pickBodyVariant({ seed: `${baseSeed}-tan`, colorKey: "tan" });

  return (
    <CharacterSvg width={width} height={height} className={className} style={style}>
      {greenVariant && (
        <g transform="translate(70 10) scale(-0.8 0.8) rotate(-10 18 70)">
          {greenVariant.render({})}
        </g>
      )}
      {redVariant && (
        <g transform="translate(46 4) scale(-0.85 0.85) rotate(4 18 70)">
          {redVariant.render({})}
        </g>
      )}
      {tanVariant && (
        <g transform="translate(22 14) scale(-0.9 0.9) rotate(-18 18 70)">
          {tanVariant.render({})}
        </g>
      )}
    </CharacterSvg>
  );
}

/**
 * Shorter, squatter figure for bottom-corner placements.
 */
export function CharacterStub({
  bodyColor = BG_PALETTE.black,
  width = 60,
  height = 80,
  className = "",
  style = {},
  bodySeed,
}) {
  const colorKey =
    bodyColor === BG_PALETTE.tan
      ? "tan"
      : bodyColor === BG_PALETTE.red
      ? "red"
      : bodyColor === BG_PALETTE.green
      ? "green"
      : bodyColor === BG_PALETTE.black
      ? "black"
      : null;

  const variant = pickBodyVariant({ seed: bodySeed ?? "stub", colorKey });

  return (
    <CharacterSvg width={width} height={height} className={className} style={style}>
      {variant && (
        <g transform="translate(20 40) scale(0.7 0.55)">{variant.render({})}</g>
      )}
    </CharacterSvg>
  );
}

/**
 * A diagonal crossing pair, good for mid-edge placements.
 */
export function CharacterDiagonalPair({
  width = 100,
  height = 100,
  className = "",
  style = {},
  bodySeed,
}) {
  const baseSeed = bodySeed ?? "diagonal-pair";

  const redVariant = pickBodyVariant({ seed: `${baseSeed}-red`, colorKey: "red" });
  const greenVariant = pickBodyVariant({ seed: `${baseSeed}-green`, colorKey: "green" });

  return (
    <CharacterSvg width={width} height={height} className={className} style={style}>
      {redVariant && (
        <g transform="translate(18 8) scale(0.75 0.8) rotate(-22 18 70)">
          {redVariant.render({})}
        </g>
      )}
      {greenVariant && (
        <g transform="translate(44 20) scale(0.75 0.8) rotate(18 18 70)">
          {greenVariant.render({})}
        </g>
      )}
    </CharacterSvg>
  );
}

/**
 * Slim tall figure hugging the card edge.
 */
export function CharacterTallEdge({
  bodyColor = BG_PALETTE.black,
  width = 60,
  height = 120,
  className = "",
  style = {},
  bodySeed,
}) {
  const colorKey =
    bodyColor === BG_PALETTE.tan
      ? "tan"
      : bodyColor === BG_PALETTE.red
      ? "red"
      : bodyColor === BG_PALETTE.green
      ? "green"
      : bodyColor === BG_PALETTE.black
      ? "black"
      : null;

  const variant = pickBodyVariant({ seed: bodySeed ?? "tall-edge", colorKey });

  return (
    <CharacterSvg width={width} height={height} className={className} style={style}>
      {variant && (
        <g transform="translate(28 4) scale(0.75 1.05) rotate(10 18 70)">
          {variant.render({})}
        </g>
      )}
    </CharacterSvg>
  );
}

/**
 * Small figure peeking over the top edge.
 */
export function CharacterPeekTop({
  bodyColor = BG_PALETTE.red,
  width = 60,
  height = 80,
  className = "",
  style = {},
  bodySeed,
}) {
  const colorKey =
    bodyColor === BG_PALETTE.tan
      ? "tan"
      : bodyColor === BG_PALETTE.red
      ? "red"
      : bodyColor === BG_PALETTE.green
      ? "green"
      : bodyColor === BG_PALETTE.black
      ? "black"
      : null;

  const variant = pickBodyVariant({ seed: bodySeed ?? "peek-top", colorKey });

  return (
    <CharacterSvg width={width} height={height} className={className} style={style}>
      {variant && (
        <g transform="translate(18 -4) scale(0.65 0.6)">{variant.render({})}</g>
      )}
    </CharacterSvg>
  );
}

export const CARD_CHARACTERS = {
  leanLeft: CharacterLeanLeft,
  onTop: CharacterOnTop,
  jumpOff: CharacterJumpOff,
  hangOff: CharacterHangOff,
  clusterRight: CharacterClusterRight,
  clusterLeft: CharacterClusterLeft,
  stub: CharacterStub,
  diagonalPair: CharacterDiagonalPair,
  tallEdge: CharacterTallEdge,
  peekTop: CharacterPeekTop,
};

// --- RAW full-body characters ---
// These mirror your original SVGs as closely as possible. We do not rotate
// or alter the internal paths; randomization happens only via placement and
// an outer scale on the wrapper container.

export function TanCharacterRaw(props) {
  return (
    <svg
      width="207"
      height="558"
      viewBox="0 0 207 558"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M132.799 61.6128C303.087 2.37032 -28.0337 -33.1033 45.4191 63.7875C45.7855 64.2708 46.1586 64.7551 46.5362 65.2452C53.9922 74.924 63.4159 87.157 66.5872 150.371C54.1099 186.572 44.8946 209.081 38.6985 224.215C30.4697 244.315 27.5662 251.407 29.4195 260.288C27.4192 280.288 27.4192 319.609 27.4192 361.788C27.4192 492.032 87.9443 553.058 103.087 553.863C103.087 553.863 103.113 553.864 103.15 553.865C103.174 553.866 103.201 553.867 103.231 553.868C103.264 553.869 103.3 553.87 103.331 553.871C103.351 553.871 103.369 553.871 103.385 553.871C118.013 553.871 180.587 475.486 180.587 344.371C172.279 289.586 153.617 249.9 137.837 216.342C123.229 185.278 111.09 159.464 111.919 131.784C112.073 126.663 111.44 122.21 110.826 117.887C108.835 103.879 107.038 91.2303 132.799 61.6128ZM103.385 340.375V553.871C108.549 513.721 115.778 415.944 103.385 340.375Z"
        fill="#D2A478"
      />
      <path
        d="M46.5362 65.2452C46.1586 64.7551 45.7855 64.2708 45.4191 63.7875C33.2426 110.102 -31.9131 368.871 29.4195 260.288C27.5662 251.407 30.4697 244.315 38.6985 224.215C44.8946 209.081 54.1099 186.572 66.5872 150.371C63.4159 87.157 53.9922 74.924 46.5362 65.2452Z"
        fill="#D2A478"
      />
      <path
        d="M46.5362 65.2452C46.1586 64.7551 45.7855 64.2708 45.4191 63.7875M46.5362 65.2452C53.9922 74.924 63.4159 87.157 66.5872 150.371C54.1099 186.572 44.8946 209.081 38.6985 224.215C30.4697 244.315 27.5662 251.407 29.4195 260.288M46.5362 65.2452C46.5126 65.2146 46.489 65.184 46.4654 65.1534M45.4191 63.7875C-28.0337 -33.1033 303.087 2.37032 132.799 61.6128C107.038 91.2303 108.835 103.879 110.826 117.887C111.44 122.21 112.073 126.663 111.919 131.784M45.4191 63.7875C33.2426 110.102 -31.9131 368.871 29.4195 260.288M111.919 131.784C111.09 159.464 123.229 185.278 137.837 216.342C153.617 249.9 172.279 289.586 180.587 344.371M111.919 131.784C226.18 36.1723 207.254 155.047 190.968 257.342C185.636 290.831 180.587 322.543 180.587 344.371M180.587 344.371C180.587 475.486 118.013 553.871 103.385 553.871M103.385 553.871C108.549 513.721 115.778 415.944 103.385 340.375V553.871ZM103.385 553.871C103.369 553.871 103.351 553.871 103.331 553.871M103.385 553.871L103.331 553.871M29.4195 260.288C27.4192 280.288 27.4192 319.609 27.4192 361.788C27.4192 492.032 87.9443 553.058 103.087 553.863M122.804 33.3711C127.135 28.2065 135.198 20.9761 132.799 33.3711M103.087 553.863C103.087 553.863 103.113 553.864 103.15 553.865M103.087 553.863L103.15 553.865M103.331 553.871C103.3 553.87 103.264 553.869 103.231 553.868C103.201 553.867 103.174 553.866 103.15 553.865M103.331 553.871L103.15 553.865"
        stroke="black"
        strokeWidth="7"
      />
    </svg>
  );
}

export function RedCharacterRaw(props) {
  return (
    <svg
      width="324"
      height="638"
      viewBox="0 0 324 638"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >
      <path
        d="M158.051 396.843C158.051 527.958 146.192 634.247 131.564 634.247C116.936 634.247 105.078 527.958 105.078 396.843C105.078 354.664 88.5084 359.011 84.513 339.866C81.2643 324.298 89.5519 373.025 118.6 288.747C102.307 278.528 87.5906 188.459 79.9884 178.431C31.2922 114.196 285.283 -10.2778 317.6 4.74681C339.6 16.7655 187.124 107.231 131.564 159.439C144.838 164.639 148.369 180.708 147.719 202.421C145.995 260.003 114.866 357.282 158.051 396.843Z"
        fill="#994242"
      />
      <path
        d="M158.051 396.843C158.051 527.958 146.192 634.247 131.564 634.247M158.051 396.843C114.866 357.282 145.995 260.003 147.719 202.421M158.051 396.843C313.1 339.866 148.165 230.077 147.719 202.421M131.564 634.247C116.936 634.247 105.078 527.958 105.078 396.843C105.078 354.664 88.5084 359.011 84.513 339.866M131.564 634.247C136.729 594.096 143.958 494.903 131.564 419.334M79.9884 178.431C87.5906 188.459 102.307 278.528 118.6 288.747C89.5519 373.025 81.2643 324.298 84.513 339.866M79.9884 178.431C-13.9004 75.247 -31.4 98.2469 84.513 339.866M79.9884 178.431C31.2922 114.196 285.283 -10.2778 317.6 4.74681C339.6 16.7655 187.124 107.231 131.564 159.439C144.838 164.639 148.369 180.708 147.719 202.421M144.558 110.459C148.889 105.295 156.951 98.0643 154.552 110.459"
        stroke="black"
        strokeWidth="7"
      />
    </svg>
  );
}

export function BlackCharacterRaw(props) {
  return (
    <svg
      width="125"
      height="570"
      viewBox="0 0 125 570"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >
      <path
        d="M96.4509 329.096C96.4509 460.211 84.5926 566.5 69.9645 566.5C55.3365 566.5 43.4782 460.211 43.4782 329.096C43.4782 286.917 26.9085 291.264 22.9131 272.119C19.6643 256.551 24.7295 225.45 53.7775 141.172C37.4847 130.953 25.9906 120.712 18.3884 110.684C-55.0645 13.7931 234.81 -63.2077 69.9645 91.6917C83.2383 96.8923 86.7695 112.961 86.1194 134.674C84.3954 192.256 53.2657 289.536 96.4509 329.096Z"
        fill="black"
      />
      <path
        d="M96.4509 329.096C96.4509 460.211 84.5926 566.5 69.9645 566.5M96.4509 329.096C53.2657 289.536 84.3954 192.256 86.1194 134.674M96.4509 329.096C89.2547 239.932 86.5648 162.33 86.1194 134.674M69.9645 566.5C55.3365 566.5 43.4782 460.211 43.4782 329.096C43.4782 286.917 26.9085 291.264 22.9131 272.119M69.9645 566.5C75.1286 526.35 82.3584 427.156 69.9645 351.587M18.3884 110.684C25.9906 120.712 37.4847 130.953 53.7775 141.172C24.7295 225.45 19.6643 256.551 22.9131 272.119M18.3884 110.684C-55.0645 13.7931 234.81 -63.2077 69.9645 91.6917C83.2383 96.8923 86.7695 112.961 86.1194 134.674M18.3884 110.684C6.21187 156.998 -9.93038 254.126 22.9131 272.119"
        stroke="white"
      />
      <path
        d="M96.4509 329.096C96.4509 460.211 84.5926 566.5 69.9645 566.5C55.3365 566.5 43.4782 460.211 43.4782 329.096C43.4782 286.917 26.9085 291.264 22.9131 272.119C19.6643 256.551 24.7295 225.45 53.7775 141.172C37.4847 130.953 25.9906 120.712 18.3884 110.684C-55.0645 13.7931 234.81 -63.2077 69.9645 91.6917C83.2383 96.8923 86.7695 112.961 86.1194 134.674C84.3954 192.256 53.2657 289.536 96.4509 329.096Z"
        fill="black"
      />
      <path
        d="M96.4509 329.096C96.4509 460.211 84.5926 566.5 69.9645 566.5M96.4509 329.096C53.2657 289.536 84.3954 192.256 86.1194 134.674M96.4509 329.096C89.2547 239.932 86.5648 162.33 86.1194 134.674M69.9645 566.5C55.3365 566.5 43.4782 460.211 43.4782 329.096C43.4782 286.917 26.9085 291.264 22.9131 272.119M69.9645 566.5C75.1286 526.35 82.3584 427.156 69.9645 351.587M18.3884 110.684C25.9906 120.712 37.4847 130.953 53.7775 141.172C24.7295 225.45 19.6643 256.551 22.9131 272.119M18.3884 110.684C-55.0645 13.7931 234.81 -63.2077 69.9645 91.6917C83.2383 96.8923 86.7695 112.961 86.1194 134.674M18.3884 110.684C6.21187 156.998 -9.93038 254.126 22.9131 272.119"
        stroke="white"
        strokeWidth="7"
      />
      <path d="M79.5 36.5C82.6667 31.3333 88.8 24.1 88 36.5" stroke="white" />
    </svg>
  );
}

export function GreenCharacterRaw(props) {
  return (
    <svg
      width="166"
      height="599"
      viewBox="0 0 166 599"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >
      <path
        d="M76.1309 357.889C76.1309 489.004 87.9891 595.293 102.617 595.293C117.245 595.293 129.104 489.004 129.104 357.889C129.104 315.71 145.673 320.057 149.669 300.912C152.917 285.344 147.852 254.243 118.804 169.965C135.097 159.746 118.48 41.3209 126.082 31.293C177.727 -36.831 27.8234 38.5614 4.58151 63.7929C-5.23285 74.4475 53.6748 74.4951 102.617 120.485C89.3434 125.685 85.8122 141.754 86.4623 163.467C88.1863 221.049 119.316 318.329 76.1309 357.889Z"
        fill="#57A15E"
      />
      <path
        d="M76.1309 357.889C76.1309 489.004 87.9891 595.293 102.617 595.293M76.1309 357.889C119.316 318.329 88.1863 221.049 86.4623 163.467M76.1309 357.889C83.327 268.725 86.0169 191.123 86.4623 163.467M102.617 595.293C117.245 595.293 129.104 489.004 129.104 357.889C129.104 315.71 145.673 320.057 149.669 300.912M102.617 595.293C97.4531 555.142 90.2234 455.949 102.617 380.38M126.082 31.293C118.48 41.3209 135.097 159.746 118.804 169.965C147.852 254.243 152.917 285.344 149.669 300.912M126.082 31.293C138.258 77.6076 182.512 282.919 149.669 300.912M126.082 31.293C177.727 -36.831 27.8234 38.5614 4.58151 63.7929C-5.23285 74.4475 53.6748 74.4951 102.617 120.485C89.3434 125.685 85.8122 141.754 86.4623 163.467M96.4572 38.293C92.1261 33.1284 84.0636 25.898 86.4623 38.293"
        stroke="black"
        strokeWidth="7"
      />
    </svg>
  );
}

// Convenience array for random selection of raw characters
export const RAW_CHARACTERS = [
  TanCharacterRaw,
  RedCharacterRaw,
  BlackCharacterRaw,
  GreenCharacterRaw,
];
