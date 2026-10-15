-- Legacy transactions use negative values for expenses. Preserve those signed
-- source amounts and allow signed non-zero values in the tracker tables.
ALTER TABLE tracker_recurring_rules DROP CONSTRAINT IF EXISTS tracker_recurring_rules_amount_check;
ALTER TABLE tracker_recurring_rules ADD CONSTRAINT tracker_recurring_rules_amount_check CHECK (amount <> 0);
ALTER TABLE tracker_transactions DROP CONSTRAINT IF EXISTS tracker_transactions_amount_check;
ALTER TABLE tracker_transactions ADD CONSTRAINT tracker_transactions_amount_check CHECK (amount <> 0);

DO $$
DECLARE
  category_row RECORD;
  rule_row RECORD;
  normalized_frequency TEXT;
  start_day SMALLINT;
  next_day DATE;
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL THEN
    FOR category_row IN
      SELECT DISTINCT COALESCE(NULLIF(BTRIM(category), ''), 'Other') AS category_name
      FROM public.transactions
      WHERE user_id = 'me'
    LOOP
      INSERT INTO tracker_categories (name)
      VALUES (category_row.category_name)
      ON CONFLICT (lower(name)) DO NOTHING;
    END LOOP;
  END IF;

  IF to_regclass('public.recurring') IS NOT NULL THEN
    FOR category_row IN
      SELECT DISTINCT COALESCE(NULLIF(BTRIM(category), ''), 'Other') AS category_name
      FROM public.recurring
      WHERE user_id = 'me'
    LOOP
      INSERT INTO tracker_categories (name)
      VALUES (category_row.category_name)
      ON CONFLICT (lower(name)) DO NOTHING;
    END LOOP;

    FOR rule_row IN SELECT * FROM public.recurring WHERE user_id = 'me' LOOP
      normalized_frequency := lower(COALESCE(rule_row.frequency, 'monthly'));
      start_day := EXTRACT(day FROM rule_row.start_date)::smallint;
      next_day := tracker_first_month_occurrence(rule_row.start_date, start_day);

      IF rule_row.last_generated IS NOT NULL THEN
        next_day := tracker_month_occurrence((rule_row.last_generated + INTERVAL '1 month')::date, start_day);
      END IF;

      INSERT INTO tracker_recurring_rules (
        id, category_id, amount, currency, notes, cadence, start_date,
        day_of_month, run_at_local_time, next_occurrence_date, last_generated,
        paused, archived, created_at
      )
      SELECT
        rule_row.id,
        c.id,
        rule_row.price::numeric(18,4),
        'INR',
        COALESCE(rule_row.notes, ''),
        CASE
          WHEN normalized_frequency LIKE '%month%' THEN 'monthly'
          WHEN normalized_frequency LIKE '%week%' THEN 'weekly'
          WHEN normalized_frequency LIKE '%year%' OR normalized_frequency LIKE '%annual%' THEN 'yearly'
          ELSE normalized_frequency
        END,
        rule_row.start_date,
        start_day,
        CASE
          WHEN rule_row.time ~ '^[0-2][0-9]:[0-5][0-9](:[0-5][0-9])?$' THEN rule_row.time::time
          ELSE TIME '00:00'
        END,
        next_day,
        rule_row.last_generated,
        COALESCE(rule_row.paused, FALSE),
        COALESCE(rule_row.paused, FALSE) OR normalized_frequency NOT LIKE '%month%',
        COALESCE(rule_row.created_at, NOW())
      FROM tracker_categories c
      WHERE lower(c.name) = lower(COALESCE(NULLIF(BTRIM(rule_row.category), ''), 'Other'))
      ON CONFLICT (id) DO NOTHING;
    END LOOP;
  END IF;

  IF to_regclass('public.transactions') IS NOT NULL THEN
    INSERT INTO tracker_transactions (
      id, occurred_at, category_id, amount, currency, notes,
      include_in_analysis, recurring_rule_id, occurrence_date,
      created_at, updated_at
    )
    SELECT
      t.id,
      ((t.date::timestamp + CASE
        WHEN t.time ~ '^[0-2][0-9]:[0-5][0-9](:[0-5][0-9])?$' THEN t.time::time
        ELSE TIME '00:00'
      END) AT TIME ZONE 'Asia/Kolkata'),
      c.id,
      t.price::numeric(18,4),
      upper(COALESCE(NULLIF(t.currency, ''), 'INR')),
      COALESCE(t.notes, ''),
      COALESCE(t.include_in_analysis, TRUE),
      r.id,
      CASE WHEN r.id IS NULL THEN NULL ELSE t.date END,
      COALESCE(t.created_at, NOW()),
      COALESCE(t.updated_at, NOW())
    FROM public.transactions t
    JOIN tracker_categories c ON lower(c.name) = lower(COALESCE(NULLIF(BTRIM(t.category), ''), 'Other'))
    LEFT JOIN tracker_recurring_rules r ON r.id = t.recurring_rule_id
    WHERE t.user_id = 'me'
    ON CONFLICT (id) DO NOTHING;
  END IF;
END
$$;
