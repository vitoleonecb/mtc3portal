import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import axios from "axios";
import { Eye, Lock } from "lucide-react";

import { Heading1, Heading2 } from "../Headings.jsx";
import { NextButton } from "../Buttons.jsx";
import { TypewriterTicker } from "../components/TypewriterTicker.jsx";
import { InteractiveButtonWall } from "../components/InteractiveButtonWall.jsx";
import { DescriptionTabs } from "../components/DescriptionTabs.jsx";
import { HomepageModuleRunner } from "../components/HomepageModuleRunner.jsx";
import { validateEmail } from "../utils/validation.js";
import { ResponseProcessor } from "../Processing.jsx";
import { LockedTooltip } from "../components/ui/locked-tooltip.jsx";

import { GlowingBarVerticalChart } from "../components/ui/glowing-bar-vertical-chart.jsx";
import { GlowingLineChart } from "../LineChartExample.jsx";

function PublicAnalysisLock({ title }) {
  return (
    <section className="publicAnalysisLockedSection" aria-label={`${title} requires an account`}>
      <h2>{title}</h2>
      <LockedTooltip
        className="publicAnalysisLockTooltip"
        interactive
        message={(
          <span>
            <Link to="/register" className="lockedTooltipRegisterLink">Register</Link>
            {" or "}
            <Link to="/login" className="lockedTooltipRegisterLink">log in</Link>
            {" to view this analysis."}
          </span>
        )}
      >
        <button type="button" className="publicAnalysisLockButton" aria-label={`${title} locked. Register or log in to view.`}>
          <Lock size={36} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </LockedTooltip>
    </section>
  );
}

function PublicModulePreview({ currentWorkshop, modules, isUnregistered }) {
  const [selectedModuleId, setSelectedModuleId] = useState(modules[0]?.moduleId ?? null);
  const selectedModule = modules.find((module) => module.moduleId === selectedModuleId) || modules[0] || null;
  const [selectedPromptId, setSelectedPromptId] = useState(selectedModule?.prompts?.[0]?.promptId ?? null);

  if (!currentWorkshop || modules.length === 0) return null;

  const activeModule = modules.find((module) => module.moduleId === selectedModuleId) || modules[0];
  const activePrompts = activeModule?.prompts || [];
  const activePrompt = activePrompts.find((prompt) => prompt.promptId === selectedPromptId) || activePrompts[0] || null;
  const dotColor = activeModule?.moduleStatus === "completed"
    ? "rgb(153, 66, 66)"
    : "rgb(210, 164, 120)";
  const isArchivedWorkshop = currentWorkshop.workshopDate && new Date(currentWorkshop.workshopDate) < new Date();
  const showAnalysisLocks = isUnregistered && (isArchivedWorkshop || activeModule?.moduleStatus === "completed");

  const chooseModule = (module) => {
    setSelectedModuleId(module.moduleId);
    setSelectedPromptId(module.prompts?.[0]?.promptId ?? null);
  };

  return (
    <div className="homepageRunnerFrame publicModulePreviewFrame">
      <div className="homepageRunnerContent">
        <Heading2 text={currentWorkshop.workshopName} />
        {currentWorkshop.workshopDescription && (
          <p className="homepageFeaturedCTA">{currentWorkshop.workshopDescription}</p>
        )}

        <div className="publicModulePreviewList">
          {modules.map((module) => (
            <button
              key={module.moduleId}
              type="button"
              className={`publicModulePreviewModule publicModulePreviewModule--${module.moduleStatus} ${activeModule?.moduleId === module.moduleId ? "publicModulePreviewModule--active" : ""}`}
              onClick={() => chooseModule(module)}
            >
              <span className="publicModulePreviewHeader">
                <span className="homepageRunnerModuleName">{module.moduleName}</span>
                <span className="publicModulePreviewMeta">
                  <span className={`publicModuleStatus publicModuleStatus--${module.moduleStatus}`}>
                    {module.moduleStatus}
                  </span>
                  <Eye size={18} strokeWidth={1.8} aria-hidden="true" />
                </span>
              </span>
            </button>
          ))}
        </div>

        {activePrompts.length > 1 && (
          <div className="publicPromptPreviewTabs">
            {activePrompts.map((prompt, index) => (
              <button
                key={prompt.promptId}
                type="button"
                className={`publicPromptPreviewTab ${activePrompt?.promptId === prompt.promptId ? "publicPromptPreviewTab--active" : ""}`}
                onClick={() => setSelectedPromptId(prompt.promptId)}
              >
                {index + 1}
              </button>
            ))}
          </div>
        )}

        {activeModule?.moduleStatus === "open" ? (
          <p className="homepageRunnerFinePrint">
            {isArchivedWorkshop
              ? "This workshop has ended. Responses are closed."
              : "This module is open. Community results are not public yet."}
          </p>
        ) : activePrompt ? (
          <div className="publicPromptPreviewProcessor">
            <ResponseProcessor
              promptId={activePrompt.promptId}
              allResponses={[]}
              templateId={activePrompt.templateId}
              isAdmin={false}
              promptOptions={activePrompt.options}
              dotColor={dotColor}
              publicPreview
              publicResponseCount={activePrompt.responses?.length || 0}
              publicAnalyticsData={activePrompt.analytics}
              redactIdentity
            />
            {activePrompt.responses?.length > 0 && (
              <div className="publicResponsePreviewList">
                {activePrompt.responses.map((response, index) => (
                  <p key={`${activePrompt.promptId}-${index}`} className="publicResponsePreview">
                    {response.text}
                  </p>
                ))}
              </div>
            )}
            {showAnalysisLocks && (
              <div className="publicAnalysisLocks">
                <PublicAnalysisLock title="Admin Analysis" />
                <PublicAnalysisLock title="AI Analysis" />
              </div>
            )}
          </div>
        ) : (
          <p className="homepageRunnerFinePrint">
            Community responses are being reviewed.
          </p>
        )}

        <div className="homepageCTAs">
          <Link to="/showcases" className="linkNoUnderLine cardLink">
            <NextButton text="Browse Showcases" />
          </Link>
        </div>
      </div>
    </div>
  );
}

