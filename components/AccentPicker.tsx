"use client";

import { useEffect, useState } from "react";
import { useUserPrefs } from "@/hooks/useUserPrefs";

const SWATCHES = [
  { id: "violet", color: "linear-gradient(135deg,#7c3aed,#ec4899)" },
  { id: "pink", color: "linear-gradient(135deg,#db2777,#f97316)" },
  { id: "lime", color: "linear-gradient(135deg,#65a30d,#10b981)" },
  { id: "blue", color: "linear-gradient(135deg,#2563eb,#06b6d4)" },
  { id: "amber", color: "linear-gradient(135deg,#d97706,#f43f5e)" },
];

const KEY = "expense-tracker.accent";

export default function AccentPicker() {
  const [accent, setAccent] = useState<string>("violet");
  const { set: setServer } = useUserPrefs();

  useEffect(() => {
    const id = setTimeout(() => {
      const cur = document.documentElement.dataset.accent || "violet";
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