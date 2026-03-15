import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

import { Heading1, Heading2 } from "../Headings.jsx";
import { NextButton } from "../Buttons.jsx";
import { ProgressBar } from "../Icons.jsx";

import {
  MultipleChoiceTemplate,
  CheckListTemplate,
  ShortResponseTemplate,
  DragAndDropTemplate,
  SampleRaterTemplate,
  ScriptNotationTemplate,
  DropDownTemplate,
} from "../Templates.jsx";

/**
 * HomepageModuleRunner
 *
 * A self-contained "flash player frame" that lets anonymous visitors run
 * through all prompts in the current workshop's open modules.
 *
 * Three phases:
 *   1. Workshop landing  – info card + module list + "Respond" button
 *   2. Prompt runner     – one prompt at a time, local progress, module edges
 *   3. Save & account    – email capture → batch POST or navigate to /register
 *
 * Props:
 *   currentWorkshop  – { workshopId, workshopName, workshopDescription, workshopDate, workshopLocation }
 *   openModules      – [{ moduleId, moduleName, prompts: [{ promptId, templateId, options, reference }] }]
 */
export function HomepageModuleRunner({ currentWorkshop, openModules }) {
  const navigate = useNavigate();

  // --- Phase management ---
  const [phase, setPhase] = useState("landing"); // 'landing' | 'running' | 'edge' | 'save'

  // --- Module / prompt tracking ---
  const [moduleIndex, setModuleIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptMode, setPromptMode] = useState("edit"); // 'edit' | 'view'

  // --- Response state ---
  const [responseData, setResponseData] = useState([]);
  const allResponsesRef = useRef({}); // { [promptId]: { promptId, templateId, content } }

  // --- Save phase state ---
  const [email, setEmail] = useState("");
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'created' | 'appended' | 'existing_user' | 'error'
  const [saveMessage, setSaveMessage] = useState("");

  // Derived values
  const currentModule = openModules[moduleIndex] || null;
  const prompts = currentModule?.prompts || [];
  const currentPrompt = prompts[promptIndex] || null;
  const totalPrompts = prompts.length;

  // Count how many prompts in the current module have saved responses
  const answeredInModule = currentModule
    ? currentModule.prompts.filter((p) => allResponsesRef.current[p.promptId]).length
    : 0;

  // ────────────────────────────────────────────
  // Response change handler (mirrors WorkshopPromptsPage)
  // ────────────────────────────────────────────
  const handleResponseChange = (
    index = 0,
    questionText = "",
    value = "",
    selected = false,
    keyName = "",
    meta = undefined
  ) => {
    if (!currentPrompt) return;
    const tid = currentPrompt.templateId;

    switch (tid) {
      case 1: {
        setResponseData((prev) => {
          const updated = Array.isArray(prev) ? [...prev] : [];
          updated[index] = { questionText, optionId: value, optionLabel: keyName };
          return updated;
        });
        break;
      }
      case 3: {
        setResponseData((prev) => {
          const updated = Array.isArray(prev) ? [...prev] : [];
          const existing = updated[index] ?? { questionText, options: [] };
          const opts = Array.isArray(existing.options) ? [...existing.options] : [];
          while (opts.length <= value) opts.push({ id: opts.length, optionText: "", selected: false });
          opts[value] = { id: value, optionText: keyName, selected: !!selected };
          updated[index] = { ...existing, questionText, options: opts };
          return updated;
        });
        break;
      }
      case 4: {
        setResponseData((prev) => {
          const updated = Array.isArray(prev) ? [...prev] : [];
          updated[index] = { questionText, answer: value };
          return updated;
        });
        break;
      }
      case 6: {
        setResponseData((prev) => {
          const updated = Array.isArray(prev) ? [...prev] : [];
          const base = { index, keyName, position: value };
          const extras = meta && typeof meta === "object" ? meta : {};
          updated[index] = { ...base, ...extras };
          return updated;
        });
        break;
      }
      case 7: {
        setResponseData((prev) => ({ ...(prev || {}), rating: value }));
        break;
      }
      case 8: {
        setResponseData((prev) => ({ ...(prev || {}), notationResponse: value }));
        break;
      }
      case 9: {
        setResponseData((prev) => {
          const updated = Array.isArray(prev) ? [...prev] : [];
          updated[index] = { questionText, answer: keyName, optionId: value, optionLabel: keyName };
          return updated;
        });
        break;
      }
      default:
        break;
    }
  };

  // ────────────────────────────────────────────
  // Initialize blank responseData for a prompt
  // ────────────────────────────────────────────
  const initResponseData = (prompt) => {
    if (!prompt) return [];
    switch (prompt.templateId) {
      case 3: {
        const cl = prompt.options?.checkListPrompts ?? [];
        return cl.map((q) => ({
          questionText: q.questionText,
          options: (q.options || []).map((opt, i) => ({ id: i, optionText: opt, selected: false })),
        }));
      }
      case 6:
        return {};
      case 7:
        return { rating: "" };
      case 8:
        return { notationResponse: "" };
      default:
        return [];
    }
  };

  // ────────────────────────────────────────────
  // Enter the runner (Phase 1 → Phase 2)
  // ────────────────────────────────────────────
  const startRunning = (mIdx = 0) => {
    setModuleIndex(mIdx);
    setPromptIndex(0);
    setPromptMode("edit");
    setResponseData(initResponseData(openModules[mIdx]?.prompts?.[0]));
    setPhase("running");
  };

  // ────────────────────────────────────────────
  // Submit current prompt response (local save)
  // ────────────────────────────────────────────
  const handleSubmit = async () => {
    if (promptMode === "view") return;
    if (!currentPrompt) return;

    const isEmpty =
      responseData == null ||
      (Array.isArray(responseData) && responseData.length === 0) ||
      (typeof responseData === "object" && !Array.isArray(responseData) && Object.keys(responseData).length === 0);

    if (isEmpty) return;

    // Store locally
    allResponsesRef.current[currentPrompt.promptId] = {
      promptId: currentPrompt.promptId,
      templateId: currentPrompt.templateId,
      content: responseData,
    };

    setPromptMode("view");
  };

  // ────────────────────────────────────────────
  // Navigate to next prompt or module edge
  // ────────────────────────────────────────────
  const handleNext = () => {
    if (promptIndex < totalPrompts - 1) {
      const nextIdx = promptIndex + 1;
      setPromptIndex(nextIdx);
      setPromptMode("edit");

      // If they already answered this prompt, restore it
      const nextPrompt = prompts[nextIdx];
      const existing = allResponsesRef.current[nextPrompt.promptId];
      if (existing) {
        setResponseData(existing.content);
        setPromptMode("view");
      } else {
        setResponseData(initResponseData(nextPrompt));
      }
    } else {
      // End of this module
      if (moduleIndex < openModules.length - 1) {
        setPhase("edge");
      } else {
        setPhase("save");
      }
    }
  };

  const handleBack = () => {
    if (promptIndex > 0) {
      const prevIdx = promptIndex - 1;
      setPromptIndex(prevIdx);
      const prevPrompt = prompts[prevIdx];
      const existing = allResponsesRef.current[prevPrompt.promptId];
      if (existing) {
        setResponseData(existing.content);
        setPromptMode("view");
      } else {
        setResponseData(initResponseData(prevPrompt));
        setPromptMode("edit");
      }
    }
  };

  // ────────────────────────────────────────────
  // Module edge → next module
  // ────────────────────────────────────────────
  const goToNextModule = () => {
    const nextMIdx = moduleIndex + 1;
    startRunning(nextMIdx);
  };

  // ────────────────────────────────────────────
  // Batch save via email
  // ────────────────────────────────────────────
  const handleSaveWithEmail = async () => {
    if (!email.trim()) return;
    setSaveStatus("saving");

    const responses = Object.values(allResponsesRef.current);
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/homepage/responses`, {
        email: email.trim(),
        workshopId: currentWorkshop.workshopId,
        responses,
      });

      const { status, message } = res.data;
      setSaveStatus(status);
      setSaveMessage(message);
    } catch (err) {
      console.error("Save error:", err);
      setSaveStatus("error");
      setSaveMessage("Something went wrong. Please try again.");
    }
  };

  // ────────────────────────────────────────────
  // Stash responses and navigate to full registration
  // ────────────────────────────────────────────
  const handleCreateAccount = () => {
    const responses = Object.values(allResponsesRef.current);
    sessionStorage.setItem(
      "guestResponses",
      JSON.stringify({ workshopId: currentWorkshop.workshopId, responses })
    );
    navigate("/register");
  };

  // ────────────────────────────────────────────
  // Prompt renderer
  // ────────────────────────────────────────────
  const renderPrompt = () => {
    if (!currentPrompt) return null;
    const disabled = promptMode === "view";

    switch (currentPrompt.templateId) {
      case 1:
        return (
          <MultipleChoiceTemplate
            responseData={responseData}
            disabled={disabled}
            onUpdateResponse={handleResponseChange}
            multipleChoiceOptions={currentPrompt.options}
          />
        );
      case 3:
        return (
          <CheckListTemplate
            responseData={responseData}
            disabled={disabled}
            onUpdateResponse={handleResponseChange}
            checkListOptions={currentPrompt.options}
          />
        );
      case 4:
        return (
          <ShortResponseTemplate
            responseData={responseData}
            disabled={disabled}
            onUpdateResponse={handleResponseChange}
            shortResponseOptions={currentPrompt.options}
          />
        );
      case 6:
        return (
          <DragAndDropTemplate
            responseData={responseData}
            disabled={disabled}
            onInitialPositions={setResponseData}
            onUpdateResponse={handleResponseChange}
            dragOptions={currentPrompt.options}
          />
        );
      case 7:
        return (
          <SampleRaterTemplate
            responseData={responseData}
            disabled={disabled}
            onUpdateResponse={handleResponseChange}
            reference={currentPrompt.reference}
          />
        );
      case 8:
        return (
          <ScriptNotationTemplate
            responseData={responseData}
            disabled={disabled}
            onUpdateResponse={handleResponseChange}
            reference={currentPrompt.reference}
          />
        );
      case 9:
        return (
          <DropDownTemplate
            responseData={responseData}
            disabled={disabled}
            onUpdateResponse={handleResponseChange}
            dropDownOptions={currentPrompt.options}
          />
        );
      default:
        return null;
    }
  };

  // ================================================================
  // RENDER
  // ================================================================

  // --- Phase 1: Workshop Landing ---
  if (phase === "landing") {
    const ws = currentWorkshop;
    const dateStr = ws.workshopDate
      ? new Date(ws.workshopDate).toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

    return (
      <div className="homepageRunnerFrame">
        <div className="homepageRunnerContent">
          <Heading1 text={ws.workshopName} />
          {ws.workshopDescription && <Heading2 text={ws.workshopDescription} />}

          {(dateStr || ws.workshopLocation) && (
            <div className="homepageRunnerMeta">
              {dateStr && <span className="homepageRunnerMetaItem">{dateStr}</span>}
              {ws.workshopLocation && (
                <span className="homepageRunnerMetaItem">{ws.workshopLocation}</span>
              )}
            </div>
          )}

          {openModules.length > 0 && (
            <div className="homepageRunnerModules">
              {openModules.map((mod, i) => (
                <div key={mod.moduleId} className="homepageRunnerModuleItem">
                  <span className="homepageRunnerModuleName">{mod.moduleName}</span>
                  <span className="homepageRunnerModuleCount">
                    {mod.prompts.length} prompt{mod.prompts.length !== 1 ? "s" : ""}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="homepageRunnerLandingCTA">
            <NextButton text="Respond" onClick={() => startRunning(0)} />
          </div>
        </div>
      </div>
    );
  }

  // --- Phase 2: Prompt Runner ---
  if (phase === "running") {
    const instructionNeeded = [4, 6].includes(currentPrompt?.templateId);

    return (
      <div className="homepageRunnerFrame">
        <div className="homepageRunnerHeader">
          <span className="homepageRunnerModuleLabel">{currentModule?.moduleName}</span>
          <ProgressBar current={answeredInModule} max={totalPrompts} />
        </div>

        <div className="homepageRunnerContent">
          {instructionNeeded && (
            <Heading1
              text={currentPrompt.templateId === 4 ? "Free Response" : "Drag and Drop"}
            />
          )}
          {renderPrompt()}
        </div>

        <div className="homepageRunnerNav">
          {promptIndex > 0 && (
            <NextButton text="Back" onClick={handleBack} />
          )}
          <NextButton
            text={promptMode === "edit" ? "Submit" : "Next"}
            onClick={async () => {
              if (promptMode === "edit") {
                await handleSubmit();
              } else {
                handleNext();
              }
            }}
          />
        </div>
      </div>
    );
  }

  // --- Phase 2.5: Module Edge ---
  if (phase === "edge") {
    const remaining = openModules.length - moduleIndex - 1;
    return (
      <div className="homepageRunnerFrame">
        <div className="homepageRunnerContent" style={{ textAlign: "center" }}>
          <Heading1 text="Module Complete!" />
          <Heading2
            text={`${remaining} module${remaining !== 1 ? "s" : ""} remaining.`}
          />
          <div className="homepageRunnerNav">
            <NextButton text="Next Module" onClick={goToNextModule} />
            <NextButton text="Save Responses" onClick={() => setPhase("save")} />
          </div>
        </div>
      </div>
    );
  }

  // --- Phase 3: Save & Account ---
  if (phase === "save") {
    const responseCount = Object.keys(allResponsesRef.current).length;

    return (
      <div className="homepageRunnerFrame">
        <div className="homepageRunnerContent">
          <Heading1 text="All Done!" />
          <Heading2
            text={`You completed ${responseCount} prompt${responseCount !== 1 ? "s" : ""}. Save your responses to receive an RSVP.`}
          />

          {saveStatus === null || saveStatus === "saving" ? (
            <div className="homepageEmailCapture">
              <input
                className="textInput"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={saveStatus === "saving"}
              />
              <div className="homepageRunnerNav">
                <NextButton
                  text={saveStatus === "saving" ? "Saving…" : "Save with Email"}
                  onClick={handleSaveWithEmail}
                  disabled={saveStatus === "saving" || !email.trim()}
                />
                <NextButton text="Create Full Account" onClick={handleCreateAccount} />
              </div>
            </div>
          ) : (
            <div className="homepageEmailCapture">
              <Heading2 text={saveMessage} />
              {saveStatus === "existing_user" && (
                <div className="homepageRunnerNav">
                  <NextButton text="Log In" onClick={() => navigate("/login")} />
                  <NextButton text="Create Full Account" onClick={handleCreateAccount} />
                </div>
              )}
              {(saveStatus === "created" || saveStatus === "appended") && (
                <div className="homepageRunnerNav">
                  <NextButton text="Create Full Account" onClick={handleCreateAccount} />
                </div>
              )}
              {saveStatus === "error" && (
                <div className="homepageRunnerNav">
                  <NextButton text="Try Again" onClick={() => setSaveStatus(null)} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}
