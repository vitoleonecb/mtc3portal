/**
 * Inline SVG assets for HTML email templates.
 *
 * Email clients strip external resources, so all SVG must be inlined.
 * These mirror the frontend's FADED_BG_SHAPES and BODY_VARIANTS but
 * are stored as raw markup strings rather than React components.
 */
import { createRng, pickFrom } from '../../utils/random.js';

// ── Palette (matches BG_PALETTE from the frontend) ─────────────
const COLORS = {
  black: '#000000',
  tan: '#D2A478',
  green: '#57A15E',
  red: '#994242',
  gray: '#D9D9D9',
  white: '#FFFFFF',
};

// ── Background tile SVG strings ────────────────────────────────
// Each is a small rounded-square tile with a drop-shadow effect,
// matching the frontend's WhiteSquare, BlackSquare, etc.
function squareTile(fillColor, hasShadow = true) {
  const shadow = hasShadow
    ? `<rect x="0" y="4" width="195" height="195" rx="16" fill="black"/>`
    : '';
  return `<svg width="32" height="32" viewBox="0 0 272 272" fill="none" xmlns="http://www.w3.org/2000/svg">
  ${shadow}
  <rect x="4" y="0" width="195" height="195" rx="16" fill="${fillColor}"/>
  <rect x="4.5" y="0.5" width="194" height="194" rx="15.5" stroke="black"/>
</svg>`;
}

export const BG_TILE_SVGS = [
  squareTile(COLORS.white),
  squareTile(COLORS.black, false),
  squareTile(COLORS.green),
  squareTile(COLORS.gray),
  squareTile(COLORS.red),
  squareTile(COLORS.tan),
];

// ── Stick-figure character SVG strings ─────────────────────────
// Simplified versions of the BODY_VARIANTS from card-characters.jsx.
export const CHARACTER_SVGS = [
  // Tan character
  `<svg width="60" height="160" viewBox="0 0 207 558" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path fill-rule="evenodd" clip-rule="evenodd" d="M132.799 61.6128C303.087 2.37032 -28.0337 -33.1033 45.4191 63.7875C45.7855 64.2708 46.1586 64.7551 46.5362 65.2452C53.9922 74.924 63.4159 87.157 66.5872 150.371C54.1099 186.572 44.8946 209.081 38.6985 224.215C30.4697 244.315 27.5662 251.407 29.4195 260.288C27.4192 280.288 27.4192 319.609 27.4192 361.788C27.4192 492.032 87.9443 553.058 103.087 553.863C103.087 553.863 103.113 553.864 103.15 553.865C103.174 553.866 103.201 553.867 103.231 553.868C103.264 553.869 103.3 553.87 103.331 553.871C103.351 553.871 103.369 553.871 103.385 553.871C118.013 553.871 180.587 475.486 180.587 344.371C172.279 289.586 153.617 249.9 137.837 216.342C123.229 185.278 111.09 159.464 111.919 131.784C112.073 126.663 111.44 122.21 110.826 117.887C108.835 103.879 107.038 91.2303 132.799 61.6128Z" fill="#D2A478"/>
  <path d="M46.5362 65.2452C46.1586 64.7551 45.7855 64.2708 45.4191 63.7875C33.2426 110.102 -31.9131 368.871 29.4195 260.288C27.5662 251.407 30.4697 244.315 38.6985 224.215C44.8946 209.081 54.1099 186.572 66.5872 150.371C63.4159 87.157 53.9922 74.924 46.5362 65.2452Z" fill="#D2A478"/>
  <path d="M46.5362 65.2452C53.9922 74.924 63.4159 87.157 66.5872 150.371C54.1099 186.572 44.8946 209.081 38.6985 224.215C30.4697 244.315 27.5662 251.407 29.4195 260.288M45.4191 63.7875C-28.0337 -33.1033 303.087 2.37032 132.799 61.6128C107.038 91.2303 108.835 103.879 110.826 117.887C111.44 122.21 112.073 126.663 111.919 131.784M29.4195 260.288C27.4192 280.288 27.4192 319.609 27.4192 361.788C27.4192 492.032 87.9443 553.058 103.087 553.863" stroke="black" stroke-width="7"/>
</svg>`,
  // Red character
  `<svg width="60" height="160" viewBox="0 0 324 638" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M158.051 396.843C158.051 527.958 146.192 634.247 131.564 634.247C116.936 634.247 105.078 527.958 105.078 396.843C105.078 354.664 88.5084 359.011 84.513 339.866C81.2643 324.298 89.5519 373.025 118.6 288.747C102.307 278.528 87.5906 188.459 79.9884 178.431C31.2922 114.196 285.283 -10.2778 317.6 4.74681C339.6 16.7655 187.124 107.231 131.564 159.439C144.838 164.639 148.369 180.708 147.719 202.421C145.995 260.003 114.866 357.282 158.051 396.843Z" fill="#994242"/>
  <path d="M158.051 396.843C158.051 527.958 146.192 634.247 131.564 634.247M131.564 634.247C116.936 634.247 105.078 527.958 105.078 396.843C105.078 354.664 88.5084 359.011 84.513 339.866M79.9884 178.431C87.5906 188.459 102.307 278.528 118.6 288.747C89.5519 373.025 81.2643 324.298 84.513 339.866M79.9884 178.431C31.2922 114.196 285.283 -10.2778 317.6 4.74681C339.6 16.7655 187.124 107.231 131.564 159.439C144.838 164.639 148.369 180.708 147.719 202.421" stroke="black" stroke-width="7"/>
</svg>`,
  // Black character
  `<svg width="60" height="160" viewBox="0 0 125 570" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M96.4509 329.096C96.4509 460.211 84.5926 566.5 69.9645 566.5C55.3365 566.5 43.4782 460.211 43.4782 329.096C43.4782 286.917 26.9085 291.264 22.9131 272.119C19.6643 256.551 24.7295 225.45 53.7775 141.172C37.4847 130.953 25.9906 120.712 18.3884 110.684C-55.0645 13.7931 234.81 -63.2077 69.9645 91.6917C83.2383 96.8923 86.7695 112.961 86.1194 134.674C84.3954 192.256 53.2657 289.536 96.4509 329.096Z" fill="black"/>
  <path d="M96.4509 329.096C96.4509 460.211 84.5926 566.5 69.9645 566.5M69.9645 566.5C55.3365 566.5 43.4782 460.211 43.4782 329.096C43.4782 286.917 26.9085 291.264 22.9131 272.119M18.3884 110.684C25.9906 120.712 37.4847 130.953 53.7775 141.172C24.7295 225.45 19.6643 256.551 22.9131 272.119M18.3884 110.684C-55.0645 13.7931 234.81 -63.2077 69.9645 91.6917C83.2383 96.8923 86.7695 112.961 86.1194 134.674" stroke="white" stroke-width="7"/>
</svg>`,
  // Green character
  `<svg width="60" height="160" viewBox="0 0 166 599" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M76.1309 357.889C76.1309 489.004 87.9891 595.293 102.617 595.293C117.245 595.293 129.104 489.004 129.104 357.889C129.104 315.71 145.673 320.057 149.669 300.912C152.917 285.344 147.852 254.243 118.804 169.965C135.097 159.746 118.48 41.3209 126.082 31.293C177.727 -36.831 27.8234 38.5614 4.58151 63.7929C-5.23285 74.4475 53.6748 74.4951 102.617 120.485C89.3434 125.685 85.8122 141.754 86.4623 163.467C88.1863 221.049 119.316 318.329 76.1309 357.889Z" fill="#57A15E"/>
  <path d="M76.1309 357.889C76.1309 489.004 87.9891 595.293 102.617 595.293M102.617 595.293C117.245 595.293 129.104 489.004 129.104 357.889C129.104 315.71 145.673 320.057 149.669 300.912M126.082 31.293C118.48 41.3209 135.097 159.746 118.804 169.965C147.852 254.243 152.917 285.344 149.669 300.912M126.082 31.293C177.727 -36.831 27.8234 38.5614 4.58151 63.7929C-5.23285 74.4475 53.6748 74.4951 102.617 120.485C89.3434 125.685 85.8122 141.754 86.4623 163.467" stroke="black" stroke-width="7"/>
</svg>`,
];

