"use client";

import { useEffect, useState } from "react";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis
} from "recharts";
import { Archive, ArrowDownRight, ArrowRight, BarChart3, CalendarDays, CircleDollarSign, Lightbulb, Plus, Search, Trash2 } from "lucide-react";
import type { Analytics, Category, RecurringRule, Transaction } from "@/lib/types";
import { api } from "@/lib/client";
import { dateLabel, money } from "@/lib/format";
import type { DashboardView, RecurringDraft } from "@/components/dashboard-types";
import { MonthPicker } from "@/components/MonthPicker";
import { TransactionList } from "@/components/TransactionRow";
import { DataTable, EmptySpark, EmptyState, IconFor, Notice, PageHeading, SectionHeading, SegmentedControl, SkeletonBlock } from "@/components/ui";

const chartColors = ["var(--chart-plum)", "var(--chart-coral)", "var(--chart-gold)", "var(--chart-blue)", "var(--chart-sage)", "var(--chart-berry)", "var(--chart-ochre)", "var(--chart-lilac)"];

function PageLoading({ label }: { label: string }) {
  return <div className="page-loading" role="status" aria-label={label}><SkeletonBlock className="skeleton-heading" /><SkeletonBlock className="skeleton-feature" /><SkeletonBlock className="skeleton-list" /><span className="sr-only">{label}</span></div>;
}

