"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { purgeUserScopedState } from "@/lib/storage";

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
        // Shared device: drop the previous user's cached pages/API responses
        // before the new session renders anything.
        await purgeUserScopedState();
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
    <main className="flex flex-1 items-center justify-center bg-canvas px-4">
      <form
        onSubmit={submit}
        className="card w-full max-w-sm space-y-5 p-6 sm:p-7"
      >
        <div>
          <span className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-accent text-2xl text-accent-ink">₹</span>
          <p className="mt-5 text-[10px] font-extrabold uppercase tracking-[0.16em] text-accent-text">Money, on main</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Welcome back.</h1>
          <p className="mt-2 text-sm text-ink-3">
            Your spending, synced and ready. Enter your passcode to continue.
          </p>
        </div>
        <input
          type="password"
          autoComplete="current-password"
          aria-label="Passcode"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(false);
          }}
          placeholder="Passcode"
          className={`field w-full placeholder:text-ink-3 ${
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
          className="btn-primary w-full py-3 text-base"
        >
          {busy ? "Checking…" : "Unlock"}
        </button>
      </form>
    </main>
  );
}
