"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) return;
    setBusy(true);
    setError(false);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        router.replace("/");
        router.refresh();
      } else {
        setError(true);
        setPassword("");
      }
    } catch {
      setError(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm space-y-4 rounded-2xl border border-line bg-panel p-6"
      >
        <div>
          <h1 className="text-xl font-bold text-ink">Expense Tracker</h1>
          <p className="mt-1 text-sm text-ink-3">
            Private to you. Enter your passcode to continue.
          </p>
        </div>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          aria-label="Passcode"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Passcode"
          className={`w-full rounded-xl border bg-panel-2 px-4 py-3 text-base placeholder:text-ink-3 focus:outline-none ${
            error ? "border-red-400" : "border-line focus:border-accent"
          }`}
        />
        {error && (
          <p aria-live="polite" className="text-sm text-red-500">
            Wrong passcode. Try again.
          </p>
        )}
        <button
          type="submit"
          disabled={busy || !password}
          className="w-full rounded-xl bg-accent py-3 text-base font-semibold text-accent-ink active:scale-[0.98] disabled:opacity-50"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}