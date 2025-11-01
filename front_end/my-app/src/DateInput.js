import React, { useMemo, useState } from "react";
import * as Popover from "@radix-ui/react-popover";
import { DayPicker } from "react-day-picker";
import "react-day-picker/dist/style.css";
import { DateTime } from "luxon";

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
export function MysqlDateInput({
  mode = "date",
  zone = "America/New_York",
  value,
  onChange,
  placeholder = "Pick a date…",
  className = ""
}) {
  const [open, setOpen] = useState(false);

  // Parse incoming value (if any)
  const initial = useMemo(() => {
    if (!value) return null;
    if (mode === "date") {
      const dt = DateTime.fromFormat(value, "yyyy-LL-dd", { zone });
      return dt.isValid ? dt : null;
    }
    const dt = DateTime.fromFormat(value, "yyyy-LL-dd HH:mm:ss", { zone: "UTC" }).setZone(zone);
    return dt.isValid ? dt : null;
  }, [value, mode, zone]);

  const [selected, setSelected] = useState(initial?.toJSDate() ?? undefined);
  const [time, setTime] = useState(() => {
    if (mode === "datetime" && initial) return initial.toFormat("HH:mm");
    return "08:00"; // default time
  });

  const label = useMemo(() => {
    if (!selected) return "";
    if (mode === "date") {
      return DateTime.fromJSDate(selected, { zone }).toFormat("DDD"); // e.g., Oct 2, 2025
    }
    return `${DateTime.fromJSDate(selected, { zone }).toFormat("DDD")} at ${time} ${zone}`;
  }, [selected, mode, time, zone]);

  function toMysqlString(sel, t) {
    if (!sel) return "";
    if (mode === "date") {
      return DateTime.fromJSDate(sel, { zone }).toFormat("yyyy-LL-dd");
    }
    const [hh, mm] = (t || "00:00").split(":").map(n => parseInt(n || "0", 10));
    const dt = DateTime.fromJSDate(sel, { zone }).set({ hour: hh, minute: mm, second: 0 });
    return dt.toUTC().toFormat("yyyy-LL-dd HH:mm:ss");
  }

  function commit(sel = selected, t = time) {
    const mysqlString = toMysqlString(sel, t);
    const lux = sel ? DateTime.fromJSDate(sel, { zone }).set({
      hour: mode === "datetime" ? parseInt((t || "00:00").split(":" )[0] || "0", 10) : 0,
      minute: mode === "datetime" ? parseInt((t || "00:00").split(":" )[1] || "0", 10) : 0,
      second: 0
    }) : null;

    onChange?.(mysqlString, {
      jsDate: sel || null,
      time: mode === "datetime" ? (t || null) : null,
      zone,
      luxon: lux
    });
    setOpen(false);
  }

  function clear() {
    setSelected(undefined);
    if (mode === "datetime") setTime("");
    onChange?.("", { jsDate: null, time: null, zone, luxon: null });
  }

  return (
    <div className={`mysql-picker ${className}`}>
      <Popover.Root open={open} onOpenChange={setOpen}>
        <Popover.Trigger asChild>
          <button
            type="button"
            className="mysql-picker__trigger"
            aria-label="Choose date"
          >
            <span className={`mysql-picker__label ${label ? "" : "mysql-picker__label--placeholder"}`}>
              {label || placeholder}
            </span>
            <svg viewBox="0 0 24 24" className="mysql-picker__chevron" aria-hidden>
              <path fill="currentColor" d="M7 10l5 5 5-5z"/>
            </svg>
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content className="mysql-picker__popover" sideOffset={8}>
            <div className="mysql-picker__body">
              <DayPicker
                styles={{
                  root: { ['--rdp-accent-color']: '#000', ['--rdp-outline']: '2px solid #000' },
                  nav_button: { color: '#000' },
                }}
                mode="single"
                selected={selected}
                onSelect={setSelected}
                ISOWeek
                showOutsideDays
                className="mysql-picker__calendar"
              />
            
              {mode === "datetime" && (
                <div className="mysql-picker__time-row">
                  <label className="mysql-picker__time-label" htmlFor="mysql-picker-time">Time</label>
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
                <button type="button" onClick={clear} className="btn btn--link">Clear</button>
                <div className="mysql-picker__actions-right">
                  <button type="button" onClick={() => setOpen(false)} className="btn btn--ghost">Cancel</button>
                  <button type="button" disabled={!selected} onClick={() => commit()} className="btn btn--primary">
                    Use this {mode === "date" ? "date" : "date & time"}
                  </button>
                </div>
              </div>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
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

