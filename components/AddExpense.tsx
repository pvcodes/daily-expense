"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useExpenses } from "@/hooks/useExpenses";
import { useHomeWidgets } from "@/hooks/useHomeWidgets";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import CategoryPicker from "@/components/CategoryPicker";
import { localTodayISO, localNowTime } from "@/lib/format";

function AddExpenseSheet({ onClose }: { onClose: () => void }) {
  const { addTransaction } = useExpenses();
  const [price, setPrice] = useState("");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => localTodayISO());
  const [time, setTime] = useState(() => localNowTime());
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
    <div
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex: 70 }}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Add expense"
        style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
        className="relative w-full max-w-xl animate-sheet-up rounded-t-[2rem] border border-line bg-panel p-5 shadow-[var(--card-shadow)]"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-text">Quick drop</p><h2 className="mt-1 text-xl font-extrabold tracking-tight text-ink">Add expense</h2></div>
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
            type="text"
            inputMode="decimal"
            aria-label="Amount"
            placeholder="₹ 0"
            value={price}
            onChange={(e) =>
              setPrice(
                e.target.value.replace(/[^\d.]/g, "").replace(/(\..*)\./g, "$1")
              )
            }
            className="field w-full py-4 text-3xl font-black tracking-tight tabular-nums placeholder:text-ink-3"
            autoFocus
          />

          <CategoryPicker value={category} onChange={setCategory} />

          <button
            type="button"
            aria-expanded={detailsOpen}
            onClick={() => setDetailsOpen((open) => !open)}
            className="flex min-h-11 w-full items-center justify-between rounded-xl px-1 text-sm font-semibold text-ink-2"
          >
            <span>{detailsOpen ? "Less details" : "Add a note, date or time"}</span>
            <span aria-hidden="true" className="text-lg text-accent-text">{detailsOpen ? "−" : "+"}</span>
          </button>
          {detailsOpen && (
            <div className="animate-pop space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <input type="date" aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} className="field min-w-0" />
                <input type="time" aria-label="Time" value={time} onChange={(e) => setTime(e.target.value)} className="field min-w-0" />
              </div>
              <input type="text" placeholder="What was it for? (optional)" aria-label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="field w-full placeholder:text-ink-3" />
            </div>
          )}

          <button
            type="submit"
            disabled={!price || saving}
            className="btn-primary w-full py-3 text-base"
          >
            Add expense
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AddExpense() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { enabled } = useHomeWidgets();

  if (pathname === "/login" || !enabled.has("addExpense")) return null;

  return (
    <>
      {!open && (
        <div
          className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center"
          style={{ zIndex: 100 }}
        >
          <div
            className="flex w-full max-w-xl justify-end px-4 sm:px-3"
            style={{ paddingBottom: "calc(6rem + env(safe-area-inset-bottom))" }}
          >
            <button
              onClick={() => setOpen(true)}
              aria-label="Add expense"
              className="btn-fab pointer-events-auto flex h-14 items-center justify-center gap-2 px-4 text-sm font-extrabold active:scale-90"
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
              <span>Add</span>
            </button>
          </div>
        </div>
      )}
      {open && <AddExpenseSheet onClose={() => setOpen(false)} />}
    </>
  );
}