// ── Decoration generator ───────────────────────────────────────

/**
 * Generate randomised visual decorations for an email.
 *
 * @param {string} seed - e.g. "notif-42-moduleOpen-1709942400000"
 * @returns {{ backgroundTiles: string[], character: string|null }}
 */
export function generateEmailDecorations(seed) {
  const rng = createRng(seed);

  // Pick 1-3 background tiles
  const tileCount = 1 + Math.floor(rng() * 3);
  const backgroundTiles = [];
  for (let i = 0; i < tileCount; i++) {
    const tile = pickFrom(rng, BG_TILE_SVGS);
    // Give each tile a randomised position (as CSS percentage)
    const left = Math.floor(rng() * 80) + 5; // 5%-85%
    const top = Math.floor(rng() * 60) + 10;  // 10%-70%
    const scale = 0.3 + rng() * 0.5;          // 0.3-0.8
    const opacity = 0.08 + rng() * 0.12;      // 0.08-0.20
    backgroundTiles.push(
      `<div style="position:absolute;left:${left}%;top:${top}%;transform:scale(${scale.toFixed(2)});opacity:${opacity.toFixed(2)};pointer-events:none;">${tile}</div>`
    );
  }

  // 25% chance a stick-figure character appears
  let character = null;
  if (rng() < 0.25) {
    const charSvg = pickFrom(rng, CHARACTER_SVGS);
    const side = rng() < 0.5 ? 'left:-10px' : 'right:-10px';
    const bottom = Math.floor(rng() * 40); // 0-40px from bottom
    character = `<div style="position:absolute;${side};bottom:${bottom}px;pointer-events:none;opacity:0.18;">${charSvg}</div>`;
  }

  return { backgroundTiles, character };
}
