"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import ImportExport from "@/components/ImportExport";
import CloudSync from "@/components/CloudSync";
import ThemeToggle from "@/components/ThemeToggle";
import AccentPicker from "@/components/AccentPicker";
import { useWeeklyBudget } from "@/hooks/useWeeklyBudget";
import { useWeekStart } from "@/hooks/useWeekStart";
import { useHomeWidgets, HOME_WIDGETS } from "@/hooks/useHomeWidgets";
import { clearLocalDataAndCache } from "@/lib/storage";

export default function SettingsPage() {
  const { budget, setBudget } = useWeeklyBudget();
  const { weekStart, setWeekStart } = useWeekStart();
  const { enabled, toggle } = useHomeWidgets();
  const router = useRouter();
  const [budgetDraft, setBudgetDraft] = useState(
    budget > 0 ? String(budget) : ""
  );
  const [clearing, setClearing] = useState(false);

  async function logout() {
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
    if (Number.isFinite(v) && v > 0) setBudget(Math.round(v));
    else setBudget(0);
  }

  async function clearLocalData() {
    if (
      !confirm(
        "This clears local preferences and cached app files on THIS device. Your transactions live on the server and are unaffected. Continue?"
      )
    ) {
      return;
    }
    setClearing(true);
    try {
      await clearLocalDataAndCache();
    } finally {
      window.location.reload();
    }
  }

  return (
    <main className="flex-1 space-y-4 p-4 pt-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">Settings</h1>
      </header>

      <div className="space-y-3 rounded-2xl border border-line bg-panel p-4">
        <h2 className="text-sm font-semibold text-ink">Weekly budget</h2>
        <p className="text-xs text-ink-3">
          Compare this week&apos;s spending against a target.
        </p>
        <div className="flex gap-2">
          <input
            type="number"
            inputMode="numeric"
            placeholder="Amount per week"
            aria-label="Weekly budget amount"
            value={budgetDraft}
            onChange={(e) => setBudgetDraft(e.target.value)}
            className="min-w-0 flex-1 rounded-xl border border-line bg-panel-2 px-4 py-3 text-base placeholder:text-ink-3 focus:border-accent focus:outline-none"
          />
          <button
            onClick={saveBudget}
            className="shrink-0 rounded-xl bg-accent px-5 py-3 text-sm font-semibold text-accent-ink active:scale-[0.98]"
          >
            {budget > 0 ? "Update" : "Set"}
          </button>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-ink">Week starts on</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Used for the weekly budget and weekly chart buckets.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-1 rounded-xl border border-line bg-panel-2 p-1">
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

      <div className="space-y-3 rounded-2xl border border-line bg-panel p-4">
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

      <div className="space-y-3 rounded-2xl border border-line bg-panel p-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">Appearance</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Light is the default. Dark saves on this device.
          </p>
        </div>
        <ThemeToggle />
        <div>
          <h2 className="text-sm font-semibold text-ink">Color scheme</h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Pick an accent for buttons and charts.
          </p>
        </div>
        <AccentPicker />
      </div>

      <div className="space-y-3 rounded-2xl border border-line bg-panel p-4">
        <div>
          <h2 className="text-sm font-semibold text-ink">
            Reset this device
          </h2>
          <p className="mt-0.5 text-xs text-ink-3">
            Clears local preferences and cached app files so the latest update
            loads on this device. Your transactions live on the server and are
            unaffected.
          </p>
        </div>
        <button
          disabled={clearing}
          onClick={clearLocalData}
          className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 active:scale-[0.98] disabled:opacity-50 dark:border-red-800 dark:text-red-300"
        >
          {clearing ? "Clearing…" : "Clear local data & cache"}
        </button>
      </div>

      <div className="rounded-2xl border border-line bg-panel p-4">
        <h2 className="mb-1 text-sm font-semibold text-ink">Account</h2>
        <p className="mb-3 text-xs text-ink-3">
          You&apos;re signed in as the owner.
        </p>
        <button
          onClick={logout}
          className="w-full rounded-xl border border-line-strong bg-panel-2 py-3 text-sm font-medium active:scale-[0.98]"
        >
          Log out
        </button>
      </div>

      <CloudSync />

      <ImportExport />
    </main>
  );
}