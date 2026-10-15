"use client";

import { useEffect, useState, FormEvent } from "react";
import { ArrowRight, LockKeyhole } from "lucide-react";
import { BrandMark } from "@/components/ui";

export default function LoginForm() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof navigator !== "undefined" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
    }
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      window.location.assign("/");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not sign in. Try again.");
      setBusy(false);
    }
  }

  return (
    <main className="login-page">
      <form className="login-card" onSubmit={submit}>
        <div className="brand">
          <BrandMark />
          <span className="brand-copy"><strong>Pocket Ledger</strong><small>YOUR PERSONAL MONEY SPACE</small></span>
        </div>
        <h1>Welcome back</h1>
        <p>Your spending, kept private and easy to understand.</p>
        <div className="login-form-grid">
          <div className="field">
            <label htmlFor="password">Your password</label>
            <input id="password" type="password" autoComplete="current-password" required value={password}
              onChange={(event) => setPassword(event.target.value)} placeholder="Enter your password" />
          </div>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={busy}>
            <LockKeyhole size={16} /> {busy ? "Checking…" : "Unlock ledger"} <ArrowRight size={15} />
          </button>
        </div>
        <p className="login-footnote">Only your fixed password can open this tracker.</p>
      </form>
    </main>
  );
}
