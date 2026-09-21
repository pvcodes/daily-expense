"use client";

import { useLocalPref } from "./useLocalPref";
import { useUserPrefs } from "./useUserPrefs";

export const HOME_WIDGETS = [
  {
    key: "addExpense",
    label: "Quick add",
    description: "Floating button to add a new expense",
  },
  {
    key: "weeklyBudget",
    label: "Weekly budget",
    description: "Progress against your weekly budget target",
  },
  {
    key: "spendingTrend",
    label: "Spending trend",
    description: "Chart of spending over time",
  },
  {
    key: "categoryBars",
    label: "Where you spent",
    description: "Ranked bars of spend by category this month",
  },
  {
    key: "recent",
    label: "Recent transactions",
    description: "The latest few transactions",
  },
] as const;

export type HomeWidgetKey = (typeof HOME_WIDGETS)[number]["key"];

const PREF_KEY = "expense-tracker.homeWidgets";

function decode(raw: string): Set<HomeWidgetKey> {
  try {
    const arr = JSON.parse(raw) as unknown;
    if (Array.isArray(arr)) {
      const keys = new Set<HomeWidgetKey>(HOME_WIDGETS.map((w) => w.key));
      return new Set(arr.filter((k): k is HomeWidgetKey => keys.has(k as HomeWidgetKey)));
    }
  } catch {
    /* ignore malformed */
  }
  return new Set(HOME_WIDGETS.map((w) => w.key));
}

function encode(set: Set<HomeWidgetKey>): string {
  return JSON.stringify(HOME_WIDGETS.map((w) => w.key).filter((k) => set.has(k)));
}

export function useHomeWidgets() {
  const [enabled, setLocal] = useLocalPref<Set<HomeWidgetKey>>(
    PREF_KEY,
    new Set(HOME_WIDGETS.map((w) => w.key)),
    (v): v is Set<HomeWidgetKey> => v instanceof Set,
    encode,
    decode
  );
  const { set: setRemote } = useUserPrefs();

  const toggle = (key: HomeWidgetKey) => {
    const next = new Set(enabled);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setLocal(next);
    setRemote(PREF_KEY, encode(next));
  };

  return { enabled, toggle };
}
