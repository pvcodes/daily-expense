"use client";

import { useMemo, useState } from "react";
import { useCategories } from "@/hooks/useCategories";
import { categoryColor, mergeCategories } from "@/lib/types";

interface Props {
  value: string;
  onChange: (category: string) => void;
  /** Existing chip labels only — hides the "+ New" affordance where it doesn't fit. */
  readOnly?: boolean;
}

/**
 * Horizontal chip row for picking a category, with inline creation: tap
 * "+ New", type a name, press Enter. Names are trimmed, capped at 24 chars and
 * matched case-insensitively against what's already there.
 */
export default function CategoryPicker({ value, onChange, readOnly }: Props) {
  const { categories, addCategory } = useCategories();
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);

  // A transaction can carry a category that predates the user's list (imported
  // CSV, older device). Keep it selectable so editing never silently swaps it.
  const chips = useMemo(
    () => (value ? mergeCategories([value], categories) : categories),
    [value, categories]
  );

  function startAdding() {
    setAdding(true);
    setDraft("");
    setError(null);
  }

  function cancel() {
    setAdding(false);
    setDraft("");
    setError(null);
  }

  function submit() {
    const res = addCategory(draft);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    onChange(res.category);
    cancel();
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2 overflow-x-auto pb-0.5 no-scrollbar">
        {chips.map((c) => {
          const active = value === c;
          const color = categoryColor(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={active}
              onClick={() => onChange(c)}
              className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                active
                  ? "chip-active"
                  : "border border-line-strong bg-panel-2 text-ink-3"
              }`}
            >
              <span
                aria-hidden
                className={`h-1.5 w-1.5 rounded-full ${active ? "bg-accent-ink" : ""}`}
                style={active ? undefined : { background: color }}
              />
              {c}
            </button>
          );
        })}

        {!readOnly && !adding && (
          <button
            type="button"
            onClick={startAdding}
            className="shrink-0 rounded-full border border-dashed border-line-strong px-3 py-1.5 text-xs font-semibold text-ink-3 active:scale-[0.98]"
          >
            + New
          </button>
        )}
      </div>

      {adding && (
        <div className="flex gap-2">
          <input
            type="text"
            autoFocus
            maxLength={24}
            aria-label="New category name"
            placeholder="e.g. Coffee"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              setError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              } else if (e.key === "Escape") {
                e.preventDefault();
                cancel();
              }
            }}
            className={`field min-w-0 flex-1 py-2 text-sm ${
              error ? "border-red-400" : "border-line focus:border-accent"
            }`}
          />
          <button
            type="button"
            onClick={submit}
            disabled={!draft.trim()}
            className="btn-primary shrink-0 px-3 py-2 text-sm"
          >
            Add
          </button>
          <button
            type="button"
            onClick={cancel}
            className="shrink-0 rounded-xl border border-line-strong px-3 py-2 text-sm font-medium text-ink-3"
          >
            Cancel
          </button>
        </div>
      )}

      {error && (
        <p aria-live="polite" className="text-xs text-red-500">
          {error}
        </p>
      )}
    </div>
  );
}
