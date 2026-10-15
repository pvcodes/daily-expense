import { memo } from "react";
import { Archive } from "lucide-react";
import { dateLabel, money } from "@/lib/format";
import type { Transaction } from "@/lib/types";
import { IconFor } from "@/components/ui";

import { useCallback } from "react";
export const TransactionRow = memo(function TransactionRow({ transaction, onEdit }: { transaction: Transaction; onEdit: (transaction: Transaction) => void }) {
  const amount = Math.abs(Number(transaction.amount));
  const date = dateLabel(transaction.occurred_at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
  const handleClick = useCallback(() => onEdit(transaction), [onEdit, transaction]);
  return <button type="button" className="transaction-row" onClick={handleClick}
    aria-label={`Edit ${transaction.category_name}, ${money(amount, transaction.currency)}`}>
    <span className="category-icon"><IconFor icon={transaction.category_icon} /></span>
    <span className="transaction-main">
      <strong>{transaction.notes || transaction.category_name}</strong>
      <small>{date}{transaction.notes ? ` · ${transaction.category_name}` : ""}</small>
      {!transaction.include_in_analysis && <span className="analysis-tag"><Archive size={12} aria-hidden="true" /> Excluded from insights</span>}
    </span>
    <span className="transaction-amount">−{money(amount, transaction.currency)}
      <small>{transaction.recurring_rule_id ? "Recurring" : "Expense"}</small>
    </span>
  </button>;
});

export const TransactionList = memo(function TransactionList({ transactions, onEdit }: { transactions: Transaction[]; onEdit: (transaction: Transaction) => void }) {
  return <div className="transaction-list">{transactions.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} onEdit={onEdit} />)}</div>;
});
