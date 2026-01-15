import React from "react";
import { Heading1, Heading2 } from "../Headings.jsx";
import { useOverlay } from "../context/OverlayContext.jsx";
import { ERROR_DEFINITIONS } from "../errors/errorRegistry.js";

/**
 * ErrorOverlay
 *
 * Renders a friendly error message inside the global overlay card.
 * Expects a `classification` object produced by `classifyError`.
 */
export function ErrorOverlay({ classification, onClose, onContact }) {
  const { hide } = useOverlay();

  const def = ERROR_DEFINITIONS[classification?.key] || ERROR_DEFINITIONS.UNKNOWN;
  const title = def.title;
  const body = def.body;
  const detail = classification?.serverMsg && classification.serverMsg !== body
    ? classification.serverMsg
    : null;

  const handleClose = () => {
    if (onClose) onClose(classification);
    hide();
  };

  const handleContact = () => {
    if (onContact) {
      onContact(classification);
    } else {
      // Placeholder: you can later swap this for a contact form or mailto.
      console.log("Contact support for error:", classification);
      hide();
    }
  };

  return (
    <div className="ErrorOverlayContent">
      <Heading1 text={title} />
      <Heading2 text={body} />
      {detail && (
        <p className="ErrorOverlayDetail">{detail}</p>
      )}

      <div className="ErrorOverlayButtons">
        <button type="button" className="logInButton" onClick={handleClose}>
          Okay
        </button>
        <button type="button" className="logInButton" onClick={handleContact}>
          Contact
        </button>
      </div>
    </div>
  );
}
