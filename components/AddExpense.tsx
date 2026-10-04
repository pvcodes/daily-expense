"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useExpenses } from "@/hooks/useExpenses";
import { useHomeWidgets } from "@/hooks/useHomeWidgets";
import { useKeyboardVisible } from "@/hooks/useKeyboardVisible";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import CategoryPicker from "@/components/CategoryPicker";
import { localTodayISO, localNowTime } from "@/lib/format";

function AddExpenseSheet({
  onClose,
}: {
  onClose: () => void;
}) {
  const { addTransaction } = useExpenses();
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState<string>(DEFAULT_CATEGORIES[0]);
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => localTodayISO());
  const [time, setTime] = useState(() => localNowTime());
  const [saving, setSaving] = useState(false);
  const sheetRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key !== "Tab") return;
      const dialog = sheetRef.current;
      const focusable = dialog?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const viewport = window.visualViewport;
    const syncViewport = () => {
      const container = viewportRef.current;
      if (!container) return;
      container.style.setProperty(
        "--visual-viewport-height",
        `${viewport?.height ?? window.innerHeight}px`
      );
      container.style.setProperty(
        "--visual-viewport-top",
        `${viewport?.offsetTop ?? 0}px`
      );
    };
    syncViewport();
    viewport?.addEventListener("resize", syncViewport);
    viewport?.addEventListener("scroll", syncViewport);
    window.addEventListener("resize", syncViewport);
    sheetRef.current?.focus({ preventScroll: true });

    return () => {
      document.removeEventListener("keydown", onKey);
      viewport?.removeEventListener("resize", syncViewport);
      viewport?.removeEventListener("scroll", syncViewport);
      window.removeEventListener("resize", syncViewport);
      document.body.style.overflow = previousOverflow;
    };
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
      ref={viewportRef}
      className="visual-viewport fixed inset-x-0 z-[70] flex items-end justify-center"
      style={{
        paddingLeft: "env(safe-area-inset-left)",
        paddingRight: "env(safe-area-inset-right)",
      }}
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-expense-title"
        tabIndex={-1}
        ref={sheetRef}
        style={{
          maxHeight: "calc(var(--visual-viewport-height, 100dvh) - env(safe-area-inset-top) - 0.5rem)",
          overflowY: "auto",
          paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))",
          overscrollBehavior: "contain",
          WebkitOverflowScrolling: "touch",
        }}
        className="relative w-full max-w-xl animate-sheet-up rounded-t-[2rem] border border-line bg-panel p-5 shadow-[var(--card-shadow)] outline-none"
      >
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-line-strong" />
        <form onSubmit={submit} className="space-y-3">
          <div className="flex items-center justify-between">
            <div><p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-text">Quick drop</p><h2 id="add-expense-title" className="mt-1 text-xl font-extrabold tracking-tight text-ink">Add expense</h2></div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-m-1 flex min-h-11 min-w-11 items-center justify-center rounded-lg p-2 text-xs text-ink-3"
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
          />

          <CategoryPicker value={category} onChange={setCategory} />

          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input type="date" aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} className="field min-w-0" />
              <input type="time" aria-label="Time" value={time} onChange={(e) => setTime(e.target.value)} className="field min-w-0" />
            </div>
            <input type="text" placeholder="What was it for? (optional)" aria-label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="field w-full placeholder:text-ink-3" />
          </div>

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
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const { enabled } = useHomeWidgets();
  const keyboardVisible = useKeyboardVisible();
  const closeSheet = useCallback(() => {
    setOpen(false);
    window.requestAnimationFrame(() => triggerRef.current?.focus({ preventScroll: true }));
  }, []);

  if (pathname === "/login" || !enabled.has("addExpense")) return null;

  return (
    <>
      {!open && (
        <div
            className={`pointer-events-none fixed inset-x-0 bottom-0 flex justify-center transition-[opacity,transform] duration-150 ${keyboardVisible ? "translate-y-full opacity-0" : "translate-y-0 opacity-100"}`}
          style={{ zIndex: 100 }}
        >
          <div
            className="flex w-full max-w-xl justify-end"
            style={{
              paddingBottom: "calc(6rem + env(safe-area-inset-bottom))",
              paddingLeft: "calc(1rem + env(safe-area-inset-left))",
              paddingRight: "calc(1rem + env(safe-area-inset-right))",
            }}
          >
            <button
              ref={triggerRef}
              onClick={() => setOpen(true)}
              aria-label="Add expense"
              aria-hidden={keyboardVisible}
              tabIndex={keyboardVisible ? -1 : 0}
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
      {open && <AddExpenseSheet onClose={closeSheet} />}
    </>
  );
}
