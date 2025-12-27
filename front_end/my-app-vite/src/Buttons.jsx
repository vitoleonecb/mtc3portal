
import React, { useState, useRef, useEffect, useMemo, useLayoutEffect }from 'react';
import { DragElement, ArrowSVG, Star, BackArrowSVG, CheckBox, LockSVG, EyeSVG, ForwardArrowIcon } from './Icons';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';

export function CompleteButton({ moduleName }) {
    return (
    <button className="completeButton">
        <span id="buttonText">{moduleName}</span>
        <div></div>
        <div></div>
        <ArrowSVG />
    </button>
    );
}

export function ProcessingButton({ moduleName, isAdmin, RSVPStatus }) {

    return (
      <button className={RSVPStatus ? "openButton": "processingButton"}>
        <span id="buttonText">{moduleName}</span>
        <div></div>
        <div></div>
    
        {
          isAdmin ? (
            <svg className="pencilIconContainer" width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path className="pencilIcon" d="M2.76738 16C2.76738 16 1.49988 19 0.999939 20C0.5 21 4.53482 18.2222 4.53482 18.2222M2.76738 16L4.53482 18.2222M2.76738 16L14.924 2.24383M4.53482 18.2222L17.6802 5M17.6802 5L18.5004 4.17499C19.3108 3.35985 19.2596 2.0284 18.3891 1.27785V1.27785C17.5676 0.569597 16.3293 0.653647 15.611 1.46641L14.924 2.24383M17.6802 5L14.924 2.24383" stroke="white"/>
            </svg>
            ) : RSVPStatus ? <EyeSVG/> : <LockSVG/>
        }
    
      </button>
    );
}

export function PendingButton({ moduleName, isAdmin }) {

    return (
        <button className={isAdmin ? "adminPendingButton" : "pendingButton"}>
            <span id="buttonText">{moduleName}</span>
            <div></div>
            <div></div>
            { isAdmin && (
                <svg className="pencilIconContainer" width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="pencilIcon" d="M2.76738 16C2.76738 16 1.49988 19 0.999939 20C0.5 21 4.53482 18.2222 4.53482 18.2222M2.76738 16L4.53482 18.2222M2.76738 16L14.924 2.24383M4.53482 18.2222L17.6802 5M17.6802 5L18.5004 4.17499C19.3108 3.35985 19.2596 2.0284 18.3891 1.27785V1.27785C17.5676 0.569597 16.3293 0.653647 15.611 1.46641L14.924 2.24383M17.6802 5L14.924 2.24383" stroke="white"/>
                </svg>
            )}
        </button>

    );
}

export function OpenButton({ moduleName, progressValue, maxValue }) {
    return (
    <button className="openButton">
        <span id="buttonText">{moduleName}</span>
        <div className="progressContainer">
            <progress className="openProgress" value={progressValue} max={maxValue}></progress>
        </div>
        <span id="buttonTimeText">72 hrs</span>
        <ArrowSVG />
    </button>
    );
}

export function OpenResponse({ onChange, responseData, disabled }) {
    
    const textareaRef = useRef(null);
    const [value, setValue] = useState('');

    const handleChange = (e) => {
        const newValue = e.target.value
        setValue(newValue);

        if (onChange) {
            onChange(newValue);
        }

        const textarea = textareaRef.current;
        if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        }
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        }
    }, []);

    useEffect(() => {
	if (responseData) {
		setValue(responseData);
	}
    }, [responseData])
    
    return (
        <textarea 
        ref={textareaRef}
        value={value}
        onChange={disabled ? undefined : handleChange}
        className={`OpenResponse ${disabled ? 'no_hover' : ''}`} 
        placeholder='Enter your response here'/>
    )
}

