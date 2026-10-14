import React, { useState, useRef, useEffect } from "react";

/**
 * LockedTooltip
 *
 * A reusable hover tooltip for locked / gated content.
 * Wrap any element and pass `message` content — the tooltip
 * appears on hover, styled to match the chart tooltips used
 * elsewhere in the app.
 *
 * Props:
 *   message  – text or React content to display in the tooltip
 *   children – the element that triggers the tooltip on hover
 */
export function LockedTooltip({ message, children, className = "", interactive = false }) {
  const [visible, setVisible] = useState(false);
  const wrapperRef = useRef(null);

  // Hide on scroll so the tooltip doesn't float away
  useEffect(() => {
    if (!visible) return;
    const hide = () => setVisible(false);
    window.addEventListener("scroll", hide, { passive: true });
    return () => window.removeEventListener("scroll", hide);
  }, [visible]);

  return (
    <div
      ref={wrapperRef}
      className={`lockedTooltipWrapper ${className}`.trim()}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setVisible(false);
      }}
    >
      {children}
      {visible && message && (
        <div
          className={`lockedTooltipBubble${interactive ? " lockedTooltipBubble--interactive" : ""}`}
          role="tooltip"
        >
          {message}
        </div>
      )}
    </div>
  );
}
