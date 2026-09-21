"use client";

import type { ReactNode } from "react";

export function Skeleton({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`animate-pulse rounded-xl bg-panel-2 ${className}`} />;
}

export function Section({
  title,
  aside,
  children,
  className = "",
}: {
  title?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`rounded-2xl border border-line bg-panel ${className}`}>
      {title && (
        <div className="flex items-center justify-between px-4 pt-4">
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
          {aside}
        </div>
      )}
      <div className={title ? "p-4 pt-3" : "p-4"}>{children}</div>
    </section>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      {icon && (
        <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-panel-2 text-ink-3">
          {icon}
        </span>
      )}
      <p className="text-sm font-medium text-ink">{title}</p>
      {hint && <p className="max-w-[26ch] text-xs text-ink-3">{hint}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}