export function ModuleNavigator({ endOfPrompts, submitHandler, backActive, backClick, nextClick, isReader=false, promptMode }) {
    return (
      <div className='moduleNavigatorContainer'>
        <div>
          <button className='previousButton' onClick={backClick} style={{ display: backActive ? 'none' : 'block' }}>
            <BackArrowSVG />
          </button>
        </div>
  
        {!endOfPrompts && (
          <button
            className='nextButton'
            onClick={async () => {
              console.log('[NAV click] promptMode =', promptMode);
              if (isReader && promptMode === 'edit') {
                const ok = await submitHandler?.();
                // IMPORTANT: do NOT call nextClick here.
                // First click just submits and flips button to arrow.
                return;
              }
              // In 'view' mode (arrow shown), now navigate.
              nextClick?.();
            }}
            type="button"
          >
            {(isReader && promptMode === 'edit') ? 'Submit' : <ArrowSVG />}
          </button>
        )}
      </div>
    );
  }

export function CheckBoxButton({ disabled, checked, optionText='Not Available', onChange }) {
  const [color, setColor] = useState('white');

  useEffect(() => {
    setColor(checked ? '#D2A478' : 'white');
  }, [checked]);

  return (
    <button
      onClick={() => !disabled && onChange(!checked)}
      onMouseEnter={() => !disabled && !checked && setColor('#D2A478')}
      onMouseLeave={() => setColor(checked ? '#D2A478' : 'white')}
      className="checkBoxButton"
    >
      <CheckBox color={color} />
      <span id="buttonText">{optionText}</span>
    </button>
  );
}


export function MultipleChoiceButton({ disabled, isSelected, onSelect, label }) {
    const buttonClass = classNames('multipleChoiceButton', { selected: isSelected, disabled });
    return (
      <button className={buttonClass} onClick={onSelect} disabled={disabled}>
        <span id="multipleChoiceText">{label}</span>
      </button>
    );
  }

export function MultipleChoiceGroup({ options, onChange, disabled, currentAnswer }) {
    const [selectedIndex, setSelectedIndex] = useState(null);
  
    useEffect(() => {
      if (!currentAnswer) { setSelectedIndex(null); return; }
      // Prefer stored optionId; fall back to label match
      if (Number.isInteger(currentAnswer.optionId)) {
        setSelectedIndex(currentAnswer.optionId);
      } else if (currentAnswer.optionLabel) {
        const i = options.findIndex(o => o === currentAnswer.optionLabel);
        setSelectedIndex(i >= 0 ? i : null);
      } else {
        setSelectedIndex(null);
      }
    }, [currentAnswer, options]);
  
    const handleSelect = (optionLabel, index) => {
      setSelectedIndex(index);
      onChange(index, optionLabel); // value=index, keyName=label
    };
  
    return (
      <>
        {options.map((option, i) => (
          <MultipleChoiceButton
            key={i}
            label={option}
            disabled={disabled}
            isSelected={selectedIndex === i}
            onSelect={() => !disabled && handleSelect(option, i)}
          />
        ))}
      </>
    );
  }

export function ScriptSampleNotate({ sample }) {
    return (
        <div className="ScriptSample">
            <h3 className="ScriptSampleText">{sample}</h3>
        </div>
    )
}

export function ScriptSampleRate({ sample }) {
    return (
        <div className="ScriptSampleRate">
            <h3 className="ScriptSampleText">{sample}</h3>
        </div>
    )
}

export function StarRater({ onChange, responseData, disabled }) {
    
    const [hoveredRating, setHoveredRating] = useState(0);
    const [selectedRating, setSelectedRating] = useState(0);

    useEffect(() => {
        onChange(selectedRating);
    },[selectedRating])

    useEffect(() => {
	if (responseData) {
		setSelectedRating(responseData);
	}
    })

    const handleMouseEnter = (index) => {
        setHoveredRating(index);
    };

    const handleMouseLeave = () => {
        setHoveredRating(0);
    };

    const handleClick = (index) => {
        setSelectedRating(index);
    }
    
    return (
        <div className="StarContainer">
            {
                [1,2,3,4,5].map((star) => (
                    <Star key={star} 
                    selected={hoveredRating >= star || (!hoveredRating && selectedRating >= star)} 
                    onMouseEnter={() => !disabled && handleMouseEnter(star)} 
                    onMouseLeave={handleMouseLeave} 
                    onClick={() => !disabled && handleClick(star)}
                    />
                    )
                )
            }
        </div>
    )
}

