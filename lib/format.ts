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
