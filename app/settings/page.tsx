"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import ImportExport from "@/components/ImportExport";
import ThemeToggle from "@/components/ThemeToggle";
import { useMonthlyBudget } from "@/hooks/useMonthlyBudget";
import { useWeekStart } from "@/hooks/useWeekStart";
import { useHomeWidgets, HOME_WIDGETS } from "@/hooks/useHomeWidgets";
import { useSessionUser } from "@/hooks/useSessionUser";
import { purgeUserScopedState } from "@/lib/storage";
import { formatMoney } from "@/lib/format";

export default function SettingsPage() {
  const { budget, setBudget } = useMonthlyBudget();
  const { weekStart, setWeekStart } = useWeekStart();
  const { enabled, toggle } = useHomeWidgets();
  const { user: sessionUser, loading } = useSessionUser();
  const router = useRouter();
  const [budgetDraft, setBudgetDraft] = useState(
    budget > 0 ? String(budget) : ""
  );
  const budgetDirty = useRef(false);

  // The saved budget loads async from localStorage on mount; reflect it in
  // the input unless the user has already started typing.
  useEffect(() => {
    if (!budgetDirty.current) {
      setBudgetDraft(budget > 0 ? String(budget) : "");
    }
  }, [budget]);

  async function logout() {
    // Wipe this device's cached pages/API responses first so the next person
    // who signs in can never read them offline.
    await purgeUserScopedState();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {
      // continue to login page regardless
    }
    router.replace("/login");
    router.refresh();
  }

  function saveBudget() {
    const v = parseFloat(budgetDraft);
    budgetDirty.current = false;
    if (Number.isFinite(v) && v > 0) setBudget(Math.round(v));
    else setBudget(0);
  }

  function removeBudget() {
    budgetDirty.current = false;
    setBudgetDraft("");
    setBudget(0);
  }

  return (
    <main className="flex-1 space-y-4 p-4 pt-5 sm:p-5">
      <header>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-text">Make it yours</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">Settings</h1>
      </header>

      <div className="card space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Account</h2>
          <p className="mt-0.5 truncate text-xs text-ink-3">
            {sessionUser
              ? `Signed in as ${sessionUser} — this ledger only`
              : loading
                ? "Checking session…"
                : "Signed in"}
          </p>
        </div>
        <button
          onClick={logout}
          className="w-full rounded-xl border border-line-strong bg-panel-2 py-3 text-sm font-bold active:scale-[0.98]"
        >
          Log out
        </button>
        <p className="text-xs text-ink-3">
          Logging out clears this device&apos;s cached data so the next person
          can&apos;t see it. Your transactions stay on the server.
        </p>
      </div>

      <div className="card space-y-3 p-4">
        <h2 className="text-sm font-semibold text-ink">Monthly budget</h2>
        <p className="text-xs text-ink-3">
          {budget > 0
            ? `Current target: ${formatMoney(budget)} per month.`
            : "Compare this month's spending against a target."}
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Amount per month"
            aria-label="Monthly budget amount"
            value={budgetDraft}
            onChange={(e) => {
              budgetDirty.current = true;
              setBudgetDraft(e.target.value);
            }}
            className="field min-w-0 flex-1 placeholder:text-ink-3"
          />
          <button
            onClick={saveBudget}
            className="btn-primary shrink-0 px-5 py-3 text-sm"
          >
            {budget > 0 ? "Update" : "Set"}
          </button>
          {budget > 0 && (
            <button
              onClick={removeBudget}
              className="shrink-0 rounded-xl border border-line-strong bg-panel-2 px-4 py-3 text-sm font-medium text-ink-3 active:scale-[0.98]"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Week starts on</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Used for the weekly chart buckets.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-2xl border-[1.5px] border-line-strong bg-panel-2 p-1">
          {(["monday", "sunday"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setWeekStart(d)}
              className={`rounded-lg py-2 text-sm capitalize transition-colors ${
                weekStart === d
                  ? "bg-panel text-ink shadow-sm"
                  : "text-ink-3 active:text-ink"
              }`}
            >
              {d}
            </button>
          ))}
        </div>
      </div>

      <div className="card space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Home screen widgets</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Choose which sections appear on the home screen.
          </p>
        </div>
        <ul className="divide-y divide-line">
          {HOME_WIDGETS.map((w) => {
            const on = enabled.has(w.key);
            return (
              <li key={w.key} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-ink">{w.label}</div>
                  <div className="text-xs text-ink-3">{w.description}</div>
                </div>
                <button
                  role="switch"
                  aria-checked={on}
                  aria-label={`Toggle ${w.label}`}
                  onClick={() => toggle(w.key)}
                  className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
                    on ? "bg-accent" : "bg-line-strong"
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${
                      on ? "left-[22px]" : "left-0.5"
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="card space-y-3 p-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Appearance</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Dark is the default. Light is for the bright days.
          </p>
        </div>
        <ThemeToggle />
      </div>

      <ImportExport />
    </main>
  );
}
