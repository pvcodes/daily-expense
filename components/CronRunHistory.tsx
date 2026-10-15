"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Clock3, RefreshCw, XCircle } from "lucide-react";
import type { CronRun } from "@/lib/types";
import { api } from "@/lib/client";
import { dateLabel } from "@/lib/format";
import { Notice, SkeletonBlock } from "@/components/ui";

function runStatus(run: CronRun) {
  if (run.status === "succeeded") return { label: "Passed", className: "is-success", Icon: CheckCircle2 };
  if (run.status === "failed") return { label: "Failed", className: "is-failure", Icon: XCircle };
  const overdue = Date.now() - new Date(run.started_at).getTime() > 10 * 60 * 1000;
  return { label: overdue ? "No result recorded" : "In progress", className: overdue ? "is-failure" : "is-running", Icon: Clock3 };
}

export function CronRunHistory() {
  const [runs, setRuns] = useState<CronRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    api<{ runs: CronRun[] }>("/api/cron/runs", { signal: controller.signal })
      .then((result) => { setRuns(result.runs); setError(""); })
      .catch((cause) => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "Could not load cron run history.");
      })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refreshKey]);

  return <div className="cron-run-history" aria-live="polite" aria-busy={loading}>
    <div className="cron-run-heading">
      <p>Latest 30 runs, shown in India time.</p>
      <button type="button" className="icon-button cron-refresh" aria-label="Refresh cron history" onClick={() => setRefreshKey((key) => key + 1)} disabled={loading}>
        <RefreshCw size={15} aria-hidden="true" />
      </button>
    </div>
    {error ? <Notice onRetry={() => setRefreshKey((key) => key + 1)}>{error}</Notice> : loading && !runs.length ? <SkeletonBlock className="list-skeleton" /> : runs.length ?
      <ol className="cron-run-list">
        {runs.map((run) => {
          const status = runStatus(run);
          const StatusIcon = status.Icon;
          const date = dateLabel(run.started_at, { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
          return <li className="cron-run-row" key={run.id}>
            <StatusIcon className={`cron-run-icon ${status.className}`} size={18} aria-hidden="true" />
            <div className="cron-run-main">
              <div className="cron-run-topline"><strong>{status.label}</strong><time dateTime={run.started_at}>{date}</time></div>
              <p>{run.status === "failed" ? `Could not process recurring expenses${run.error_code ? ` · ${run.error_code}` : ""}` : run.status === "running" ? "The recurring job has not recorded a result yet." : run.generated_count ? `${run.generated_count} expense${run.generated_count === 1 ? "" : "s"} added` : "No expenses were due"}</p>
              <small>{run.source === "vercel_cron" ? "Scheduled run" : "Manual request"}{run.duration_ms !== null ? ` · ${(run.duration_ms / 1000).toFixed(1)}s` : ""}{run.request_id ? ` · ${run.request_id.slice(0, 24)}` : ""}</small>
            </div>
          </li>;
        })}
      </ol> : <p className="cron-run-empty">No recurring runs have been recorded yet. The next scheduled run will appear here.</p>}
  </div>;
}
