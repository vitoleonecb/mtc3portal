import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate, useLocation } from 'react-router-dom';

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
        {/* ◀️ This stays fixed at 36×36 */}
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

        {/* 👉 This nested SVG holds and scales your 23×23 arrow */}
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
            <svg  className="ratingSVG"onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave} onClick={onClick} width="30" height="30" viewBox="0 0 30 30" fill="none" xmlns="http://www.w3.org/2000/svg">
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

export function DragElement({ id, color, dragConstraints, onPositionChange }) {
    const ref = useRef(null);

    // Get initial position once mounted
    useEffect(() => {
        const el = ref.current;
        if (el && onPositionChange) {
            const rect = el.getBoundingClientRect();
            const containerRect = el.offsetParent.getBoundingClientRect();
            onPositionChange(id, {
                x: rect.left - containerRect.left,
                y: rect.top - containerRect.top,
            });
        }
    }, []);

    const handleDragEnd = () => {
        const el = ref.current;
        if (el && onPositionChange) {
            const rect = el.getBoundingClientRect();
            const containerRect = el.offsetParent.getBoundingClientRect();
            onPositionChange(id, {
                x: Math.round(rect.left - containerRect.left),
                y: Math.round(rect.top - containerRect.top),
            });
        }
    };

    return (
        <motion.div
            ref={ref}
            className="dragElement"
            style={{ backgroundColor: color }}
            drag
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
