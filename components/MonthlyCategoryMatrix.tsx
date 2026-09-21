"use client";

import { useMemo } from "react";
import type { Transaction } from "@/lib/types";
import { CATEGORY_COLORS } from "@/lib/types";
import { categoryMonthMatrix } from "@/lib/analytics";
import { formatMoney } from "@/lib/format";

const MAX_ROWS = 8;

export default function MonthlyCategoryMatrix({
  transactions,
}: {
  transactions: Transaction[];
}) {
  const m = useMemo(() => categoryMonthMatrix(transactions), [transactions]);

  if (m.grandTotal === 0) {
    return (
      <p className="py-4 text-center text-sm text-ink-3">No expenses in the last 6 months.</p>
    );
  }

  const visible = m.rows.slice(0, MAX_ROWS);
  const hidden = m.rows.length - visible.length;

  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[430px] border-collapse text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-panel py-1 pr-3 text-left text-xs font-medium text-ink-3">
              Category
            </th>
            {m.labels.map((l, i) => (
              <th
                key={i}
                className="px-2 py-1 text-right text-xs font-medium text-ink-3"
                title={m.months[i]}
              >
                {l}
              </th>
            ))}
            <th className="px-2 py-1 text-right text-xs font-medium text-ink-3">
              Total
            </th>
          </tr>
        </thead>
        <tbody>
          {visible.map((r) => (
            <tr key={r.name} className="border-t border-line">
              <td className="sticky left-0 z-10 max-w-[9rem] truncate bg-panel py-2 pr-3">
                <span className="flex items-center gap-1.5 text-sm text-ink">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ background: CATEGORY_COLORS[r.name] || "#64748b" }}
                  />
                  <span className="truncate">{r.name}</span>
                </span>
              </td>
              {r.values.map((v, i) => (
                <td
                  key={i}
                  className="px-2 py-2 text-right text-[13px] tabular-nums text-ink-2"
                >
                  {v > 0 ? formatMoney(v) : <span className="text-ink-3/40">–</span>}
                </td>
              ))}
              <td className="px-2 py-2 text-right text-sm font-semibold tabular-nums text-ink">
                {formatMoney(r.total)}
              </td>
            </tr>
          ))}
          {hidden > 0 && (
            <tr className="border-t border-line">
              <td className="sticky left-0 z-10 bg-panel py-2 pr-3 text-xs text-ink-3">
                +{hidden} more
              </td>
              <td colSpan={m.labels.length + 1} className="py-2" />
            </tr>
          )}
        </tbody>
        <tfoot>
          <tr className="border-t border-line-strong">
            <td className="sticky left-0 z-10 bg-panel py-2 pr-3 text-sm font-semibold text-ink">
              Total
            </td>
            {m.monthTotals.map((v, i) => (
              <td
                key={i}
                className="px-2 py-2 text-right text-[13px] font-medium tabular-nums text-ink"
              >
                {formatMoney(v)}
              </td>
            ))}
            <td className="px-2 py-2 text-right text-sm font-semibold tabular-nums text-ink">
              {formatMoney(m.grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>
      <p className="mt-2 text-center text-[11px] text-ink-3">
        Last {m.labels.length} months · expenses only
      </p>
    </div>
  );
}