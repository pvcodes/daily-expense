"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import type { Transaction } from "@/lib/types";
import { contentKey, newId } from "@/lib/types";
import { fetchRemote, pushRemote, clearRemote } from "@/hooks/sync";

const PULL_INTERVAL_MS = 60000;

export interface NewTransaction {
  date: string;
  time: string;
  category: string;
  price: number;
  notes?: string;
}

interface ExpenseContextValue {
  transactions: Transaction[];
  loaded: boolean;
  error: string | null;
  offline: boolean;
  lastSyncAt: number | null;
  refresh: () => Promise<void>;
  addTransaction: (tx: NewTransaction) => void;
  addMany: (txs: Transaction[]) => number;
  updateTransaction: (id: string, patch: NewTransaction) => void;
  deleteTransaction: (id: string) => void;
  clearAll: () => void;
}

const ExpenseContext = createContext<ExpenseContextValue | null>(null);

function sortDesc(a: Transaction, b: Transaction) {
  return `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`);
}

export function ExpenseProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [offline, setOffline] = useState(false);
  const busyRef = useRef(false);
  const txsRef = useRef<Transaction[]>([]);
  useEffect(() => {
    txsRef.current = transactions;
  }, [transactions]);
  const router = useRouter();

  const redirectToLogin = useCallback(() => {
    if (window.location.pathname !== "/login") {
      router.replace("/login");
    }
  }, [router]);

  const pull = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    try {
      const r = await fetchRemote();
      if (r.offline) {
        setOffline(true);
        setTransactions(r.transactions);
      } else if (r.stale) {
        // Render the cached ledger immediately; the service worker will send
        // the fresh ledger once its background request completes.
        setOffline(false);
        setTransactions(r.transactions);
      } else {
        setOffline(false);
        setTransactions(r.transactions);
        setLastSyncAt(Date.now());
        setError(null);
      }
    } catch (e) {
      const status = (e as { status?: number }).status;
      if (status === 401) {
        redirectToLogin();
      } else {
        setOffline(true);
        setError((e as Error).message);
      }
    } finally {
      busyRef.current = false;
      setLoaded(true);
    }
  }, [redirectToLogin]);

  useEffect(() => {
    const first = setTimeout(() => {
      void pull();
    }, 0);
    const iv = setInterval(() => {
      void pull();
    }, PULL_INTERVAL_MS);
    const onVis = () => {
      if (document.visibilityState === "visible") void pull();
    };
    const onOnline = () => {
      void pull();
    };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("online", onOnline);
    return () => {
      clearTimeout(first);
      clearInterval(iv);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("online", onOnline);
    };
  }, [pull]);

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message = event.data as
        | { type?: string; transactions?: Transaction[] }
        | undefined;
      if (message?.type === "TRANSACTIONS_UPDATED" && Array.isArray(message.transactions)) {
        setTransactions(message.transactions);
        setOffline(false);
        setError(null);
        setLastSyncAt(Date.now());
        setLoaded(true);
      } else if (message?.type === "TRANSACTIONS_SYNC_FAILED") {
        setOffline(true);
        setLoaded(true);
      }
    };
    navigator.serviceWorker?.addEventListener("message", onMessage);
    return () => navigator.serviceWorker?.removeEventListener("message", onMessage);
  }, []);

  const addTransaction = useCallback((tx: NewTransaction) => {
    const full: Transaction = {
      id: "",
      date: tx.date,
      time: tx.time || "00:00",
      category: tx.category,
      price: tx.price,
      currency: "INR",
      notes: tx.notes || "",
    };
    full.id = newId();
    setTransactions((prev) => [full, ...prev].sort(sortDesc));
    setError(null);
    pushRemote([full], []).catch((e) => {
      if ((e as { status?: number }).status === 401) {
        redirectToLogin();
        return;
      }
      setTransactions((prev) => prev.filter((t) => t.id !== full.id));
      setError("Couldn't save — reverting. Check your connection.");
    });
  }, [redirectToLogin]);

  const addMany = useCallback(
    (txs: Transaction[]) => {
      // Compute the de-duped set synchronously from the current ledger so the
      // optimistic update and the return value agree.
      const prev = txsRef.current;
      const existing = new Set(prev.map(contentKey));
      const added = txs
        .map((t) => ({
          ...t,
          id: t.id || newId(),
          currency: t.currency || "INR",
          notes: t.notes || "",
        }))
        .filter((t) => !existing.has(contentKey(t)));
      if (added.length > 0) {
        setTransactions([...[...added].reverse(), ...prev].sort(sortDesc));
      }
      setError(null);
      if (added.length > 0) {
        pushRemote(added, []).catch((e) => {
          if ((e as { status?: number }).status === 401) {
            redirectToLogin();
            return;
          }
          const ids = new Set(added.map((t) => t.id));
          setTransactions((p) => p.filter((t) => !ids.has(t.id)));
          setError("Couldn't import — reverting. Check your connection.");
        });
      }
      return added.length;
    },
    [redirectToLogin]
  );

  const updateTransaction = useCallback(
    (id: string, patch: NewTransaction) => {
      const prev = txsRef.current;
      const old = prev.find((t) => t.id === id);
      if (!old) return;
      const updated: Transaction = {
        id,
        date: patch.date,
        time: patch.time || "00:00",
        category: patch.category,
        price: patch.price,
        currency: old.currency || "INR",
        notes: patch.notes || "",
      };
      setTransactions(
        prev.filter((t) => t.id !== id).concat([updated]).sort(sortDesc)
      );
      setError(null);
      pushRemote([updated], []).catch((e) => {
        if ((e as { status?: number }).status === 401) {
          redirectToLogin();
          return;
        }
        setTransactions((p) =>
          p.filter((t) => t.id !== updated.id).concat([old]).sort(sortDesc)
        );
        setError("Couldn't save edit — reverting. Check your connection.");
      });
    },
    [redirectToLogin]
  );

  const deleteTransaction = useCallback((id: string) => {
    const removed = txsRef.current.find((t) => t.id === id);
    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setError(null);
    pushRemote([], [id]).catch((e) => {
      if ((e as { status?: number }).status === 401) {
        redirectToLogin();
        return;
      }
      if (!removed) return;
      setTransactions((prev) => [...prev, removed].sort(sortDesc));
      setError("Couldn't delete — reverting. Check your connection.");
    });
  }, [redirectToLogin]);

  const clearAll = useCallback(() => {
    const prev = txsRef.current;
    setTransactions([]);
    setError(null);
    clearRemote().catch((e) => {
      if ((e as { status?: number }).status === 401) {
        redirectToLogin();
        return;
      }
      setTransactions(prev);
      setError("Couldn't clear — reverting. Check your connection.");
    });
  }, [redirectToLogin]);

  const value = useMemo(
    () => ({
      transactions,
      loaded,
      error,
      offline,
      lastSyncAt,
      refresh: pull,
      addTransaction,
      addMany,
      updateTransaction,
      deleteTransaction,
      clearAll,
    }),
    [
      transactions,
      loaded,
      error,
      offline,
      lastSyncAt,
      pull,
      addTransaction,
      addMany,
      updateTransaction,
      deleteTransaction,
      clearAll,
    ]
  );

  return (
    <ExpenseContext.Provider value={value}>{children}</ExpenseContext.Provider>
  );
}

export function useExpenses(): ExpenseContextValue {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error("useExpenses must be used within ExpenseProvider");
  return ctx;
}
