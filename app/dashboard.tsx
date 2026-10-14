"use client";

import {
  Activity, Archive, ArrowDownRight, ArrowRight, ArrowUpRight, BarChart3, BookOpen,
  CalendarDays, Check, ChevronDown, ChevronLeft, ChevronRight, CircleDollarSign,
  Coffee, CreditCard, Ellipsis, HeartPulse, House, Lightbulb, ListFilter, LogOut,
  Plus, Receipt, Search, ShoppingBag, Sparkles, Tag, Ticket, TrainFront, Utensils,
  Wallet, X
} from "lucide-react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Analytics, Category, RecurringRule, Transaction } from "@/lib/types";
import { currencyFractionDigits, dateLabel, localDateTimeInput, money } from "@/lib/format";

type View = "home" | "transactions" | "recurring" | "insights";
type TxForm = {
  id?: string;
  amount: string;
  category_id: string;
  currency: string;
  notes: string;
  occurred_at: string;
  include_in_analysis: boolean;
};
type RuleForm = {
  id?: string;
  amount: string;
  category_id: string;
  currency: string;
  notes: string;
  start_date: string;
  end_date: string;
  day_of_month: string | number;
  run_at_local_time: string;
  paused?: boolean;
  archived?: boolean;
};

const chartColors = ["#587c69", "#d09a61", "#7b91aa", "#ad7895", "#c27367", "#829361", "#9887b0", "#b49e71"];
const iconMap: Record<string, typeof Coffee> = {
  utensils: Utensils, "train-front": TrainFront, "shopping-bag": ShoppingBag,
  receipt: Receipt, "heart-pulse": HeartPulse, house: House, ticket: Ticket,
  circle: CircleDollarSign, coffee: Coffee, wallet: Wallet, tag: Tag
};

function IconFor({ icon, size = 19 }: { icon: string; size?: number }) {
  const Icon = iconMap[icon] || CircleDollarSign;
  return <Icon size={size} strokeWidth={1.8} />;
}

async function api<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { ...init, headers: { "Content-Type": "application/json" } });
  const body = await response.json().catch(() => ({}));
  if (response.status === 401) {
    window.location.assign("/login");
    throw new Error("Your session ended. Sign in again.");
  }
  if (!response.ok) throw new Error(body.error || "Something went wrong.");
  return body as T;
}

function monthKey(date: Date) {
  return date.getFullYear() + "-" + String(date.getMonth() + 1).padStart(2, "0");
}

function monthTitle(key: string) {
  return new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric" }).format(new Date(key + "-01T00:00:00"));
}

