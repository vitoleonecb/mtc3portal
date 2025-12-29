import React from "react";

// Core palette for background shapes. Mirrors the app's existing colors.
export const BG_PALETTE = {
  black: "#000000",
  tan: "#D2A478",
  green: "#57A15E",
  red: "#994242",
  gray: "#D9D9D9",
};

/**
 * Tall, asymmetric figure sliver – simplified version of the silhouette bodies.
 * Can be used directly or as a building block for characters.
 */
export function FigureSliver({
  fill = BG_PALETTE.red,
  stroke = BG_PALETTE.black,
  width = 32,
  height = 160,
  className = "",
  style = {},
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 160"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path
        d="M18 3
           C12 15 10 32 11 50
           C12 74 8 92 7 112
           C6 132 7 146 10 156
           C14 154 18 146 20 134
           C22 120 22 104 21 90
           C20 70 21 52 23 38
           C25 26 25 16 23 8
           C22 5 20 3 18 3Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Cropped limb / torso fragment that works well when partially off-screen.
 */
export function LimbFragment({
  fill = BG_PALETTE.red,
  stroke = BG_PALETTE.black,
  width = 40,
  height = 80,
  className = "",
  style = {},
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 40 80"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path
        d="M6 78
           C4 65 4 54 6 42
           C8 30 13 21 18 14
           C22 9 27 6 32 4
           C30 14 28 23 26 30
           C23 40 19 49 16 58
           C13 66 10 73 6 78Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Small card fan – 3 overlapping rounded rectangles echoing module cards.
 */
export function CardFan({
  colors = [BG_PALETTE.green, BG_PALETTE.tan, BG_PALETTE.red],
  width = 140,
  height = 120,
  className = "",
  style = {},
}) {
  const [front, middle, back] = [
    colors[0] ?? BG_PALETTE.green,
    colors[1] ?? BG_PALETTE.tan,
    colors[2] ?? BG_PALETTE.red,
  ];

  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 140 120"
      aria-hidden="true"
      className={className}
      style={style}
    >
      {/* back card */}
      <rect
        x="10"
        y="18"
        width="90"
        height="60"
        rx="10"
        fill={back}
        stroke={BG_PALETTE.black}
        strokeWidth="1.5"
        transform="rotate(-10 10 18)"
      />
      {/* middle card */}
      <rect
        x="20"
        y="20"
        width="90"
        height="60"
        rx="10"
        fill={middle}
        stroke={BG_PALETTE.black}
        strokeWidth="1.5"
        transform="rotate(-4 20 20)"
      />
      {/* front card */}
      <rect
        x="28"
        y="24"
        width="90"
        height="60"
        rx="10"
        fill={front}
        stroke={BG_PALETTE.black}
        strokeWidth="1.5"
      />
    </svg>
  );
}

/**
 * Pebble – irregular oval used for low-contrast "pebble field" backgrounds.
 */
export function Pebble({
  fill = BG_PALETTE.tan,
  stroke = "none",
  width = 32,
  height = 20,
  className = "",
  style = {},
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 32 20"
      aria-hidden="true"
      className={className}
      style={style}
    >
      <path
        d="M4 10
           C4 5 8 2 13 2
           C20 2 28 5 28 11
           C28 16 22 18 16 18
           C9 18 4 15 4 10Z"
        fill={fill}
        stroke={stroke}
        strokeWidth="1"
      />
    </svg>
  );
}

/**
 * DotCloudPattern – a reusable <pattern> matching the analytics dot motif.
 * Use inside an SVG <defs>. The caller controls ids and how it is applied.
 */
export function DotCloudPattern({
  id = "bg-dot-cloud",
  color = "rgb(210,164,120)",
  spacing = 10,
  radius = 1.75,
}) {
  return (
    <pattern
      id={id}
      x="0"
      y="0"
      width={spacing}
      height={spacing}
      patternUnits="userSpaceOnUse"
    >
      <circle cx="2" cy="2" r={radius} fill={color} />
    </pattern>
  );
}

/**
 * BACKGROUND_SHAPES – convenience registry other code can sample from when it
 * wants a concrete SVG component (figures, fragments, etc.).
 */
export const BACKGROUND_SHAPES = [
  {
    id: "figure-sliver-red",
    kind: "figure",
    Component: (props) => <FigureSliver fill={BG_PALETTE.red} {...props} />,
  },
  {
    id: "figure-sliver-tan",
    kind: "figure",
    Component: (props) => <FigureSliver fill={BG_PALETTE.tan} {...props} />,
  },
  {
    id: "figure-sliver-green",
    kind: "figure",
    Component: (props) => <FigureSliver fill={BG_PALETTE.green} {...props} />,
  },
  {
    id: "limb-fragment-red",
    kind: "figure-fragment",
    Component: (props) => <LimbFragment fill={BG_PALETTE.red} {...props} />,
  },
  {
    id: "limb-fragment-black",
    kind: "figure-fragment",
    Component: (props) => <LimbFragment fill={BG_PALETTE.black} {...props} />,
  },
  {
    id: "card-fan-main",
    kind: "card-fan",
    Component: (props) => <CardFan {...props} />,
  },
  {
    id: "pebble-tan",
    kind: "pebble",
    Component: (props) => <Pebble fill={BG_PALETTE.tan} {...props} />,
  },
  {
    id: "pebble-red",
    kind: "pebble",
    Component: (props) => <Pebble fill={BG_PALETTE.red} {...props} />,
  },
];

// Your custom faded background shape.
// Default size is modest; RandomBackgroundLayer may still apply an outer scale.
export function Pyramid({ width = 32, height = 32, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 272 272"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >
      <path
        d="M271.5 0.5V271.5H0.5V0.5H271.5Z"
        fill="#D9D9D9"
        stroke="black"
      />
    </svg>
  );
}

export function WhiteSquare({ width = 32, height = 32, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 272 272"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >
      <g filter="url(#filter0_d_5_863)">
      <rect x="4" width="195" height="195" rx="16" fill="white"/>
      <rect x="4.5" y="0.5" width="194" height="194" rx="15.5" stroke="black"/>
      </g>
      <defs>
      <filter id="filter0_d_5_863" x="0" y="0" width="199" height="199" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="-4" dy="4"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5_863"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5_863" result="shape"/>
      </filter>
      </defs>
    </svg>
  );
}

export function BlackSquare({ width = 32, height = 32, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 272 272"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >
      <g filter="url(#filter0_d_5_864)">
      <rect x="4" width="195" height="195" rx="16" fill="black"/>
      <rect x="4.5" y="0.5" width="194" height="194" rx="15.5" stroke="black"/>
      </g>
      <defs>
      <filter id="filter0_d_5_864" x="0" y="0" width="199" height="199" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="-4" dy="4"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5_864"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5_864" result="shape"/>
      </filter>
      </defs>

    </svg>
  );
}

export function GraySquare({ width = 32, height = 32, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 272 272"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >

      <g filter="url(#filter0_d_5_865)">
      <rect x="4" width="195" height="195" rx="16" fill="#D9D9D9"/>
      <rect x="4.5" y="0.5" width="194" height="194" rx="15.5" stroke="black"/>
      </g>
      <defs>
      <filter id="filter0_d_5_865" x="0" y="0" width="199" height="199" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="-4" dy="4"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5_865"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5_865" result="shape"/>
      </filter>
      </defs>

    </svg>
  );
}

export function RedSquare({ width = 32, height = 32, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 272 272"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >

      <g filter="url(#filter0_d_5_866)">
      <rect x="4" width="195" height="195" rx="16" fill="#994242"/>
      <rect x="4.5" y="0.5" width="194" height="194" rx="15.5" stroke="black"/>
      </g>
      <defs>
      <filter id="filter0_d_5_866" x="0" y="0" width="199" height="199" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="-4" dy="4"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5_866"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5_866" result="shape"/>
      </filter>
      </defs>

    </svg>
  );
}

export function TanSquare({ width = 32, height = 32, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 272 272"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >


      <g filter="url(#filter0_d_5_869)">
      <rect x="4" width="195" height="195" rx="16" fill="#D2A478"/>
      <rect x="4.5" y="0.5" width="194" height="194" rx="15.5" stroke="black"/>
      </g>
      <defs>
      <filter id="filter0_d_5_869" x="0" y="0" width="199" height="199" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="-4" dy="4"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_5_869"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_5_869" result="shape"/>
      </filter>
      </defs>


    </svg>
  );
}

export function GreenSquare({ width = 32, height = 32, ...props }) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 272 272"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      role="presentation"
      {...props}
    >
      <g filter="url(#filter0_d_8_8)">
      <rect x="4" y="1.52588e-05" width="195" height="195" rx="16" fill="#57A15E"/>
      <rect x="4.5" y="0.500015" width="194" height="194" rx="15.5" stroke="black"/>
      </g>
      <defs>
      <filter id="filter0_d_8_8" x="0" y="0" width="199" height="199" filterUnits="userSpaceOnUse" color-interpolation-filters="sRGB">
      <feFlood flood-opacity="0" result="BackgroundImageFix"/>
      <feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
      <feOffset dx="-4" dy="4"/>
      <feComposite in2="hardAlpha" operator="out"/>
      <feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0"/>
      <feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_8_8"/>
      <feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_8_8" result="shape"/>
      </filter>
      </defs>

    </svg>
  );
}

/**
 * FADED_BG_SHAPES – array of React components used by RandomBackgroundLayer
 * for the blurred/faded background. You can add your own SVG components here.
 */
export const FADED_BG_SHAPES = [WhiteSquare, BlackSquare, GreenSquare, GraySquare, RedSquare, TanSquare];