export function ShortResponseArea({ onChange, responseData, disabled }) {
    
    const textareaRef = useRef(null);
    const [value, setValue] = useState('');

    const handleChange = (e) => {
        if (!disabled) {
		const newValue = e.target.value
        	setValue(newValue);
        	if (onChange) {
            		onChange(newValue);
        	} 
        	const textarea = textareaRef.current;
        	if (textarea) {
        		textarea.style.height = 'auto';
        		textarea.style.height = textarea.scrollHeight + 'px';
        	}
	}
    };

    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = textarea.scrollHeight + 'px';
        }
    }, []);

    useEffect(() => {
	if (responseData) {
		setValue(responseData);
		
	}
    }, [responseData]);
    
    return (
        <>
            <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange} 
            placeholder="Enter your response here:" 
            className="ShortResponseArea">
            </textarea>
        </>
    )
}

/* ------------------------ Drag and Drop BEGIN ------------------------ */

/* ============== sizing (freezable to prevent jolt) ============== */
function useConstraintSize(ref, { freeze = false } = {}) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const last = useRef({ w: 0, h: 0 });

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;

    const ro = new ResizeObserver(([entry]) => {
      if (freeze) return; // freeze during drag/submit to prevent jumps
      const { width, height } = entry.contentRect;
      // ignore sub-pixel jitters
      if (Math.abs(width - last.current.w) < 1 && Math.abs(height - last.current.h) < 1) return;
      last.current = { w: width, h: height };
      setSize({ w: width, h: height });
    });

    ro.observe(el);
    return () => ro.disconnect();
  }, [ref, freeze]);

  return size;
}

/* ====================== helpers ====================== */
const clamp = (n, lo, hi) => Math.min(Math.max(n, lo), hi);
const clamp01 = (n) => clamp(n ?? 0, 0, 1);
const quantize = (n, places = 3) => Number((n ?? 0).toFixed(places)); // compact storage
const pct2 = (n) => Number(((n ?? 0) * 100).toFixed(2));             // human-readable

function toPct(posPx, size) {
  const { w, h } = size;
  if (!posPx || !w || !h) return posPx;
  return { x: clamp01(posPx.x / w), y: clamp01(posPx.y / h) };
}
function toPx(posPct, size) {
  const { w, h } = size;
  if (!posPct || !w || !h) return undefined;
  return { x: clamp((posPct.x ?? 0) * w, 0, w), y: clamp((posPct.y ?? 0) * h, 0, h) };
}
function isPixelPos(pos) {
  return !!pos && (pos.x > 1 || pos.y > 1 || pos.x < 0 || pos.y < 0);
}

