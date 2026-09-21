"use client";

import { useEffect, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { fetchRemote } from "@/hooks/sync";

export default function CloudSync() {
  const { transactions, refresh, clearAll, error, lastSyncAt, offline } =
    useExpenses();
  const [remoteCount, setRemoteCount] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchRemote()
      .then((r) => {
        if (!cancelled) {
          setRemoteCount(r.count);
          if (r.offline) setMsg({ type: "err", text: "Offline — showing cached data." });
        }
      })
      .catch(() => {
        if (!cancelled) setRemoteCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function run(fn: () => Promise<void>, okText: string) {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      setMsg({ type: "ok", text: okText });
    } catch (e) {
      setMsg({ type: "err", text: (e as Error).message });
    } finally {
      setBusy(false);
      fetchRemote()
        .then((r) => setRemoteCount(r.count))
        .catch(() => setRemoteCount(null));
    }
  }

  const syncedAt =
    lastSyncAt == null
      ? "never"
      : new Date(lastSyncAt).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

  return (
    <div className="space-y-3 rounded-2xl border border-line bg-panel p-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-ink">Cloud</h3>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/10 px-2 py-0.5 text-[11px] font-medium text-accent-text">
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              remoteCount === null ? "bg-ink-3" : "bg-accent"
            }`}
          />
          {remoteCount === null ? "offline" : `${remoteCount} on server`}
        </span>
      </div>

      <p className="text-xs text-ink-3">
        Your data lives on the server and stays in sync across devices. The app
        loads it on open, refreshes on focus and every minute, and saves
        changes immediately. Last updated {syncedAt}.
      </p>

      {offline && (
        <div className="rounded-lg border border-amber-300/60 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:border-amber-500/30 dark:text-amber-300">
          You&apos;re offline. Showing cached data; edits resume when you reconnect.
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </div>
      )}

      <button
        disabled={busy}
        onClick={() => run(async () => { await refresh(); }, "Refreshed from server.")}
        className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-ink active:scale-[0.98] disabled:opacity-50"
      >
        Refresh now
      </button>

      {transactions.length > 0 ? (
        <button
          disabled={busy}
          onClick={() => {
            if (!confirm("Delete ALL transactions on the server? This cannot be undone.")) return;
            run(
              async () => {
                clearAll();
              },
              `Cleared ${transactions.length} transactions.`
            );
          }}
          className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 active:scale-[0.98] disabled:opacity-50 dark:border-red-800 dark:text-red-300"
        >
          Clear all data
        </button>
      ) : null}

      {msg && (
        <div
          className={`rounded-lg border px-3 py-2 text-xs ${
            msg.type === "ok"
              ? "border-accent-border bg-accent-soft text-accent-text"
              : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {msg.text}
        </div>
      )}
    </div>
  );
}