function TrendChart({ analytics, currency, compact = false }: { analytics: Analytics; currency: string; compact?: boolean }) {
  const data = analytics.months.filter((row) => row.currency === currency).map((row) => ({
    label: new Intl.DateTimeFormat("en", { month: "short" }).format(new Date(row.month + "-01T12:00:00")),
    amount: Number(row.amount)
  }));
  const rows = data.map((item) => ({ label: item.label, value: money(item.amount, currency) }));
  return <>
    <div className={"chart-wrap" + (compact ? " chart-compact" : "")} role="img" aria-label={`Spending trend across six months, in ${currency}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 4, left: -22, bottom: 0 }}>
          <defs><linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-plum)" stopOpacity={0.18} /><stop offset="100%" stopColor="var(--chart-plum)" stopOpacity={0.015} /></linearGradient></defs>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} tickFormatter={(n) => n >= 1000 ? `${(n / 1000).toFixed(0)}k` : String(n)} />
          <Tooltip formatter={(value) => [money(Number(value), currency), "Spending"]} contentStyle={{ borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 12 }} />
          <Area type="monotone" dataKey="amount" stroke="var(--chart-plum)" strokeWidth={2.5} fill="url(#trendFill)" activeDot={{ r: 4, fill: "var(--chart-coral)", stroke: "var(--surface)", strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <DataTable title="Six-month spending" rows={rows} />
  </>;
}

export function HomeScreen({ analytics, transactions, includedCount, recurringCount, loading, month, setMonth, onEdit, onAdd, onNavigate }: {
  analytics: Analytics | null; transactions: Transaction[]; includedCount: number; loading: boolean; month: string;
  recurringCount: number;
  setMonth: (month: string) => void; onEdit: (tx: Transaction) => void; onAdd: () => void; onNavigate: (view: DashboardView) => void;
}) {
  const included = transactions.filter((tx) => tx.include_in_analysis);
  const recent = included.slice(0, 5);
  const totals = analytics?.totals || [];
  const selectedCurrency = totals.find((row) => row.currency === "INR")?.currency || totals[0]?.currency || analytics?.months[0]?.currency || "INR";
  const total = totals.find((row) => row.currency === selectedCurrency);
  const monthName = new Intl.DateTimeFormat("en-IN", { month: "long" }).format(new Date(month + "-01T12:00:00"));

  if (loading && !analytics) return <PageLoading label="Loading your ledger" />;
  return <>
    <PageHeading eyebrow="POCKET LEDGER" title="Your month, in view." copy="A clear look at everyday spending." action={<MonthPicker month={month} onChange={setMonth} />} />
    <section className="month-overview" aria-label={`${monthName} spending summary`}>
      <div className="overview-copy"><span className="eyebrow">SPENT IN {monthName.toUpperCase()}</span>
        {loading ? <SkeletonBlock className="overview-skeleton" /> : total ? <strong className="overview-amount">{money(total.amount, selectedCurrency)}</strong> : <strong className="overview-amount">{money(0, selectedCurrency)}</strong>}
        <span className="overview-note">Included expenses only</span>
      </div>
      <div className="overview-side">
        <span className="overview-mark" aria-hidden="true"><CircleDollarSign size={22} /></span>
        {total && Number(total.previous_amount) > 0 ? <span className="overview-compare"><ArrowDownRight size={14} /> {money(total.previous_amount, selectedCurrency)} last month</span> : <span className="overview-compare">One entry at a time</span>}
      </div>
    </section>
    <div className="quick-stats" aria-label="This month at a glance">
      <div><span>Entries</span><strong>{includedCount}</strong></div>
      <div><span>Recurring rules</span><strong>{recurringCount}</strong></div>
      <div><span>Currencies</span><strong>{totals.length || 0}</strong></div>
    </div>

    <section className="home-section">
      <SectionHeading title="Spending trend" action={<button type="button" className="text-action" onClick={() => onNavigate("insights")}>More insights <ArrowRight size={14} /></button>} />
      {loading ? <SkeletonBlock className="chart-skeleton" /> : analytics?.months.length ? <TrendChart analytics={analytics} currency={selectedCurrency} compact /> :
        <EmptyState icon={<BarChart3 size={21} />} title="Your trend starts here" copy="As you add expenses, your month-to-month pattern will take shape." />}
    </section>

    <section className="home-section recent-section">
      <SectionHeading title="Latest activity" action={<button type="button" className="text-action" onClick={() => onNavigate("transactions")}>All activity <ArrowRight size={14} /></button>} />
      {loading ? <SkeletonBlock className="list-skeleton" /> : recent.length ? <TransactionList transactions={recent} onEdit={onEdit} /> :
        <EmptyState icon={<EmptySpark />} title="A fresh page" copy="Add your first expense. It only takes a moment." action={<button type="button" className="secondary-button" onClick={onAdd}><Plus size={15} /> Add expense</button>} />}
    </section>
  </>;
}

export function TransactionsScreen({ includedCount, excludedCount, refreshToken, onEdit }: {
  includedCount: number; excludedCount: number; refreshToken: number; onEdit: (tx: Transaction) => void;
}) {
  const pageSize = 20;
  const [tab, setTab] = useState<"included" | "excluded">("included");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, pageCount);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);
  useEffect(() => { setPage(1); }, [tab, debouncedSearch]);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    const params = new URLSearchParams({ limit: String(pageSize), page: String(page) });
    if (tab === "excluded") params.set("excluded", "true");
    if (debouncedSearch) params.set("q", debouncedSearch);
    api<{ transactions: Transaction[]; total: number }>(`/api/transactions?${params}`)
      .then((result) => { if (active) {
        setRows(result.transactions); setTotal(result.total);
        setPage((current) => Math.min(current, Math.max(1, Math.ceil(result.total / pageSize))));
      } })
      .catch((cause) => { if (active) setError(cause instanceof Error ? cause.message : "Could not load transactions."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [tab, page, debouncedSearch, refreshToken]);
  return <>
    <PageHeading eyebrow="YOUR MONEY, YOUR RECORD" title="Activity" copy="Tap an expense to review or edit it." />
    <div className="screen-tools">
      <SegmentedControl label="Analysis inclusion" value={tab} onChange={(value) => { setTab(value); setPage(1); }} options={[
        { value: "included", label: "Included", count: includedCount },
        { value: "excluded", label: "Excluded", count: excludedCount }
      ]} />
      <label className="search-field"><Search size={16} aria-hidden="true" /><span className="sr-only">Search activity</span>
        <input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search category or note" />
      </label>
    </div>
    {error && <Notice>{error}</Notice>}
    {loading ? <SkeletonBlock className="list-skeleton" /> : total ? <>
      <TransactionList transactions={rows} onEdit={onEdit} />
      <nav className="pagination" aria-label="Transaction pages">
        <span>Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, total)} of {total}</span>
        <div>
          <button type="button" className="secondary-button" onClick={() => setPage(currentPage - 1)} disabled={currentPage <= 1}>Previous</button>
          <span className="pagination-page">{currentPage} / {pageCount}</span>
          <button type="button" className="secondary-button" onClick={() => setPage(currentPage + 1)} disabled={currentPage >= pageCount}>Next</button>
        </div>
      </nav>
    </> :
      <EmptyState icon={tab === "excluded" ? <Archive size={20} /> : <EmptySpark />} title={debouncedSearch ? "No matching expenses" : tab === "excluded" ? "Nothing excluded" : "No activity yet"}
        copy={debouncedSearch ? "Try a different category or note." : tab === "excluded" ? "Expenses excluded from insights can be restored here." : "Your expenses will appear here as you add them."} />}
  </>;
}

export function RecurringScreen({ rules, loading, onEdit, onReload }: {
  rules: RecurringRule[]; loading: boolean; onEdit: (rule: RecurringDraft | null) => void; onReload: () => void;
}) {
  const [error, setError] = useState("");
  async function update(rule: RecurringRule, updates: Record<string, unknown>) {
    setError("");
    try { await api("/api/recurring/" + encodeURIComponent(rule.id), { method: "PATCH", body: JSON.stringify({ updates }) }); onReload(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not update this rule."); }
  }
  async function removeArchived(rule: RecurringRule) {
    if (!window.confirm(`Delete the archived ${rule.category_name} rule? Existing transactions will be kept.`)) return;
    setError("");
    try {
      await api("/api/recurring/" + encodeURIComponent(rule.id), { method: "DELETE" });
      onReload();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete this rule."); }
  }
  const active = rules.filter((rule) => !rule.archived);
  const archived = rules.filter((rule) => rule.archived);
  return <>
    <PageHeading eyebrow="REPEATS, ON AUTOPILOT" title="Recurring" copy="Regular expenses, already taken care of." action={<button type="button" className="primary-icon-button" aria-label="Add recurring expense" onClick={() => onEdit(null)}><Plus size={18} /></button>} />
    {error && <Notice>{error}</Notice>}
    {loading ? <SkeletonBlock className="list-skeleton" /> : active.length ? <section className="rules-list" aria-labelledby="current-rules-title">
      <SectionHeading title="Current rules" action={<span className="count-label">{active.length}</span>} className="compact-heading" id="current-rules-title" />
      {active.map((rule) => <div className="recurring-row" key={rule.id}>
        <span className="category-icon"><IconFor icon={rule.category_icon} /></span>
        <button type="button" className="recurring-info" onClick={() => onEdit({
          id: rule.id, amount: rule.amount, category_id: rule.category_id, currency: rule.currency, notes: rule.notes,
          start_date: String(rule.start_date).slice(0, 10), end_date: rule.end_date ? String(rule.end_date).slice(0, 10) : "",
          day_of_month: String(rule.day_of_month), run_at_local_time: rule.run_at_local_time.slice(0, 5), paused: rule.paused, archived: rule.archived
        })}>
          <strong>{rule.category_name}<span>{money(Math.abs(Number(rule.amount)), rule.currency)}</span></strong>
          <small>{rule.cadence === "monthly" ? rule.paused ? "Paused" : "Monthly" : "Inactive legacy rule"} · next {dateLabel(rule.next_occurrence_date + "T00:00:00", { day: "numeric", month: "short" })}{rule.notes ? ` · ${rule.notes}` : ""}</small>
        </button>
        {rule.cadence === "monthly" && <button type="button" role="switch" aria-checked={!rule.paused} aria-label={rule.paused ? `Resume ${rule.category_name}` : `Pause ${rule.category_name}`}
          className={"switch" + (!rule.paused ? " on" : "")} onClick={() => update(rule, { paused: !rule.paused })} />}
        <button type="button" className="icon-button archive-button" aria-label={`Archive ${rule.category_name}`} onClick={() => update(rule, { archived: true })}><Archive size={15} /></button>
      </div>)}
    </section> : <EmptyState icon={<CalendarDays size={21} />} title="No recurring rules yet" copy="Set rent, subscriptions, and regular expenses once. We’ll add each due occurrence." action={<button type="button" className="secondary-button" onClick={() => onEdit(null)}><Plus size={15} /> Add a rule</button>} />}
    {archived.length > 0 && <section className="archived-section"><SectionHeading title="Archived" action={<span className="count-label">{archived.length}</span>} />
      {archived.map((rule) => <div className="archived-row" key={rule.id}><span>{rule.category_name} · {money(Math.abs(Number(rule.amount)), rule.currency)}</span>
        <div className="archived-actions"><button type="button" className="text-action" onClick={() => update(rule, { archived: false, paused: false })}>Restore</button>
          <button type="button" className="icon-button archived-delete" aria-label={`Delete archived ${rule.category_name} rule`} onClick={() => removeArchived(rule)}><Trash2 size={15} /></button></div></div>)}
    </section>}
  </>;
}

export function InsightsScreen({ analytics, loading, month, setMonth }: {
  analytics: Analytics | null; loading: boolean; month: string; setMonth: (month: string) => void;
}) {
  const currencies = Array.from(new Set((analytics?.totals || []).map((item) => item.currency).concat((analytics?.categories || []).map((item) => item.currency))));
  const [currency, setCurrency] = useState("");
  useEffect(() => { if (currencies.length && (!currency || !currencies.includes(currency))) setCurrency(currencies.includes("INR") ? "INR" : currencies[0]); }, [currencies.join(","), currency]);
  const selectedCurrency = currency && currencies.includes(currency) ? currency : currencies.includes("INR") ? "INR" : currencies[0] || "";
  const categories = (analytics?.categories || []).filter((row) => row.currency === selectedCurrency);
  const pieCategories = categories.map((row) => ({ ...row, amount: Number(row.amount) }));
  const daily = (analytics?.daily || []).filter((row) => row.currency === selectedCurrency);
  const weekdays = (analytics?.weekdays || []).filter((row) => row.currency === selectedCurrency);
  const months = (analytics?.months || []).filter((row) => row.currency === selectedCurrency);
  const total = analytics?.totals.find((row) => row.currency === selectedCurrency);

  return <>
    <PageHeading eyebrow="PATTERNS, NOT PRESSURE" title="Insights" copy="Only expenses included in analysis are shown." action={<span className="insight-mark" aria-hidden="true"><Lightbulb size={20} /></span>} />
    <div className="screen-tools insight-tools"><MonthPicker month={month} onChange={setMonth} />
      {currencies.length > 1 && <label className="currency-select"><span className="sr-only">Currency</span><select value={selectedCurrency} onChange={(event) => setCurrency(event.target.value)}>{currencies.map((code) => <option key={code}>{code}</option>)}</select></label>}
    </div>
    {loading && !analytics ? <PageLoading label="Loading spending insights" /> : !total ? <EmptyState icon={<BarChart3 size={21} />} title="Nothing to chart yet" copy="Add or include expenses for this month and your patterns will appear here." /> : <>
      <div className="insight-summary"><div><span>This month</span><strong>{money(total.amount, selectedCurrency)}</strong></div><div><span>Previous month</span><strong>{money(total.previous_amount, selectedCurrency)}</strong></div></div>

      <div className="insights-layout">
      <section className="insight-section"><SectionHeading title="Spending over time" action={<span className="unit-label">6 months · {selectedCurrency}</span>} />
        {months.length ? <TrendChart analytics={{ ...(analytics as Analytics), months }} currency={selectedCurrency} /> : <EmptyState title="No trend yet" copy="Monthly totals appear here when there are included expenses." />}
      </section>

      <section className="insight-section"><SectionHeading title="Where it went" action={<span className="unit-label">This month</span>} />
        {categories.length ? <>
          <div className="chart-wrap donut-chart" role="img" aria-label={`Spending by category in ${selectedCurrency}`}><ResponsiveContainer width="100%" height="100%"><PieChart>
            <Pie data={pieCategories} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={88} paddingAngle={3} stroke="none">
              {pieCategories.map((row, index) => <Cell key={row.category} fill={chartColors[index % chartColors.length]} />)}
            </Pie><Tooltip formatter={(value) => money(Number(value), selectedCurrency)} contentStyle={{ borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 12 }} />
          </PieChart></ResponsiveContainer></div>
          <div className="category-breakdown">{categories.map((row, index) => <div className="category-breakdown-row" key={row.category}>
            <span className="chart-swatch" style={{ background: chartColors[index % chartColors.length] }} />
            <span>{row.category}</span><small>{row.count}</small><strong>{money(row.amount, selectedCurrency)}</strong>
          </div>)}</div>
          <DataTable title="Spending by category" rows={categories.map((row) => ({ label: row.category, value: money(row.amount, selectedCurrency) }))} />
        </> : <EmptyState title="No category totals" copy="Category patterns will show once this month has included expenses." />}
      </section>

      <section className="insight-section"><SectionHeading title="Spending by day" action={<span className="unit-label">Daily totals</span>} />
        {daily.length ? <><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={daily} margin={{ top: 12, right: 2, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} /><XAxis dataKey="date" tickFormatter={(value) => String(value).slice(-2)} tickLine={false} axisLine={false} interval="preserveStartEnd" tick={{ fill: "var(--muted)", fontSize: 9 }} />
          <YAxis domain={([, dataMax]) => [0, dataMax > 0 ? dataMax * 1.08 : 1]} allowDataOverflow tickCount={4} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} tickFormatter={(value) => Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(Math.round(Number(value)))} /><Tooltip labelFormatter={(value) => dateLabel(String(value) + "T00:00:00Z", { day: "numeric", month: "short" })} formatter={(value) => money(Number(value), selectedCurrency)} contentStyle={{ borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 12 }} />
          <Bar dataKey="amount" fill="var(--chart-coral)" radius={[5, 5, 0, 0]} maxBarSize={24} />
        </BarChart></ResponsiveContainer></div><DataTable title="Daily spending" rows={daily.map((row) => ({ label: row.date, value: money(row.amount, selectedCurrency) }))} /></> : <EmptyState title="No daily totals" copy="There are no included expenses to show for this month." />}
      </section>

      <section className="insight-section"><SectionHeading title="Your weekly rhythm" action={<span className="unit-label">Average expense</span>} />
        {weekdays.length ? <><div className="chart-wrap"><ResponsiveContainer width="100%" height="100%"><BarChart data={weekdays} margin={{ top: 12, right: 2, left: -22, bottom: 0 }}>
          <CartesianGrid stroke="var(--line)" strokeDasharray="2 5" vertical={false} /><XAxis dataKey="day" tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 10 }} />
          <YAxis domain={([, dataMax]) => [0, dataMax > 0 ? dataMax * 1.08 : 1]} allowDataOverflow tickCount={4} tickLine={false} axisLine={false} tick={{ fill: "var(--muted)", fontSize: 9 }} tickFormatter={(value) => Number(value) >= 1000 ? `${(Number(value) / 1000).toFixed(1).replace(/\.0$/, "")}k` : String(Math.round(Number(value)))} /><Tooltip formatter={(value) => [money(Number(value), selectedCurrency), "Average"]} contentStyle={{ borderRadius: 14, border: "1px solid var(--line)", background: "var(--surface)", color: "var(--ink)", fontSize: 12 }} />
          <Bar dataKey="amount" fill="var(--chart-plum)" radius={[5, 5, 0, 0]} maxBarSize={28} />
        </BarChart></ResponsiveContainer></div><DataTable title="Average expense by weekday" rows={weekdays.map((row) => ({ label: row.day, value: money(row.amount, selectedCurrency) }))} /></> : <EmptyState title="Not enough history yet" copy="Averages appear once there is spending to compare." />}
      </section>

      <section className="insight-section"><SectionHeading title="Daily rhythm" action={<span className="unit-label">{selectedCurrency}</span>} /><Heatmap daily={daily} month={month} currency={selectedCurrency} /></section>
      </div>
    </>}
  </>;
}

function Heatmap({ daily, month, currency }: { daily: Analytics["daily"]; month: string; currency: string }) {
  const count = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0).getDate();
  const first = new Date(Number(month.slice(0, 4)), Number(month.slice(5, 7)) - 1, 1).getDay();
  const values = new Map(daily.map((row) => [row.date.slice(-2), Number(row.amount)]));
  const max = Math.max(...Array.from(values.values()), 1);
  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return <div className="heatmap" role="group" aria-label={`Daily spending for ${month}`}>
    {weekdays.map((day) => <span className="heatmap-day" key={day}>{day.slice(0, 1)}</span>)}
    {Array.from({ length: first }, (_, index) => <span key={`blank-${index}`} aria-hidden="true" />)}
    {Array.from({ length: count }, (_, index) => {
      const day = String(index + 1).padStart(2, "0");
      const amount = values.get(day) || 0;
      const opacity = amount ? 0.12 + 0.72 * amount / max : 0.035;
      return <span key={day} className="heatmap-cell" title={`${day}: ${money(amount, currency)}`} aria-label={`${day}: ${money(amount, currency)}`} style={{ background: `color-mix(in oklch, var(--chart-plum) ${Math.round(opacity * 100)}%, var(--surface))` }}>{index + 1}</span>;
    })}
  </div>;
}