function TxEditor({ tx, categories, onClose, onSaved }: {
  tx: TxForm | null; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const editing = Boolean(tx?.id);
  const [amount, setAmount] = useState(tx ? String(Math.abs(Number(tx.amount))) : "");
  const [categoryId, setCategoryId] = useState(tx?.category_id || categories[0]?.id || "");
  const [currency, setCurrency] = useState(tx?.currency || "INR");
  const [notes, setNotes] = useState(tx?.notes || "");
  const [occurredAt, setOccurredAt] = useState(tx?.occurred_at || localDateTimeInput());
  const [included, setIncluded] = useState(tx?.include_in_analysis ?? true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(event: FormEvent) {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = { amount, category_id: categoryId, currency, notes, occurred_at: occurredAt, include_in_analysis: included };
      if (editing && tx?.id) {
        await api("/api/transactions/" + encodeURIComponent(tx.id), { method: "PATCH", body: JSON.stringify(data) });
      } else {
        await api("/api/transactions", { method: "POST", body: JSON.stringify(data) });
      }
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save this expense.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="tx-editor-title">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <div><p className="eyebrow">{editing ? "MAKE A CHANGE" : "QUICK ENTRY"}</p><h2 id="tx-editor-title">{editing ? "Edit expense" : "New expense"}</h2></div>
          <button className="icon-button" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button>
        </div>
        <form className="form-grid" onSubmit={save}>
          <div className="field">
            <label htmlFor="expense-amount">Amount</label>
            <input autoFocus id="expense-amount" className="amount-input" inputMode="decimal" required min={1 / (10 ** currencyFractionDigits(currency))} step={1 / (10 ** currencyFractionDigits(currency))} type="number" placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} />
          </div>
          <div className="field">
            <label>Category</label>
            <div className="category-grid">
              {categories.map((category) => (
                <button type="button" key={category.id} className={"category-chip" + (categoryId === category.id ? " selected" : "")}
                  onClick={() => setCategoryId(category.id)} aria-pressed={categoryId === category.id}>
                  <IconFor icon={category.icon} size={14} /> {category.name}
                </button>
              ))}
            </div>
          </div>
          <div className="stats-grid">
            <div className="field"><label htmlFor="expense-date">Date and time</label><input id="expense-date" type="datetime-local" required value={occurredAt} onChange={(event) => setOccurredAt(event.target.value)} /></div>
            <div className="field"><label htmlFor="expense-currency">Currency</label><input id="expense-currency" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></div>
          </div>
          <div className="field"><label htmlFor="expense-notes">Note <span className="muted">(optional)</span></label><input id="expense-notes" maxLength={300} placeholder="What was it for?" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
          <div className="toggle-row">
            <div className="toggle-copy"><strong>Include in analysis</strong><small>{included ? "This expense is included in your insights." : "This expense stays out of charts and totals."}</small></div>
            <button type="button" role="switch" aria-checked={included} aria-label="Include in analysis" className={"switch" + (included ? " on" : "")} onClick={() => setIncluded(!included)} />
          </div>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" type="submit" disabled={busy || !categoryId}>{busy ? "Saving…" : editing ? "Save changes" : "Save expense"} <ArrowRight size={16} /></button>
        </form>
      </section>
    </div>
  );
}

function RuleEditor({ rule, categories, onClose, onSaved }: {
  rule: RuleForm | null; categories: Category[]; onClose: () => void; onSaved: () => void;
}) {
  const [amount, setAmount] = useState(rule ? String(Math.abs(Number(rule.amount))) : "");
  const [categoryId, setCategoryId] = useState(rule?.category_id || categories[0]?.id || "");
  const [currency, setCurrency] = useState(rule?.currency || "INR");
  const [notes, setNotes] = useState(rule?.notes || "");
  const [startDate, setStartDate] = useState(rule?.start_date || localDateTimeInput().slice(0, 10));
  const [endDate, setEndDate] = useState(rule?.end_date || "");
  const [day, setDay] = useState(Number(rule?.day_of_month || new Date().getDate()));
  const [time, setTime] = useState(rule?.run_at_local_time?.slice(0, 5) || "09:00");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const editing = Boolean(rule?.id);

  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    const body = { amount, category_id: categoryId, currency, notes, start_date: startDate, end_date: endDate || null, day_of_month: Number(day), run_at_local_time: time };
    try {
      if (rule?.id) await api("/api/recurring/" + encodeURIComponent(rule.id), { method: "PATCH", body: JSON.stringify(body) });
      else await api("/api/recurring", { method: "POST", body: JSON.stringify(body) });
      onSaved();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save recurring expense.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="sheet" role="dialog" aria-modal="true" aria-labelledby="rule-editor-title">
        <div className="sheet-handle" />
        <div className="sheet-head"><div><p className="eyebrow">MONTHLY REPEAT</p><h2 id="rule-editor-title">{editing ? "Edit future expenses" : "New recurring expense"}</h2></div><button className="icon-button" type="button" aria-label="Close" onClick={onClose}><X size={18} /></button></div>
        <form className="form-grid" onSubmit={save}>
          <div className="field"><label htmlFor="rule-amount">Amount</label><input id="rule-amount" className="amount-input" inputMode="decimal" type="number" min={1 / (10 ** currencyFractionDigits(currency))} step={1 / (10 ** currencyFractionDigits(currency))} required placeholder="0.00" value={amount} onChange={(event) => setAmount(event.target.value)} /></div>
          <div className="field"><label>Category</label><div className="category-grid">{categories.map((category) => <button key={category.id} type="button" className={"category-chip" + (categoryId === category.id ? " selected" : "")} onClick={() => setCategoryId(category.id)}><IconFor icon={category.icon} size={14} /> {category.name}</button>)}</div></div>
          <div className="stats-grid">
            <div className="field"><label htmlFor="rule-currency">Currency</label><input id="rule-currency" maxLength={3} value={currency} onChange={(event) => setCurrency(event.target.value.toUpperCase())} /></div>
            <div className="field"><label htmlFor="rule-day">Day each month</label><select id="rule-day" value={day} onChange={(event) => setDay(Number(event.target.value))}>{Array.from({ length: 31 }, (_, i) => <option key={i + 1} value={i + 1}>{i + 1}{[1,21,31].includes(i + 1) ? "st" : [2,22].includes(i + 1) ? "nd" : [3,23].includes(i + 1) ? "rd" : "th"}</option>)}</select></div>
          </div>
          <div className="stats-grid">
            <div className="field"><label htmlFor="rule-start">Starts on</label><input id="rule-start" type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} /></div>
            <div className="field"><label htmlFor="rule-time">Local time</label><input id="rule-time" type="time" required value={time} onChange={(event) => setTime(event.target.value)} /></div>
          </div>
          <div className="field"><label htmlFor="rule-end">Ends on <span className="muted">(optional)</span></label><input id="rule-end" type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} /></div>
          <div className="field"><label htmlFor="rule-note">Note <span className="muted">(optional)</span></label><input id="rule-note" maxLength={300} placeholder="Rent, subscription…" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
          <p className="muted" style={{ margin: 0, fontSize: 11 }}>If a month is shorter, the expense is added on its last day. The daily job can be up to a day late.</p>
          {error && <p className="error-message" role="alert">{error}</p>}
          <button className="primary-button" disabled={busy}>{busy ? "Saving…" : editing ? "Save future changes" : "Create monthly rule"} <ArrowRight size={16} /></button>
        </form>
      </section>
    </div>
  );
}

