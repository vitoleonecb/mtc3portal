import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

export function CheckBox(props) {
    return (
            <div className="checkBox" style={{backgroundColor : props.color}}/>
        
    )
}

export function ArrowSVG() {
    return (
        <svg className="forwardArrow" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.8889L12.4545 22M22 11.8889L12.4545 1M22 11.8889H1" stroke="black" strokeLinecap="round"/>
        </svg>
    )
}

export function BackArrowSVG() {
    return (
        <svg className="backArrow" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 11.8889L12.4545 22M22 11.8889L12.4545 1M22 11.8889H1" stroke="black" strokeLinecap="round"/>
        </svg>
    )
}

export function MenuBarIcon() {
    const location = useLocation();
    const navigate = useNavigate();
    const isMenuOpen = location.pathname === '/nav';
  
    const handleClick = () => {
      if (isMenuOpen) {
        navigate(-1);
      } else {
        navigate('/nav');
      }
    };
  
    return (
      <div className={`menuIcon ${isMenuOpen ? 'open' : ''}`} onClick={handleClick}>
        <div className="bar top"></div>
        <div className="bar middle"></div>
        <div className="bar bottom"></div>
      </div>
    );
  }

export function LockSVG() {
  return (
    <svg className="LockSVG" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M5.5 10.5V7a6 6 0 0 1 12 0v3.5" stroke="black" strokeLinecap="round" fill="none"/>
      <rect x="4.5" y="10.5" width="14" height="9" rx="1.75" stroke="black" strokeLinecap="round" fill="none"/>
      <circle cx="11.5" cy="14.75" r="1.25" fill="black"/>
    </svg>
  );
}

export function EyeSVG() {
  return (
    <svg className="EyeSVG" width="23" height="23" viewBox="0 0 23 23" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M1.75 11.5C4.25 6.75 8.5 4 11.5 4C14.5 4 18.75 6.75 21.25 11.5C18.75 16.25 14.5 19 11.5 19C8.5 19 4.25 16.25 1.75 11.5Z"
        stroke="black" strokeLinecap="round" fill="none"/>
      <circle cx="11.5" cy="11.5" r="2.5" fill="black"/>
    </svg>
  );
}

// Minimal location pin used for "Where" labels (teardrop with inner circle)
export function LocationIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size + 4}
      viewBox="0 0 16 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M8 19 C8 19 2 12.5 2 8 C2 4.686 4.239 2.5 8 2.5 C11.761 2.5 14 4.686 14 8 C14 12.5 8 19 8 19 Z"
        stroke="black"
        strokeWidth="1"
        fill="none"
      />
      <circle cx="8" cy="8" r="2" stroke="black" strokeWidth="1" fill="none" />
    </svg>
  );
}

// Minimal clock used for "When" labels (your Option C)
export function ClockIcon({ size = 16 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle cx="8" cy="8" r="6.5" stroke="black" strokeWidth="1" fill="none" />
      <path d="M8 8 L11 7" stroke="black" strokeWidth="1" strokeLinecap="round" />
      <path d="M8 8 L8 4.5" stroke="black" strokeWidth="1" strokeLinecap="round" />
    </svg>
  );
}

// Small "AI sparkle" icon used next to similarity tags
export function AiSimilarityIcon({ size = 18 }) {
  const stroke = "#57A15E";
  const strokeWidth = 1;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* central node */}
      <circle cx="9" cy="9" r="1.4" stroke={stroke} strokeWidth={strokeWidth} fill="none" />

      {/* orbiting nodes */}
      <circle cx="4" cy="6" r="1" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
      <circle cx="14" cy="5" r="1" stroke={stroke} strokeWidth={strokeWidth} fill="none" />
      <circle cx="6" cy="13" r="1" stroke={stroke} strokeWidth={strokeWidth} fill="none" />

      {/* connections */}
      <path
        d="M5 6.5 L7.5 8.3 M13 5.5 L10.2 8.1 M7 12.5 L8.4 10.2"
        stroke={stroke}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
      />

      {/* small sparkle */}
      <path
        d="M14.5 11 L15 12.5 L16.5 13 L15 13.5 L14.5 15 L14 13.5 L12.5 13 L14 12.5 Z"
        stroke={stroke}
        strokeWidth={strokeWidth}
        fill="none"
      />
    </svg>
  );
}

