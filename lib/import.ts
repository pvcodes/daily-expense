import type { Transaction } from "./types";
import { newId } from "./types";

export function parsePrice(raw: unknown): number {
  if (raw === null || raw === undefined) return 0;
  const s = String(raw).trim();
  if (s === "") return 0;
  let cleaned = s;
  if (cleaned.includes(",") && !cleaned.includes(".")) {
    cleaned = cleaned.replace(/,/g, "."); // comma as decimal separator (e.g. "-12,34")
  } else {
    cleaned = cleaned.replace(/,/g, ""); // comma as thousands separator
  }
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : 0;
}

function splitDateTime(raw: string): { date: string; time: string } {
  const s = String(raw || "").trim();
  // bare date yyyy-MM-dd
  const mDate = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (mDate) {
    return { date: `${mDate[1]}-${mDate[2]}-${mDate[3]}`, time: "00:00" };
  }
  // date + time
  const m = s.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/
  );
  if (m) {
    return {
      date: `${m[1]}-${m[2]}-${m[3]}`,
      time: `${m[4]}:${m[5]}${m[6] ? `:${m[6]}` : ""}`,
    };
  }
  // mm/dd/yyyy HH:mm legacy
  const m2 = s.match(/^(\d{2})\/(\d{2})\/(\d{4})[T ](\d{2}):(\d{2})/);
  if (m2) {
    return {
      date: `${m2[3]}-${m2[1]}-${m2[2]}`,
      time: `${m2[4]}:${m2[5]}`,
    };
  }
  return { date: new Date().toISOString().slice(0, 10), time: "00:00" };
}

export interface ImportResult {
  transactions: Transaction[];
  errors: string[];
  fileName: string;
}

export function parseCSV(text: string, fileName: string): ImportResult {
  const errors: string[] = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim() !== "");
  if (lines.length === 0) {
    return { transactions: [], errors: ["File is empty"], fileName };
  }

  const header = lines[0];
  const delim = header.includes(";") ? ";" : ",";
  const rawCols = splitRow(header, delim).map((c) =>
    c.replace(/^"|"$/g, "").trim().toLowerCase().replace(/[ _-]/g, "")
  );
  if (rawCols.length === 0) {
    return { transactions: [], errors: ["No header row"], fileName };
  }

  const isExpensesFormat =
    rawCols.includes("date") && rawCols.includes("price");
  const isLegacyFormat =
    rawCols.includes("amount") && rawCols.includes("categoryname");

  if (!isExpensesFormat && !isLegacyFormat) {
    return {
      transactions: [],
      errors: [`Unrecognized header: ${header}`],
      fileName,
    };
  }

  const transactions: Transaction[] = [];
  for (let i = 1; i < lines.length; i++) {
    const vals = splitRow(lines[i], delim).map((c) =>
      c.replace(/^"|"$/g, "").trim()
    );
    if (vals.length === 0) continue;
    const row: Record<string, string> = {};
    rawCols.forEach((col, idx) => {
      row[col] = vals[idx] ?? "";
    });

    try {
      const tx = isExpensesFormat
        ? fromExpensesRow(row)
        : fromLegacyRow(row);
      transactions.push(tx);
    } catch (e) {
      errors.push(`Row ${i + 1}: ${(e as Error).message}`);
    }
  }

  return { transactions, errors, fileName };
}

function splitRow(line: string, delim: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let k = 0; k < line.length; k++) {
    const ch = line[k];
    if (ch === '"') {
      if (inQuotes && line[k + 1] === '"') {
        cur += '"';
        k++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === delim && !inQuotes) {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out;
}

function fromExpensesRow(row: Record<string, string>): Transaction {
  const { date, time } = splitDateTime(row["date"]);
  const price = parsePrice(row["price"]);
  const tx: Transaction = {
    id: newId(),
    date,
    time,
    category: row["category"] || "No Category",
    price,
    currency: "INR",
    notes: row["notes"] || "",
  };
  return tx;
}

function fromLegacyRow(row: Record<string, string>): Transaction {
  const { date, time } = splitDateTime(row["date"]);
  const price = parsePrice(row["amount"]);
  const category = row["categoryname"] || "No Category";
  const tx: Transaction = {
    id: newId(),
    date,
    time,
    category,
    price,
    currency: "INR",
    notes: row["title"] || "",
  };
  return tx;
}

export function exportExpensesCSV(txs: Transaction[]): string {
  const header = ["Date", "Category", "Price", "Notes"];
  const lines = [header.join(",")];
  for (const t of txs) {
    lines.push(
      [
        `${t.date} ${t.time || "00:00:00"}`,
        csvField(t.category),
        t.price.toString(),
        csvField(t.notes),
      ].join(",")
    );
  }
  return lines.join("\n");
}

export function exportJSON(txs: Transaction[]): string {
  return JSON.stringify(txs, null, 2);
}

function csvField(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

export function downloadFile(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
