import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * OverlayContext
 *
 * Provides a simple, app-wide way to show a blocking overlay with a
 * translucent blanket and a centered card. Content is supplied as a
 * React node. While the overlay is open, body scrolling is disabled.
 */
export const OverlayContext = createContext(null);

export function OverlayProvider({ children }) {
  const [content, setContent] = useState(null);

  const show = useCallback((node) => {
    setContent(() => node || null);
  }, []);

  const hide = useCallback(() => {
    setContent(null);
  }, []);

  const isOpen = !!content;

  // Lock body scroll while the overlay is open.
  useEffect(() => {
    if (!isOpen) return;

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isOpen]);

  // Allow Escape to close dismissible overlays.
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        hide();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, hide]);

  const value = useMemo(
    () => ({ show, hide, isOpen }),
    [show, hide, isOpen]
  );

  return (
    <OverlayContext.Provider value={value}>
      {children}
      {isOpen && (
        <div className="overlayRoot">
          <div className="overlayBlanket" aria-hidden="true" onClick={hide} />
          <div
            className="overlayCard"
            role="dialog"
            aria-modal="true"
          >
            {content}
          </div>
        </div>
      )}
    </OverlayContext.Provider>
  );
}

export function useOverlay() {
  const ctx = useContext(OverlayContext);
  if (!ctx) {
    throw new Error("useOverlay must be used within an OverlayProvider");
  }
  return ctx;
}
