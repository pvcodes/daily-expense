"use client";

import Link from "next/link";
import type { Transaction } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { formatMoney, formatDate, formatTime } from "@/lib/format";

export default function TransactionRow({
  tx,
  showCategory = true,
  compact = false,
}: {
  tx: Transaction;
  showCategory?: boolean;
  compact?: boolean;
}) {
  const sub = [
    formatDate(tx.date),
    tx.time && tx.time !== "00:00" ? formatTime(tx.time) : null,
    showCategory ? tx.category : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/transactions/${tx.id}`}
      className={`flex min-w-0 flex-1 items-center gap-3 active:bg-panel-2 ${
        compact ? "px-4 py-2" : "px-3 py-2.5"
      }`}
    >
      <span
        className="h-9 w-1.5 shrink-0 rounded-full"
        style={{ background: CATEGORY_COLORS[tx.category] || "#64748b" }}
      />
      <div className="min-w-0 flex-1">
        <div className={`truncate text-ink ${compact ? "text-sm" : "text-sm font-medium"}`}>
          {tx.notes || tx.category}
        </div>
        <div className="truncate text-xs text-ink-3">{sub}</div>
      </div>
      <div
        className={`shrink-0 tabular-nums text-rose-500 dark:text-rose-400 ${
          compact ? "text-sm font-medium" : "text-sm font-semibold"
        }`}
      >
        {formatMoney(tx.price)}
      </div>
    </Link>
  );
}