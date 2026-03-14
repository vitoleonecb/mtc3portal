import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";

import { Heading1, Heading2 } from "../Headings.jsx";
import { DropDown } from "../Buttons.jsx";

const API = import.meta.env.VITE_API_URL;

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const PRESET_LABELS = {
  quick_test: "Quick Test",
  extended_test: "Extended Test",
  normal: "Normal Weekly",
};

const PRESET_DESCRIPTIONS = {
  quick_test: "2-min intervals — fast iteration",
  extended_test: "30-min intervals — longer test",
  normal: "Weekly cycle with configurable day & time",
};

export function CycleConfigPage() {
  const navigate = useNavigate();
  const accessToken = localStorage.getItem("accessToken");
  const headers = { Authorization: `Bearer ${accessToken}` };

  // ── Auth ──
  const [isAdmin, setIsAdmin] = useState(false);
  const decoded = useMemo(() => {
    try { return jwtDecode(accessToken); } catch { return null; }
  }, [accessToken]);
  const userId = decoded?.user_id;

  useEffect(() => {
    if (!userId) return;
    axios
      .get(`${API}/users/${userId}/isadmin`, { headers })
      .then((r) => r.data > 0 && setIsAdmin(true))
      .catch(() => {});
  }, [userId]);

  // ── Workshops list ──
  const [workshops, setWorkshops] = useState([]);
  const [selectedWorkshopId, setSelectedWorkshopId] = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/workshops`, { headers })
      .then((r) => setWorkshops(r.data))
      .catch(console.error);
  }, []);

  // ── Auto-select soonest workshop with pending modules ──
  const [modulesMap, setModulesMap] = useState({}); // workshopId -> modules[]

  useEffect(() => {
    if (workshops.length === 0) return;

    const fetchAll = async () => {
      const map = {};
      for (const w of workshops) {
        try {
          const r = await axios.get(`${API}/cycle/validate/${w.workshop_id}`, { headers });
          map[w.workshop_id] = r.data.modules || [];
        } catch {
          map[w.workshop_id] = [];
        }
      }
      setModulesMap(map);

      // Default to soonest workshop that has at least one pending module
      const now = new Date();
      const withPending = workshops
        .filter((w) => {
          const mods = map[w.workshop_id] || [];
          return mods.some((m) => m.workshop_module_status === "pending");
        })
        .sort((a, b) => new Date(a.workshop_date) - new Date(b.workshop_date));

      if (withPending.length > 0 && !selectedWorkshopId) {
        setSelectedWorkshopId(withPending[0].workshop_id);
      } else if (!selectedWorkshopId && workshops.length > 0) {
        // Fallback: soonest by date
        const sorted = [...workshops].sort(
          (a, b) => new Date(a.workshop_date) - new Date(b.workshop_date)
        );
        setSelectedWorkshopId(sorted[0].workshop_id);
      }
    };
    fetchAll();
  }, [workshops]);

  // ── Cycle config state ──
  const [preset, setPreset] = useState("normal");
  const [startDay, setStartDay] = useState(3);
  const [startHour, setStartHour] = useState(7);
  const [otpHours, setOtpHours] = useState(72);
  const [ptcHours, setPtcHours] = useState(42);

  // ── Active cycle status ──
  const [cycleStatus, setCycleStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // ── Load existing config when workshop changes ──
  useEffect(() => {
    if (!selectedWorkshopId) return;

    axios
      .get(`${API}/cycle/config/${selectedWorkshopId}`, { headers })
      .then((r) => {
        const cfg = r.data.config;
        if (cfg) {
          setPreset(cfg.preset);
          setStartDay(cfg.start_day);
          setStartHour(cfg.start_hour);
          setOtpHours(Number(cfg.open_to_processing_hours));
          setPtcHours(Number(cfg.processing_to_completed_hours));
        }
      })
      .catch(console.error);

    // Fetch active cycle status
    axios
      .get(`${API}/cycle/status/${selectedWorkshopId}`, { headers })
      .then((r) => setCycleStatus(r.data))
      .catch(console.error);
  }, [selectedWorkshopId]);

  // ── Apply preset defaults ──
  const applyPreset = (p) => {
    setPreset(p);
    if (p === "quick_test") {
      setOtpHours(2 / 60);
      setPtcHours(2 / 60);
    } else if (p === "extended_test") {
      setOtpHours(0.5);
      setPtcHours(0.5);
    } else {
      setOtpHours(72);
      setPtcHours(42);
    }
  };

  // ── Validation ──
  const currentModules = modulesMap[selectedWorkshopId] || [];
  const pendingModules = currentModules.filter((m) => m.workshop_module_status === "pending");
  const modulesWithoutPrompts = pendingModules.filter((m) => Number(m.prompt_count) === 0);
  const canStart = pendingModules.length > 0 && modulesWithoutPrompts.length === 0;

  const workshopOptions = workshops.map((w) => {
    const hasPending = modulesMap[w.workshop_id]?.some(
      (m) => m.workshop_module_status === "pending"
    );
    return `${w.workshop_name}${hasPending ? " ● pending" : ""}`;
  });

  const selectedWorkshopIdx = workshops.findIndex(
    (w) => w.workshop_id === selectedWorkshopId
  );
  const selectedWorkshopLabel =
    selectedWorkshopIdx >= 0 ? workshopOptions[selectedWorkshopIdx] : null;

  // ── Save config ──
  const handleSave = async () => {
    setLoading(true);
    setMessage(null);
    try {
      await axios.put(
        `${API}/cycle/config/${selectedWorkshopId}`,
        {
          preset,
          start_day: startDay,
          start_hour: startHour,
          open_to_processing_hours: otpHours,
          processing_to_completed_hours: ptcHours,
        },
        { headers }
      );
      setMessage("Config saved.");
    } catch (err) {
      setMessage(`Error saving config: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Start cycle ──
  const handleStart = async () => {
    setLoading(true);
    setMessage(null);
    try {
      // Save first
      await axios.put(
        `${API}/cycle/config/${selectedWorkshopId}`,
        {
          preset,
          start_day: startDay,
          start_hour: startHour,
          open_to_processing_hours: otpHours,
          processing_to_completed_hours: ptcHours,
        },
        { headers }
      );

      const r = await axios.post(
        `${API}/cycle/start/${selectedWorkshopId}`,
        {},
        { headers }
      );

      const s = r.data.schedule;
      setMessage(
        `Cycle started! Open: ${formatDT(s.openAt)}, Processing: ${formatDT(s.processingAt)}, Completed: ${formatDT(s.completedAt)}`
      );

      // Refresh status
      const statusR = await axios.get(`${API}/cycle/status/${selectedWorkshopId}`, { headers });
      setCycleStatus(statusR.data);
    } catch (err) {
      const data = err.response?.data;
      if (data?.modules) {
        setMessage(
          `Cannot start: modules missing prompts — ${data.modules.map((m) => m.module_name).join(", ")}`
        );
      } else {
        setMessage(`Error: ${data?.error || err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Cancel cycle ──
  const handleCancel = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const r = await axios.post(
        `${API}/cycle/cancel/${selectedWorkshopId}`,
        {},
        { headers }
      );
      setMessage(`Cycle cancelled. ${r.data.cancelledJobs} jobs removed.`);
      setCycleStatus(null);
    } catch (err) {
      setMessage(`Error: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // ── Helpers ──
  const formatDT = (iso) => {
    try {
      return format(new Date(iso), "EEE MMM d, h:mm a");
    } catch {
      return iso;
    }
  };

  if (!isAdmin) {
    return (
      <div className="CycleConfigContainer">
        <Heading1 text="Cycle Configuration" />
        <Heading2 text="Admin access required." />
      </div>
    );
  }

  const hasActiveCycle =
    cycleStatus && cycleStatus.pendingJobs && cycleStatus.pendingJobs.length > 0;

  return (
    <div className="CycleConfigContainer">
      <Heading1 text="Module Cycle Configuration" />

      {/* Workshop selector */}
      <DropDown
        options={workshopOptions}
        value={selectedWorkshopLabel}
        onSelect={(option, index) => setSelectedWorkshopId(workshops[index].workshop_id)}
      />

      {/* Preset selector */}
      <Heading2 text="Preset" />
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "1.5rem",
        }}
      >
        {Object.entries(PRESET_LABELS).map(([key, label]) => (
          <button
            key={key}
            className="logInButton"
            onClick={() => applyPreset(key)}
            style={{
              opacity: preset === key ? 1 : 0.5,
              border: preset === key ? "2px solid black" : "1px solid black",
              minWidth: "120px",
            }}
          >
            {label}
          </button>
        ))}
      </div>
      <p style={{ textAlign: "center", fontSize: "0.875rem", marginTop: "-0.5rem" }}>
        {PRESET_DESCRIPTIONS[preset]}
      </p>

      {/* Timing fields (editable for normal) */}
      {preset === "normal" && (
        <div className="CycleConfigTimingGrid" style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "bold" }}>Start Day</label>
              <DropDown
                options={[...DAY_NAMES]}
                value={DAY_NAMES[startDay]}
                onSelect={(option, index) => setStartDay(index)}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "bold" }}>Start Hour (0–23)</label>
              <input
                type="number"
                className="textInput"
                min={0}
                max={23}
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                style={{ width: "100%", marginBottom: 0 }}
              />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "bold" }}>Open → Processing (hours)</label>
              <input
                type="number"
                className="textInput"
                min={0}
                step={1}
                value={otpHours}
                onChange={(e) => setOtpHours(Number(e.target.value))}
                style={{ width: "100%", marginBottom: 0 }}
              />
            </div>
            <div>
              <label style={{ fontSize: "0.875rem", fontWeight: "bold" }}>Processing → Completed (hours)</label>
              <input
                type="number"
                className="textInput"
                min={0}
                step={1}
                value={ptcHours}
                onChange={(e) => setPtcHours(Number(e.target.value))}
                style={{ width: "100%", marginBottom: 0 }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Module validation panel */}
      <Heading2 text="Module Readiness" />
      {pendingModules.length === 0 ? (
        <p style={{ textAlign: "center", fontSize: "0.875rem" }}>
          No pending modules for this workshop.
        </p>
      ) : (
        <div style={{ marginBottom: "1.5rem" }}>
          {pendingModules.map((m) => {
            const hasPrompts = Number(m.prompt_count) > 0;
            return (
              <div
                key={m.workshop_module_id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid #eee",
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10">
                  <circle cx="5" cy="5" r="5" fill={hasPrompts ? "#57A15E" : "#994242"} />
                </svg>
                <span style={{ flex: 1 }}>{m.workshop_module_name}</span>
                <span style={{ fontSize: "0.75rem", color: hasPrompts ? "#57A15E" : "#994242" }}>
                  {hasPrompts ? `${m.prompt_count} prompt${m.prompt_count > 1 ? "s" : ""}` : "No prompts"}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {modulesWithoutPrompts.length > 0 && (
        <p style={{ textAlign: "center", color: "#994242", fontSize: "0.875rem", marginBottom: "1rem" }}>
          ⚠ {modulesWithoutPrompts.length} module{modulesWithoutPrompts.length > 1 ? "s" : ""} missing
          prompts. Cycle cannot start until all pending modules have prompts.
        </p>
      )}

      {/* Action buttons */}
      <div className="logInButtonContainer" style={{ marginTop: 0 }}>
        <button
          className="logInButton"
          onClick={handleSave}
          disabled={loading}
          style={{ marginBottom: "0.75rem" }}
        >
          Save Config
        </button>
      </div>

      <div className="logInButtonContainer" style={{ marginTop: 0 }}>
        <button
          className="logInButton"
          onClick={handleStart}
          disabled={loading || !canStart}
          style={{
            opacity: canStart ? 1 : 0.4,
            marginBottom: "0.75rem",
          }}
        >
          {hasActiveCycle ? "Restart Cycle" : "Start Cycle"}
        </button>
      </div>

      {/* Active cycle panel */}
      {hasActiveCycle && (
        <>
          <Heading2 text="Active Cycle" />
          <div style={{ marginBottom: "1rem" }}>
            {cycleStatus.pendingJobs.map((j) => (
              <div
                key={j.cycle_job_id}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  padding: "0.35rem 0",
                  borderBottom: "1px solid #eee",
                  fontSize: "0.875rem",
                }}
              >
                <span>{j.workshop_module_name}</span>
                <span style={{ fontWeight: "bold" }}>{j.job_name.replace("Module", "")}</span>
                <span>{formatDT(j.scheduled_for)}</span>
              </div>
            ))}
          </div>
          <div className="logInButtonContainer" style={{ marginTop: 0 }}>
            <button
              className="logInButton"
              onClick={handleCancel}
              disabled={loading}
              style={{ color: "#994242" }}
            >
              Cancel Cycle
            </button>
          </div>
        </>
      )}

      {/* Status message */}
      {message && (
        <p
          style={{
            textAlign: "center",
            fontSize: "0.875rem",
            margin: "1rem auto",
            whiteSpace: "pre-wrap",
          }}
        >
          {message}
        </p>
      )}
    </div>
  );
}
