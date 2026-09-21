"use client";

/**
 * Preferences that persist to BOTH localStorage (fast, offline-first) and the
 * server DB (single-owner, shared across devices).
 *
 * Reading is synchronous from localStorage for instant UI. Writes hit
 * localStorage immediately and the DB debounced. On mount we pull the server
 * copy and merge: server values fill gaps only when localStorage has no value
 * for a given key (keeps local edits authoritative).
 */
import { useCallback, useEffect, useRef, useState } from "react";

const PREF_KEYS = [
  "expense-tracker.period",
  "expense-tracker.txns.cat",
  "expense-tracker.txns.search",
  "expense-tracker.weekStart",
  "expense-tracker.accent",
  "expense-tracker.budget.v1",
  "expense-tracker.homeWidgets",
];

function loadLocal(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function saveLocal(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

async function fetchPrefs(): Promise<Record<string, string>> {
  const res = await fetch("/api/prefs");
  if (!res.ok) return {};
  const body = await res.json().catch(() => ({}));
  return body.prefs || {};
}

export function useUserPrefs() {
  const [syncState, setSyncState] = useState<"idle" | "syncing" | "error">("idle");
  const [loaded, setLoaded] = useState(false);
  const queued = useRef<Map<string, string>>(new Map());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const server = await fetchPrefs();
        if (cancelled) return;
        // Fill gaps only: never overwrite a value we already have locally.
        for (const key of PREF_KEYS) {
          if (loadLocal(key) === null && server[key] !== undefined) {
            saveLocal(key, server[key]);
          }
        }
      } catch {
        // offline — proceed with local only
      } finally {
        if (!cancelled) setLoaded(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistToServer = useCallback(() => {
    if (queued.current.size === 0) return;
    const pairs = [...queued.current.entries()].map(([key, value]) => ({
      key,
      value,
    }));
    queued.current.clear();
    setSyncState("syncing");
    fetch("/api/prefs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prefs: pairs }),
    })
      .then((res) => {
        setSyncState(res.ok ? "idle" : "error");
      })
      .catch(() => setSyncState("error"));
  }, []);

  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    persistToServer();
  }, [persistToServer]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      // best-effort flush before unmount
      if (queued.current.size > 0) persistToServer();
    };
  }, [persistToServer]);

  const set = useCallback(
    (key: string, value: string) => {
      saveLocal(key, value);
      queued.current.set(key, value);
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(flush, 1200);
    },
    [flush]
  );

  return { set, syncState, loaded };
}
