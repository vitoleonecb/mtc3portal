import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import { Heading1, Heading2 } from "../Headings.jsx";
import { NextButton } from "../Buttons.jsx";
import { TypewriterTicker } from "../components/TypewriterTicker.jsx";
import { InteractiveButtonWall } from "../components/InteractiveButtonWall.jsx";
import { DescriptionTabs } from "../components/DescriptionTabs.jsx";
import { HomepageModuleRunner } from "../components/HomepageModuleRunner.jsx";

import { GlowingBarVerticalChart } from "../components/ui/glowing-bar-vertical-chart.jsx";
import { GlowingLineChart } from "../LineChartExample.jsx";

export function HomePage() {
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    setIsLoggedIn(!!localStorage.getItem('accessToken'));
  });

  useEffect(() => {
    let cancelled = false;
    const fetchFeed = async () => {
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/homepage/feed`
        );
        if (!cancelled) setFeed(res.data);
      } catch (err) {
        console.error("Homepage feed error:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchFeed();
    return () => { cancelled = true; };
  }, []);

  const stats = feed?.communityStats;
  const currentWorkshop = feed?.currentWorkshop;
  const openModules = feed?.openModules || [];
  const firstPromptPath = feed?.firstPromptPath;
  const analytics = feed?.sampleAnalytics;
  const hasWorkshop = currentWorkshop && openModules.length > 0;

  return (
    <>
      {/* =========== SECTION A: Hero + Module Runner or Workshop CTA =========== */}
      <section className="homepageSection homepageHero">
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

        {/* Logged-in: show workshop CTA card */}
        {hasWorkshop && isLoggedIn && (
          <div className="homepageLoggedInCTA">
            <Heading2 text={currentWorkshop.workshopName} />
            {currentWorkshop.workshopDescription && (
              <p className="homepageFeaturedCTA">{currentWorkshop.workshopDescription}</p>
            )}
            <div className="homepageCTAs">
              <Link to={firstPromptPath || `/workshops`} className="linkNoUnderLine cardLink">
                <NextButton text="Continue in Workshop" />
              </Link>
            </div>
          </div>
        )}

        {/* Not logged in: show the module runner frame */}
        {hasWorkshop && !isLoggedIn && (
          <HomepageModuleRunner
            currentWorkshop={currentWorkshop}
            openModules={openModules}
          />
        )}

        {/* Fallback CTAs when no workshop is open */}
        {!hasWorkshop && (
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
            <Link to="workshops" className="linkNoUnderLine cardLink">
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
