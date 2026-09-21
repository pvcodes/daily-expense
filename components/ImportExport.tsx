"use client";

import { useRef, useState } from "react";
import { useExpenses } from "@/hooks/useExpenses";
import {
  parseCSV,
  exportExpensesCSV,
  exportJSON,
  downloadFile,
} from "@/lib/import";

export default function ImportExport() {
  const { transactions, addMany, clearAll } = useExpenses();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [confirmingClear, setConfirmingClear] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const text = String(reader.result || "");
      const result = parseCSV(text, file.name);
      if (result.transactions.length === 0) {
        setMessage({
          type: "err",
          text:
            result.errors[0] || "No valid rows found. Expected Date,Category,Price,Notes header.",
        });
        return;
      }
      addMany(result.transactions);
      const warn = result.errors.length ? ` ${result.errors.length} rows skipped.` : "";
      setMessage({
        type: "ok",
        text: `Imported ${result.transactions.length} transactions.${warn}`,
      });
    };
    reader.onerror = () => setMessage({ type: "err", text: "Failed to read file." });
    reader.readAsText(file);
    e.target.value = "";
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-line bg-panel p-4">
        <h3 className="mb-1 text-sm font-semibold text-ink">Import CSV</h3>
        <p className="mb-3 text-xs text-ink-3">
          Expected columns: Date, Category, Price, Notes. Price is negative for
          expenses.
        </p>
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-xl bg-accent py-3 text-sm font-semibold text-accent-ink active:scale-[0.98]"
        >
          Choose CSV file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleFile}
        />
      </div>

      {message && (
        <div
          className={`rounded-xl border px-3 py-2 text-sm ${
            message.type === "ok"
              ? "border-accent-border bg-accent-soft text-accent-text"
              : "border-red-200 bg-red-50 text-red-600 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="rounded-2xl border border-line bg-panel p-4">
        <h3 className="mb-3 text-sm font-semibold text-ink">Export</h3>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() =>
              downloadFile(
                exportExpensesCSV(transactions),
                "expenses.csv",
                "text/csv"
              )
            }
            className="rounded-xl border border-line-strong bg-panel-2 py-3 text-sm font-medium active:scale-[0.98]"
          >
            CSV
          </button>
          <button
            onClick={() =>
              downloadFile(
                exportJSON(transactions),
                "expenses.json",
                "application/json"
              )
            }
            className="rounded-xl border border-line-strong bg-panel-2 py-3 text-sm font-medium active:scale-[0.98]"
          >
            JSON
          </button>
        </div>
      </div>

      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-950/30">
        <h3 className="mb-3 text-sm font-semibold text-red-600 dark:text-red-300">Danger zone</h3>
        {!confirmingClear ? (
          <button
            onClick={() => setConfirmingClear(true)}
            className="w-full rounded-xl border border-red-200 py-3 text-sm font-medium text-red-600 active:scale-[0.98] dark:border-red-800 dark:text-red-300"
          >
            Clear all transactions
          </button>
        ) : (
          <div className="flex gap-3">
            <button
              onClick={() => {
                clearAll();
                setConfirmingClear(false);
                setMessage({ type: "ok", text: "All transactions cleared." });
              }}
              className="flex-1 rounded-xl bg-red-600 py-3 text-sm font-semibold text-white active:scale-[0.98]"
            >
              Yes, clear
            </button>
            <button
              onClick={() => setConfirmingClear(false)}
              className="flex-1 rounded-xl border border-line-strong bg-panel-2 py-3 text-sm font-medium active:scale-[0.98]"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}