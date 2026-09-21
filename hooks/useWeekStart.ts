"use client";

import { useCallback, useEffect, useState } from "react";
import { DEFAULT_WEEK_START, type WeekStart } from "@/lib/analytics";
import { useUserPrefs } from "@/hooks/useUserPrefs";

const KEY = "expense-tracker.weekStart";

export function useWeekStart(): {
  weekStart: WeekStart;
  setWeekStart: (v: WeekStart) => void;
} {
  const [weekStart, setWeekStartState] = useState<WeekStart>(
    DEFAULT_WEEK_START
  );
  const { set: setServer } = useUserPrefs();

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const v = localStorage.getItem(KEY);
        if (v === "sunday" || v === "monday") setWeekStartState(v);
      } catch {
        /* ignore */
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const setWeekStart = useCallback(
    (v: WeekStart) => {
      setWeekStartState(v);
      try {
        localStorage.setItem(KEY, v);
      } catch {
        /* ignore */
      }
      setServer(KEY, v);
    },
    [setServer]
  );

  return { weekStart, setWeekStart };
}