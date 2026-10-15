-- Run only after stopping writes from the new app.
-- This copies current tracker records into the original tables without deleting either copy.
BEGIN;

INSERT INTO public.recurring (
  user_id, id, category, price, notes, frequency, start_date, time,
  last_generated, created_at, include_in_analysis, paused
)
SELECT
  'me', r.id, c.name, r.amount::double precision, r.notes, r.cadence,
  r.start_date, to_char(r.run_at_local_time, 'HH24:MI'),
  COALESCE(MAX(t.occurrence_date), r.last_generated), r.created_at, FALSE,
  r.paused OR r.archived
FROM tracker_recurring_rules r
JOIN tracker_categories c ON c.id = r.category_id
LEFT JOIN tracker_transactions t ON t.recurring_rule_id = r.id
GROUP BY r.id, c.name, r.amount, r.notes, r.cadence, r.start_date,
  r.run_at_local_time, r.last_generated, r.created_at, r.paused, r.archived
ON CONFLICT (id) DO UPDATE SET
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  notes = EXCLUDED.notes,
  frequency = EXCLUDED.frequency,
  start_date = EXCLUDED.start_date,
  time = EXCLUDED.time,
  last_generated = EXCLUDED.last_generated,
  paused = EXCLUDED.paused;

INSERT INTO public.transactions (
  id, date, time, category, price, currency, notes,
  created_at, updated_at, user_id, include_in_analysis, recurring_rule_id
)
SELECT
  t.id,
  (t.occurred_at AT TIME ZONE 'Asia/Kolkata')::date,
  to_char(t.occurred_at AT TIME ZONE 'Asia/Kolkata', 'HH24:MI'),
  c.name,
  t.amount::double precision,
  t.currency,
  t.notes,
  t.created_at,
  t.updated_at,
  'me',
  t.include_in_analysis,
  t.recurring_rule_id
FROM tracker_transactions t
JOIN tracker_categories c ON c.id = t.category_id
ON CONFLICT (id) DO UPDATE SET
  date = EXCLUDED.date,
  time = EXCLUDED.time,
  category = EXCLUDED.category,
  price = EXCLUDED.price,
  currency = EXCLUDED.currency,
  notes = EXCLUDED.notes,
  updated_at = EXCLUDED.updated_at,
  include_in_analysis = EXCLUDED.include_in_analysis,
  recurring_rule_id = EXCLUDED.recurring_rule_id;

COMMIT;