function Nav({ view, setView, onAdd }: { view: View; setView: (value: View) => void; onAdd: () => void }) {
  return (
    <nav className="bottom-nav" aria-label="Main navigation">
      <div className="nav-inner">
        <button className={"nav-item" + (view === "home" ? " active" : "")} onClick={() => setView("home")}><Wallet size={19} /><span>Home</span></button>
        <button className={"nav-item" + (view === "transactions" ? " active" : "")} onClick={() => setView("transactions")}><Receipt size={19} /><span>History</span></button>
        <button className="nav-item" onClick={onAdd} aria-label="Add expense"><span className="nav-add"><Plus size={23} /></span><span>Add</span></button>
        <button className={"nav-item" + (view === "recurring" ? " active" : "")} onClick={() => setView("recurring")}><CalendarDays size={19} /><span>Repeats</span></button>
        <button className={"nav-item" + (view === "insights" ? " active" : "")} onClick={() => setView("insights")}><BarChart3 size={19} /><span>Insights</span></button>
      </div>
    </nav>
  );
}

function TransactionRows({ transactions, onEdit, emptyTitle, emptyCopy }: {
  transactions: Transaction[]; onEdit: (tx: Transaction) => void; emptyTitle: string; emptyCopy: string;
}) {
  if (!transactions.length) return <div className="empty-state"><Sparkles size={24} /><div><strong>{emptyTitle}</strong><p>{emptyCopy}</p></div></div>;
  return <div className="transaction-list">{transactions.map((tx) => (
    <button type="button" className="transaction-row" key={tx.id} onClick={() => onEdit(tx)} aria-label={"Edit " + tx.category_name + " " + money(Math.abs(Number(tx.amount)), tx.currency)}>
      <span className="category-icon"><IconFor icon={tx.category_icon} /></span>
      <span className="transaction-main"><strong>{tx.category_name}</strong><small>{dateLabel(tx.occurred_at, { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}{tx.notes ? " · " + tx.notes : ""}</small>{!tx.include_in_analysis && <span className="analysis-tag"><Archive size={11} /> Excluded from analysis</span>}</span>
      <span className="transaction-amount">−{money(Math.abs(Number(tx.amount)), tx.currency)}<small>{tx.recurring_rule_id ? "Recurring" : "Expense"}</small></span>
    </button>
  ))}</div>;
}

function MonthPicker({ month, onChange }: { month: string; onChange: (month: string) => void }) {
  function shift(delta: number) {
    const date = new Date(month + "-01T12:00:00");
    date.setMonth(date.getMonth() + delta);
    onChange(monthKey(date));
  }
  return <div className="month-button" style={{ padding: 0 }}>
    <button className="icon-button" style={{ border: 0, minWidth: 39, minHeight: 40, background: "transparent" }} aria-label="Previous month" onClick={() => shift(-1)}><ChevronLeft size={17} /></button>
    <span style={{ minWidth: 80, textAlign: "center", fontSize: 11, fontWeight: 700 }}>{monthTitle(month)}</span>
    <button className="icon-button" style={{ border: 0, minWidth: 39, minHeight: 40, background: "transparent" }} aria-label="Next month" onClick={() => shift(1)}><ChevronRight size={17} /></button>
  </div>;
}

function HomeView({ analytics, transactions, loading, month, setMonth, onEdit, onAdd, onView }: {
  analytics: Analytics | null; transactions: Transaction[]; loading: boolean; month: string;
  setMonth: (month: string) => void; onEdit: (tx: Transaction) => void; onAdd: () => void; onView: (view: View) => void;
}) {
  const totals = analytics?.totals || [];
  const included = transactions.filter((tx) => tx.include_in_analysis);
  const recent = included.slice(0, 4);
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">YOUR MONTH, IN VIEW</p><h1>Good to see you.</h1><p className="page-subtitle">A little clarity for your everyday spending.</p></div></div>
      <section className="balance">
        <p className="eyebrow">SPENDING THIS MONTH</p>
        {loading ? <div className="loading-block" style={{ minHeight: 40, backgroundColor: "transparent" }} aria-label="Loading spending" /> :
          totals.length ? totals.map((row) => <div className="balance-value" key={row.currency}>{money(row.amount, row.currency)}</div>) :
            <div className="balance-value">{money(0, "INR")}</div>}
        <div className="balance-footer">{totals[0] && Number(totals[0].previous_amount) > 0 ?
          <><ArrowDownRight size={15} /><strong>{money(totals[0].previous_amount, totals[0].currency)}</strong> last month</> :
          <><Sparkles size={14} /><span>Every small entry makes the picture clearer.</span></>}</div>
      </section>
      <div className="summary-row">
        <div className="summary-item"><div className="summary-top"><CircleDollarSign size={14} /> Currencies</div><strong>{totals.length || 0} this month</strong></div>
        <div className="summary-item"><div className="summary-top"><Activity size={14} /> Entries</div><strong>{included.length} included</strong></div>
      </div>
      <div className="section-head"><h2>Recent activity</h2><button className="text-action" onClick={() => onView("transactions")}>See all <ArrowRight size={13} style={{ verticalAlign: "middle" }} /></button></div>
      {loading ? <div className="loading-block" /> :
        <TransactionRows transactions={recent} onEdit={onEdit} emptyTitle="A fresh page" emptyCopy="Add your first expense. It takes just a moment." />}
      {!loading && recent.length === 0 && <button className="primary-button" style={{ width: "100%", marginTop: 14 }} onClick={onAdd}><Plus size={17} /> Add an expense</button>}
      <div className="section-head"><h2>Monthly rhythm</h2><MonthPicker month={month} onChange={setMonth} /></div>
      <section className="panel chart-panel" aria-label="Six month spending chart">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}><div><p className="eyebrow">LAST SIX MONTHS</p><h3>Spending over time</h3></div><button className="text-action" onClick={() => onView("insights")}>Explore</button></div>
        {analytics?.months.length ? <TrendChart analytics={analytics} currency={analytics.totals[0]?.currency || analytics.months[0].currency} /> :
          <div className="empty-state" style={{ minHeight: 145 }}><div><strong>Your trend will show here</strong><p>Included expenses appear as soon as you start logging.</p></div></div>}
      </section>
    </>
  );
}

