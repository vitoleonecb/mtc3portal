import { MenuBarIcon, DragAndDropKey, ProgressBar } from './Icons.jsx';
import { ModuleHeader } from './ModuleHeader.jsx';
import { ModuleEdge } from './EdgePages.jsx';
import { OpenResponse,
    ScriptSampleNotate,
    ScriptSampleRate,
    CheckBoxButton,
    ModuleNavigator,
    PendingButton,
    CompleteButton,
    OpenButton,
    ProcessingButton,
    MultipleChoiceGroup,
    ShortResponseArea,
    DragAndDropArea,
    MainNavCard,
    StarRater,
    LogInButton,
    NextButton,
    YesNoButton,
    WorkshopCard,
    CreateButton,
    DropDown } from './Buttons.jsx';
import { Heading1, Heading2, PromptInstruction, Completedheading, PendingHeading , OpenHeading , ProcessingHeading } from './Headings.jsx';
import React, { useRef, useState, useEffect, useContext, createContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Link, useParams, useNavigate, Outlet, useLocation, useMatch } from 'react-router-dom';
import { format } from 'date-fns';
import { DefaultBarChart } from './BarChartExample.jsx'
import { GlowingLineChart } from './LineChartExample.jsx';
import { GlowingBarVerticalChart } from "./components/ui/glowing-bar-vertical-chart.jsx";
  
import { RandomBackgroundLayer } from "./components/RandomBackgroundLayer";

