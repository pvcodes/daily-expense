"use client";

import { useEffect, useState } from "react";
import { useUserPrefs } from "@/hooks/useUserPrefs";

const SWATCHES = [
  { id: "emerald", color: "#10b981" },
  { id: "blue", color: "#2563eb" },
  { id: "violet", color: "#8b5cf6" },
  { id: "rose", color: "#f43f5e" },
  { id: "amber", color: "#f59e0b" },
];

const KEY = "expense-tracker.accent";

export default function AccentPicker() {
  const [accent, setAccent] = useState<string>("emerald");
  const { set: setServer } = useUserPrefs();

  useEffect(() => {
    const id = setTimeout(() => {
      const cur = document.documentElement.dataset.accent || "emerald";
      setAccent(cur);
    }, 0);
    return () => clearTimeout(id);
  }, []);

  function apply(id: string) {
    setAccent(id);
    document.documentElement.setAttribute("data-accent", id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      // storage unavailable — still applies for this session
    }
    setServer(KEY, id);
  }

  return (
    <div className="flex flex-wrap gap-3">
      {SWATCHES.map((s) => (
        <button
          key={s.id}
          onClick={() => apply(s.id)}
          aria-label={`${s.id} accent`}
          className={`h-9 w-9 rounded-full transition-transform active:scale-95 ${
            accent === s.id
              ? "ring-2 ring-ink ring-offset-2 ring-offset-panel"
              : "ring-1 ring-line-strong"
          }`}
          style={{ background: s.color }}
        />
      ))}
    </div>
  );
}