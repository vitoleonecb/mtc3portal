import { MenuBarIcon, DragAndDropKey, ProgressBar, AiSimilarityIcon } from './Icons.jsx';
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
    DropDown,
    useAutosizeTextArea } from './Buttons.jsx';
import { Heading1, Heading2, PromptInstruction, Completedheading, PendingHeading , OpenHeading , ProcessingHeading } from './Headings.jsx';
import React, { useRef, useState, useEffect, useContext, createContext } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { Link, useParams, useNavigate, Outlet, useLocation, useMatch } from 'react-router-dom';
import { format } from 'date-fns';
import { DefaultBarChart } from './BarChartExample.jsx'
import { GlowingLineChart } from './LineChartExample.jsx';
import { GlowingBarVerticalChart } from "./components/ui/glowing-bar-vertical-chart.jsx";
import { GlowingStrokeRadarChart } from "./components/ui/glowing-stroke-radar-chart.jsx";
import { AiWordBubbles } from "./components/ui/ai-word-bubbles.jsx";
import { AiSummarySections } from "./components/ui/ai-summary-sections.jsx";
  
import { RandomBackgroundLayer } from "./components/RandomBackgroundLayer";
import { BarChart, Bar, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { AnswerBar } from "./components/ui/glowing-bar-vertical-chart.jsx";

// Shared helpers for DnD token display
function prettyTokenLabel(key) {
  if (!key) return '';
  const s = String(key).replace(/[-_]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function buildTokenMeta(analyticsData, promptOptions) {
  const tokensObj = analyticsData?.tokens || {};
  const tokenKeys = Object.keys(tokensObj);
  if (!tokenKeys.length) {
    return { tokenKeys: [], labelsByKey: {}, colorsByKey: {} };
  }

  const baseColors = ["#994242", "#D2A478", "#57A15E", "#FFFFFF", "#000000", "#D9D9D9"];
  const fallbackColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)'];

  const dragOptions = promptOptions?.options || [];
  const safe = (s) =>
    (s || "")
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9\-]/g, "");

  const labelsByKey = {};
  const colorsByKey = {};

  tokenKeys.forEach((tokenKey, idx) => {
    const opt = dragOptions.find((opt, optIdx) => {
      const optKey = opt?.optionKey || `${safe(opt?.optionName) || 'item'}-${optIdx}`;
      return optKey === tokenKey;
    });

    const label = opt?.optionName || prettyTokenLabel(tokenKey);
    labelsByKey[tokenKey] = label;

    const colorIndex = opt ? dragOptions.indexOf(opt) : idx;
    const palette = opt ? baseColors : fallbackColors;
    colorsByKey[tokenKey] = palette[Math.abs(colorIndex) % palette.length];
  });

  return { tokenKeys, labelsByKey, colorsByKey };
}

