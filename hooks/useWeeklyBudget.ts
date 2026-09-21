"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useWeekStart } from "@/hooks/useWeekStart";
import { useUserPrefs } from "@/hooks/useUserPrefs";
import { currentWeekStartISO } from "@/lib/analytics";

const KEY = "expense-tracker.budget.v1";

export function useWeeklyBudget() {
  const { transactions } = useExpenses();
  const { weekStart } = useWeekStart();
  const { set: setServer } = useUserPrefs();
  const [budget, setBudgetState] = useState<number>(0);
  const weekStartDate = useMemo(
    () => currentWeekStartISO(weekStart),
    [weekStart]
  );

  useEffect(() => {
    const id = setTimeout(() => {
      try {
        const v = Number(localStorage.getItem(KEY));
        if (v > 0) setBudgetState(v);
      } catch {
        // storage unavailable
      }
    }, 0);
    return () => clearTimeout(id);
  }, []);

  const setBudget = useCallback(
    (v: number) => {
      setBudgetState(v);
      try {
        localStorage.setItem(KEY, String(v));
      } catch {
        // storage unavailable
      }
      setServer(KEY, String(v));
    },
    [setServer]
  );

  const spent = useMemo(() => {
    const start = currentWeekStartISO(weekStart);
    return transactions.reduce(
      (s, t) => (t.price < 0 && t.date >= start ? s + -t.price : s),
      0
    );
  }, [transactions, weekStart]);

  return { budget, setBudget, spent, weekStart, weekStartDate };
}