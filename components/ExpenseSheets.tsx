"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import type { Category } from "@/lib/types";
import { api } from "@/lib/client";
import { currencyFractionDigits, localDateTimeInput } from "@/lib/format";
import type { RecurringDraft, TransactionDraft } from "@/components/dashboard-types";
import { IconFor } from "@/components/ui";

function BottomSheet({ title, eyebrow, onClose, children, focusRef }: {
  title: string; eyebrow: string; onClose: () => void; children: React.ReactNode; focusRef?: React.RefObject<HTMLElement | null>;
}) {
  const viewportHeight = useRef("100dvh");
  const [, renderViewport] = useState(0);
  useEffect(() => {
    const view = window.visualViewport;
    const sync = () => {
      viewportHeight.current = `${view?.height || window.innerHeight}px`;
      renderViewport((v) => v + 1);
    };
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    sync();
    view?.addEventListener("resize", sync);
    view?.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      document.body.style.overflow = oldOverflow;
      view?.removeEventListener("resize", sync);
      view?.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
      requestAnimationFrame(() => focusRef?.current?.focus({ preventScroll: true }));
    };
  }, [focusRef]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") { event.preventDefault(); onClose(); }
    if (event.key !== "Tab") return;
    const nodes = event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])');
    if (!nodes.length) return;
    const first = nodes[0];
    const last = nodes[nodes.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  return <div className="sheet-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
    <section className="sheet" style={{ maxHeight: `calc(${viewportHeight.current} - env(safe-area-inset-top) - 0.5rem)` }}
      role="dialog" aria-modal="true" aria-labelledby="sheet-title" onKeyDown={handleKeyDown}>
      <div className="sheet-handle" aria-hidden="true" />
      <header className="sheet-head"><div><p className="eyebrow">{eyebrow}</p><h2 id="sheet-title">{title}</h2></div>
        <button className="icon-button sheet-close" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button>
      </header>
      {children}
    </section>
  </div>;
}

function CategoryPicker({ categories, value, onChange }: { categories: Category[]; value: string; onChange: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const visibleCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? categories.filter((category) => category.name.toLowerCase().includes(query)) : categories;
  }, [categories, search]);
  return <div className="field">
    <span className="field-label" id="entry-category-label">Category</span>
    {categories.length > 5 && <label className="category-search"><Search size={15} aria-hidden="true" /><span className="sr-only">Search categories</span>
      <input type="search" enterKeyHint="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Find a category" />
    </label>}
    <div className="category-picker" role="group" aria-labelledby="entry-category-label">
      {visibleCategories.map((category) => <button type="button" key={category.id} aria-pressed={category.id === value}
        className={"category-chip" + (category.id === value ? " selected" : "")} onClick={() => onChange(category.id)}>
        <IconFor icon={category.icon} size={14} /><span>{category.name}</span>
      </button>)}
      {!visibleCategories.length && <span className="category-empty">No matching category</span>}
    </div>
  </div>;
}

