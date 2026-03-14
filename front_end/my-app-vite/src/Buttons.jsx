
import React, { useState, useRef, useEffect, useMemo, useLayoutEffect }from 'react';
import { DragElement, ArrowSVG, Star, BackArrowSVG, CheckBox, LockSVG, EyeSVG, ForwardArrowIcon, LocationIcon, ClockIcon, AvatarCircle, AVATAR_COLORS } from './Icons';
import classNames from 'classnames';
import { motion } from 'framer-motion';
import { Link, useParams, useNavigate, Navigate } from 'react-router-dom';

// Shared textarea autosize hook: adjusts height to fit content whenever `value` changes.
export function useAutosizeTextArea(textareaRef, value) {
  useLayoutEffect(() => {
    const textarea = textareaRef?.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, [textareaRef, value]);
}

export function CompleteButton({ moduleName, decoration }) {
    return (
    <button className="completeButton">
        <span id="buttonText">{moduleName}</span>
        <div></div>
        <div></div>
        <ArrowSVG />
        {decoration && (
          <div className="cardDecoration">{decoration}</div>
        )}
    </button>
    );
}

export function ProcessingButton({ moduleName, isAdmin, RSVPStatus, decoration }) {
  const buttonClassName = RSVPStatus ? "openButton" : "processingButton";

  return (
    <button className={buttonClassName}>
      <span id="buttonText">{moduleName}</span>
      <div></div>
      <div></div>

      {isAdmin ? (
        <svg
          className="pencilIconContainer"
          width="20"
          height="21"
          viewBox="0 0 20 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="pencilIcon"
            d="M2.76738 16C2.76738 16 1.49988 19 0.999939 20C0.5 21 4.53482 18.2222 4.53482 18.2222M2.76738 16L4.53482 18.2222M2.76738 16L14.924 2.24383M4.53482 18.2222L17.6802 5M17.6802 5L18.5004 4.17499C19.3108 3.35985 19.2596 2.0284 18.3891 1.27785V1.27785C17.5676 0.569597 16.3293 0.653647 15.611 1.46641L14.924 2.24383M17.6802 5L14.924 2.24383"
            stroke="white"
          />
        </svg>
      ) : RSVPStatus ? (
        <EyeSVG />
      ) : (
        <LockSVG />
      )}

      {decoration && <div className="cardDecoration">{decoration}</div>}
    </button>
  );
}

export function PendingButton({ moduleName, isAdmin, decoration }) {
  return (
    <button className={isAdmin ? "adminPendingButton" : "pendingButton"}>
      <span id="buttonText">{moduleName}</span>
      <div></div>
      <div></div>

      {isAdmin && (
        <svg
          className="pencilIconContainer"
          width="20"
          height="21"
          viewBox="0 0 20 21"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            className="pencilIcon"
            d="M2.76738 16C2.76738 16 1.49988 19 0.999939 20C0.5 21 4.53482 18.2222 4.53482 18.2222M2.76738 16L4.53482 18.2222M2.76738 16L14.924 2.24383M4.53482 18.2222L17.6802 5M17.6802 5L18.5004 4.17499C19.3108 3.35985 19.2596 2.0284 18.3891 1.27785V1.27785C17.5676 0.569597 16.3293 0.653647 15.611 1.46641L14.924 2.24383M17.6802 5L14.924 2.24383"
            stroke="white"
          />
        </svg>
      )}

      {decoration && <div className="cardDecoration">{decoration}</div>}
    </button>
  );
}

export function OpenButton({ moduleName, progressValue, maxValue, decoration }) {
  return (
    <button className="openButton">
      <span id="buttonText">{moduleName}</span>
      <div className="progressContainer">
        <progress className="openProgress" value={progressValue} max={maxValue}></progress>
      </div>
      <span id="buttonTimeText">72 hrs</span>
      <ArrowSVG />
      {decoration && <div className="cardDecoration">{decoration}</div>}
    </button>
  );
}

export function OpenResponse({ onChange, responseData, disabled }) {
    const textareaRef = useRef(null);
    const [value, setValue] = useState('');

    // Keep height in sync with current value (both user input and prop-driven changes).
    useAutosizeTextArea(textareaRef, value);

    const handleChange = (e) => {
        const newValue = e.target.value;
        setValue(newValue);

        if (onChange) {
            onChange(newValue);
        }
    };

    // Rehydrate when responseData changes (including on first mount).
    useEffect(() => {
        if (responseData !== undefined && responseData !== null) {
            setValue(responseData);
        } else {
            setValue('');
        }
    }, [responseData]);
    
    return (
        <textarea 
        ref={textareaRef}
        value={value}
        onChange={disabled ? undefined : handleChange}
        className={`OpenResponse ${disabled ? 'no_hover' : ''}`} 
        placeholder='Enter your response here'/>
    );
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

// Build simple rectangular zones for a grid layout (rows x cols)
function buildZonesFromGrid(grid) {
  const rows = Math.max(1, grid?.rows || 1);
  const cols = Math.max(1, grid?.cols || 1);

  const zones = [];
  const rowHeight = 1 / rows;
  const colWidth = 1 / cols;

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      zones.push({
        id: `r${r + 1}c${c + 1}`,
        label: grid.labels?.[r]?.[c] || `R${r + 1}C${c + 1}`,
        xMin: c * colWidth,
        xMax: (c + 1) * colWidth,
        yMin: r * rowHeight,
        yMax: (r + 1) * rowHeight,
      });
    }
  }
  return zones;
}

