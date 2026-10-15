"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LogOut } from "lucide-react";
import { api } from "@/lib/client";
import { clearActivityPage, writeActivityPage, type ActivityPage } from "@/lib/activity-cache";
import { localDateTimeInput } from "@/lib/format";
import type { Analytics, Category, RecurringRule, Transaction } from "@/lib/types";
import type { DashboardView, RecurringDraft, TransactionDraft } from "@/components/dashboard-types";
import { BottomNav } from "@/components/BottomNav";
import { ExpenseSheet, RecurringSheet } from "@/components/ExpenseSheets";
import { HomeScreen, InsightsScreen, RecurringScreen, TransactionsScreen } from "@/components/DashboardScreens";
import { BrandMark, Notice } from "@/components/ui";

function currentMonthKey() {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).formatToParts(new Date());
  const part = (key: string) => parts.find((item) => item.type === key)?.value || "";
  return `${part("year")}-${part("month")}`;
}

export default function Dashboard() {
  const [view, setView] = useState<DashboardView>("home");
  const [month, setMonth] = useState(currentMonthKey);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [includedCount, setIncludedCount] = useState(0);
  const [categories, setCategories] = useState<Category[]>([]);
  const [rules, setRules] = useState<RecurringRule[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [error, setError] = useState("");
  const [txEditor, setTxEditor] = useState<TransactionDraft | null | undefined>(undefined);
  const [ruleEditor, setRuleEditor] = useState<RecurringDraft | null | undefined>(undefined);
  const [signingOut, setSigningOut] = useState(false);
  const addButtonRef = useRef<HTMLButtonElement>(null);
  const expenseReturnFocusRef = useRef<HTMLElement | null>(null);
  const recurringReturnFocusRef = useRef<HTMLElement | null>(null);
  const monthRef = useRef(month);
  monthRef.current = month;

  const loadCore = useCallback(async () => {
    const [includedData, categoryData, recurringData] = await Promise.all([
      api<ActivityPage>("/api/transactions?page=1&pageSize=20"),
      api<{ categories: Category[] }>("/api/categories"),
      api<{ rules: RecurringRule[] }>("/api/recurring")
    ]);
    setTransactions(includedData.transactions);
    setIncludedCount(includedData.total);
    writeActivityPage(includedData);
    setCategories(categoryData.categories);
    setRules(recurringData.rules);
  }, []);

  const loadAnalytics = useCallback(async (targetMonth: string) => {
    const result = await api<Analytics>("/api/analytics?month=" + targetMonth);
    setAnalytics(result);
  }, []);

  const reloadRules = useCallback(async () => {
    try {
      const result = await api<{ rules: RecurringRule[] }>("/api/recurring");
      setRules(result.rules);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not refresh recurring expenses.");
    }
  }, []);

  const reload = useCallback(async () => {
    setError("");
    if (!hasLoaded.current) setLoading(true);
    try {
      await Promise.all([loadCore(), loadAnalytics(monthRef.current)]);
      setRefreshVersion((version) => version + 1);
      hasLoaded.current = true;
    }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load the ledger."); }
    finally { setLoading(false); }
  }, [loadCore, loadAnalytics]);

  useEffect(() => { void reload(); }, [reload]);
  // Changing the month only needs fresh analytics; core data is month-independent.
  useEffect(() => {
    if (!hasLoaded.current) return;
    void loadAnalytics(month).catch((cause) => setError(cause instanceof Error ? cause.message : "Could not load the ledger."));
  }, [month, loadAnalytics]);
  useEffect(() => {
    if ("serviceWorker" in navigator) void navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  }, []);

  const openExpense = useCallback((draft: TransactionDraft | null = null) => {
    expenseReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : addButtonRef.current;
    setTxEditor(draft);
  }, []);
  const closeExpense = useCallback(() => setTxEditor(undefined), []);
  const addExpense = useCallback(() => openExpense(null), [openExpense]);
  const openRecurring = useCallback((draft: RecurringDraft | null = null) => {
    recurringReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setRuleEditor(draft);
  }, []);
  const closeRecurring = useCallback(() => setRuleEditor(undefined), []);

  const editTransaction = useCallback((transaction: Transaction) => {
    expenseReturnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : addButtonRef.current;
    setTxEditor({
      id: transaction.id, amount: transaction.amount, category_id: transaction.category_id,
      currency: transaction.currency, notes: transaction.notes,
      occurred_at: localDateTimeInput(transaction.occurred_at), include_in_analysis: transaction.include_in_analysis
    });
  }, []);

  async function signOut() {
    setSigningOut(true);
    try { await fetch("/api/auth/logout", { method: "POST" }); }
    finally {
      setTransactions([]); setAnalytics(null); clearActivityPage();
      window.location.assign("/login");
    }
  }

  const pageTitle = view === "home" ? "Your month" : view === "transactions" ? "Activity" : view === "recurring" ? "Recurring" : "Insights";
  return <div className="shell">
    <header className="app-header">
      <div className="brand"><BrandMark /><span className="brand-copy"><strong>Pocket Ledger</strong><small>PERSONAL EXPENSES</small></span></div>
      <button className="header-action" type="button" aria-label="Sign out" onClick={signOut} disabled={signingOut}>
        {signingOut ? <span className="sr-only">Signing out</span> : <LogOut size={17} />}
      </button>
    </header>
    <main className="main-content" aria-label={pageTitle}>
      {error && <Notice onRetry={() => void reload()}>{error}</Notice>}
      {view === "home" && <HomeScreen analytics={analytics} transactions={transactions} includedCount={includedCount} recurringCount={rules.filter((rule) => !rule.archived).length} loading={loading} month={month} setMonth={setMonth} onEdit={editTransaction} onAdd={addExpense} onNavigate={setView} />}
      {view === "transactions" && <TransactionsScreen refreshVersion={refreshVersion} onEdit={editTransaction} />}
      {view === "recurring" && <RecurringScreen rules={rules} loading={loading} onEdit={openRecurring} onReload={() => void reloadRules()} />}
      {view === "insights" && <InsightsScreen analytics={analytics} loading={loading} month={month} setMonth={setMonth} />}
    </main>
    <BottomNav view={view} onNavigate={setView} onAdd={addExpense} addRef={addButtonRef} />
    {txEditor !== undefined && <ExpenseSheet draft={txEditor} categories={categories} onClose={closeExpense} onSaved={() => void reload()} returnFocusRef={expenseReturnFocusRef} />}
    {ruleEditor !== undefined && <RecurringSheet draft={ruleEditor} categories={categories} onClose={closeRecurring} onSaved={() => void reload()} returnFocusRef={recurringReturnFocusRef} />}
  </div>;
}
