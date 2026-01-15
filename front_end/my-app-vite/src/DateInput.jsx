import React, { useMemo, useState } from "react";
import { DateTime } from "luxon";
import { useOverlay } from "./context/OverlayContext.jsx";

/**
 * MysqlDateInput (no Tailwind) — controlled-ish component that returns MySQL-ready strings.
 *
 * Props
 *  - mode: 'date' | 'datetime' (default 'date')
 *  - zone: IANA timezone string (default 'America/New_York')
 *  - value: initial MySQL string (e.g., '2025-10-02' or '2025-10-02 13:30:00')
 *  - onChange: function(mysqlString, meta)
 *      meta: { jsDate: Date | null, time: string | null, zone: string, luxon: DateTime | null }
 *  - placeholder: text inside the trigger button when empty
 *  - className: optional extra class on root for custom scoping
 */

function parseInitialLuxon(value, mode, zone) {
  if (!value) return null;
  if (mode === "date") {
    const dt = DateTime.fromFormat(value, "yyyy-LL-dd", { zone });
    return dt.isValid ? dt : null;
  }
  const dt = DateTime.fromFormat(value, "yyyy-LL-dd HH:mm:ss", { zone: "UTC" }).setZone(zone);
  return dt.isValid ? dt : null;
}

function formatLabel(value, mode, zone) {
  const initial = parseInitialLuxon(value, mode, zone);
  if (!initial) return "";

  if (mode === "date") {
    return initial.toFormat("DDD"); // e.g., Oct 2, 2025
  }

  const time = initial.toFormat("HH:mm");
  return `${initial.toFormat("DDD")} at ${time} ${zone}`;
}

function buildMonthGrid(viewMonth) {
  // viewMonth: Luxon DateTime at first of month
  const startOfMonth = viewMonth.startOf("month");
  // Luxon weekday: 1=Mon..7=Sun; we want Monday as column 0
  const startWeekdayIndex = (startOfMonth.weekday + 6) % 7; // 0..6
  const gridStart = startOfMonth.minus({ days: startWeekdayIndex });

  const days = [];
  for (let i = 0; i < 42; i += 1) {
    days.push(gridStart.plus({ days: i }));
  }
  return days;
}

