"use client";

export const APP_STORAGE_KEYS = [
  "expense-tracker.period",
  "expense-tracker.txns.cat",
  "expense-tracker.txns.search",
  "expense-tracker.weekStart",
  "expense-tracker.accent",
  "expense-tracker.budget.v1",
  "expense-tracker.homeWidgets",
];

/**
 * Removes every app-owned preference key. Leaves unrelated keys ("theme") so
 * we don't lose the user's theme unnecessarily. Transactions are NOT stored
 * locally anymore — they live on the server and reload on next launch.
 * Also clears Cache Storage and unregisters the service worker so a fresh
 * bundle is fetched on next load.
 */
export async function clearLocalDataAndCache(): Promise<void> {
  // 1. Drop app-owned preference keys (transactions live on the server)
  for (const key of APP_STORAGE_KEYS) {
    try {
      localStorage.removeItem(key);
    } catch {
      // storage unavailable
    }
  }

  // 2. nuke all Cache Storage (old app-shell assets, stale JS)
  try {
    if ("caches" in window) {
      const keys = await window.caches.keys();
      await Promise.all(keys.map((k) => window.caches.delete(k)));
    }
  } catch {
    // caches unavailable / private mode
  }

  // 3. unregister any service worker so we don't keep serving the old bundle
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    }
  } catch {
    // SW unavailable
  }
}