export function ExpenseSheet({ draft, categories, onClose, onSaved, returnFocusRef }: {
  draft: TransactionDraft | null; categories: Category[]; onClose: () => void; onSaved: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const editing = Boolean(draft?.id);
  const [amount, setAmount] = useState(draft ? String(Math.abs(Number(draft.amount))) : "");
  const [categoryId, setCategoryId] = useState(draft?.category_id || categories[0]?.id || "");
  const [currency, setCurrency] = useState(draft?.currency || "INR");
  const [notes, setNotes] = useState(draft?.notes || "");
  const [occurredAt, setOccurredAt] = useState(draft?.occurred_at || localDateTimeInput());
  const [included, setIncluded] = useState(draft?.include_in_analysis ?? true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError(""); setBusy(true);
    try {
      const body = { amount, category_id: categoryId, currency, notes, occurred_at: occurredAt, include_in_analysis: included };
      if (draft?.id) await api("/api/transactions/" + encodeURIComponent(draft.id), { method: "PATCH", body: JSON.stringify(body) });
      else await api("/api/transactions", { method: "POST", body: JSON.stringify(body) });
      onSaved(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this expense."); }
    finally { setBusy(false); }
  }

  return <BottomSheet eyebrow={editing ? "EDIT TRANSACTION" : "QUICK ENTRY"} title={editing ? "Edit expense" : "Add an expense"} onClose={onClose} focusRef={returnFocusRef}>
    <form className="entry-form" onSubmit={save}>
      <label className="sr-only" htmlFor="expense-amount">Amount</label>
      <div className="amount-field"><span aria-hidden="true">{currency}</span>
        <input ref={amountRef} autoFocus id="expense-amount" type="number" inputMode="decimal" enterKeyHint="done" required
          min={1 / (10 ** currencyFractionDigits(currency))} step={1 / (10 ** currencyFractionDigits(currency))}
          placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} aria-describedby="entry-amount-hint" />
      </div>
      <p className="field-hint" id="entry-amount-hint">Enter the amount you spent</p>
      <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
      <div className="entry-details-content entry-always-visible">
        <div className="expense-date-time-row">
          <input className="expense-date-time-input" aria-label="Date" id="expense-date" type="date" required value={occurredAt.slice(0, 10)} onChange={(event) => setOccurredAt(event.target.value + occurredAt.slice(10))} />
          <input className="expense-date-time-input" aria-label="Time" id="expense-time" type="time" required value={occurredAt.slice(11, 16)} onChange={(event) => setOccurredAt(occurredAt.slice(0, 10) + "T" + event.target.value)} />
        </div>
        <div className="field"><label htmlFor="expense-notes">Note <span className="muted">(optional)</span></label><input id="expense-notes" enterKeyHint="done" autoCapitalize="sentences" autoCorrect="on" maxLength={300} placeholder="What was it for?" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
        <div className="toggle-row"><div className="toggle-copy"><strong>Include in analysis</strong><small>{included ? "Shown in charts and totals" : "Hidden from charts and totals"}</small></div>
          <button type="button" role="switch" aria-checked={included} aria-label="Include in analysis" className={"switch" + (included ? " on" : "")} onClick={() => setIncluded(!included)} />
        </div>
      </div>
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="primary-button entry-submit" type="submit" disabled={busy || !categoryId || !amount}>
        {busy ? "Saving…" : editing ? "Save changes" : "Save expense"}<ArrowRight size={16} aria-hidden="true" />
      </button>
    </form>
  </BottomSheet>;
}

export function RecurringSheet({ draft, categories, onClose, onSaved, returnFocusRef }: {
  draft: RecurringDraft | null; categories: Category[]; onClose: () => void; onSaved: () => void;
  returnFocusRef?: React.RefObject<HTMLElement | null>;
}) {
  const editing = Boolean(draft?.id);
  const [amount, setAmount] = useState(draft ? String(Math.abs(Number(draft.amount))) : "");
  const [categoryId, setCategoryId] = useState(draft?.category_id || categories[0]?.id || "");
  const [currency, setCurrency] = useState(draft?.currency || "INR");
  const [notes, setNotes] = useState(draft?.notes || "");
  const [startDate, setStartDate] = useState(draft?.start_date || localDateTimeInput().slice(0, 10));
  const [endDate, setEndDate] = useState(draft?.end_date || "");
  const [day, setDay] = useState(Number(draft?.day_of_month || localDateTimeInput().slice(8, 10)));
  const [time, setTime] = useState(draft?.run_at_local_time?.slice(0, 5) || "09:00");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  async function save(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError("");
    const body = { amount, category_id: categoryId, currency, notes, start_date: startDate, end_date: endDate || null, day_of_month: Number(day), run_at_local_time: time };
    try {
      if (draft?.id) await api("/api/recurring/" + encodeURIComponent(draft.id), { method: "PATCH", body: JSON.stringify(body) });
      else await api("/api/recurring", { method: "POST", body: JSON.stringify(body) });
      onSaved(); onClose();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save this recurring expense."); }
    finally { setBusy(false); }
  }

  return <BottomSheet eyebrow="MONTHLY REPEAT" title={editing ? "Edit future expenses" : "New recurring expense"} onClose={onClose} focusRef={returnFocusRef}>
    <form className="entry-form recurring-form" onSubmit={save}>
      <label className="field-label" htmlFor="rule-amount">Amount</label>
      <div className="amount-field"><span aria-hidden="true">{currency}</span><input ref={amountRef} autoFocus id="rule-amount" type="number" inputMode="decimal" enterKeyHint="done" min={1 / (10 ** currencyFractionDigits(currency))} step={1 / (10 ** currencyFractionDigits(currency))} required placeholder="0" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
      <CategoryPicker categories={categories} value={categoryId} onChange={setCategoryId} />
      <div className="form-two-columns recurring-fields">
        <div className="field"><label htmlFor="rule-start">Starts on</label><input id="rule-start" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
        <div className="field"><label htmlFor="rule-time">Local time</label><input id="rule-time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} /></div>
        <div className="field"><label htmlFor="rule-day">Day each month</label><input id="rule-day" type="number" inputMode="numeric" enterKeyHint="done" min="1" max="31" required value={day} onChange={(event) => setDay(Number(event.target.value))} /></div>
        <div className="field"><label htmlFor="rule-end">Ends on <span className="muted">(optional)</span></label><input id="rule-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
      </div>
      <details className="entry-details"><summary>Note and currency</summary><div className="entry-details-content">
        <div className="field"><label htmlFor="rule-currency">Currency</label><input id="rule-currency" maxLength={3} autoCapitalize="characters" value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></div>
        <div className="field"><label htmlFor="rule-note">Note <span className="muted">(optional)</span></label><input id="rule-note" enterKeyHint="done" autoCapitalize="sentences" autoCorrect="on" maxLength={300} placeholder="Rent, subscription…" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
      </div></details>
      <p className="field-hint">Short months use their final day. Due entries keep this local time.</p>
      {error && <p className="error-message" role="alert">{error}</p>}
      <button className="primary-button entry-submit" type="submit" disabled={busy || !categoryId || !amount}>{busy ? "Saving…" : editing ? "Save future changes" : "Create monthly rule"}<ArrowRight size={16} aria-hidden="true" /></button>
    </form>
  </BottomSheet>;
}
