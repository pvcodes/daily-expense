export type Category = {
  id: string;
  name: string;
  icon: string;
  color: string;
};

export type Transaction = {
  id: string;
  occurred_at: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  amount: string;
  currency: string;
  notes: string;
  include_in_analysis: boolean;
  recurring_rule_id: string | null;
  occurrence_date: string | null;
};

export type RecurringRule = {
  id: string;
  category_id: string;
  category_name: string;
  category_icon: string;
  amount: string;
  currency: string;
  notes: string;
  start_date: string;
  end_date: string | null;
  day_of_month: number;
  run_at_local_time: string;
  next_occurrence_date: string;
  paused: boolean;
  archived: boolean;
  cadence: string;
};

export type CronRun = {
  id: string;
  request_id: string | null;
  source: "vercel_cron" | "http";
  status: "running" | "succeeded" | "failed";
  started_at: string;
  completed_at: string | null;
  duration_ms: number | null;
  generated_count: number | null;
  error_name: string | null;
  error_code: string | null;
};

export type Analytics = {
  totals: { currency: string; amount: string; previous_amount: string }[];
  months: { month: string; currency: string; amount: string }[];
  categories: { category: string; icon: string; currency: string; amount: string; count: number }[];
  weekdays: { day: string; currency: string; amount: string }[];
  daily: { date: string; currency: string; amount: string }[];
};