/* ====================== component ====================== */
export function DragAndDropArea({
  responseData,
  disabled,
  dragOptions,          // expect: { options: [{ optionName, optionKey }...] }
  onInitialPositions,   // callback(snapshotArray)
  onUpdateResponse,     // callback(index, label, position, isFinal, keyName, meta)
}) {
  const constraintRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false); // drag or submit underway
  const size = useConstraintSize(constraintRef, { freeze: isInteracting });

  const options = dragOptions?.options ?? [];

  // Use stable keys provided by the editor (optionKey). If missing, fall back safely.
  const ids = useMemo(() => {
    const safe = (s) =>
      (s || "").toString().toLowerCase().trim()
        .replace(/\s+/g, "-").replace(/[^a-z0-9\-]/g, "");
    return options.map((o, i) => o?.optionKey || `${safe(o?.optionName) || "item"}-${i}`);
  }, [options]);

  const total = ids.length;

  // Normalized positions in state (0..1). Do NOT round here to avoid visible jolts.
  const [positionsPct, setPositionsPct] = useState({}); // { [key]: {x:0..1,y:0..1} }

  /* -------- hydrate from responseData; migrate pixels -> normalized; clamp -------- */
  useEffect(() => {
    if (!Array.isArray(responseData) || responseData.length === 0) return;

    const init = {};
    for (const item of responseData) {
      // prefer explicit keyName from stored responses; else map by index (legacy)
      const key =
        item?.keyName ??
        (Number.isInteger(item?.index) && ids[item.index] ? ids[item.index] : null);
      if (!key) continue;

      const raw = item.position ?? item.answer;
      if (!raw) continue;

      const pct = isPixelPos(raw) ? toPct(raw, size) : raw;
      if (!pct) continue;

      init[key] = { x: clamp01(pct.x), y: clamp01(pct.y) };
    }
    if (Object.keys(init).length > 0) setPositionsPct(init);
  }, [responseData, ids, size.w, size.h]);

  /* -------- safety: if container resizes (when not frozen), keep values clamped -------- */
  useEffect(() => {
    if (!size.w || !size.h) return;
    setPositionsPct((prev) => {
      const next = {};
      for (const [k, v] of Object.entries(prev)) next[k] = { x: clamp01(v?.x), y: clamp01(v?.y) };
      return next;
    });
  }, [size.w, size.h]);

  /* -------- emit helper: normalized (quantized) + readable percent + label -------- */
  function emitUpdate(idx, id, pct) {
    const pos = { x: quantize(pct.x), y: quantize(pct.y) }; // nice-looking normalized numbers
    const display = { xPct: pct2(pct.x), yPct: pct2(pct.y) }; // e.g., { xPct: 42.13, yPct: 18.00 }
    const label = options[idx]?.optionName ?? "";             // your authored name
    onUpdateResponse?.(idx, label, pos, false, id, { display });
  }

  const handlePositionChange = (id, idx, pixelPos) => {
    const pct = toPct(pixelPos, size);
    const clamped = { x: clamp01(pct?.x), y: clamp01(pct?.y) };

    setPositionsPct((prev) => {
      const updated = { ...prev, [id]: clamped };
      emitUpdate(idx, id, clamped);

      // Once all have been placed at least once, send a complete snapshot
      if (Object.keys(updated).length === total && total > 0) {
        const snapshot = ids.map((k, i) => {
          const p = updated[k] ?? { x: 0, y: 0 };
          return {
            keyName: k,                                  // stable key from editor
            index: i,
            label: options[i]?.optionName ?? "",         // human-readable name
            position: { x: quantize(p.x), y: quantize(p.y) },
            display: { xPct: pct2(p.x), yPct: pct2(p.y) },
          };
        });
        onInitialPositions?.(snapshot);
      }
      return updated;
    });
  };

  // Colors unchanged
  const colors = ["#994242", "#D2A478", "#57A15E", "#FFFFFF", "#000000", "#D9D9D9"];
  const limitedColors = colors.slice(0, Math.min(total, colors.length));

  return (
    <div
      className={`DragAndDropContainer dnd-container ${isInteracting ? "freeze-width" : ""}`}
      ref={constraintRef}
      style={{ position: "relative", overflow: "hidden", boxSizing: "border-box" }}
    >
      {options.map((opt, index) => {
        const id = ids[index];
        const defaultPx = toPx(positionsPct[id], size); // render in pixels (clamped)

        return (
          <DragElement
            key={id}
            id={id}
            color={limitedColors[index]}
            dragConstraints={constraintRef}
            dragMomentum={false}
            dragElastic={0}
            // If using Framer Motion under the hood, these prevent layout reflow animations:
            initial={false}
            layout={false}
            onDragStart={() => setIsInteracting(true)}
            onDragEnd={() => setIsInteracting(false)}
            onPositionChange={(_, posPx) => handlePositionChange(id, index, posPx)}
            defaultPosition={defaultPx}
            disabled={disabled}
          />
        );
      })}
    </div>
  );
}



export function NextButton({ onClick, text = "Next", style= {}, to=""}) {
    
    const navigate = useNavigate();

    const handleClick = (e) => {
      console.log('CLICK:', { to });
      if (onClick) onClick(e);
      if (to) navigate(to);
      else console.warn('Navigation skipped — `to` is falsy.');
    };
    
    return (
        <div style={style} className="logInButtonContainer linkNoUnderLine cardLink">
            <button onClick={handleClick} className="logInButton">{text}</button>
        </div>
    );
}

