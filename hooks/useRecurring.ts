"use client";

import { useCallback, useEffect, useState } from "react";
import type { RecurringRule } from "@/lib/types";

export function useRecurring() {
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/recurring");
      if (res.ok) {
        const body = (await res.json()) as { rules: RecurringRule[] };
        setRules(body.rules);
      }
    } catch {
      // offline: keep last known rules
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void refresh();
    }, 0);
    return () => clearTimeout(t);
  }, [refresh]);

  const addRule = useCallback(
    async (rule: Omit<RecurringRule, "id" | "lastGenerated">) => {
      const res = await fetch("/api/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rule),
      });
      if (!res.ok) throw new Error("Couldn't save rule");
      const body = (await res.json()) as { rules: RecurringRule[] };
      setRules(body.rules);
    },
    []
  );

  const removeRule = useCallback(async (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
    const res = await fetch(`/api/recurring?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      // revert on failure
      const refreshRes = await fetch("/api/recurring");
      if (refreshRes.ok) {
        const body = (await refreshRes.json()) as { rules: RecurringRule[] };
        setRules(body.rules);
      }
      throw new Error("Couldn't delete rule");
    }
  }, []);

  const updateRule = useCallback(async (rule: RecurringRule) => {
    const res = await fetch("/api/recurring", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(rule),
    });
    if (!res.ok) throw new Error("Couldn't update rule");
    const body = (await res.json()) as { rules: RecurringRule[] };
    setRules(body.rules);
  }, []);

  return { rules, loaded, refresh, addRule, removeRule, updateRule };
}