// --- Avatar generator -------------------------------------------------

// Simple deterministic hash from string -> 32-bit int
function hashString(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i);
    h |= 0; // force 32-bit
  }
  return Math.abs(h);
}

// Shared avatar color palette used across the app (RSVP, registration, etc.)
export const AVATAR_COLORS = [
  "#994242",
  "#D2A478",
  "#57A15E",
  "#D9D9D9",
  "#FFFFFF",
  "#000000",
];

/**
 * AvatarCircle
 *
 * Configurable avatar generator based on a seed string and a small
 * configuration object. By default we derive colors from the seed,
 * but callers (e.g. registration) can control:
 *   - rings: how many stroke circles to draw
 *   - strokeWidth: thickness of those circles
 *   - backgroundColor: fill color of the outer disc
 *   - ringColors: array of stroke colors for each ring layer
 *   - centerColor: fill color for a small inner disc (layer 7)
 */
export function AvatarCircle({
  seed = "",
  size = 40,
  rings = 2,
  strokeWidth = 2,
  backgroundColor,
  ringColors,
  centerColor,
  colors, // optional custom palette fallback for legacy callers
}) {
  const palette = Array.isArray(colors) && colors.length > 0 ? colors : AVATAR_COLORS;
  const hash = hashString(seed || "");

  const baseIndex = Math.abs(hash) % palette.length;

  // Resolve background color: explicit prop wins, otherwise hashed palette
  const resolvedBackground = backgroundColor || palette[baseIndex];

  // Resolve per-ring colors. If a ringColors[i] is provided, use it; otherwise
  // fall back to cycling through the palette for a bit of automatic variety.
  const resolvedRingColors = [];
  for (let i = 0; i < rings; i++) {
    if (Array.isArray(ringColors) && ringColors[i]) {
      resolvedRingColors.push(ringColors[i]);
    } else {
      resolvedRingColors.push(palette[(baseIndex + 1 + i) % palette.length]);
    }
  }

  // Resolve center dot color: explicit first, then a palette offset
  const resolvedCenter = centerColor || palette[(baseIndex + 3) % palette.length];

  // Render into a fixed 72×72 viewBox so stroke widths and ring spacing
  // (which are stored as absolute values from the registration preview)
  // look identical at every display size.
  const CANONICAL = 72;
  const center = CANONICAL / 2;
  const outerRadius = CANONICAL / 2 - strokeWidth;

  const ringRadii = [];
  for (let i = 0; i < rings; i++) {
    const r = outerRadius - i * (strokeWidth + CANONICAL * 0.06);
    ringRadii.push(Math.max(r, strokeWidth * 0.75));
  }

  const innerDotRadius = Math.max(strokeWidth * 1.4, outerRadius * 0.15);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${CANONICAL} ${CANONICAL}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', flexShrink: 0, width: size, height: size }}
    >
      {/* Base filled circle */}
      <circle cx={center} cy={center} r={outerRadius} fill={resolvedBackground} />

      {/* Configurable rings, using resolved per-layer colors */}
      {ringRadii.map((r, idx) => (
        <circle
          key={idx}
          cx={center}
          cy={center}
          r={r}
          stroke={resolvedRingColors[idx]}
          strokeWidth={strokeWidth}
          fill="none"
        />
      ))}

      {/* Inner filled circle (layer 7) */}
      <circle cx={center} cy={center} r={innerDotRadius} fill={resolvedCenter} />
    </svg>
  );
}

/**
 * Small header button that shows the current user's avatar and
 * links to the profile/settings page. Sized to match the menu
 * icon tile (3rem square) so the two feel like a pair.
 */
