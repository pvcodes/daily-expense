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
      let added: Transaction[] = [];
      setTransactions((prev) => {
        const existing = new Set(prev.map(contentKey));
        added = txs
          .map((t) => ({
            ...t,
            id: t.id || newId(),
            currency: t.currency || "INR",
            notes: t.notes || "",
          }))
          .filter((t) => !existing.has(contentKey(t)));
        if (added.length === 0) return prev;
        return [...[...added].reverse(), ...prev].sort(sortDesc);
      });
      setError(null);
      if (added.length > 0) {
        pushRemote(added, []).catch((e) => {
          if ((e as { status?: number }).status === 401) {
            redirectToLogin();
            return;
          }
          const ids = new Set(added.map((t) => t.id));
          setTransactions((prev) => prev.filter((t) => !ids.has(t.id)));
          setError("Couldn't import — reverting. Check your connection.");
        });
      }
      return txs.length;
    },
    [redirectToLogin]
  );

  const updateTransaction = useCallback(
    (id: string, patch: NewTransaction) => {
      let old: Transaction | undefined;
      let updated: Transaction | undefined;
      setTransactions((prev) => {
        old = prev.find((t) => t.id === id);
        if (!old) return prev;
        updated = {
          id,
          date: patch.date,
          time: patch.time || "00:00",
          category: patch.category,
          price: patch.price,
          currency: old.currency || "INR",
          notes: patch.notes || "",
        };
        return prev
          .filter((t) => t.id !== id)
          .concat([updated])
          .sort(sortDesc);
      });
      setError(null);
      if (!updated || !old) return;
      const upd = updated;
      pushRemote([upd], []).catch((e) => {
        if ((e as { status?: number }).status === 401) {
          redirectToLogin();
          return;
        }
        setTransactions((prev) => prev.filter((t) => t.id !== upd.id));
        setTransactions((prev) => [...prev, old as Transaction].sort(sortDesc));
        setError("Couldn't save edit — reverting. Check your connection.");
      });
    },
    [redirectToLogin]
  );

  const deleteTransaction = useCallback((id: string) => {
    let removed: Transaction | undefined;
    setTransactions((prev) => {
      removed = prev.find((t) => t.id === id);
      return prev.filter((t) => t.id !== id);
    });
    setError(null);
    pushRemote([], [id]).catch((e) => {
      if ((e as { status?: number }).status === 401) {
        redirectToLogin();
        return;
      }
      if (!removed) return;
      const restored: Transaction = removed;
      setTransactions((prev) => [...prev, restored].sort(sortDesc));
      setError("Couldn't delete — reverting. Check your connection.");
    });
  }, [redirectToLogin]);

  const clearAll = useCallback(() => {
    const prev = transactions;
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
  }, [transactions, redirectToLogin]);

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