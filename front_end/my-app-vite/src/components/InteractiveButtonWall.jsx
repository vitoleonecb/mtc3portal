import React, { useState } from "react";
import {
  MultipleChoiceButton,
  CheckBoxButton,
  StarRater,
  DropDown,
  OpenResponse,
} from "../Buttons.jsx";

/**
 * A decorative mosaic of the app's interactive UI components rendered with
 * mock data. Visitors can click/hover them but no data is submitted anywhere.
 */
export function InteractiveButtonWall() {
  const [mcSelected, setMcSelected] = useState(1);
  const [checks, setChecks] = useState([true, false, true, false]);

  const mcOptions = [
    "Heightened Realism",
    "Epic Theater",
    "Absurdism",
    "Devised / Physical",
  ];

  const checkOptions = [
    "Ensemble Work",
    "Improvisation",
    "Script Analysis",
    "Movement",
  ];

  return (
    <div className="buttonWallGrid">
      {/* Multiple choice cluster */}
      <div className="buttonWallCell buttonWallCell--mc">
        <span className="buttonWallLabel">Multiple Choice</span>
        {mcOptions.map((label, i) => (
          <MultipleChoiceButton
            key={i}
            label={label}
            isSelected={mcSelected === i}
            onSelect={() => setMcSelected(i)}
            disabled={false}
          />
        ))}
      </div>

      {/* Checkbox cluster */}
      <div className="buttonWallCell buttonWallCell--cb">
        <span className="buttonWallLabel">Checklist</span>
        {checkOptions.map((label, i) => (
          <CheckBoxButton
            key={i}
            optionText={label}
            checked={checks[i]}
            onChange={(val) => {
              const next = [...checks];
              next[i] = val;
              setChecks(next);
            }}
            disabled={false}
          />
        ))}
      </div>

      {/* Star rater */}
      <div className="buttonWallCell buttonWallCell--star">
        <span className="buttonWallLabel">Rating</span>
        <StarRater
          responseData="3"
          disabled={false}
          onChange={() => {}}
        />
      </div>

      {/* Dropdown */}
      <div className="buttonWallCell buttonWallCell--dd">
        <span className="buttonWallLabel">Dropdown</span>
        <DropDown
          options={["Tragedy", "Comedy", "Tragicomedy", "Farce"]}
          disabled={false}
          onChange={() => {}}
          responseData={{}}
        />
      </div>

      {/* Open response */}
      <div className="buttonWallCell buttonWallCell--open">
        <span className="buttonWallLabel">Short Response</span>
        <OpenResponse
          responseData=""
          disabled={false}
          onChange={() => {}}
        />
      </div>
    </div>
  );
}
