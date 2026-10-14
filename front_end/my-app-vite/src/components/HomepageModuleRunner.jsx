import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, Check, Eye, Lock, MapPin } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { validateEmail } from "../utils/validation.js";
import { useOverlay } from "../context/OverlayContext.jsx";
import { ErrorOverlay } from "./ErrorOverlay.jsx";
import { classifyError } from "../errors/errorRegistry.js";
import { previewStorageKey, promptStorageKey, readPreviewResponses, removePreviewResponses } from "../utils/homepagePreviewStorage.js";
import { allAvailablePromptsAnswered, moduleProgress, nextUnansweredModuleIndex, nextUnansweredPromptIndex } from "../utils/homepagePreviewProgress.js";

import { Heading1, Heading2 } from "../Headings.jsx";
import { NextButton } from "../Buttons.jsx";
import { ProgressBar } from "../Icons.jsx";
import { LockedTooltip } from "./ui/locked-tooltip.jsx";

import {
  MultipleChoiceTemplate,
  CheckListTemplate,
  ShortResponseTemplate,
  DragAndDropTemplate,
  SampleRaterTemplate,
  ScriptNotationTemplate,
  DropDownTemplate,
} from "../Templates.jsx";

const formatWorkshopDate = (datetime) => {
  try {
    return format(new Date(datetime), "EEEE 'at' h:mm a | MM-dd-yyyy");
  } catch {
    return String(datetime || "");
  }
};

/**
 * HomepageModuleRunner
 *
 * A self-contained "flash player frame" that lets anonymous visitors run
 * through all open prompts in one upcoming workshop.
 *
 * Three phases:
 *   1. Workshop landing  – info card + module list + "Respond" button
 *   2. Prompt runner     – one prompt at a time, local progress, module edges
 *   3. Save & account    – email capture → batch POST or navigate to /register
 *
 * Props:
 *   currentWorkshop  – { workshopId, workshopName, workshopDescription, workshopDate, hasWorkshopLocation }
 *   openModules      – [{ moduleId, moduleName, prompts: [{ promptId, templateId, options, reference }] }]
 */
