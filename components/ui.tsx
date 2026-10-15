import type { ReactNode } from "react";
import {
  Activity, Archive, CalendarDays, CircleDollarSign, Coffee, HeartPulse, House,
  Receipt, ShoppingBag, Sparkles, Ticket, TrainFront, Utensils, Wallet, Tag
} from "lucide-react";

const iconMap: Record<string, typeof Coffee> = {
  utensils: Utensils, "train-front": TrainFront, "shopping-bag": ShoppingBag,
  receipt: Receipt, "heart-pulse": HeartPulse, house: House, ticket: Ticket,
  circle: CircleDollarSign, coffee: Coffee, wallet: Wallet, tag: Tag
};

export function IconFor({ icon, size = 18 }: { icon: string; size?: number }) {
  const Icon = iconMap[icon] || CircleDollarSign;
  return <Icon size={size} strokeWidth={1.8} aria-hidden="true" />;
}

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return <span className={"brand-mark" + (compact ? " brand-mark-compact" : "")} aria-hidden="true"><Wallet size={compact ? 18 : 20} strokeWidth={1.8} /></span>;
}

export function PageHeading({ eyebrow, title, copy, action }: {
  eyebrow: string; title: string; copy?: string; action?: ReactNode;
}) {
  return <header className="page-heading">
    <div className="page-heading-copy"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1>{copy && <p className="page-subtitle">{copy}</p>}</div>
    {action && <div className="page-heading-action">{action}</div>}
  </header>;
}

export function SectionHeading({ title, action, className = "", id }: { title: string; action?: ReactNode; className?: string; id?: string }) {
  return <div className={"section-heading " + className}><h2 id={id}>{title}</h2>{action}</div>;
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={"skeleton-block " + className} aria-hidden="true" />;
}

export function EmptyState({ icon, title, copy, action }: { icon?: ReactNode; title: string; copy?: string; action?: ReactNode }) {
  return <div className="empty-state">
    {icon && <span className="empty-state-icon">{icon}</span>}
    <strong>{title}</strong>{copy && <p>{copy}</p>}{action && <div className="empty-state-action">{action}</div>}
  </div>;
}

export function Notice({ children, onRetry }: { children: ReactNode; onRetry?: () => void }) {
  return <div className="notice" role="alert"><span>{children}</span>{onRetry && <button type="button" className="text-action" onClick={onRetry}>Try again</button>}</div>;
}

export type Segment<T extends string> = { value: T; label: string; count?: number };
export function SegmentedControl<T extends string>({ label, value, options, onChange }: {
  label: string; value: T; options: Segment<T>[]; onChange: (value: T) => void;
}) {
  return <div className="segmented-control" role="group" aria-label={label}>
    {options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value}
      className={"segment" + (value === option.value ? " selected" : "")} onClick={() => onChange(option.value)}>
      <span>{option.label}</span>{option.count !== undefined && <span className="segment-count">{option.count}</span>}
    </button>)}
  </div>;
}

export function DataTable({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  if (!rows.length) return null;
  return <details className="chart-data"><summary>View data table</summary><table><caption>{title}</caption>
    <thead><tr><th scope="col">Period</th><th scope="col">Amount</th></tr></thead>
    <tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td></tr>)}</tbody>
  </table></details>;
}

export function StatusLine({ icon, children }: { icon: "activity" | "archive" | "calendar"; children: ReactNode }) {
  const Icon = icon === "activity" ? Activity : icon === "archive" ? Archive : CalendarDays;
  return <span className="status-line"><Icon size={14} aria-hidden="true" />{children}</span>;
}

export function EmptySpark() { return <Sparkles size={22} aria-hidden="true" />; }