function MysqlDateOverlay({ mode, zone, initialLuxon, placeholder, onCommit, onCancel }) {
  const [viewMonth, setViewMonth] = useState(
    (initialLuxon || DateTime.now().setZone(zone)).startOf("month")
  );
  const [selected, setSelected] = useState(initialLuxon ?? null);
  const [time, setTime] = useState(() => {
    if (mode === "datetime" && initialLuxon) return initialLuxon.toFormat("HH:mm");
    return "08:00"; // default time
  });

  const label = useMemo(() => {
    if (!selected) return placeholder || "";
    if (mode === "date") {
      return selected.toFormat("DDD");
    }
    return `${selected.toFormat("DDD")} at ${time} ${zone}`;
  }, [selected, mode, time, zone, placeholder]);

  const gridDays = useMemo(() => buildMonthGrid(viewMonth), [viewMonth]);

  function handleDayClick(day) {
    // Only allow selection from current month
    setSelected(day);
  }

  function toMysqlString(lux, t) {
    if (!lux) return "";
    if (mode === "date") {
      return lux.toFormat("yyyy-LL-dd");
    }
    const [hh, mm] = (t || "00:00").split(":").map((n) => parseInt(n || "0", 10));
    const dt = lux.set({ hour: hh, minute: mm, second: 0 });
    return dt.toUTC().toFormat("yyyy-LL-dd HH:mm:ss");
  }

  function handleCommit() {
    const mysqlString = toMysqlString(selected, time);
    const jsDate = selected ? selected.toJSDate() : null;

    onCommit?.(mysqlString, {
      jsDate,
      time: mode === "datetime" ? (time || null) : null,
      zone,
      luxon: selected || null,
    });
  }

  function handleClear() {
    setSelected(null);
    if (mode === "datetime") setTime("");
  }

  const weekdayLabels = ["Mo", "Tu", "We", "Th", "Fr", "Sa", "Su"];

  return (
    <div className="mysql-picker__popover">
      <div className="mysql-picker__body">
        {/* Header row: month name + arrows, full width */}
        <div className="mysql-picker__header">
          <div className="mysql-picker__month-label">
            {viewMonth.toFormat("LLLL yyyy")}
          </div>
          <div className="mysql-picker__nav">
            <button
              type="button"
              className="createButton mysql-picker__nav-btn mysql-picker__nav-btn--prev"
              onClick={() => setViewMonth(viewMonth.minus({ months: 1 }))}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline
                  className="mysql-picker__nav-arrow"
                  points="12.75 2.75 5.25 9 12.75 15.25"
                  stroke="black"
                  fill="none"
                />
              </svg>
            </button>
            <button
              type="button"
              className="createButton mysql-picker__nav-btn mysql-picker__nav-btn--next"
              onClick={() => setViewMonth(viewMonth.plus({ months: 1 }))}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <polyline
                  className="mysql-picker__nav-arrow"
                  points="5.25 2.75 12.75 9 5.25 15.25"
                  stroke="black"
                  fill="none"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="mysql-picker__weekdays">
          {weekdayLabels.map((wl) => (
            <div key={wl} className="mysql-picker__weekday">
              {wl}
            </div>
          ))}
        </div>

        {/* Full-width calendar grid */}
        <div className="mysql-picker__grid">
          {gridDays.map((day) => {
            const inMonth = day.month === viewMonth.month && day.year === viewMonth.year;
            const isSelected = selected && day.hasSame(selected, "day");
            const classes = [
              "mysql-picker__cell",
              inMonth ? "mysql-picker__cell--in" : "mysql-picker__cell--out",
              isSelected ? "mysql-picker__cell--selected" : "",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <button
                key={day.toISODate()}
                type="button"
                className={classes}
                onClick={() => handleDayClick(day)}
              >
                {day.day}
              </button>
            );
          })}
        </div>

        {mode === "datetime" && (
          <div className="mysql-picker__time-row">
            <label className="mysql-picker__time-label" htmlFor="mysql-picker-time">
              Time
            </label>
            <input
              id="mysql-picker-time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="mysql-picker__time-input"
            />
            <span className="mysql-picker__zone">{zone}</span>
          </div>
        )}

        <div className="mysql-picker__actions">
          <div />
          <div className="mysql-picker__actions-right">
            <button
              type="button"
              onClick={onCancel}
              className="createButton mysql-picker__action-btn"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={!selected}
              onClick={handleCommit}
              className="createButton mysql-picker__action-btn"
            >
              Use this {mode === "date" ? "date" : "date & time"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MysqlDateInput({
  mode = "date",
  zone = "America/New_York",
  value,
  onChange,
  placeholder = "Pick a date…",
  className = "",
}) {
  const { show, hide } = useOverlay();

  const label = useMemo(() => formatLabel(value, mode, zone), [value, mode, zone]);

  const openOverlay = () => {
    const initialLuxon = parseInitialLuxon(value, mode, zone);

    show(
      <MysqlDateOverlay
        mode={mode}
        zone={zone}
        initialLuxon={initialLuxon}
        placeholder={placeholder}
        onCommit={(mysqlString, meta) => {
          onChange?.(mysqlString, meta);
          hide();
        }}
        onCancel={hide}
      />
    );
  };

  const isPlaceholder = !label;

  return (
    <div className={`mysql-picker ${className}`}>
      <button
        type="button"
        className="mysql-picker__trigger"
        aria-label="Choose date"
        onClick={openOverlay}
      >
        <span
          className={`mysql-picker__label ${
            isPlaceholder ? "mysql-picker__label--placeholder" : ""
          }`}
        >
          {label || placeholder}
        </span>
        <svg viewBox="0 0 24 24" className="mysql-picker__chevron" aria-hidden>
          <path fill="currentColor" d="M7 10l5 5 5-5z" />
        </svg>
      </button>
    </div>
  );
}

// --- Demo usage (remove in production) -------------------------------------
export function DemoMysqlPicker() {
  const [mysql, setMysql] = useState("");
  const [mysqlDT, setMysqlDT] = useState("");
  return (
    <div style={{ display: 'grid', gap: 24, padding: 24, gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Date → MySQL DATE</h2>
        <MysqlDateInput mode="date" onChange={(s) => setMysql(s)} />
        <div style={{ fontSize: 14, color: '#475569', marginTop: 8 }}>MySQL: <code>{mysql || "(empty)"}</code></div>
      </section>
      <section>
        <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>Date & Time → MySQL DATETIME (UTC)</h2>
        <MysqlDateInput mode="datetime" zone="America/New_York" onChange={(s) => setMysqlDT(s)} />
        <div style={{ fontSize: 14, color: '#475569', marginTop: 8 }}>MySQL: <code>{mysqlDT || "(empty)"}</code></div>
      </section>
    </div>
  );
}