export function AccountAvatarButton() {
  let seed = "User";
  let avatarProps = {};

  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken');
    if (typeof accessToken === 'string' && accessToken.trim() !== '') {
      try {
        const decoded = jwtDecode(accessToken);
        console.log('[Header] Decoded token avatar_config:', decoded?.avatar_config);
        seed = decoded?.username || decoded?.first_name || decoded?.email || String(decoded?.user_id || 'User');

        const cfg = decoded?.avatar_config;
        if (cfg) {
          const {
            rings,
            strokeWidth,
            backgroundColorIndex,
            ringColorIndices,
            centerColorIndex,
          } = cfg;

          const palette = AVATAR_COLORS;
          const maxRings = 6;
          const safeRings = Math.max(1, Math.min(rings ?? 1, maxRings));
          const backgroundColor = palette[(backgroundColorIndex ?? 0) % palette.length];
          const ringColors = Array.from({ length: safeRings }, (_, i) => {
            const idx = ringColorIndices?.[i] ?? 0;
            return palette[idx % palette.length];
          });
          const centerColor = palette[(centerColorIndex ?? 0) % palette.length];

          avatarProps = {
            rings: safeRings,
            strokeWidth: strokeWidth ?? 2,
            backgroundColor,
            ringColors,
            centerColor,
          };
        }
      } catch (err) {
        console.error('Invalid token while building account avatar:', err);
      }
    }
  }

  return (
    <Link to="/profile" className="menuIcon accountMenuIcon" aria-label="Account settings">
      <AvatarCircle seed={seed} size={32} {...avatarProps} />
    </Link>
  );
}

export function ForwardArrowIcon() {

  const [rectFill,   setRectFill]   = useState('white');
  const [lineColor,  setLineColor]  = useState('black');
  const [dropShadow, setDropShadow] = useState('url(#filter0_d)');

  const handleMouseEnter = () => {
    setRectFill('black');
    setLineColor('white');
    setDropShadow('none');
  };
  const handleMouseLeave = () => {
    setRectFill('white');
    setLineColor('black');
    setDropShadow('url(#filter0_d)');
  };

  // ★ only this controls the arrow size; the rect stays 36×36 always
  const ARROW_SIZE = 20;                    // try 16, 18, 20…
  const PADDING    = (36 - ARROW_SIZE) / 2; // centers inside 36×36

  return (
    <svg
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'fill 0.3s, stroke 0.3s' }}
      className="ForwardArrowIcon"
      width="52"
      height="52"
      viewBox="0 0 52 52"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <filter id="filter0_d" x="-10%" y="-10%" width="120%" height="120%" filterUnits="objectBoundingBox">
          <feDropShadow dx="-4" dy="4" stdDeviation="0" floodColor="#000" floodOpacity="1" />
        </filter>
      </defs>

      <g filter={dropShadow}>
        {/* This stays fixed at 36×36 */}
        <rect
          x="5"
          y="1"
          width="36"
          height="36"
          rx="10"
          ry="10"
          fill={rectFill}
          stroke="black"
        />
        <svg
          x={5 + PADDING}
          y={1 + PADDING}
          width={ARROW_SIZE}
          height={ARROW_SIZE}
          viewBox="0 0 23 23"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M22 11.8889L12.4545 22M22 11.8889L12.4545 1M22 11.8889H1"
            stroke={lineColor}
            strokeLinecap="round"
          />
        </svg>
      </g>
    </svg>
  );
}