function TrendChart({ analytics, currency }: { analytics: Analytics; currency: string }) {
  const data = analytics.months.filter((row) => row.currency === currency).map((row) => ({
    label: new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(row.month + "-01T12:00:00")),
    amount: Number(row.amount)
  }));
  return <><div className="chart-wrap" aria-label="Six-month spending trend"><ResponsiveContainer width="100%" height="100%">
    <AreaChart data={data} margin={{ top: 10, right: 2, left: -24, bottom: 0 }}>
      <defs><linearGradient id="spendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#587c69" stopOpacity={0.2} /><stop offset="95%" stopColor="#587c69" stopOpacity={0} /></linearGradient></defs>
      <CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} />
      <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
      <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} tickFormatter={(n) => n >= 1000 ? (n / 1000).toFixed(0) + "k" : String(n)} />
      <Tooltip formatter={(value) => [money(Number(value), currency), "Spending"]} contentStyle={{ borderRadius: 12, border: "1px solid var(--line)", background: "var(--surface)", fontSize: 11 }} />
      <Area type="monotone" dataKey="amount" stroke="#587c69" strokeWidth={2.5} fill="url(#spendFill)" />
  </AreaChart>
  </ResponsiveContainer></div><DataTable title="Six-month spending data" rows={data.map((item) => ({ label: item.label, value: money(item.amount, currency) }))} /></>;
}

