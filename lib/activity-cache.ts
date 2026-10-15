import type { Transaction } from "@/lib/types";

// First page of the default Activity view, kept in memory so the screen can
// render instantly when it remounts (tab switch) instead of showing a skeleton.
export type ActivityPage = {
  transactions: Transaction[];
  total: number;
  pageCount: number;
  includedTotal: number;
  excludedTotal: number;
};

let firstPage: ActivityPage | null = null;

export function readActivityPage(): ActivityPage | null {
  return firstPage;
}

export function writeActivityPage(page: ActivityPage): void {
  firstPage = page;
}

export function clearActivityPage(): void {
  firstPage = null;
}
