import { ChevronLeft, ChevronRight } from "lucide-react";

function monthTitle(key: string) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(key + "-01T12:00:00"));
}

export function MonthPicker({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  function shift(delta: number) {
    const date = new Date(month + "-01T12:00:00");
    date.setMonth(date.getMonth() + delta);
    onChange(date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0"));
  }
  return <div className="month-picker" aria-label="Choose month">
    <button type="button" className="icon-button month-step" aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={17} /></button>
    <span aria-live="polite">{monthTitle(month)}</span>
    <button type="button" className="icon-button month-step" aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={17} /></button>
  </div>;
}