export function HomePage() {
  const [searchParams] = useSearchParams();
  const selectedWorkshopId = searchParams.get("workshopId");
  const guestToken = searchParams.get("guestToken");
  const isSelectedPreview = Boolean(selectedWorkshopId);
  const [feed, setFeed] = useState(null);
  const [feedError, setFeedError] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isGuest, setIsGuest] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notifyError, setNotifyError] = useState("");
  const [notifyStatus, setNotifyStatus] = useState(null);
  const [notifyMessage, setNotifyMessage] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    setIsLoggedIn(!!token);
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setIsGuest(decoded?.user_type === "guest");
      } catch {
        setIsGuest(false);
      }
    } else {
      setIsGuest(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    const fetchFeed = async () => {
      setFeed(null);
      setFeedError(false);
      setLoading(true);
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/homepage/feed`,
          { params: selectedWorkshopId ? { workshopId: selectedWorkshopId } : undefined }
        );
        if (!cancelled) setFeed(res.data);
      } catch (err) {
        console.error("Homepage feed error:", err);
        if (!cancelled) setFeedError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFeed();
    return () => { cancelled = true; };
  }, [selectedWorkshopId]);

  const stats = feed?.communityStats;
  const currentWorkshop = feed?.currentWorkshop;
  const openModules = feed?.openModules || [];
  const publicPreviewModules = feed?.publicPreviewModules || [];
  const firstPromptPath = feed?.firstPromptPath;
  const analytics = feed?.sampleAnalytics;
  const hasOpenModules = currentWorkshop && openModules.length > 0;
  const hasPublicPreviewModules = currentWorkshop && publicPreviewModules.length > 0;
  const hasPublicWorkshop = hasOpenModules || hasPublicPreviewModules;

  const handleModuleNotify = async () => {
    const error = validateEmail(notifyEmail);
    if (error) {
      setNotifyError(error);
      return;
    }

    setNotifyError("");
    setNotifyStatus("saving");
    setNotifyMessage("");

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/homepage/module-open-notify`,
        { email: notifyEmail.trim() }
      );
      setNotifyStatus(res.data.status);
      setNotifyMessage(res.data.message);
    } catch (err) {
      setNotifyStatus("error");
      setNotifyMessage(err?.response?.data?.error || "Could not save that email. Please try again.");
    }
  };

  return (
    <>
      {/* =========== SECTION A: Hero + Module Runner or Workshop CTA =========== */}
      <section id="workshop-preview" className="homepageSection homepageHero">
        <Heading1
          text="Machine Theater Collective"
          style={{ textAlign: "center" }}
        />
        <Heading2 text="A theater company powered by imagination and software." />

        {/* Community stats */}
        {stats && (
          <div className="homepageStats">
            <div className="homepageStat">
              <span className="homepageStatNumber">{stats.totalResponses}</span>
              <span className="homepageStatLabel">Responses</span>
            </div>
            <div className="homepageStat">
              <span className="homepageStatNumber">{stats.totalUsers}</span>
              <span className="homepageStatLabel">Members</span>
            </div>
            <div className="homepageStat">
              <span className="homepageStatNumber">{stats.totalWorkshops}</span>
              <span className="homepageStatLabel">Workshops</span>
            </div>
          </div>
        )}

        {/* Logged-in (non-guest): show workshop CTA card */}
        {hasOpenModules && isLoggedIn && !isGuest && (
          <div className="homepageLoggedInCTA">
            <Heading2 text={currentWorkshop.workshopName} />
            {currentWorkshop.workshopDescription && (
              <p className="homepageFeaturedCTA">{currentWorkshop.workshopDescription}</p>
            )}
            <div className="homepageCTAs">
              <Link to={firstPromptPath || `/showcases`} className="linkNoUnderLine cardLink">
                <NextButton text="Continue in Workshop" />
              </Link>
            </div>
          </div>
        )}

        {/* Not logged in (or guest): show the module runner frame */}
        {hasOpenModules && (!isLoggedIn || isGuest) && (
          <HomepageModuleRunner
            key={currentWorkshop.workshopId}
            currentWorkshop={currentWorkshop}
            openModules={openModules}
            guestToken={guestToken}
          />
        )}
        {hasPublicPreviewModules && (isSelectedPreview || !isLoggedIn || isGuest) && (
          <PublicModulePreview
            key={currentWorkshop.workshopId}
            currentWorkshop={currentWorkshop}
            modules={publicPreviewModules}
            isUnregistered={!isLoggedIn || isGuest}
          />
        )}
        {!loading && isSelectedPreview && feedError && (
          <div className="homepageLoggedInCTA">
            <Heading2 text="Workshop preview unavailable" />
            <Link to="/showcases" className="linkNoUnderLine cardLink">
              <NextButton text="Browse Showcases" />
            </Link>
          </div>
        )}
        {!loading && !isSelectedPreview && !hasPublicWorkshop && (!isLoggedIn || isGuest) && (
          <div className="homepageLoggedInCTA">
            <Heading2 text={currentWorkshop ? `${currentWorkshop.workshopName} is coming soon` : "New workshop coming soon"} />
            {notifyStatus === "created" || notifyStatus === "updated" ? (
              <p className="homepageFeaturedCTA">{notifyMessage}</p>
            ) : notifyStatus === "existing_user" ? (
              <>
                <p className="homepageFeaturedCTA">{notifyMessage}</p>
                <div className="homepageCTAs">
                  <Link to="login" className="linkNoUnderLine cardLink">
                    <NextButton text="Log In" />
                  </Link>
                </div>
              </>
            ) : (
              <div className="homepageNotifyCapture">
                <input
                  className={`textInput ${notifyError ? "textInputError" : ""}`}
                  type="email"
                  placeholder="Email for module updates"
                  value={notifyEmail}
                  onChange={(event) => {
                    setNotifyEmail(event.target.value);
                    if (notifyError) setNotifyError("");
                    if (notifyStatus === "error") {
                      setNotifyStatus(null);
                      setNotifyMessage("");
                    }
                  }}
                />
                {notifyError && <p className="formInlineError">{notifyError}</p>}
                {notifyStatus === "error" && <p className="formInlineError">{notifyMessage}</p>}
                <div className="homepageCTAs">
                  <NextButton
                    text={notifyStatus === "saving" ? "Saving..." : "Notify Me"}
                    onClick={handleModuleNotify}
                    disabled={notifyStatus === "saving"}
                  />
                </div>
              </div>
            )}
          </div>
        )}
        {/* Login / Sign Up CTAs shown when user is not fully registered */}
        {(!isLoggedIn || isGuest || !hasPublicWorkshop) && (
          <div className="homepageCTAs">
            <Link to="login" className="linkNoUnderLine cardLink">
              <NextButton text="Log In" />
            </Link>
            <Link to="register" className="linkNoUnderLine cardLink">
              <NextButton text="Sign Up" />
            </Link>
          </div>
        )}
      </section>

      {/* =========== SECTION B: Typewriter Response Ticker =========== */}
      {feed?.recentResponses?.length > 0 && (
        <section className="homepageSection">
          <TypewriterTicker responses={feed.recentResponses} />
        </section>
      )}

      {/* =========== SECTION C: Interactive Button Wall =========== */}
      <section className="homepageSection">
        <Heading1 text="Explore the Toolkit" />
        <Heading2 text="Every prompt is an opportunity to think differently." />
        <InteractiveButtonWall />
      </section>

      {/* =========== SECTION D: Description Tabs =========== */}
      <section className="homepageSection">
        <Heading1 text="How It Works" />
        <DescriptionTabs />
      </section>

      {/* =========== SECTION E: Live Analytics Showcase =========== */}
      {analytics && (
        <section className="homepageSection">
          <Heading1 text="Community in Data" />
          <Heading2 text="See how the collective thinks." />
          <div className="analyticsShowcase">
            <GlowingBarVerticalChart analyticsData={analytics} />
            <GlowingLineChart analyticsData={analytics} promptId={analytics.promptId} />
          </div>
          <div className="homepageCTAs" style={{ marginTop: 24 }}>
            <Link to="/showcases" className="linkNoUnderLine cardLink">
              <NextButton text="View Workshops" />
            </Link>
          </div>
        </section>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ textAlign: "center", padding: "4rem 0" }}>
          <Heading2 text="Loading community feed…" />
        </div>
      )}
    </>
  );
}
