import React, { useState, useEffect, useRef, useCallback } from "react";

const SLOT_COUNT = 4;
const TYPE_INTERVAL_MS = 35;
const HOLD_MS = 2500;
const FADE_MS = 600;

function pickRandom(arr, exclude) {
  if (!arr.length) return null;
  const pool = arr.length > 1 ? arr.filter((_, i) => i !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

function TypewriterSlot({ item }) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState("typing"); // typing | holding | fading

  useEffect(() => {
    if (!item) return;
    setDisplayed("");
    setPhase("typing");

    const full = `${item.name}: "${item.text}"`;
    let i = 0;

    const typeTimer = setInterval(() => {
      i++;
      setDisplayed(full.slice(0, i));
      if (i >= full.length) {
        clearInterval(typeTimer);
        setPhase("holding");
      }
    }, TYPE_INTERVAL_MS);

    return () => clearInterval(typeTimer);
  }, [item]);

  useEffect(() => {
    if (phase !== "holding") return;
    const t = setTimeout(() => setPhase("fading"), HOLD_MS);
    return () => clearTimeout(t);
  }, [phase]);

  const opacity = phase === "fading" ? 0 : 1;

  return (
    <div
      className="typewriterSlot"
      style={{ opacity, transition: `opacity ${FADE_MS}ms ease` }}
    >
      <span>{displayed}</span>
      {phase === "typing" && <span className="typewriterCursor">|</span>}
    </div>
  );
}

export function TypewriterTicker({ responses = [] }) {
  const [slots, setSlots] = useState(() =>
    Array.from({ length: SLOT_COUNT }, () => ({ item: null, key: 0 }))
  );
  const lastIndexRef = useRef(-1);

  const refreshSlot = useCallback(
    (slotIndex) => {
      if (!responses.length) return;
      const item = pickRandom(responses, lastIndexRef.current);
      lastIndexRef.current = responses.indexOf(item);
      setSlots((prev) => {
        const next = [...prev];
        next[slotIndex] = { item, key: prev[slotIndex].key + 1 };
        return next;
      });
    },
    [responses]
  );

  // Initialize slots with staggered starts
  useEffect(() => {
    if (!responses.length) return;
    const timers = slots.map((_, i) =>
      setTimeout(() => refreshSlot(i), i * 1200)
    );
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses]);

  // Cycle each slot on a staggered interval
  useEffect(() => {
    if (!responses.length) return;
    const cycleDuration =
      TYPE_INTERVAL_MS * 140 + HOLD_MS + FADE_MS + 400; // rough full cycle
    const timers = slots.map((_, i) => {
      const offset = i * 1200;
      return setInterval(() => refreshSlot(i), cycleDuration + offset);
    });
    return () => timers.forEach(clearInterval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses, refreshSlot]);

  if (!responses.length) return null;

  return (
    <div className="typewriterContainer">
      {slots.map((slot, i) => (
        <TypewriterSlot key={`${i}-${slot.key}`} item={slot.item} />
      ))}
    </div>
  );
}