function DataTable({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  if (!rows.length) return null;
  return <details className="chart-data"><summary>View chart data</summary><table><caption>{title}</caption><thead><tr><th scope="col">Period</th><th scope="col">Amount</th></tr></thead><tbody>{rows.map((row) => <tr key={row.label}><th scope="row">{row.label}</th><td>{row.value}</td></tr>)}</tbody></table></details>;
}

function InsightsView({ analytics, loading, month, setMonth }: { analytics: Analytics | null; loading: boolean; month: string; setMonth: (value: string) => void }) {
  const currencies = Array.from(new Set((analytics?.totals || []).map((item) => item.currency).concat((analytics?.categories || []).map((item) => item.currency))));
  const [currency, setCurrency] = useState("");
  useEffect(() => {
    if (currencies.length && (!currency || !currencies.includes(currency))) setCurrency(currencies.includes("INR") ? "INR" : currencies[0]);
  }, [currencies.join(","), currency]);
  const categories = (analytics?.categories || []).filter((item) => item.currency === currency);
  const daily = (analytics?.daily || []).filter((item) => item.currency === currency);
  const weekdays = (analytics?.weekdays || []).filter((item) => item.currency === currency);
  const months = (analytics?.months || []).filter((item) => item.currency === currency);
  const total = analytics?.totals.find((item) => item.currency === currency);
  return (
    <>
      <div className="page-heading"><div><p className="eyebrow">PATTERNS, NOT PRESSURE</p><h1>Your insights</h1><p className="page-subtitle">Only expenses you include in analysis appear here.</p></div><Lightbulb size={21} color="var(--green)" /></div>
      <div className="toolbar"><MonthPicker month={month} onChange={setMonth} />{currencies.length > 1 && <label className="sr-only" htmlFor="currency-filter">Currency</label>}{currencies.length > 1 && <select id="currency-filter" className="filter-button" value={currency} onChange={(event) => setCurrency(event.target.value)}>{currencies.map((code) => <option key={code}>{code}</option>)}</select>}</div>
      {loading ? <div className="loading-block" /> : !total ? <div className="panel empty-state"><BarChart3 size={24} /><div><strong>Nothing to chart just yet</strong><p>Add or include expenses for this month and your patterns will appear here.</p></div></div> : (
        <>
          <div className="summary-row"><div className="summary-item"><div className="summary-top"><Wallet size={14} /> This month</div><strong>{money(total.amount, currency)}</strong></div><div className="summary-item"><div className="summary-top"><ArrowUpRight size={14} /> Previous month</div><strong>{money(total.previous_amount, currency)}</strong></div></div>
          <section className="panel chart-panel"><p className="eyebrow">SIX MONTHS · {currency}</p><h3>Spending over time</h3><TrendChart analytics={{ ...(analytics as Analytics), months }} currency={currency} /></section>
          <section className="panel chart-panel" style={{ marginTop: 13 }}><p className="eyebrow">THIS MONTH · {currency}</p><h3>Where it went</h3>
            {categories.length ? <><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categories} dataKey="amount" nameKey="category" innerRadius={53} outerRadius={77} paddingAngle={3} stroke="none">{categories.map((item, index) => <Cell key={item.category} fill={chartColors[index % chartColors.length]} />)}</Pie><Tooltip formatter={(value) => money(Number(value), currency)} /></PieChart></ResponsiveContainer></div>
              <div className="legend">{categories.map((item, index) => <div className="legend-item" key={item.category}><span className="dot" style={{ background: chartColors[index % chartColors.length] }} />{item.category}<strong>{money(item.amount, currency)}</strong></div>)}</div></> :
              <div className="empty-state"><p>No category data for this month.</p></div>}
          </section>
          <section className="panel chart-panel" style={{ marginTop: 13 }}><p className="eyebrow">DAILY TOTALS · {currency}</p><h3>Your month at a glance</h3>
            {daily.length ? <><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={daily} margin={{ top: 10, right: 0, left: -22, bottom: 0 }}><CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="date" tickFormatter={(v) => String(v).slice(-2)} tickLine={false} axisLine={false} interval="preserveStartEnd" tick={{ fill: "var(--muted)", fontSize: 9 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} /><Tooltip labelFormatter={(v) => dateLabel(String(v) + "T00:00:00Z", { day: "numeric", month: "short" })} formatter={(v) => money(Number(v), currency)} /><Bar dataKey="amount" fill="#78947f" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div><DataTable title="Daily spending" rows={daily.map((item) => ({ label: item.date, value: money(item.amount, currency) }))} /></> : <div className="empty-state"><p>No daily totals yet.</p></div>}
          </section>
          <section className="panel chart-panel" style={{ marginTop: 13 }}><p className="eyebrow">AVERAGE EXPENSE · {currency}</p><h3>By day of the week</h3>
            {weekdays.length ? <><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekdays} margin={{ top: 10, right: 0, left: -22, bottom: 0 }}><CartesianGrid stroke="var(--line)" strokeDasharray="3 5" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} /><YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} /><Tooltip formatter={(v) => [money(Number(v), currency), "Average"]} /><Bar dataKey="amount" fill="#d09a61" radius={[5,5,0,0]} /></BarChart></ResponsiveContainer></div><DataTable title="Average expense by weekday" rows={weekdays.map((item) => ({ label: item.day, value: money(item.amount, currency) }))} /></> : <div className="empty-state"><p>Weekday patterns appear once a month has entries.</p></div>}
          </section>
          <section className="panel" style={{ marginTop: 13 }} aria-label="Daily expense heatmap"><p className="eyebrow">DAILY RHYTHM</p><h3>Spending days</h3><Heatmap daily={daily} month={month} currency={currency} /></section>
        </>
      )}
    </>
  );
}

