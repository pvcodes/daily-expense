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

export type Analytics = {
  totals: { currency: string; amount: string; previous_amount: string }[];
  months: { month: string; currency: string; amount: string }[];
  categories: { category: string; icon: string; currency: string; amount: string; count: number }[];
  weekdays: { day: string; currency: string; amount: string }[];
  daily: { date: string; currency: string; amount: string }[];
};