export function YesNoButton({ onClickYes, onClickNo }) {
    return (
        <div className="logInButtonContainer">
            <button onClick={ onClickYes } className="logInButton">Yes</button>
            <button onClick={ onClickNo } className="logInButton">No</button>
        </div>
    );
}


export function LogInButton({ to="/workshops" }) {

    return (
        <div className="logInButtonContainer">
            <input className="logInButton" type="submit"/>
        </div>
    );
}

export function CreateButton({ handleClick }) {
    return (
        <div className="createButtonContainer">
            <button onClick={handleClick} className="createButton" type="button">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <line x1="9.5" y1="0" x2="9.5" y2="18" stroke="black" />
                    <line y1="8.5" x2="18" y2="8.5" stroke="black" />
                </svg>
            </button>
        </div>
    );
}

export function WorkshopCard({ workshopName, workshopLocation, workshopDate, workshopDescription }) {
    return (
        <>
            <div className="workshopCardContainer">
                <div>
                    <h1 className="workshopCardName">{workshopName}</h1>
                    <span id="buttonText">{'When: ' + workshopDate}</span>
                    <span id="buttonText">{'Where: ' + workshopLocation}</span>
                    <span id="workshopCardDescription">{workshopDescription}</span>
                </div>

                <div>
                    <ArrowSVG />
                </div>

            </div>
        </>
    )
}

export function MainNavCard({color, text, link}) {
    return (
      <Link to={link} className="linkNoUnderLine cardLink">
        <div className="MainNavCardContainer" style={{ backgroundColor: color}}>
            <div className="MainNavCardLabel">
                <span className="MainNavCardTitle">{text}</span>
                <span className="MainNavCardDesc"></span>
            </div>
            <EnterButton />
        </div>
      </Link>
    )
}

export function DropDown({ responseData, options = [], onSelect, reset, onChange, disabled }) {
  const [isClicked, setIsClicked] = useState(false);
  const [selectedOption, setSelectedOption] = useState(null);
  const [dropDownLabel, setDropDownLabel] = useState('Select an option');

  const handleMainClick = () => {
    if (disabled) return;
    setIsClicked(prev => !prev);
  };

  const handleOptionClick = (option, index) => {
    if (disabled) return;
    setSelectedOption(option);
    setDropDownLabel(option);
    setIsClicked(false);
    onSelect?.(option, index);
    onChange?.(option, index);
  };

  useEffect(() => {
    if (reset) {
      setSelectedOption(null);
      setDropDownLabel('Select an option');
    }
  }, [reset]);

  // Rehydrate selection when showing a saved response
  useEffect(() => {
    const optionId = responseData?.optionId;
    const answer = responseData?.answer;

    if (disabled) {
      if (Number.isInteger(optionId) && options[optionId] != null) {
        setSelectedOption(options[optionId]);
        setDropDownLabel(options[optionId]);
      } else if (answer != null) {
        setSelectedOption(answer);
        setDropDownLabel(answer);
      }
      setIsClicked(false);
    }
  }, [responseData, options, disabled]);

  const liClass = `dropDownOption${disabled ? ' no_hover' : ''}`;

  return (
    <div className="dropDownContainer">
      <div className="dropDownButton" onClick={handleMainClick}>
        <h2 id="dropDownText">{dropDownLabel}</h2>
        <div className="dropDownArrowContainer">
          <svg
            className="dropDownArrow"
            style={{ transform: isClicked ? 'rotate(180deg)' : 'rotate(0deg)' }}
            width="23"
            height="11"
            viewBox="0 0 23 11"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M0.727539 0.727251L10.8387 10.2727L21.7275 0.72725"
              className="dropDownArrowPath"
              stroke="black"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {isClicked && (
        <ul className="dropDownOptionsBox">
          {options.map((option, i) => (
            <li
              key={`${option}-${i}`}
              className={`${liClass} ${option === selectedOption ? 'selected' : ''}`}
              onClick={() => handleOptionClick(option, i)}
            >
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function EnterButton() {

  return (
    <button type="button" className="enterButton">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline points="5.25 2.75 12.75 9 5.25 15.25" stroke="black" fill="none" />
      </svg>
    </button>
  )

}
