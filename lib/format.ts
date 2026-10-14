export function money(value: string | number, currency = "INR") {
  const amount = typeof value === "string" ? Number(value) : value;
  try {
    const digits = new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
    return new Intl.NumberFormat("en-IN", { style: "currency", currency, minimumFractionDigits: digits, maximumFractionDigits: digits }).format(amount);
  } catch {
    return currency + " " + amount.toFixed(2);
  }
}

export function currencyFractionDigits(currency: string) {
  try {
    return new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions().maximumFractionDigits;
  } catch {
    return 2;
  }
}

export function validAmountForCurrency(value: unknown, currency: string) {
  const text = String(value ?? "");
  if (!/^\d{1,14}(\.\d{1,4})?$/.test(text) || !Number.isFinite(Number(text)) || Number(text) <= 0) return false;
  const decimals = text.includes(".") ? text.split(".")[1].length : 0;
  return decimals <= currencyFractionDigits(currency);
}

export function dateLabel(value: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) {
  return new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", ...options }).format(new Date(value));
}

export function localDateTimeInput(value?: string) {
  const date = value ? new Date(value) : new Date();
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  const get = (name: string) => parts.find((part) => part.type === name)?.value || "";
  return get("year") + "-" + get("month") + "-" + get("day") + "T" + get("hour") + ":" + get("minute");
}