export function Star({selected, onMouseEnter, onMouseLeave, onClick}) {
    return (
        <>
            <svg  className="ratingSVG" onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick} width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path className="ratingPATH" d="M14.0554 2.71739C14.3667 1.82183 15.6333 1.82183 15.9446 2.71739L18.2982 9.48861C18.4356 9.88368 18.8043 10.1516 19.2224 10.1601L26.3896 10.3061C27.3375 10.3254 27.7289 11.53 26.9733 12.1028L21.2609 16.4337C20.9276 16.6864 20.7867 17.1198 20.9078 17.5201L22.9837 24.3816C23.2583 25.2891 22.2336 26.0336 21.4554 25.492L15.5712 21.3975C15.2279 21.1586 14.7721 21.1586 14.4288 21.3975L8.54463 25.492C7.76639 26.0336 6.74174 25.2891 7.01629 24.3816L9.09216 17.5201C9.21327 17.1198 9.07245 16.6864 8.73915 16.4337L3.02666 12.1028C2.27112 11.53 2.6625 10.3254 3.61043 10.3061L10.7776 10.1601C11.1957 10.1516 11.5644 9.88368 11.7018 9.48861L14.0554 2.71739Z" 
            fill={selected ? "#D2A478" : "#D9D9D9"} />
            </svg>
        </>
    )
}

export function ProgressBar({current, max}) {
    return (
        <>
            <div className="promptProgressContainer">
                <progress className="promptProgress" value={current} max={max}></progress>
            </div>
        </>
    )
}

export function DragElement({ id, color, dragConstraints, onPositionChange, defaultPosition, disabled, dragAxis, lockY }) {
    const ref = useRef(null);

    // NOTE: We no longer derive initial positions from the DOM.
    // DragAndDropArea seeds normalized positions itself so that
    // layout is stable and independent of timing/measurement here.

    const handleDragEnd = () => {
        if (!disabled) {
          const el = ref.current;
          if (el && onPositionChange) {
              const rect = el.getBoundingClientRect();
              const containerRect = el.offsetParent.getBoundingClientRect();
              onPositionChange(id, {
                  x: Math.round(rect.left - containerRect.left),
                  y: Math.round(rect.top - containerRect.top),
              });
          }
          
        }
    };

    // Base positioning: when we have a locked Y (spectrum), always pin to that
    // vertical coordinate. Otherwise, only use defaultPosition when disabled
    // (read-only playback).
    let positionStyle = {};
    if (lockY) {
      // Spectrum: vertically center on container midline regardless of height.
      // We know .dragElement is 30px tall (see App.css), so margin-top:-15px
      // centers it exactly on the 50% line.
      positionStyle = { position: 'absolute', top: '50%', marginTop: -15 };
      if (defaultPosition?.x != null) {
        positionStyle.left = defaultPosition.x;
      }
    } else if (disabled && defaultPosition) {
      positionStyle = { position: 'absolute', left: defaultPosition.x, top: defaultPosition.y };
    }

    // Limit drag axis when requested (e.g. spectrum => horizontal-only)
    let dragProp = false;
    if (!disabled) {
      if (dragAxis === 'x' || dragAxis === 'y') dragProp = dragAxis;
      else dragProp = true;
    }

    return (
        <motion.div
            ref={ref}
            className="dragElement"
            // x/y are always reset to 0 so that the canonical position is
            // driven by left/top (via defaultPosition + clamping). Framer's
            // drag only affects the transform during interaction.
            style={{ backgroundColor: color, ...positionStyle, x: 0, y: 0 }}
            drag={dragProp}
            dragMomentum={false}
            inertia={false}
            dragElastic={1}
            dragConstraints={dragConstraints}
            whileDrag={{ scale: 1.5, cursor: "grabbing" }}
            onDragEnd={handleDragEnd}
        />
    );
}

function DragAndDropKeyItem({color, characterName}) {
    
    return (
        <div className="DragAndDropKeyItemContainer" >
            <div className="checkBox" style={{backgroundColor: color}} />
            <span id="KeyItemText">{characterName}</span>
        </div>
    )
}

export function DragAndDropKey({dragOptions}) {

    const colors = ['#994242','#D2A478','#57A15E','#FFFFFF','#000000','#D9D9D9'];

    return (
        <div className="DragAndDropKeyContainer" >
            {dragOptions.options.map((option, index) => (
                <DragAndDropKeyItem characterName={option.optionName} color={colors[index]}/>
            ))}
        </div>
    )
}
