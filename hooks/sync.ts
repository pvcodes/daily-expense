import type { Transaction } from "@/lib/types";

export interface RemoteTransactions {
  transactions: Transaction[];
  count: number;
  offline: boolean;
}

export async function fetchRemote(): Promise<RemoteTransactions> {
  const res = await fetch("/api/transactions");
  const offline = res.headers.get("x-offline") === "1";
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(
      (body as { error?: string }).error || `Sync failed (${res.status})`
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  const body = (await res.json()) as {
    transactions: Transaction[];
    count: number;
  };
  return { ...body, offline };
}

export async function pushRemote(
  txs: Transaction[],
  deleteIds: string[] = []
): Promise<{ count: number }> {
  const res = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(
      deleteIds.length > 0
        ? { transactions: txs, deleteIds }
        : { transactions: txs }
    ),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(
      (body as { error?: string }).error || `Push failed (${res.status})`
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export async function clearRemote(): Promise<void> {
  const res = await fetch("/api/transactions", { method: "DELETE" });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(
      (body as { error?: string }).error || `Clear failed (${res.status})`
    ) as Error & { status?: number };
    err.status = res.status;
    throw err;
  }
}