"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useExpenses } from "@/hooks/useExpenses";
import { DEFAULT_CATEGORIES } from "@/lib/types";
import CategoryPicker from "@/components/CategoryPicker";
import { EmptyState, Section, Skeleton } from "@/components/ui";

export default function TransactionEditPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { transactions, loaded, updateTransaction, deleteTransaction } =
    useExpenses();

  const tx = transactions.find((t) => t.id === params.id);
  const [amount, setAmount] = useState(() => (tx ? String(Math.abs(tx.price)) : ""));
  const [category, setCategory] = useState<string>(
    () => tx?.category || DEFAULT_CATEGORIES[0]
  );
  const [date, setDate] = useState(() => tx?.date || "");
  const [time, setTime] = useState(() => tx?.time && tx.time !== "00:00" ? tx.time.slice(0, 5) : "");
  const [notes, setNotes] = useState(() => tx?.notes || "");
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  if (!loaded) {
    return (
      <main className="flex-1 space-y-4 p-4 pt-6">
        <Skeleton className="h-8 w-32" />
        <Section>
          <Skeleton className="h-12 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
          <Skeleton className="mt-3 h-10 w-full" />
        </Section>
      </main>
    );
  }

  if (!tx) {
    return (
      <main className="flex-1 p-4 pt-6">
        <h1 className="text-2xl font-extrabold">✏️ Edit</h1>
        <EmptyState
          title="Transaction not found"
          hint="It may have been deleted on another device."
          action={
            <Link
              href="/transactions"
              className="btn-primary rounded-full! px-4 py-2 text-xs"
            >
              Back to transactions
            </Link>
          }
        />
      </main>
    );
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseFloat(amount);
    if (!Number.isFinite(p) || p <= 0) return;
    setSaving(true);
    updateTransaction(tx.id, { date: date || tx.date, time, category, price: -p, notes });
    router.back();
  };

  const remove = () => {
    setSaving(true);
    deleteTransaction(tx.id);
    router.back();
  };

  return (
    <main className="flex-1 space-y-4 p-4 pt-6 pb-4">
      <header className="flex items-center gap-2">
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="-m-2 rounded-lg p-2 text-ink-3 active:text-ink"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round">
            <path d="m15 18-6-6 6-6" strokeWidth={2} />
          </svg>
        </button>
        <h1 className="text-2xl font-extrabold">✏️ Edit</h1>
      </header>

      <Section>
        <form onSubmit={submit} className="space-y-3" data-testid="edit-form">
          <input
            type="number"
            inputMode="decimal"
            aria-label="Amount"
            placeholder="Amount"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="field w-full placeholder:text-ink-3"
            autoFocus
          />

          <CategoryPicker value={category} onChange={setCategory} />

          <div className="grid grid-cols-2 gap-3">
            <input
              type="date"
              aria-label="Date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="field min-w-0"
            />
            <input
              type="time"
              aria-label="Time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="field min-w-0"
            />
          </div>

          <input
            type="text"
            placeholder="Notes (optional)"
            aria-label="Notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="field w-full placeholder:text-ink-3"
          />

          <button
            type="submit"
            disabled={saving}
            className="btn-primary w-full py-3 text-base"
          >
            Save changes
          </button>
        </form>
      </Section>

      <Section>
        {confirmDelete ? (
          <div className="flex flex-col gap-2">
            <p className="text-sm text-ink-2">Delete this transaction?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(false)}
                disabled={saving}
                className="flex-1 rounded-xl border border-line-strong bg-panel-2 py-2.5 text-sm font-medium text-ink active:scale-[0.98] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={remove}
                disabled={saving}
                className="flex-1 rounded-xl bg-red-500 py-2.5 text-sm font-semibold text-white active:scale-[0.98] disabled:opacity-50"
              >
                Delete
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={saving}
            className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 active:scale-[0.98] disabled:opacity-50 dark:border-red-800 dark:text-red-300"
          >
            Delete this transaction
          </button>
        )}
      </Section>
    </main>
  );
}