export function HomepageModuleRunner({ currentWorkshop, openModules, guestToken }) {
  const navigate = useNavigate();
  const { show } = useOverlay();

  // --- Phase management ---
  const [phase, setPhase] = useState("landing"); // 'landing' | 'running' | 'edge' | 'save' | 'finishing' | 'earned'

  // --- Module / prompt tracking ---
  const [moduleIndex, setModuleIndex] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [promptMode, setPromptMode] = useState("edit"); // 'edit' | 'view'
  const [isReviewing, setIsReviewing] = useState(false);

  // --- Response state ---
  const [responseData, setResponseData] = useState([]);
  const storageKey = currentWorkshop?.workshopId ? previewStorageKey(currentWorkshop.workshopId) : null;
  const [allResponses, setAllResponses] = useState(() => readPreviewResponses(currentWorkshop?.workshopId, openModules));
  const [serverResponses, setServerResponses] = useState({});
  const [activeGuestToken, setActiveGuestToken] = useState(null);
  const [guestProgressLoading, setGuestProgressLoading] = useState(Boolean(guestToken));
  const [guestLinkError, setGuestLinkError] = useState("");
  const [linkRequestEmail, setLinkRequestEmail] = useState("");
  const [linkRequestStatus, setLinkRequestStatus] = useState("");
  const [showLinkRequest, setShowLinkRequest] = useState(false);

  // --- Save phase state ---
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [saveStatus, setSaveStatus] = useState(null); // null | 'saving' | 'created' | 'appended' | 'existing_user' | 'error'
  const [savedCount, setSavedCount] = useState(0);
  const [rsvpEarned, setRsvpEarned] = useState(false);

  // Derived values
  const currentModule = openModules[moduleIndex] || null;
  const prompts = currentModule?.prompts || [];
  const currentPrompt = prompts[promptIndex] || null;
  const totalPrompts = prompts.length;

  useEffect(() => {
    if (!storageKey || typeof window === "undefined") return;

    try {
      if (Object.keys(allResponses).length) {
        window.localStorage.setItem(storageKey, JSON.stringify(allResponses));
      } else {
        window.localStorage.removeItem(storageKey);
      }
    } catch (err) {
      console.warn("Unable to store homepage preview responses:", err);
    }
  }, [allResponses, storageKey]);

  useEffect(() => {
    if (!guestToken) return;
    let cancelled = false;
    axios.post(`${import.meta.env.VITE_API_URL}/homepage/guest-progress`, { guestToken })
      .then(({ data }) => {
        if (cancelled) return;
        if (Number(data.workshopId) !== Number(currentWorkshop.workshopId)) {
          setGuestLinkError("This link belongs to a different workshop.");
          return;
        }
        const allowed = new Map(openModules.flatMap((module) => module.prompts.map((prompt) => [
          promptStorageKey(module.moduleId, prompt.promptId), Number(prompt.templateId),
        ])));
        const restored = {};
        for (const response of data.responses) {
          const key = promptStorageKey(response.moduleId, response.promptId);
          if (allowed.get(key) === Number(response.templateId)) restored[key] = response;
        }
        setServerResponses(restored);
        setEmail(data.email);
        setRsvpEarned(Boolean(data.rsvpEarned));
        setActiveGuestToken(guestToken);
      })
      .catch(() => {
        if (!cancelled) setGuestLinkError("This continuation link is unavailable. Request a fresh link below.");
      })
      .finally(() => { if (!cancelled) setGuestProgressLoading(false); });
    return () => { cancelled = true; };
  }, [guestToken, currentWorkshop.workshopId, openModules]);

  const getStoredResponse = (module, prompt) => {
    if (!module || !prompt) return null;
    const key = promptStorageKey(module.moduleId, prompt.promptId);
    return serverResponses[key] || allResponses[key] || null;
  };

  const hasResponse = (module, prompt) => Boolean(getStoredResponse(module, prompt));
  const getModuleProgress = (module) => moduleProgress(module, hasResponse);

  const findNextModuleIndex = () => nextUnansweredModuleIndex(openModules, hasResponse);

  // Count how many prompts in the current module have saved responses
  const answeredInModule = currentModule
    ? currentModule.prompts.filter((p) => getStoredResponse(currentModule, p)).length
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
    const nextModule = openModules[mIdx];
    const nextIdx = nextUnansweredPromptIndex(nextModule, hasResponse);
    const promptIdx = nextIdx >= 0 ? nextIdx : 0;
    const firstPrompt = nextModule?.prompts?.[promptIdx];
    const existing = getStoredResponse(nextModule, firstPrompt);

    setModuleIndex(mIdx);
    setIsReviewing(false);
    setPromptIndex(promptIdx);
    setPromptMode(existing ? "view" : "edit");
    setResponseData(existing?.content ?? initResponseData(firstPrompt));
    setPhase("running");
  };

  const startReview = (mIdx) => {
    const module = openModules[mIdx];
    const firstPrompt = module?.prompts?.[0];
    const saved = getStoredResponse(module, firstPrompt);
    if (!saved) return;
    setModuleIndex(mIdx);
    setPromptIndex(0);
    setPromptMode("view");
    setResponseData(saved.content);
    setIsReviewing(true);
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

    const nextResponses = {
      ...allResponses,
      [promptStorageKey(currentModule.moduleId, currentPrompt.promptId)]: {
        moduleId: currentModule.moduleId,
        promptId: currentPrompt.promptId,
        templateId: currentPrompt.templateId,
        content: responseData,
      },
    };
    setAllResponses(nextResponses);

    const allAvailableAnswered = allAvailablePromptsAnswered(openModules, (module, prompt) => {
      const key = promptStorageKey(module.moduleId, prompt.promptId);
      return Boolean(serverResponses[key] || nextResponses[key]);
    });
    if (activeGuestToken && allAvailableAnswered) {
      await saveResponses({ responsesMap: nextResponses, finish: true });
    } else {
      setPromptMode("view");
    }
  };

  // ────────────────────────────────────────────
  // Navigate to next prompt or module edge
  // ────────────────────────────────────────────
  const handleNext = () => {
    if (isReviewing) {
      if (promptIndex >= totalPrompts - 1) {
        setIsReviewing(false);
        setPhase("landing");
        return;
      }
      const nextPrompt = prompts[promptIndex + 1];
      setPromptIndex(promptIndex + 1);
      setResponseData(getStoredResponse(currentModule, nextPrompt)?.content ?? initResponseData(nextPrompt));
      return;
    }

    const nextIdx = prompts.findIndex((prompt, index) => index > promptIndex && !getStoredResponse(currentModule, prompt));
    if (nextIdx >= 0) {
      setPromptIndex(nextIdx);
      setPromptMode("edit");
      setResponseData(initResponseData(prompts[nextIdx]));
    } else {
      if (findNextModuleIndex() >= 0) {
        setPhase("edge");
      } else {
        setPhase(rsvpEarned ? "earned" : "save");
      }
    }
  };

  const handleBack = () => {
    if (isReviewing && promptIndex === 0) {
      setIsReviewing(false);
      setPhase("landing");
      return;
    }
    if (promptIndex > 0) {
      const prevIdx = promptIndex - 1;
      setPromptIndex(prevIdx);
      const prevPrompt = prompts[prevIdx];
      const existing = getStoredResponse(currentModule, prevPrompt);
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
    const nextMIdx = findNextModuleIndex();
    setSaveStatus(null);
    if (nextMIdx >= 0) startRunning(nextMIdx);
    else setPhase(rsvpEarned ? "earned" : "save");
  };

  // ────────────────────────────────────────────
  // Batch save via email
  // ────────────────────────────────────────────
  const saveResponses = async ({ responsesMap = allResponses, finish = false } = {}) => {
    const error = activeGuestToken ? "" : validateEmail(email);
    if (error) {
      setEmailError(error);
      return;
    }
    setEmailError("");
    setSaveStatus("saving");
    if (finish) setPhase("finishing");

    const responses = Object.values(responsesMap);
    if (responses.length === 0) {
      setPhase(rsvpEarned ? "earned" : "save");
      setSaveStatus(rsvpEarned ? "appended" : "awaiting_modules");
      return;
    }
    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/homepage/responses`, {
        ...(activeGuestToken ? { guestToken: activeGuestToken } : { email: email.trim() }),
        workshopId: currentWorkshop.workshopId,
        responses,
      });

      const { status, userId, savedPromptIds = [], skippedPromptIds = [] } = res.data;
      const earned = Boolean(res.data.rsvpEarned || rsvpEarned);
      setRsvpEarned(earned);
      setSavedCount(savedPromptIds.length);
      setSaveStatus(finish && !earned ? "awaiting_modules" : skippedPromptIds.length ? "existing_guest_response" : status);
      if (status === "created" || status === "appended") {
        const savedIds = new Set(savedPromptIds.map(Number));
        const clearedIds = activeGuestToken
          ? new Set([...savedIds, ...skippedPromptIds.map(Number)])
          : savedIds;
        if (activeGuestToken) {
          setServerResponses((previous) => ({ ...previous, ...Object.fromEntries(
            Object.entries(responsesMap).filter(([, response]) => savedIds.has(response.promptId))
          ) }));
        }
        const savedKeys = Object.keys(responsesMap).filter((key) => clearedIds.has(responsesMap[key].promptId));
        removePreviewResponses(currentWorkshop.workshopId, savedKeys);
        setAllResponses((previous) => Object.fromEntries(
          Object.entries(previous).filter(([, response]) => !clearedIds.has(response.promptId))
        ));
      }
      if (userId) {
        sessionStorage.setItem("guestEmail", email.trim());
      }
      if (finish) setPhase(earned ? "earned" : "save");
    } catch (err) {
      console.error("Save error:", err);
      if (finish) {
        setPhase("finishingError");
      } else {
        const classification = classifyError(err);
        show(<ErrorOverlay classification={classification} />);
      }
      setSaveStatus("error");
    }
  };

  const handleSaveWithEmail = () => saveResponses();

  // ────────────────────────────────────────────
  // Stash responses and navigate to full registration
  // ────────────────────────────────────────────
  const handleCreateAccount = () => {
    if (email.trim()) {
      sessionStorage.setItem("guestEmail", email.trim());
    }
    const params = new URLSearchParams({ previewWorkshopId: String(currentWorkshop.workshopId) });
    if (activeGuestToken) params.set("guestToken", activeGuestToken);
    navigate(`/register?${params}`);
  };

  const requestFreshLink = async () => {
    const error = validateEmail(linkRequestEmail);
    if (error) { setLinkRequestStatus(error); return; }
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/homepage/guest-link`, {
        email: linkRequestEmail.trim(), workshopId: currentWorkshop.workshopId,
      });
      setLinkRequestStatus("If this email has saved workshop work, a fresh link is on its way.");
    } catch {
      setLinkRequestStatus("Could not request a new link. Please try again later.");
    }
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
    const hasDate = Boolean(ws.workshopDate);
    const hasLockedLocation = Boolean(ws.hasWorkshopLocation);

    return (
      <div className="homepageRunnerFrame">
        <div className="homepageRunnerContent">
          <Heading1 text={ws.workshopName} />
          {ws.workshopDescription && <Heading2 text={ws.workshopDescription} />}

          {(hasDate || hasLockedLocation) && (
            <div className="homepageRunnerMeta">
              {hasDate && (
                <div className="homepageRunnerMetaItem homepageRunnerDateMeta">
                  <Calendar size={16} strokeWidth={1.8} aria-hidden="true" />
                  <span>{formatWorkshopDate(ws.workshopDate)}</span>
                </div>
              )}
              {hasLockedLocation && (
                <LockedTooltip
                  className="homepageRunnerLocationTooltip"
                  interactive
                  message={(
                    <span>
                      <Link to="/register" className="lockedTooltipRegisterLink">Register</Link>
                      {" to view location"}
                    </span>
                  )}
                >
                  <div
                    className="homepageRunnerMetaItem homepageRunnerLocationMeta"
                    tabIndex={0}
                    aria-label="Workshop location available after registration"
                  >
                    <MapPin size={16} strokeWidth={1.8} aria-hidden="true" />
                    <Lock size={14} strokeWidth={1.8} aria-hidden="true" />
                  </div>
                </LockedTooltip>
              )}
            </div>
          )}

          {openModules.length > 0 && (
            <div className="homepageRunnerModules">
              {openModules.map((mod, index) => {
                const progress = getModuleProgress(mod);
                return (
                  <div key={mod.moduleId} className={`homepageRunnerModuleItem${progress.complete ? " homepageRunnerModuleItem--completed" : ""}`}>
                    <span className="homepageRunnerModuleName">{mod.moduleName}</span>
                    <span className="homepageRunnerModuleMeta">
                      <span className="homepageRunnerModuleCount">
                        {progress.complete ? <><Check size={16} strokeWidth={2} aria-hidden="true" /> Completed</> : `${progress.left} prompt${progress.left !== 1 ? "s" : ""} left`}
                      </span>
                      {progress.complete && (
                        <button type="button" className="homepageRunnerReviewButton" onClick={() => startReview(index)} title={`Review answers for ${mod.moduleName}`} aria-label={`Review answers for ${mod.moduleName}`}>
                          <Eye size={18} strokeWidth={1.8} aria-hidden="true" />
                        </button>
                      )}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="homepageRunnerLandingCTA">
            {guestProgressLoading ? <p className="homepageRunnerFinePrint">Loading saved responses...</p> : (
              <>
                {findNextModuleIndex() >= 0 ? (
                  <>
                    <NextButton text={Object.keys(serverResponses).length || Object.keys(allResponses).length ? "Continue Responding" : "Respond"} onClick={() => startRunning(findNextModuleIndex())} />
                    {activeGuestToken && <NextButton text="Create Full Account" onClick={handleCreateAccount} />}
                  </>
                ) : rsvpEarned ? (
                  <NextButton text="Join Workshop" onClick={handleCreateAccount} />
                ) : (
                  <NextButton text="Finish Workshop" onClick={() => activeGuestToken ? saveResponses({ finish: true }) : setPhase("save")} />
                )}
              </>
            )}
            {!activeGuestToken && !guestProgressLoading && (
              <NextButton text="Resume Saved Work" onClick={() => setShowLinkRequest((shown) => !shown)} />
            )}
            {(showLinkRequest || guestLinkError) && (
              <div className="homepageEmailCapture">
                <p className="homepageRunnerFinePrint">{guestLinkError || "We can email a secure link to your saved workshop work."}</p>
                <input className="textInput" type="email" placeholder="Your email" value={linkRequestEmail} onChange={(event) => setLinkRequestEmail(event.target.value)} />
                <NextButton text="Send Fresh Link" onClick={requestFreshLink} />
                {linkRequestStatus && <p className="homepageRunnerFinePrint">{linkRequestStatus}</p>}
              </div>
            )}
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
          <span className="homepageRunnerModuleLabel">{isReviewing ? `Review: ${currentModule?.moduleName}` : currentModule?.moduleName}</span>
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
          {(promptIndex > 0 || isReviewing) && (
            <NextButton text="Back" onClick={handleBack} />
          )}
          <NextButton
            text={isReviewing && promptIndex === totalPrompts - 1 ? "Done" : promptMode === "edit" ? "Submit" : "Next"}
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
    const remaining = openModules.filter((module) => getModuleProgress(module).left > 0).length;
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

  if (phase === "finishing") {
    return <div className="homepageRunnerFrame"><div className="homepageRunnerContent homepageRunnerFinalState"><Heading1 text="Saving your answers..." /></div></div>;
  }

  if (phase === "finishingError") {
    return (
      <div className="homepageRunnerFrame"><div className="homepageRunnerContent homepageRunnerFinalState">
        <Heading1 text="Your answers need another try" />
        <NextButton text="Retry Save" onClick={() => saveResponses({ finish: true })} />
      </div></div>
    );
  }

  if (phase === "earned") {
    return (
      <div className="homepageRunnerFrame"><div className="homepageRunnerContent homepageRunnerFinalState">
        <Heading1 text="You earned an RSVP!" />
        <NextButton text="Join Workshop" onClick={handleCreateAccount} />
      </div></div>
    );
  }

  // --- Phase 3: Save & Account ---
  if (phase === "save") {
    const hasRemainingModules = findNextModuleIndex() >= 0;
    const hasUnsavedResponses = Object.keys(allResponses).length > 0;
    const saveHeading = (() => {
      if (saveStatus === "saving") return "Saving Responses";
      if (saveStatus === "created" || saveStatus === "appended") return "Responses Saved";
      if (saveStatus === "existing_user") return "Log In to Save Responses";
      if (saveStatus === "existing_guest_response") return "Some Responses Already Saved";
      if (saveStatus === "error") return "Try Saving Again";
      if (saveStatus === "awaiting_modules") return "Answers Saved";
      return hasUnsavedResponses ? "Save Responses" : "Responses Saved";
    })();

    return (
      <div className="homepageRunnerFrame">
        <div className="homepageRunnerContent">
          <Heading1 text={saveHeading} />
          {saveStatus === null && hasUnsavedResponses && <Heading2 text="Save your responses to continue this workshop." />}
          {saveStatus === "awaiting_modules" ? (
            <p className="homepageRunnerFinePrint">Your answers are saved. An RSVP unlocks when all required modules are complete.</p>
          ) : <p className="homepageRunnerFinePrint">An RSVP unlocks after all required modules are complete.</p>}

          {(saveStatus === null || saveStatus === "saving") && hasUnsavedResponses ? (
            <div className="homepageEmailCapture">
              {!activeGuestToken && <input
                className={`textInput ${emailError ? 'textInputError' : ''}`}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailError) setEmailError(""); }}
                disabled={saveStatus === "saving"}
              />}
              {emailError && <p className="registrationError">{emailError}</p>}
              <div className="homepageRunnerNav">
                <NextButton
                  text={saveStatus === "saving" ? "Saving…" : activeGuestToken ? "Save Responses" : "Save with Email"}
                  onClick={handleSaveWithEmail}
                  disabled={saveStatus === "saving"}
                />
                <NextButton text="Create Full Account" onClick={handleCreateAccount} />
              </div>
            </div>
          ) : (
            <div className="homepageEmailCapture">
              {!hasUnsavedResponses && saveStatus === null && (
                <div className="homepageRunnerNav">
                  {activeGuestToken ? <NextButton text="Create Full Account" onClick={handleCreateAccount} /> : <p className="homepageRunnerFinePrint">Use your emailed link to continue saved work.</p>}
                </div>
              )}
              {saveStatus === "existing_user" && (
                <div className="homepageRunnerNav">
                  <NextButton text="Log In" onClick={() => navigate("/login")} />
                </div>
              )}
              {saveStatus === "existing_guest_response" && (
                <>
                  <p className="homepageRunnerFinePrint">{savedCount ? "New answers were saved. " : "No new answers were saved. "}{activeGuestToken ? "Earlier answers are already saved to your guest record." : "Earlier answers remain on this device; use your emailed link to review them."}</p>
                  <div className="homepageRunnerNav">
                    {hasRemainingModules && <NextButton text="Continue Responding" onClick={goToNextModule} />}
                    {activeGuestToken ? <NextButton text="Create Full Account" onClick={handleCreateAccount} /> : <p className="homepageRunnerFinePrint">Use the link in your email to create your account.</p>}
                  </div>
                </>
              )}
              {(saveStatus === "created" || saveStatus === "appended") && (
                <div className="homepageRunnerNav">
                  {hasRemainingModules && (
                    <NextButton text="Continue Responding" onClick={goToNextModule} />
                  )}
                  {activeGuestToken ? <NextButton text="Create Full Account" onClick={handleCreateAccount} /> : <p className="homepageRunnerFinePrint">Use the link in your email to create your account.</p>}
                </div>
              )}
              {saveStatus === "error" && (
                <div className="homepageRunnerNav">
                  <NextButton text="Try Again" onClick={() => setSaveStatus(null)} />
                </div>
              )}
              {saveStatus === "awaiting_modules" && (
                <div className="homepageRunnerNav">
                  {activeGuestToken && <NextButton text="Create Full Account" onClick={handleCreateAccount} />}
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
