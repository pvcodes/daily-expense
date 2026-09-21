"use client";

import { useEffect, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import { CATEGORIES } from "@/lib/types";

function AddExpenseSheet({ onClose }: { onClose: () => void }) {
  const { addTransaction } = useExpenses();
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => new Date().toTimeString().slice(0, 5));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const p = parseFloat(price);
    if (!Number.isFinite(p) || p <= 0) return;
    setSaving(true);
    addTransaction({ date, time, category, price: -p, notes });
    onClose();
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add expense"
        className="relative w-full max-w-md animate-sheet-up rounded-t-3xl border border-line bg-panel p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-ink">Add expense</h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-m-2 rounded-lg p-2 text-xs text-ink-3"
            >
              Close
            </button>
          </div>

          <input
            type="number"
            inputMode="decimal"
            aria-label="Amount"
            placeholder="Amount"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full rounded-xl border border-line bg-panel-2 px-3 py-3 text-base placeholder:text-ink-3 focus:border-accent focus:outline-none"
            autoFocus
          />

          <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                  category === c
                    ? "bg-accent text-accent-ink"
                    : "border border-line-strong bg-panel-2 text-ink-3"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              aria-label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="min-w-0 rounded-xl border border-line bg-panel-2 px-3 py-3 text-base focus:border-accent focus:outline-none"
            />
            <input
              type="time"
              aria-label="Time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="min-w-0 rounded-xl border border-line bg-panel-2 px-3 py-3 text-base focus:border-accent focus:outline-none"
            />
          </div>

          <input
            type="text"
            placeholder="Notes (optional)"
            aria-label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded-xl border border-line bg-panel-2 px-3 py-3 text-base placeholder:text-ink-3 focus:border-accent focus:outline-none"
          />

          <button
            type="submit"
            disabled={!price || saving}
            className="w-full rounded-xl bg-accent py-3 text-base font-semibold text-accent-ink active:scale-[0.98] disabled:opacity-50"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AddExpense() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Add expense"
        className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom)+0.75rem)] right-4 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lg shadow-accent/25 active:scale-95"
      >
        <svg
          viewBox="0 0 24 24"
          className="h-6 w-6"
          fill="none"
          stroke="currentColor"
          strokeWidth={2.4}
          strokeLinecap="round"
        >
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
      {open && <AddExpenseSheet onClose={() => setOpen(false)} />}
    </>
  );
}