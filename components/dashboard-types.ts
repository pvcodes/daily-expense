export type DashboardView = "home" | "transactions" | "recurring" | "insights";

export type TransactionDraft = {
  id?: string;
  amount: string;
  category_id: string;
  currency: string;
  notes: string;
  occurred_at: string;
  include_in_analysis: boolean;
};

export type RecurringDraft = {
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
