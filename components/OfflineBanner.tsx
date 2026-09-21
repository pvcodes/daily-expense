"use client";

import { useExpenses } from "@/hooks/useExpenses";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";

export default function OfflineBanner() {
  const online = useNetworkStatus();
  const { offline } = useExpenses();
  if (online && !offline) return null;

  return (
    <div className="mx-4 mt-2 flex items-center gap-2 rounded-xl border border-amber-300/60 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 dark:border-amber-500/30 dark:text-amber-300">
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500" />
      You&apos;re offline. Showing cached data; edits resume when you reconnect.
    </div>
  );
}