function hexToRgba(hex, alpha) {
  if (!hex) return `rgba(0,0,0,${alpha})`;
  const match = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return `rgba(0,0,0,${alpha})`;
  const int = parseInt(match[1], 16);
  const r = (int >> 16) & 255;
  const g = (int >> 8) & 255;
  const b = int & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Layout-specific charts for drag-and-drop analytics
function DragAndDropZonesChart({ analyticsData }) {
  if (!analyticsData || analyticsData.mode !== 'zones' || !Array.isArray(analyticsData.zones)) return null;

  // Reuse the multiple-choice bar style: "answer" pill with text inside
  const chartData = analyticsData.zones.map((z) => ({
    answer: z.zoneLabel,
    count: z.count,
  }));

  const max = Math.max(...chartData.map((d) => d.count), 1);

  return (
    <Card>
      <CardDescription>Placements by Zone</CardDescription>
      <CardContent>
        <ChartContainer
          config={{
            count: { label: 'Placements', color: 'var(--chart-1)' },
          }}
        >
          <BarChart
            layout="vertical"
            data={chartData}
            height={chartData.length * 56}
            margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
          >
            <defs>
              <pattern
                id="dnd-zones-dots"
                x="0"
                y="0"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.75" fill="rgb(210,164,120)" />
              </pattern>
            </defs>

            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#dnd-zones-dots)"
              pointerEvents="none"
            />

            <XAxis type="number" hide domain={[0, max]} />
            <YAxis type="category" dataKey="answer" hide />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  hideIndicator
                  formatter={(value) => {
                    const count = value ?? 0;
                    return (
                      <span className="font-medium">
                        {count} placement{count === 1 ? '' : 's'}
                      </span>
                    );
                  }}
                />
              }
            />

            <Bar
              dataKey="count"
              radius={12}
              barSize={44}
              fill="var(--chart-1)"
              shape={<AnswerBar />}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function DragAndDropSpectrumChart({ analyticsData }) {
  if (!analyticsData || analyticsData.mode !== 'spectrum' || !analyticsData.tokens) return null;

  const axis = analyticsData.axes?.x || {};
  const left = axis.labelMin || 'Left';
  const right = axis.labelMax || 'Right';

  const chartData = Object.entries(analyticsData.tokens).map(([token, t]) => ({
    answer: prettyTokenLabel(token),
    count: Math.round((t.mean ?? 0) * 100),
  }));

  if (!chartData.length) return null;

  return (
    <Card>
      <CardDescription>
        Average position along spectrum ({left} → {right})
      </CardDescription>
      <CardContent>
        <ChartContainer
          config={{
            count: { label: 'Average Position', color: 'var(--chart-1)' },
          }}
        >
          <BarChart
            layout="vertical"
            data={chartData}
            height={chartData.length * 56}
            margin={{ top: 8, right: 24, left: 24, bottom: 8 }}
          >
            <defs>
              <pattern
                id="dnd-spectrum-dots"
                x="0"
                y="0"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.75" fill="rgb(210,164,120)" />
              </pattern>
            </defs>

            <rect
              x="0"
              y="0"
              width="100%"
              height="100%"
              fill="url(#dnd-spectrum-dots)"
              pointerEvents="none"
            />

            <XAxis type="number" hide domain={[0, 100]} />
            <YAxis type="category" dataKey="answer" hide />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  hideIndicator
                  formatter={(value) => {
                    const pct = value ?? 0;
                    return (
                      <span className="font-medium">{pct} / 100</span>
                    );
                  }}
                />
              }
            />

            <Bar
              dataKey="count"
              radius={12}
              barSize={44}
              fill="var(--chart-1)"
              shape={<AnswerBar />}
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function DragAndDropTokenZonesChart({ analyticsData, promptOptions }) {
  if (!analyticsData || analyticsData.mode !== 'zones' || !analyticsData.tokens) return null;

  // X axis: zones; Y axis: count of placements per token in that zone.
  const zoneLabels = Array.isArray(analyticsData.zones)
    ? analyticsData.zones.map((z) => z.zoneLabel)
    : [];
  if (!zoneLabels.length) return null;

  const { tokenKeys, labelsByKey, colorsByKey } = buildTokenMeta(analyticsData, promptOptions);
  if (!tokenKeys.length) return null;

  // One column per zone; stacked segments per token (counts of placements)
  const chartData = zoneLabels.map((zoneLabel) => {
    const row = { zone: zoneLabel };
    tokenKeys.forEach((token) => {
      const info = analyticsData.tokens[token];
      const z = (info.zones || []).find((zz) => zz.zoneLabel === zoneLabel);
      row[token] = z ? z.count : 0;
    });
    return row;
  });

  if (!chartData.length) return null;

  // ChartContainer uses this to register CSS vars like --color-{token}
  const chartConfig = tokenKeys.reduce((acc, token) => {
    acc[token] = {
      label: labelsByKey[token] || prettyTokenLabel(token),
      color: colorsByKey[token] || 'var(--chart-1)',
    };
    return acc;
  }, {});

  return (
    <Card>
      <CardDescription>Zone distribution per item</CardDescription>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={chartData}
            margin={{ top: 8, right: 8, left: 8, bottom: 24 }}
          >
            {/* Dotted backdrop to match other charts */}
            <defs>
              <pattern
                id="dnd-token-zones-dots"
                x="0"
                y="0"
                width="10"
                height="10"
                patternUnits="userSpaceOnUse"
              >
                <circle cx="2" cy="2" r="1.75" fill="rgb(210,164,120)" />
              </pattern>
            </defs>

            <rect
              x="0"
              y="0"
              width="100%"
              height="80%"
              fill="url(#dnd-token-zones-dots)"
              pointerEvents="none"
            />

            <XAxis
              dataKey="zone"
              tickLine={false}
              axisLine={false}
              tickMargin={10}
            />

            <ChartTooltip
              cursor={false}
              content={
                <ChartTooltipContent
                  hideLabel
                  formatter={(value, name) => {
                    const count = value ?? 0;
                    const label = chartConfig[name]?.label || prettyTokenLabel(name);
                    return (
                      <span className="font-medium">
                        {label}: {count}
                      </span>
                    );
                  }}
                />
              }
            />

            {tokenKeys.map((token) => (
              <Bar
                key={token}
                stackId="zones"
                dataKey={token}
                barSize={50}
                radius={25}
                fill={colorsByKey[token] || 'var(--chart-1)'}
                stroke="none"
                overflow="visible"
              />
            ))}
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

function DragAndDropHeatmap({ analyticsData, promptOptions }) {
  if (!analyticsData || !analyticsData.tokens) return null;

  const { tokenKeys, labelsByKey, colorsByKey } = buildTokenMeta(analyticsData, promptOptions);
  if (!tokenKeys.length) return null;

  const [activeKey, setActiveKey] = React.useState(tokenKeys[0]);

  React.useEffect(() => {
    if (!tokenKeys.includes(activeKey)) {
      setActiveKey(tokenKeys[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenKeys.join(',')]);

  const layout = analyticsData.mode;
  const selected = analyticsData.tokens[activeKey];
  if (!selected) return null;

  const renderSpectrumHeat = () => {
    const buckets = selected.buckets || [];
    if (!buckets.length) return null;
    const maxCount = Math.max(...buckets.map((b) => b.count || 0), 1);

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '30%',
          borderRadius: 20,
          border: '1px solid black',
          boxShadow: '-4px 4px black',
          overflow: 'hidden',
          backgroundColor: '#faf7f2',
          marginTop: 12,
        }}
      >
        {buckets.map((b) => {
          const frac = (b.count || 0) / maxCount;
          const alpha = frac <= 0 ? 0 : 0.15 + 0.55 * frac;
          return (
            <div
              key={b.index}
              style={{
                position: 'absolute',
                left: `${(b.rangeMin ?? 0) * 100}%`,
                width: `${((b.rangeMax ?? 0) - (b.rangeMin ?? 0)) * 100}%`,
                top: 0,
                bottom: 0,
                backgroundColor: hexToRgba(colorsByKey[activeKey], alpha),
              }}
            />
          );
        })}
        <div className="DndSpectrumAxis" />
        <div className="DndSpectrumLabel DndSpectrumLabelLeft">
          {analyticsData.axes?.x?.labelMin}
        </div>
        <div className="DndSpectrumLabel DndSpectrumLabelRight">
          {analyticsData.axes?.x?.labelMax}
        </div>
      </div>
    );
  };

  const renderZonesHeat = () => {
    const grid = analyticsData.grid;
    if (!grid || !Array.isArray(grid.labels)) return null;

    const rows = Math.max(1, grid.rows || grid.labels.length || 1);
    const cols = Math.max(1, grid.cols || (grid.labels[0]?.length || 1));

    const perZone = {};
    (selected.zones || []).forEach((z) => {
      perZone[z.zoneLabel] = z;
    });
    const maxCount = Math.max(...Object.values(perZone).map((z) => z.count || 0), 1);

    const cellWidth = 100 / cols;
    const cellHeight = 100 / rows;

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '60%',
          borderRadius: 20,
          border: '1px solid black',
          boxShadow: '-4px 4px black',
          overflow: 'hidden',
          backgroundColor: '#faf7f2',
          marginTop: 12,
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const label = grid.labels?.[r]?.[c];
            const zInfo = label ? perZone[label] : undefined;
            const count = zInfo?.count || 0;
            const frac = count / maxCount;
            const alpha = frac <= 0 ? 0 : 0.15 + 0.55 * frac;
            const bg = count > 0 ? hexToRgba(colorsByKey[activeKey], alpha) : 'transparent';

            return (
              <div
                key={`cell-${r}-${c}`}
                style={{
                  position: 'absolute',
                  left: `${c * cellWidth}%`,
                  top: `${r * cellHeight}%`,
                  width: `${cellWidth}%`,
                  height: `${cellHeight}%`,
                  backgroundColor: bg,
                  border: '1px solid rgba(0,0,0,0.04)',
                  boxSizing: 'border-box',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10,
                  textAlign: 'center',
                  padding: 2,
                  color: '#111',
                }}
              >
                {label}
              </div>
            );
          })
        )}
      </div>
    );
  };

  const renderFreeHeat = () => {
    const points = selected.points || [];
    if (!points.length) return null;

    const rows = analyticsData.heatmap?.rows || 3;
    const cols = analyticsData.heatmap?.cols || 3;

    const counts = Array.from({ length: rows * cols }, () => 0);
    points.forEach((p) => {
      const r = Math.min(rows - 1, Math.max(0, Math.floor((p.y ?? 0) * rows)));
      const c = Math.min(cols - 1, Math.max(0, Math.floor((p.x ?? 0) * cols)));
      const idx = r * cols + c;
      counts[idx] += 1;
    });

    const maxCount = Math.max(...counts, 1);
    const cellWidth = 100 / cols;
    const cellHeight = 100 / rows;

    return (
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '60%',
          borderRadius: 20,
          border: '1px solid black',
          boxShadow: '-4px 4px black',
          overflow: 'hidden',
          backgroundColor: '#faf7f2',
          marginTop: 12,
        }}
      >
        {Array.from({ length: rows }).map((_, r) =>
          Array.from({ length: cols }).map((__, c) => {
            const idx = r * cols + c;
            const count = counts[idx];
            const frac = count / maxCount;
            const alpha = frac <= 0 ? 0 : 0.15 + 0.55 * frac;
            const bg = count > 0 ? hexToRgba(colorsByKey[activeKey], alpha) : 'transparent';

            return (
              <div
                key={`cell-${r}-${c}`}
                style={{
                  position: 'absolute',
                  left: `${c * cellWidth}%`,
                  top: `${r * cellHeight}%`,
                  width: `${cellWidth}%`,
                  height: `${cellHeight}%`,
                  backgroundColor: bg,
                  border: '1px solid rgba(0,0,0,0.04)',
                  boxSizing: 'border-box',
                }}
              />
            );
          })
        )}
      </div>
    );
  };

  const renderStage = () => {
    if (layout === 'spectrum') return renderSpectrumHeat();
    if (layout === 'zones') return renderZonesHeat();
    return renderFreeHeat();
  };

  return (
    <Card>
      <CardDescription>Where each item tends to land</CardDescription>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {renderStage()}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {tokenKeys.map((key) => {
              const isActive = key === activeKey;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveKey(key)}
                  className={`logInButton${isActive ? ' logInButton--pressed' : ''}`}
                  style={{
                    margin: 'auto',
                  }}
                >
                  {labelsByKey[key] || prettyTokenLabel(key)}
                </button>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DragAndDropDistributionChart({ analyticsData, promptOptions }) {
  if (!analyticsData || !analyticsData.mode) return null;

  if (analyticsData.mode === 'zones') {
    return (
      <>
        <DragAndDropZonesChart analyticsData={analyticsData} />
        <DragAndDropTokenZonesChart analyticsData={analyticsData} promptOptions={promptOptions} />
        <DragAndDropHeatmap analyticsData={analyticsData} promptOptions={promptOptions} />
      </>
    );
  }

  if (analyticsData.mode === 'spectrum') {
    return (
      <>
        <DragAndDropSpectrumChart analyticsData={analyticsData} />
        <DragAndDropHeatmap analyticsData={analyticsData} promptOptions={promptOptions} />
      </>
    );
  }

  // Free layout: show only the heatmap based on per-item points
  if (analyticsData.mode === 'free') {
    return <DragAndDropHeatmap analyticsData={analyticsData} promptOptions={promptOptions} />;
  }

  return null;
}

export function ResponseProcessor({ promptId, allResponses, templateId, isAdmin, promptOptions, currentUserResponseId, currentUserName }) {

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

  const [aiAnalysisText, setAiAnalysisText] = useState("");
  const [aiAnalysisData, setAiAnalysisData] = useState(null);
  const [aiAnalysisLoading, setAiAnalysisLoading] = useState(false);
  const [aiAnalysisError, setAiAnalysisError] = useState("");

  const visibleResponses = isAdmin
    ? safeResponses
    : safeResponses.filter(r => r.workshop_response_acceptance === 1);

  // Precompute similarity scores for the current user (if any)
  const numericCurrentUserResponseId = currentUserResponseId ? Number(currentUserResponseId) : null;
  let similarResponseIds = new Set();
  let similarityScoresById = {};

  const supportsSimilarities = (templateId === 6 || templateId === 4 || templateId === 8);

  if (supportsSimilarities && numericCurrentUserResponseId && aiAnalysisData?.similarities?.pairs) {
    const pairs = Array.isArray(aiAnalysisData.similarities.pairs)
      ? aiAnalysisData.similarities.pairs
      : [];

    const scores = {};
    pairs.forEach((p) => {
      const a = Number(p.a);
      const b = Number(p.b);
      const score = typeof p.score === 'number' ? p.score : 0;
      if (!score) return;

      if (a === numericCurrentUserResponseId && b !== numericCurrentUserResponseId) {
        scores[b] = Math.max(scores[b] || 0, score);
      } else if (b === numericCurrentUserResponseId && a !== numericCurrentUserResponseId) {
        scores[a] = Math.max(scores[a] || 0, score);
      }
    });

    similarityScoresById = scores;

    const threshold = 0.75;
    const topMatches = Object.entries(scores)
      .filter(([, s]) => s >= threshold)
      .sort(([, s1], [, s2]) => s2 - s1)
      .slice(0, 2)
      .map(([id]) => Number(id));

    similarResponseIds = new Set(topMatches);
  }

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

  // Autosize the admin analysis textarea whenever its content changes.
  useAutosizeTextArea(adminAnalysisRef, adminAnalysis);

  useEffect(() => {
    let cancelled = false;

    const fetchAiAnalysis = async () => {
      if (!promptId) return;
      setAiAnalysisLoading(true);
      setAiAnalysisError("");
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/analytics/ai/${promptId}`,
          {
            headers: {
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );

        if (cancelled) return;

        if (!response.data) {
          setAiAnalysisText("");
          setAiAnalysisData(null);
        } else {
          // Keep both a raw JSON text view and the parsed object for charts.
          setAiAnalysisData(response.data);
          setAiAnalysisText(JSON.stringify(response.data, null, 2));
        }
      } catch (error) {
        if (cancelled) return;

        // 404 = no AI analysis yet; just hide the panel.
        if (error?.response?.status === 404) {
          setAiAnalysisText("");
          setAiAnalysisData(null);
        } else {
          console.error("Fetch AI analysis error:", error);
          setAiAnalysisError("Could not load AI analysis.");
        }
      } finally {
        if (!cancelled) {
          setAiAnalysisLoading(false);
        }
      }
    };

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
      fetchAiAnalysis();
    }

    return () => {
      cancelled = true;
    };
  }, [promptId, templateId, accessToken]);

  const renderCharts = () => {
    switch (templateType) {
      case 'multiplechoice':
        return (
          <>
            <GlowingBarVerticalChart analyticsData={analyticsData} />
            <GlowingLineChart key={`mc-${promptId}`} analyticsData={analyticsData} promptId={promptId} />
          </>
        );

      case 'checklist':
        return (
          <>
            <DefaultBarChart analyticsData={analyticsData} />
            <GlowingLineChart key={`cl-${promptId}`} analyticsData={analyticsData} promptId={promptId} />
          </>
        );

      case 'dropdown':
        return (
          <>
            <DefaultBarChart analyticsData={analyticsData} />
            <GlowingLineChart key={`dd-${promptId}`} analyticsData={analyticsData} promptId={promptId} />
          </>
        );

      case 'shortresponse':
        return (
          <>
            <GlowingBarVerticalChart />
            <GlowingLineChart key={`sr-${promptId}`} analyticsData={analyticsData} promptId={promptId} />
          </>
        );

      case 'draganddrop':
        // Layout-specific DnD distribution chart + responses-over-time line
        return (
          <>
            <DragAndDropDistributionChart analyticsData={analyticsData} promptOptions={promptOptions} />
            <GlowingLineChart
              key={`dnd-${promptId}`}
              analyticsData={analyticsData}
              promptId={promptId}
            />
          </>
        );

      case 'notation':
        return (
          <GlowingLineChart key={`nt-${promptId}`} analyticsData={analyticsData} promptId={promptId} />
        );

      case 'samplerater':
        return (
          <>
            <GlowingBarVerticalChart analyticsData={analyticsData} />
            <GlowingLineChart key={`srater-${promptId}`} analyticsData={analyticsData} promptId={promptId} />
          </>
        );

      default:
        return null;
    }
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
        {renderCharts()}

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

        {aiAnalysisData && (
          <div className="AiAnalysisContainer">
            <h2 className="AiAnalysisHeading">
              <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                <AiSimilarityIcon size={18} />
                <span style={{ color: "#57A15E"}}>AI Analysis</span>
              </span>
            </h2>

            {/* Single AI analysis card containing summary, charts, and questions */}
            <div className="OpenResponse AiAnalysisTextarea">
              {/* Concise theme summary */}
              <AiSummarySections analysis={aiAnalysisData} />

              {/* Theme distribution radar chart */}
              <div className="AiAnalysisChartWrapper">
                <GlowingStrokeRadarChart analysis={aiAnalysisData} />
              </div>

              {/* Salient words/phrases bubble cloud */}
              <AiWordBubbles analysis={aiAnalysisData} />

              {/* Key questions from the free-text summary */}
              {Array.isArray(aiAnalysisData?.free_text_summary?.questions) &&
                aiAnalysisData.free_text_summary.questions.length > 0 && (
                  <div className="AiSummaryQuestions">
                    <div className="AiSummaryBody">
                      {aiAnalysisData.free_text_summary.questions.map(
                        (q, idx) => (
                          <p key={idx} className="AiSummaryText">
                            {q}
                          </p>
                        )
                      )}
                    </div>
                  </div>
                )}

              {(aiAnalysisLoading || aiAnalysisError) && (
                <div className="AdminAnalysisControls">
                  {aiAnalysisLoading && (
                    <span className="status-text" role="status">
                      Loading AI analysis…
                    </span>
                  )}
                  {aiAnalysisError && (
                    <span className="error-text" role="status">
                      {aiAnalysisError}
                    </span>
                  )}
                </div>
              )}
            </div>
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
            {visibleResponses.map((r, i) => {
              const numericId = Number(r.workshop_response_id);
              const isSimilarToCurrentUser = similarResponseIds.has(numericId);
              const similarityScore = similarityScoresById[numericId] ?? null;

              return (
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
                  // For drag-and-drop templates, pass along layout + axis labels
                  dndLayout={templateId === 6 ? analyticsData.layout : undefined}
                  dndAxes={templateId === 6 ? analyticsData.axes : undefined}
                  isSimilarToCurrentUser={isSimilarToCurrentUser}
                  similarityScore={similarityScore}
                  currentUserName={currentUserName}
                />
              );
            })}
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
  accessToken,
  dndLayout,
  dndAxes,
  isSimilarToCurrentUser,
  similarityScore,
  currentUserName,
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

          const fmtCoord = (v) =>
            v == null ? "—" : v <= 1 ? `${(v * 100).toFixed(0)}` : `${Math.round(v)}px`;

          const prettyFromKey = (k) => {
            if (!k) return "";
            const s = String(k).replace(/[-_]+/g, " ").trim();
            return s.charAt(0).toUpperCase() + s.slice(1);
          };

        const layout = dndLayout || "free";
        const axisLabels = dndAxes?.x || {};

        const describeSpectrum = (scoreX) => {
          const pct = Math.round(scoreX * 100);
          const left = axisLabels.labelMin || "Left";
          const right = axisLabels.labelMax || "Right";

          if (pct <= 10) return `Extremely ${left} (${pct})`;
          if (pct <= 25) return `Strongly ${left} (${pct})`;
          if (pct <= 40) return `Leaning ${left} (${pct})`;
          if (pct <= 60) return `Balanced between ${left} and ${right} (${pct})`;
          if (pct <= 75) return `Leaning ${right} (${pct})`;
          if (pct <= 90) return `Strongly ${right} (${pct})`;
          return `Extremely ${right} (${pct})`;
        };

        const formatLine = (item) => {
          const label = item.label ?? prettyFromKey(item.keyName);
          const semantics = item.semantics || {};

          // Zone layout: show chosen zone label directly
          if (semantics.zoneLabel) {
            return `${label} — ${semantics.zoneLabel}`;
          }

          // Spectrum layout: map score into qualitative buckets
          if (typeof semantics.scoreX === "number") {
            const desc = describeSpectrum(semantics.scoreX);
            return `${label} — ${desc}`;
          }

            // Free layout or legacy responses: fall back to coordinates
            const x = item.position?.x;
            const y = item.position?.y;
            return `${label} — Y: ${fmtCoord(y)}, X: ${fmtCoord(x)}`;
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
                  .map((e, idx) => (
                    <li key={e.keyName ?? idx}>{formatLine(e)}</li>
                  ))}
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
      <div className="ResponseContentContainer">
      
        {isSimilarToCurrentUser && (
          <span
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, color: "#57A15E" }}
            className="ButtonText"
          >
            <AiSimilarityIcon size={16} />
            {templateId === 6 ? "Similar to your map" : "Similar to your response"}
          </span>
        )}
        <span style={{ display: "block" }} className="ButtonText">{"Name: " + name}</span>
        <span style={{ display: "block" }} className="ButtonText">{"Username: " + username}</span>
        

        {renderContent()}

        {showModeration && (
          <div className="AdminControls" style={{ marginTop: 12, display: "flex", gap: 8 }}>
            <button
              disabled={saving}
              aria-pressed={accepted}
              onClick={() => updateAcceptance(true)}
              className={initialAccepted === 1 ? "approvedButtonSelected" : "approvedButtonDeselected"}
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
              className={initialAccepted === 0 ? "declinedButtonSelected" : "declinedButtonDeselected"}
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
