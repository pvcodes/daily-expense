import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchRemote, pushRemote, clearRemote } from "./sync";
import type { Transaction } from "@/lib/types";

function t(id: string, price: number, notes = ""): Transaction {
  return {
    id,
    date: "2026-09-01",
    time: "00:00",
    category: "Food",
    price,
    currency: "INR",
    notes,
  };
}

function mockFetch(status: number, body: unknown, headers: Record<string, string> = {}) {
  const res = {
    ok: status >= 200 && status < 300,
    status,
    headers: new Headers(headers),
    json: () => Promise.resolve(body),
  };
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(res));
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchRemote", () => {
  it("returns transactions and count", async () => {
    mockFetch(200, { transactions: [t("a", -5)], count: 1 });
    const r = await fetchRemote();
    expect(r.transactions).toHaveLength(1);
    expect(r.count).toBe(1);
    expect(r.offline).toBe(false);
  });

  it("flags cached responses served while offline", async () => {
    mockFetch(200, { transactions: [t("a", -5)], count: 1 }, { "X-Offline": "1" });
    const r = await fetchRemote();
    expect(r.offline).toBe(true);
  });

  it("attaches the HTTP status to thrown errors", async () => {
    mockFetch(401, { error: "Not signed in" });
    await expect(fetchRemote()).rejects.toMatchObject({
      message: "Not signed in",
      status: 401,
    });
  });
});

describe("pushRemote", () => {
  it("posts transactions and returns the server count", async () => {
    const fn = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ ok: true, count: 7 }) });
    vi.stubGlobal("fetch", fn);
    const r = await pushRemote([t("a", -5)]);
    expect(r.count).toBe(7);
    const body = JSON.parse(fn.mock.calls[0]![1].body as string);
    expect(body.deleteIds).toBeUndefined();
  });

  it("includes deleteIds when provided", async () => {
    const fn = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ count: 1 }) });
    vi.stubGlobal("fetch", fn);
    await pushRemote([], ["a"]);
    const body = JSON.parse(fn.mock.calls[0]![1].body as string);
    expect(body.deleteIds).toEqual(["a"]);
  });

  it("attaches the HTTP status to thrown errors", async () => {
    mockFetch(413, { error: "Too many transactions" });
    await expect(pushRemote([t("a", -1)])).rejects.toMatchObject({
      message: "Too many transactions",
      status: 413,
    });
  });
});

describe("clearRemote", () => {
  it("sends DELETE and resolves on ok", async () => {
    const fn = vi.fn().mockResolvedValue({ ok: true, status: 200, json: () => Promise.resolve({ ok: true }) });
    vi.stubGlobal("fetch", fn);
    await clearRemote();
    expect(fn.mock.calls[0]![0]).toBe("/api/transactions");
    expect(fn.mock.calls[0]![1].method).toBe("DELETE");
  });

  it("throws with status on failure", async () => {
    mockFetch(500, { error: "boom" });
    await expect(clearRemote()).rejects.toMatchObject({ status: 500 });
  });
});