export function ResponseProcessor({ promptId, allResponses, templateId, isAdmin }) {

  const [analyticsData, setAnalyticsData] = useState({});
  const [templateType, setTemplateType] = useState();
  const [isDragging, setIsDragging] = useState(false);

  const scrollerRef = useRef(null);
  const adminAnalysisRef = useRef(null);
  const dragStartXRef = useRef(0);
  const dragScrollLeftRef = useRef(0);
  const isDraggingRef = useRef(false);

  const accessToken = localStorage.getItem('accessToken');

  const safeResponses = Array.isArray(allResponses) ? allResponses : [];

  const [adminAnalysis, setAdminAnalysis] = useState("");
  const [adminAnalysisLoading, setAdminAnalysisLoading] = useState(false);
  const [adminAnalysisSaving, setAdminAnalysisSaving] = useState(false);
  const [adminAnalysisError, setAdminAnalysisError] = useState("");
  const [adminAnalysisSavedAt, setAdminAnalysisSavedAt] = useState(null);
  const [adminAnalysisLocked, setAdminAnalysisLocked] = useState(false);

  const visibleResponses = isAdmin
    ? safeResponses
    : safeResponses.filter(r => r.workshop_response_acceptance === 1);

  useEffect(() => {
    if (!isAdmin || !promptId) return;

    let cancelled = false;

    const fetchAdminAnalysis = async () => {
      setAdminAnalysisLoading(true);
      setAdminAnalysisError("");
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/analytics/admin-analysis/${promptId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (cancelled) return;

        const value = response.data?.adminAnalysis ?? "";
        const text = typeof value === "string" ? value : "";
        setAdminAnalysis(text);
        // If any non-empty analysis exists, lock the field (no further edits via UI)
        setAdminAnalysisLocked(text.trim().length > 0);
      } catch (error) {
        if (cancelled) return;

        // 404 -> treat as no existing analysis
        if (error?.response?.status === 404) {
          // No existing analysis; allow first-time entry.
          setAdminAnalysis("");
          setAdminAnalysisLocked(false);
        } else {
          console.error("Fetch admin analysis error:", error);
          setAdminAnalysisError("Could not load analysis.");
        }
      } finally {
        if (!cancelled) {
          setAdminAnalysisLoading(false);
        }
      }
    };

    fetchAdminAnalysis();

    return () => {
      cancelled = true;
    };
  }, [isAdmin, promptId, accessToken]);

  useEffect(() => {
    const textarea = adminAnalysisRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = textarea.scrollHeight + 'px';
  }, [adminAnalysis]);

  useEffect(() => {
    const fetchPromptAnalytics = async () => {
      const promptTemplateType = (() => {
        switch (templateId) {
          case 1: return 'multiplechoice';
          case 3: return 'checklist';
          case 6: return 'draganddrop';
          case 9: return 'dropdown';
          case 8: return 'notation';
          case 7: return 'samplerater';
          case 4: return 'shortresponse';
          default: return 'multiplechoice';
        }
      })();

      // Always record which template we are rendering charts for,
      // even if the analytics request fails.
      setTemplateType(promptTemplateType);

      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/analytics/${promptTemplateType}/${promptId}`,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
          }
        );
        console.log(`Analytics for Prompt (${promptTemplateType}): ${JSON.stringify(response.data)}`);

        setAnalyticsData(response.data || {});
      } catch (error) {
        console.log(`Front End Fetch Error for ${promptTemplateType}:`, error);
        setAnalyticsData({});
      }
    };

    if (promptId && templateId) {
      fetchPromptAnalytics();
    }
  }, [promptId, templateId, accessToken]);

  const chartsByTemplate = {
    multiplechoice: (
      <>
        <GlowingBarVerticalChart analyticsData={analyticsData} />
        <GlowingLineChart analyticsData={analyticsData} />
      </>
    ),

    checklist: (
      <>
        <DefaultBarChart analyticsData={analyticsData} />
        <GlowingLineChart analyticsData={analyticsData} />
      </>
    ),
  
    dropdown: (
      <>
        <GlowingLineChart analyticsData={analyticsData} />
      </>
    ),
  
    shortresponse: (
      <>
        <GlowingBarVerticalChart />
        <GlowingLineChart analyticsData={analyticsData} />
      </>
    ),
  
    draganddrop: (
      <GlowingLineChart analyticsData={analyticsData} />
    ),

    notation: (
      <GlowingLineChart analyticsData={analyticsData} />
    ),

    samplerater: (
      <>
        <div style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>
          <strong>Average Rating: </strong>
          {analyticsData && analyticsData.averageRating != null
            ? Number(analyticsData.averageRating).toFixed(1)
            : '—'}
        </div>
        <GlowingLineChart analyticsData={analyticsData} />
      </>
    ),

  };

  const handleHorizontalWheel = (e) => {
    if (!scrollerRef.current) return;
    
    // If vertical wheel movement is dominant (typical mouse wheel)
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      e.preventDefault();
      scrollerRef.current.scrollLeft += e.deltaY;
    }
    // Otherwise let native horizontal scrolling (trackpad) work naturally
  };

  const handlePointerDown = (e) => {
    // Enable click-and-drag only for mouse pointers so touch/trackpads behave natively
    if (e.pointerType !== 'mouse') return;
    if (!scrollerRef.current) return;

    isDraggingRef.current = true;
    setIsDragging(true);
    dragStartXRef.current = e.clientX;
    dragScrollLeftRef.current = scrollerRef.current.scrollLeft;
    scrollerRef.current.setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current || !scrollerRef.current) return;
    e.preventDefault();

     const speed = 2; // >1 = faster scrolling, <1 = slower
    const dx = e.clientX - dragStartXRef.current;
    scrollerRef.current.scrollLeft = dragScrollLeftRef.current - dx * speed;
  };

  const endDrag = (e) => {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    scrollerRef.current?.releasePointerCapture?.(e.pointerId);
  };

  const handleSaveAdminAnalysis = async () => {
    if (!isAdmin || !promptId) return;

    setAdminAnalysisSaving(true);
    setAdminAnalysisError("");

    try {
      await axios.put(
        `${import.meta.env.VITE_API_URL}/analytics/admin-analysis/${promptId}`,
        { adminAnalysis },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );
      setAdminAnalysisSavedAt(new Date());
      // Once saved successfully, prevent further edits/overwrites in the UI.
      setAdminAnalysisLocked(true);
    } catch (error) {
      console.error('Save admin analysis error:', error);
      setAdminAnalysisError(
        error?.response?.data?.message || 'Failed to save analysis.'
      );
    } finally {
      setAdminAnalysisSaving(false);
    }
  };

  return (
    <>
      <Heading1 text={visibleResponses.length > 0 ? "Community Responses" : "Community Responses Coming Soon"} />
      <div className="ProcessorContainer">
        {chartsByTemplate[templateType] ?? null}

        {isAdmin && (
          <div className="AdminAnalysisContainer">
            <h2 className="AdminAnalysisHeading">Admin Analysis</h2>
            <textarea
              ref={adminAnalysisRef}
              className={`OpenResponse AdminAnalysisTextarea ${(adminAnalysisSaving || adminAnalysisLocked) ? 'no_hover' : ''}`}
              value={adminAnalysis}
              onChange={(adminAnalysisSaving || adminAnalysisLocked) ? undefined : (e) => {
                setAdminAnalysis(e.target.value);
                if (adminAnalysisSavedAt) setAdminAnalysisSavedAt(null);
              }}
              readOnly={adminAnalysisLocked}
              placeholder="Enter your summary and analysis for this prompt..."
            />
            {!adminAnalysisLocked && (
              <div className="AdminAnalysisControls">
                <button
                  type="button"
                  onClick={handleSaveAdminAnalysis}
                  disabled={adminAnalysisSaving}
                  class="logInButton"
                >
                  {adminAnalysisSaving ? "Saving…" : "Save analysis"}
                </button>
                {adminAnalysisLoading && (
                  <span className="status-text" role="status">
                    Loading…
                  </span>
                )}
                {adminAnalysisError && (
                  <span className="error-text" role="status">
                    {adminAnalysisError}
                  </span>
                )}
                {!adminAnalysisError && adminAnalysisSavedAt && (
                  <span className="status-text" role="status">
                    Saved
                  </span>
                )}
              </div>
            )}
          </div>
        )}
        
        {/* Horizontal scroller for processor cards */}
        {visibleResponses.length > 0 && (
          <div 
            className={`ProcessorScroller${isDragging ? ' is-dragging' : ''}`} 
            ref={scrollerRef}
            onWheel={handleHorizontalWheel}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endDrag}
            onPointerLeave={endDrag}
          >
            {visibleResponses.map((r, i) => (
              <ProcessorCard
                key={r.workshop_response_id ?? i}
                name={`${r.first_name} ${r.last_name}`}
                username={r.username}
                response_content={r.workshop_response_content}
                templateId={templateId}
                isAdmin={isAdmin}
                responseId={r.workshop_response_id}
                initialAccepted={!!r.workshop_response_acceptance}
                accessToken={accessToken}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export function ProcessorCard({
  name,
  username,
  response_content,
  templateId,
  isAdmin,
  responseId,
  initialAccepted,
  accessToken
}) {
  const [accepted, setAccepted] = useState(Boolean(initialAccepted));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const showModeration = isAdmin && (templateId === 4 || templateId === 8);

  const updateAcceptance = async (nextAccepted) => {
    if (!responseId) return;
    setSaving(true);
    setError("");
    const prev = accepted;
    setAccepted(nextAccepted); // optimistic
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/workshops/${responseId}/response/acceptance`,
        { acceptance: nextAccepted },
        {headers: {'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}`}}
      );
    } catch (e) {
      setAccepted(prev); // rollback
      setError(e?.response?.data?.message || "Failed to update status.");
    } finally {
      setSaving(false);
    }
  };

  const renderContent = () => {
    switch (templateId) {
      case 3:
        return (
          <div>
            {response_content.map((q, qIdx) => (
              <div key={qIdx}>
                {q.questionText && (
                  <strong className="QuestionProcessing">
                    {"Question: " + q.questionText}
                  </strong>
                )}
                <ul>
                  {q.options?.map((opt, i) =>
                    opt.selected ? <li key={i}>{opt.optionText}</li> : null
                  )}
                </ul>
              </div>
            ))}
          </div>
        );

      case 1: {
        const items = (() => {
          if (Array.isArray(response_content)) return response_content;
          if (typeof response_content === "string") {
            try {
              const parsed = JSON.parse(response_content);
              return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              return [];
            }
          }
        return response_content ? [response_content] : [];
        })();

        const pickAnswer = (e) => {
          if (e?.answer != null && e.answer !== "") return e.answer;
          if (e?.optionLabel) return e.optionLabel;
          if (typeof e?.optionIndex === "number") return `Option #${e.optionIndex + 1}`;
          return "—";
        };

        return (
          <div>
            {items.map((entry, idx) => (
              <div key={idx}>
                <strong className="QuestionProcessing">
                  {entry?.questionText ?? `Question ${idx + 1}`}
                </strong>
                <p>{pickAnswer(entry)}</p>
              </div>
            ))}
          </div>
        );
      }

        case 6: {
          const items = (() => {
            if (Array.isArray(response_content)) return response_content;
            if (response_content && typeof response_content === "object")
              return [response_content];
            return [];
          })();

          const fmt = (v) =>
            v == null ? "—" : v <= 1 ? `${(v * 100).toFixed(0)}` : `${Math.round(v)}px`;

          const prettyFromKey = (k) => {
            if (!k) return "";
            const s = String(k).replace(/[-_]+/g, " ").trim();
            return s.charAt(0).toUpperCase() + s.slice(1);
          };

          return (
            <div>
              <strong className="QuestionProcessing">
                Dragged Items and Their Positions:
              </strong>
              <ul>
                {items
                  .filter((e) => e?.keyName && e.keyName !== "undefined")
                  .sort((a, b) => (a.position?.y ?? 0) - (b.position?.y ?? 0))
                  .map((e, idx) => {
                    const x = e.position?.x;
                    const y = e.position?.y;
                    const label = e.label ?? prettyFromKey(e.keyName);

                    return (
                      <li key={e.keyName ?? idx}>
                        {label} — Y: {fmt(y)}, X: {fmt(x)}
                      </li>
                    );
                  })}
              </ul>
            </div>
          );
        }


      case 9: {
        const items = (() => {
          if (Array.isArray(response_content)) return response_content;
          if (typeof response_content === "string") {
            try {
              const parsed = JSON.parse(response_content);
              return Array.isArray(parsed) ? parsed : [parsed];
            } catch {
              return [];
            }
          }
          return response_content ? [response_content] : [];
        })();
        return (
          <div>
            {items.map((e, idx) => (
              <div key={idx}>
                <strong className="QuestionProcessing">{e?.questionText}</strong>
                <p>{e?.answer}</p>
              </div>
            ))}
          </div>
        );
      }

      case 4:
        return (
          <div>
            {response_content.map((e, idx) => (
              <div key={idx}>
                <strong className="QuestionProcessing">{e.questionText}</strong>
                <p>{e.answer}</p>
              </div>
            ))}
          </div>
        );

      case 8:
        return (
          <div>
            <strong className="QuestionProcessing">Script Annotation:</strong>
            <p>{response_content.notationResponse}</p>
          </div>
        );

      case 7:
        return (
          <div>
            <strong className="QuestionProcessing">Rating:</strong>
            <p>{response_content.rating} / 5</p>
          </div>
        );

      default:
        return <p>Template type not yet supported.</p>;
    }
  };

  return (
    <div className="ProcessorResponseContainer">
      <div>
        <span style={{ display: "block" }} className="ButtonText">{"Name: " + name}</span>
        <span style={{ display: "block" }} className="ButtonText">{"Username: " + username}</span>

        {renderContent()}

        {showModeration && (
          <div className="AdminControls" style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              disabled={saving}
              aria-pressed={accepted}
              onClick={() => updateAcceptance(true)}
              className={initialAccepted === 1 ? "approvedButtonSelected": "approvedButtonDeselected"}
              title="Mark as accepted (kept for analysis)"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline points="3.25 9.5 7.5 14.5 14.75 3.25" stroke="black" fill="none" />
              </svg>

              {saving && accepted ? "Saving…" : "Accept"}
            </button>
            <button
              disabled={saving}
              aria-pressed={!accepted}
              onClick={() => updateAcceptance(false)}
              className={initialAccepted === 0 ? "declinedButtonSelected": "declinedButtonDeselected"}
              title="Mark as declined (excluded from analysis)"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="3.25" y1="3.25" x2="14.75" y2="14.75" stroke="black" />
                <line x1="14.75" y1="3.25" x2="3.25" y2="14.75" stroke="black" />
              </svg>

              {saving && !accepted ? "Saving…" : "Decline"}
            </button>
            {error && <span className="error-text" role="status">{error}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
