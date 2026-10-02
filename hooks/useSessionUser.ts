"use client";

import { useEffect, useState } from "react";

/**
 * The id of the signed-in account, or null while unknown/offline. Used to tell
 * whoever is holding the phone whose ledger they are looking at.
 */
export function useSessionUser(): { user: string | null; loading: boolean } {
  const [user, setUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/session", { cache: "no-store" });
        if (cancelled) return;
        if (res.ok) {
          const body = (await res.json()) as { user?: string };
          setUser(typeof body.user === "string" ? body.user : null);
        }
      } catch {
        // offline — leave it unknown
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return { user, loading };
}