function Heatmap({ daily, month, currency }: { daily: Analytics["daily"]; month: string; currency: string }) {
  const count = new Date(Number(month.slice(0,4)), Number(month.slice(5,7)), 0).getDate();
  const first = new Date(Number(month.slice(0,4)), Number(month.slice(5,7)) - 1, 1).getDay();
  const values = new Map(daily.map((item) => [item.date.slice(-2), Number(item.amount)]));
  const max = Math.max(...Array.from(values.values()), 1);
  return <div style={{ display: "grid", gridTemplateColumns: "repeat(7, minmax(0,1fr))", gap: 5, marginTop: 14 }}>
    {["S","M","T","W","T","F","S"].map((day, i) => <span key={i} style={{ textAlign: "center", color: "var(--muted)", fontSize: 9 }}>{day}</span>)}
    {Array.from({ length: first }, (_, i) => <span key={"blank" + i} />)}
    {Array.from({ length: count }, (_, i) => {
      const key = String(i + 1).padStart(2, "0");
      const amount = values.get(key) || 0;
      const opacity = amount ? .22 + .68 * amount / max : .055;
      return <span key={key} title={key + " " + money(amount, currency)} aria-label={key + " " + money(amount, currency)}
        style={{ display: "grid", aspectRatio: "1", placeItems: "center", borderRadius: 7, background: "color-mix(in oklch, var(--green) " + Math.round(opacity * 100) + "%, var(--surface))", fontSize: 9 }}>{i + 1}</span>;
    })}
  </div>;
}

function HistoryView({ included, excluded, onEdit }: { included: Transaction[]; excluded: Transaction[]; onEdit: (tx: Transaction) => void }) {
  const [tab, setTab] = useState<"included" | "excluded">("included");
  const [search, setSearch] = useState("");
  const rows = (tab === "included" ? included : excluded).filter((tx) =>
    (tx.category_name + " " + tx.notes).toLowerCase().includes(search.toLowerCase()));
  return <>
    <div className="page-heading"><div><p className="eyebrow">YOUR MONEY, YOUR RECORD</p><h1>Transactions</h1><p className="page-subtitle">Tap any entry to edit it.</p></div><ListFilter size={20} color="var(--green)" /></div>
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 7, padding: 5, borderRadius: 15, background: "var(--green-soft)", marginBottom: 13 }}>
      <button className={"category-chip" + (tab === "included" ? " selected" : "")} onClick={() => setTab("included")}>Included <span>{included.length}</span></button>
      <button className={"category-chip" + (tab === "excluded" ? " selected" : "")} onClick={() => setTab("excluded")}>Excluded <span>{excluded.length}</span></button>
    </div>
    <div style={{ position: "relative", marginBottom: 12 }}><Search size={16} style={{ position: "absolute", left: 13, top: 14, color: "var(--muted)" }} /><input className="search-input" style={{ paddingLeft: 38 }} aria-label="Search transactions" placeholder="Search by category or note" value={search} onChange={(event) => setSearch(event.target.value)} /></div>
    <TransactionRows transactions={rows} onEdit={onEdit}
      emptyTitle={tab === "excluded" ? "Nothing excluded" : "No entries yet"}
      emptyCopy={tab === "excluded" ? "Transactions you exclude from analysis can be restored here." : "Your expenses will appear here as you add them."} />
  </>;
}

