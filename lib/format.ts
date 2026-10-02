const INTL = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

export function formatMoney(value: number, currency = "INR"): string {
  if (currency === "INR") return INTL.format(Math.abs(value));
  try {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency,
      maximumFractionDigits: Math.abs(value) >= 1000 ? 0 : 2,
    }).format(Math.abs(value));
  } catch {
    return `${Math.abs(value).toFixed(2)} ${currency}`;
  }
}

export function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

export function formatTime(t: string): string {
  if (!t) return "";
  return t.slice(0, 5);
}

/** Today's date in LOCAL time as yyyy-MM-dd (toISOString would be UTC). */
export function localTodayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function localNowTime(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
}

/** formatMoney keeps the absolute amount; this restores the sign for lists. */
export function moneyWithSign(value: number): string {
  return value < 0 ? `-${formatMoney(value)}` : `+${formatMoney(value)}`;
}
