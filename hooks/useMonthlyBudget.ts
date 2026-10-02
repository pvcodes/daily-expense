"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { useUserPrefs } from "@/hooks/useUserPrefs";
import { currentMonthKey } from "@/lib/analytics";

const KEY = "expense-tracker.budget.v1";

export function useMonthlyBudget() {
  const { transactions } = useExpenses();
  const { set: setServer } = useUserPrefs();
  const [budget, setBudgetState] = useState<number>(0);
  const monthKey = useMemo(() => currentMonthKey(), []);

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
    return transactions.reduce(
      (s, t) => (t.price < 0 && t.date.startsWith(monthKey) ? s + -t.price : s),
      0
    );
  }, [transactions, monthKey]);

  return { budget, setBudget, spent, monthKey };
}