function RecurringView({ rules, categories, onEdit, onReload }: {
  rules: RecurringRule[]; categories: Category[]; onEdit: (rule: RuleForm | null) => void; onReload: () => void;
}) {
  const [error, setError] = useState("");
  async function update(rule: RecurringRule, updates: Record<string, unknown>) {
    setError("");
    try {
      await api("/api/recurring/" + encodeURIComponent(rule.id), { method: "PATCH", body: JSON.stringify({ updates }) });
      onReload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update this rule."); }
  }
  const active = rules.filter((rule) => !rule.archived);
  const archived = rules.filter((rule) => rule.archived);
  return <>
    <div className="page-heading"><div><p className="eyebrow">SET IT ONCE</p><h1>Recurring</h1><p className="page-subtitle">Monthly expenses appear automatically.</p></div><button className="icon-button" aria-label="Add recurring expense" onClick={() => onEdit(null)}><Plus size={19} /></button></div>
    {error && <p className="error-message" role="alert">{error}</p>}
    {active.length ? <section className="panel"><div className="section-head" style={{ marginTop: 0 }}><h2>Current rules</h2><span className="muted" style={{ fontSize: 11 }}>{active.length} total</span></div>
      {active.map((rule) => <div className="recurring-row" key={rule.id}>
        <span className="category-icon"><IconFor icon={rule.category_icon} /></span>
        <button className="recurring-info" style={{ textAlign: "left", border: 0, background: "transparent", padding: 0, cursor: "pointer" }} onClick={() => onEdit({
          id: rule.id, amount: rule.amount, category_id: rule.category_id, currency: rule.currency, notes: rule.notes,
          start_date: String(rule.start_date).slice(0, 10), end_date: rule.end_date ? String(rule.end_date).slice(0, 10) : "",
          day_of_month: String(rule.day_of_month), run_at_local_time: rule.run_at_local_time.slice(0, 5), paused: rule.paused, archived: rule.archived
        })}>
          <strong>{rule.category_name} · {money(Math.abs(Number(rule.amount)), rule.currency)}</strong>
          <small>{rule.cadence === "monthly" ? "Monthly" : "Paused legacy rule"} · next {dateLabel(rule.next_occurrence_date + "T00:00:00", { day: "numeric", month: "short" })}{rule.notes ? " · " + rule.notes : ""}</small>
        </button>
        {rule.cadence === "monthly" ? <button className={"switch" + (!rule.paused ? " on" : "")} role="switch" aria-checked={!rule.paused} aria-label={rule.paused ? "Resume rule" : "Pause rule"} onClick={() => update(rule, { paused: !rule.paused })} /> : <span className="muted" style={{ fontSize: 10 }}>Inactive</span>}
        <button className="icon-button" style={{ minWidth: 39, minHeight: 39 }} aria-label="Archive rule" onClick={() => update(rule, { archived: true })}><Archive size={15} /></button>
      </div>)}
    </section> : <div className="panel empty-state"><CalendarDays size={25} /><div><strong>No monthly rules yet</strong><p>Add rent, subscriptions, or another regular expense once. We’ll fill in each due occurrence.</p></div></div>}
    {archived.length > 0 && <section className="panel" style={{ marginTop: 14 }}><div className="section-head" style={{ marginTop: 0 }}><h2>Archived</h2><span className="muted" style={{ fontSize: 11 }}>{archived.length}</span></div>{archived.map((rule) => <div className="recurring-row" key={rule.id}><span className="category-icon"><Archive size={17} /></span><span className="recurring-info"><strong>{rule.category_name} · {money(Math.abs(Number(rule.amount)), rule.currency)}</strong><small>{rule.cadence === "monthly" ? "Generated expenses remain in your history." : "Legacy cadence preserved but not scheduled."}</small></span>{rule.cadence === "monthly" && <button className="text-action" onClick={() => update(rule, { archived: false, paused: false })}>Restore</button>}</div>)}</section>}
  </>;
}

export default function Dashboard() {
  const [view, setView] = useState<View>("home");
  const [month, setMonth] = useState(monthKey(new Date()));
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [excluded, setExcluded] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [txEditor, setTxEditor] = useState<TxForm | null | undefined>(undefined);
  const [ruleEditor, setRuleEditor] = useState<RuleForm | null | undefined>(undefined);
  const [signingOut, setSigningOut] = useState(false);

  const loadCore = useCallback(async () => {
    const [includedData, excludedData, categoryData, recurringData] = await Promise.all([
      api<{ transactions: Transaction[] }>("/api/transactions"),
      api<{ transactions: Transaction[] }>("/api/transactions?excluded=true"),
      api<{ categories: Category[] }>("/api/categories"),
      api<{ rules: RecurringRule[] }>("/api/recurring")
    ]);
    setTransactions(includedData.transactions);
    setExcluded(excludedData.transactions);
    setCategories(categoryData.categories);
    setRules(recurringData.rules);
  }, []);

  const loadAnalytics = useCallback(async () => {
    const result = await api<Analytics>("/api/analytics?month=" + month);
    setAnalytics(result);
  }, [month]);

  const reload = useCallback(async () => {
    setError("");
    setLoading(true);
    try { await Promise.all([loadCore(), loadAnalytics()]); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load the ledger."); }
    finally { setLoading(false); }
  }, [loadCore, loadAnalytics]);

  useEffect(() => { void reload(); }, [reload]);
  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  async function signOut() {
    setSigningOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setTransactions([]);
      setExcluded([]);
      setAnalytics(null);
      window.location.assign("/login");
    }
  }

  function editTransaction(tx: Transaction) {
    setTxEditor({
      id: tx.id, amount: tx.amount, category_id: tx.category_id, currency: tx.currency,
      notes: tx.notes, occurred_at: localDateTimeInput(tx.occurred_at), include_in_analysis: tx.include_in_analysis
    });
  }

  const pageTitle = view === "home" ? "Pocket Ledger" : view === "transactions" ? "Transaction history" : view === "recurring" ? "Recurring expenses" : "Spending insights";

  return (
    <div className="shell">
      <header className="app-header">
        <div className="brand"><span className="brand-mark"><BookOpen size={20} /></span><span className="brand-copy"><strong>Pocket Ledger</strong><small>YOUR PERSONAL MONEY SPACE</small></span></div>
        <button className="header-action" aria-label="Sign out" onClick={signOut} disabled={signingOut}>{signingOut ? <span className="sr-only">Signing out</span> : <LogOut size={17} />}</button>
      </header>
      <main className="main-content" aria-label={pageTitle}>
        {error && <p className="error-message" role="alert">{error} <button className="text-action" onClick={() => void reload()}>Try again</button></p>}
        {view === "home" && <HomeView analytics={analytics} transactions={transactions} loading={loading} month={month} setMonth={setMonth} onEdit={editTransaction} onAdd={() => setTxEditor(null)} onView={setView} />}
        {view === "transactions" && (loading ? <div className="loading-block" /> : <HistoryView included={transactions} excluded={excluded} onEdit={editTransaction} />)}
        {view === "recurring" && (loading ? <div className="loading-block" /> : <RecurringView rules={rules} categories={categories} onEdit={(rule) => setRuleEditor(rule)} onReload={() => void reload()} />)}
        {view === "insights" && <InsightsView analytics={analytics} loading={loading} month={month} setMonth={setMonth} />}
      </main>
      <Nav view={view} setView={setView} onAdd={() => setTxEditor(null)} />
      {txEditor !== undefined && <TxEditor tx={txEditor} categories={categories} onClose={() => setTxEditor(undefined)} onSaved={() => void reload()} />}
      {ruleEditor !== undefined && <RuleEditor rule={ruleEditor} categories={categories} onClose={() => setRuleEditor(undefined)} onSaved={() => void reload()} />}
    </div>
  );
}
