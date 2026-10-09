"use client";

import { useRouter } from "next/navigation";
import ImportExport from "@/components/ImportExport";
import { useSessionUser } from "@/hooks/useSessionUser";
import { purgeUserScopedState } from "@/lib/storage";

export default function SettingsPage() {
  const { user, loading } = useSessionUser();
  const router = useRouter();

  async function logout() {
    await purgeUserScopedState();
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  return (
    <main className="flex-1 space-y-4 p-4 pb-8 pt-5 sm:p-5">
      <header>
        <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-text">Your account</p>
        <h1 className="mt-1 text-3xl font-black tracking-tight text-ink">Settings</h1>
      </header>

      <section className="card space-y-3 p-4" aria-labelledby="account-heading">
        <div>
          <h2 id="account-heading" className="text-sm font-semibold text-ink">Account</h2>
          <p className="mt-0.5 truncate text-xs text-ink-3">
            {user ? `Signed in as ${user} — this ledger only` : loading ? "Checking session…" : "Signed in"}
          </p>
        </div>
        <button onClick={logout} className="min-h-12 w-full rounded-xl border border-line-strong bg-panel-2 py-3 text-sm font-bold active:scale-[0.98]">
          Log out
        </button>
        <p className="text-xs text-ink-3">Your transactions stay on the server. This device&apos;s cached data is cleared when you log out.</p>
      </section>

      <ImportExport />
    </main>
  );
}