// Derive semantic meaning (zone or spectrum score) from a normalized position
function deriveSemantics(pct, layout, zones) {
  const semantics = {};
  if (!pct) return semantics;

  if (layout === 'x-spectrum') {
    semantics.scoreX = clamp01(pct.x);
  }

  if (layout === 'grid-zones' && Array.isArray(zones)) {
    const z = zones.find(z =>
      pct.x >= z.xMin && pct.x <= z.xMax &&
      pct.y >= z.yMin && pct.y <= z.yMax
    );
    if (z) {
      semantics.zoneId = z.id;
      semantics.zoneLabel = z.label;
      // Recover row/col indices from the id pattern r{row}c{col}
      const m = /^r(\d+)c(\d+)$/.exec(z.id);
      if (m) {
        semantics.rowIndex = Number(m[1]) - 1; // 0-based
        semantics.colIndex = Number(m[2]) - 1;
      }
    }
  }

  return semantics;
}

/* ====================== component ====================== */
export function DragAndDropArea({
  responseData,
  disabled,
  dragOptions,          // expect: { layout, axes, grid, options: [...] }
  onInitialPositions,   // callback(snapshotArray)
  onUpdateResponse,     // callback(index, label, position, isFinal, keyName, meta)
}) {
  const constraintRef = useRef(null);
  const [isInteracting, setIsInteracting] = useState(false); // drag or submit underway
  const size = useConstraintSize(constraintRef, { freeze: isInteracting });

  const options = dragOptions?.options ?? [];
  const layout = dragOptions?.layout || 'free';
  const grid = dragOptions?.grid || null;

  const zones = useMemo(() => {
    if (layout === 'grid-zones' && grid) return buildZonesFromGrid(grid);
    return null;
  }, [layout, grid]);

  const rows = layout === 'grid-zones' && grid ? Math.max(1, grid.rows || 1) : 0;
  const cols = layout === 'grid-zones' && grid ? Math.max(1, grid.cols || 1) : 0;

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

  /* -------- seed initial positions when nothing stored yet -------- */
  useEffect(() => {
    if (!options.length || !ids.length) return;
    setPositionsPct(prev => {
      if (Object.keys(prev).length > 0) return prev;
      const init = {};
      ids.forEach((id) => {
        init[id] = {
          x: 0.5,
          y: layout === 'x-spectrum' ? 0.5 : 0.5,
        };
      });
      return init;
    });
  }, [options.length, ids, layout]);

  /* -------- hydrate from responseData; assume new shape (position + semantics) -------- */
  useEffect(() => {
    if (!Array.isArray(responseData) || responseData.length === 0) return;

    const init = {};
    for (const item of responseData) {
      const key = item?.keyName ?? (Number.isInteger(item?.index) && ids[item.index] ? ids[item.index] : null);
      if (!key) continue;

      const raw = item.position;
      if (!raw) continue;

      const pct = isPixelPos(raw) ? toPct(raw, size) : raw;
      if (!pct) continue;

      // For x-spectrum, treat Y as visually/semantically fixed at center (0.5)
      const xNorm = clamp01(pct.x);
      const yNorm = layout === 'x-spectrum' ? 0.5 : clamp01(pct.y);

      init[key] = { x: xNorm, y: yNorm };
    }
    if (Object.keys(init).length > 0) setPositionsPct(init);
  }, [responseData, ids, size.w, size.h, layout]);

  /* -------- safety: if container resizes (when not frozen), keep values clamped -------- */
  useEffect(() => {
    if (!size.w || !size.h) return;
    setPositionsPct((prev) => {
      const next = {};
      for (const [k, v] of Object.entries(prev)) next[k] = { x: clamp01(v?.x), y: clamp01(v?.y) };
      return next;
    });
  }, [size.w, size.h]);

  /* -------- emit helper: normalized (quantized) + readable percent + label + semantics -------- */
  function emitUpdate(idx, id, pct) {
    const pos = { x: quantize(pct.x), y: quantize(pct.y) }; // nice-looking normalized numbers
    const display = { xPct: pct2(pct.x), yPct: pct2(pct.y) }; // e.g., { xPct: 42.13, yPct: 18.00 }
    const label = options[idx]?.optionName ?? "";             // your authored name
    const semantics = deriveSemantics(pct, layout, zones || undefined);
    onUpdateResponse?.(idx, label, pos, false, id, { display, semantics });
  }

  const handlePositionChange = (id, idx, pixelPos) => {
    const rawPct = toPct(pixelPos, size) || { x: 0, y: 0 };

    // Legacy path for Framer-based drag (non-spectrum). Kept for
    // compatibility but not used by the new pointer-based handles.
    const pct = rawPct;
    const clamped = { x: clamp01(pct.x), y: clamp01(pct.y) };

    setPositionsPct((prev) => {
      const updated = { ...prev, [id]: clamped };
      emitUpdate(idx, id, clamped);

      // Once all have been placed at least once, send a complete snapshot
      if (Object.keys(updated).length === total && total > 0) {
        const snapshot = ids.map((k, i) => {
          const p = updated[k] ?? { x: 0, y: 0 };
          const semantics = deriveSemantics(p, layout, zones || undefined);
          return {
            keyName: k,                                  // stable key from editor
            index: i,
            label: options[i]?.optionName ?? "",         // human-readable name
            position: { x: quantize(p.x), y: quantize(p.y) },
            display: { xPct: pct2(p.x), yPct: pct2(p.y) },
            semantics,
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
      {/* Spectrum visual hint: center line + end labels */}
      {layout === 'x-spectrum' && (
        <>
          <div className="DndSpectrumAxis" />
          <div className="DndSpectrumLabel DndSpectrumLabelLeft">
            {dragOptions?.axes?.x?.labelMin}
          </div>
          <div className="DndSpectrumLabel DndSpectrumLabelRight">
            {dragOptions?.axes?.x?.labelMax}
          </div>
        </>
      )}

      {/* Grid zoning visual hint: horizontal and vertical dashed lines */}
      {layout === 'grid-zones' && rows > 0 && cols > 0 && (
        <>
          {[...Array(Math.max(0, rows - 1))].map((_, r) => (
            <div
              key={`grid-h-${r}`}
              className="DndGridLine DndGridLineH"
              style={{ top: `${((r + 1) * 100) / rows}%` }}
            />
          ))}
          {[...Array(Math.max(0, cols - 1))].map((_, c) => (
            <div
              key={`grid-v-${c}`}
              className="DndGridLine DndGridLineV"
              style={{ left: `${((c + 1) * 100) / cols}%` }}
            />
          ))}

          {/* Centered labels for each zone, using built zones metadata */}
          {Array.isArray(zones) && zones.map((z) => {
            const centerX = ((z.xMin + z.xMax) / 2) * 100;
            const centerY = ((z.yMin + z.yMax) / 2) * 100;
            return (
              <div
                key={`zone-label-${z.id}`}
                className="DndZoneLabel"
                style={{ left: `${centerX}%`, top: `${centerY}%` }}
              >
                {z.label}
              </div>
            );
          })}
        </>
      )}

      {options.map((opt, index) => {
        const id = ids[index];

        // Spectrum layout uses a custom CSS/PointerEvents-based slider handle
        if (layout === 'x-spectrum') {
          const pct = positionsPct[id] || { x: 0.5, y: 0.5 };
          return (
            <SpectrumHandle
              key={id}
              id={id}
              color={limitedColors[index]}
              pctX={pct.x}
              constraintRef={constraintRef}
              disabled={disabled}
              onChangeX={(xNorm) => {
                const pctNorm = { x: clamp01(xNorm), y: 0.5 };
                setPositionsPct(prev => ({ ...prev, [id]: pctNorm }));
                emitUpdate(index, id, pctNorm);
              }}
            />
          );
        }

        // Grid-zones and free layouts use a 2D pointer-based box handle
        const pct = positionsPct[id] || { x: 0.5, y: 0.5 };
        return (
          <BoxHandle
            key={id}
            id={id}
            color={limitedColors[index]}
            pct={pct}
            constraintRef={constraintRef}
            disabled={disabled}
            onChange={(norm) => {
              const clamped = {
                x: clamp01(norm.x),
                y: clamp01(norm.y),
              };
              setPositionsPct(prev => ({ ...prev, [id]: clamped }));
              emitUpdate(index, id, clamped);
            }}
          />
        );
      })}
    </div>
  );
}

// Simple pointer-based horizontal slider handle for spectrum layout
function SpectrumHandle({ id, color, pctX, constraintRef, disabled, onChangeX }) {
  const handlePointerDown = (e) => {
    if (disabled) return;
    const el = constraintRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const updateFromClientX = (clientX) => {
      const rel = (clientX - rect.left) / rect.width;
      const clamped = clamp01(rel);
      onChangeX(clamped);
    };

    // Prevent text selection while dragging across labels/axis
    e.preventDefault();
    document.body.classList.add('dnd-spectrum-dragging');

    // Initial update on click-down
    updateFromClientX(e.clientX);

    const handleMove = (moveEvent) => {
      moveEvent.preventDefault();
      updateFromClientX(moveEvent.clientX);
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      document.body.classList.remove('dnd-spectrum-dragging');
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      className="dragElement"
      style={{
        position: 'absolute',
        top: '50%',
        left: `${clamp01(pctX) * 100}%`,
        marginTop: -15,
        transform: 'translateX(-50%)',
        backgroundColor: color,
        cursor: disabled ? 'default' : 'grab',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
    />
  );
}

// 2D pointer-based box handle for grid-zones and free layouts
function BoxHandle({ id, color, pct, constraintRef, disabled, onChange }) {
  const handlePointerDown = (e) => {
    if (disabled) return;
    const el = constraintRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();

    const updateFromClient = (clientX, clientY) => {
      const relX = (clientX - rect.left) / rect.width;
      const relY = (clientY - rect.top) / rect.height;
      onChange({ x: relX, y: relY });
    };

    e.preventDefault();
    document.body.classList.add('dnd-spectrum-dragging'); // reuse no-select class

    updateFromClient(e.clientX, e.clientY);

    const handleMove = (moveEvent) => {
      moveEvent.preventDefault();
      updateFromClient(moveEvent.clientX, moveEvent.clientY);
    };
    const handleUp = () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      document.body.classList.remove('dnd-spectrum-dragging');
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
  };

  return (
    <div
      className="dragElement"
      style={{
        position: 'absolute',
        left: `${clamp01(pct.x) * 100}%`,
        top: `${clamp01(pct.y) * 100}%`,
        transform: 'translate(-50%, -50%)',
        backgroundColor: color,
        cursor: disabled ? 'default' : 'grab',
        WebkitUserSelect: 'none',
        userSelect: 'none',
      }}
      onPointerDown={handlePointerDown}
    />
  );
}


export function NextButton({ onClick, text = "Next", style= {}, to="", disabled = false, children }) {
    
    const navigate = useNavigate();

    const handleClick = (e) => {
      if (disabled) return;
      console.log('CLICK:', { to });
      if (onClick) onClick(e);
      if (to) navigate(to);
      else console.warn('Navigation skipped — `to` is falsy.');
    };
    
    return (
        <div style={style} className="logInButtonContainer linkNoUnderLine cardLink">
            <button 
                onClick={handleClick} 
                className={`logInButton ${disabled ? 'logInButtonDisabled' : ''}`}
                disabled={disabled}
            >
                {children || text}
            </button>
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


export function LogInButton({ to="/showcases" }) {

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

// Shared row for "when" / "where" styles
export function WhenWhereRow({ icon, label }) {
  return (
    <div className="whenWhereRow">
      <span className="whenWhereIcon">{icon}</span>
      <span className="whenWhereText">{label}</span>
    </div>
  );
}

// Horizontal strip of attendee avatars
export function AttendeeAvatarStrip({ attendees, currentUserId }) {
  if (!Array.isArray(attendees) || attendees.length === 0) return null;

  // Put current user first, then others
  const sorted = [...attendees].sort((a, b) => {
    const aSelf = Number(a.user_id) === Number(currentUserId);
    const bSelf = Number(b.user_id) === Number(currentUserId);
    if (aSelf && !bSelf) return -1;
    if (!aSelf && bSelf) return 1;
    return 0;
  });

  const showFade = sorted.length > 3;

  // Scroll + drag behavior (mirrors Processing.jsx ProcessorScroller)
  const scrollerRef = useRef(null);
  const isDraggingRef = useRef(false);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleHorizontalWheel = (e) => {
    const el = scrollerRef.current;
    if (!el) return;

    // If vertical wheel movement dominates, translate it into horizontal scroll
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    }
  };

  const handlePointerDown = (e) => {
    // Enable click-and-drag only for mouse pointers so touch/trackpads behave natively
    if (e.pointerType !== 'mouse') return;
    const el = scrollerRef.current;
    if (!el) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragScrollLeftRef.current = el.scrollLeft;
    el.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const el = scrollerRef.current;
    if (!el) return;
    e.preventDefault();

    const speed = 2; // >1 = faster scrolling, <1 = slower
    const dx = e.clientX - dragStartXRef.current;
    el.scrollLeft = dragScrollLeftRef.current - dx * speed;
  };

  const endDrag = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    scrollerRef.current?.releasePointerCapture?.(e.pointerId);
  };

  return (
    <div className="AttendeeStripWrapper">
      <div
        className={`AttendeeStripViewport${isDragging ? ' is-dragging' : ''}`}
        ref={scrollerRef}
        onWheel={handleHorizontalWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
      >
        <div className="AttendeeStrip">
          {sorted.map((a) => {
          const isSelf = Number(a.user_id) === Number(currentUserId);
          const seed = a.username || a.first_name || String(a.user_id);
          const displayName = a.first_name || a.username || `User ${a.user_id}`;

          // Derive avatar props from stored avatar_config when present
          let avatarProps = {};
          if (a.avatar_config) {
            try {
              let cfg = typeof a.avatar_config === 'string'
                ? JSON.parse(a.avatar_config)
                : a.avatar_config;

              console.log('[AttendeeStrip] avatar_config for user', a.user_id, cfg);

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
            } catch (e) {
              console.error('Invalid avatar_config for attendee', a.user_id, e);
            }
          }

          return (
            <div
              key={a.user_id}
              className={isSelf ? 'AttendeeAvatar AttendeeAvatar--self' : 'AttendeeAvatar'}
              title={displayName}
            >
              <AvatarCircle seed={seed} size={32} {...avatarProps} />
            </div>
          );
        })}
        </div>
      </div>
      {/* Fade-out overlay that starts around the last visible avatar */}
      {showFade && <div className="AttendeeStripFade" aria-hidden="true" />}
    </div>
  );
}

export function WorkshopCard({ workshopName, workshopLocation, workshopDate, workshopDescription, workshopPublic, decoration }) {
  const locationLabel = workshopPublic != null
    ? `${workshopLocation} (${workshopPublic ? 'Public' : 'In Studio'})`
    : workshopLocation;

  return (
    <>
      <div className="workshopCardContainer">
        <div>
          <h1 className="workshopCardName">{workshopName}</h1>
          <WhenWhereRow icon={<ClockIcon size={14} />} label={workshopDate} />
          <WhenWhereRow icon={<LocationIcon size={14} />} label={locationLabel} />
          <span id="workshopCardDescription">{workshopDescription}</span>
        </div>

        <div>
          <ArrowSVG />
        </div>

        {decoration && <div className="cardDecoration">{decoration}</div>}
      </div>
    </>
  );
}

export function MainNavCard({ color, text, link, decoration }) {
  return (
    <Link to={link} className="linkNoUnderLine cardLink">
      <div className="MainNavCardContainer" style={{ backgroundColor: color }}>
        <div className="MainNavCardLabel">
          <span className="MainNavCardTitle">{text}</span>
          <span className="MainNavCardDesc"></span>
        </div>
        <EnterButton />
        {decoration && <div className="cardDecoration">{decoration}</div>}
      </div>
    </Link>
  );
}

export function DropDown({ responseData, options = [], onSelect, reset, onChange, disabled, value }) {
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

  // Sync label with controlled value prop
  useEffect(() => {
    if (value != null && !disabled) {
      setSelectedOption(value);
      setDropDownLabel(value);
    }
  }, [value]);

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
