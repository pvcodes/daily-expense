CREATE TABLE IF NOT EXISTS tracker_migrations (
  version TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tracker_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT 'circle',
  color TEXT NOT NULL DEFAULT '#496d5d',
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS tracker_categories_name_uq ON tracker_categories (lower(name));

CREATE TABLE IF NOT EXISTS tracker_recurring_rules (
  id TEXT PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES tracker_categories(id) ON DELETE RESTRICT,
  amount NUMERIC(18,4) NOT NULL CHECK (amount <> 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency ~ '^[A-Z]{3}$'),
  notes TEXT NOT NULL DEFAULT '',
  cadence TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL,
  end_date DATE,
  day_of_month SMALLINT NOT NULL CHECK (day_of_month BETWEEN 1 AND 31),
  run_at_local_time TIME NOT NULL DEFAULT '00:00',
  next_occurrence_date DATE NOT NULL,
  last_generated DATE,
  paused BOOLEAN NOT NULL DEFAULT FALSE,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date IS NULL OR end_date >= start_date)
);
CREATE INDEX IF NOT EXISTS tracker_recurring_due_idx ON tracker_recurring_rules (next_occurrence_date) WHERE paused = FALSE AND archived = FALSE;

CREATE TABLE IF NOT EXISTS tracker_transactions (
  id TEXT PRIMARY KEY,
  occurred_at TIMESTAMPTZ NOT NULL,
  category_id UUID NOT NULL REFERENCES tracker_categories(id) ON DELETE RESTRICT,
  amount NUMERIC(18,4) NOT NULL CHECK (amount <> 0),
  currency VARCHAR(3) NOT NULL DEFAULT 'INR' CHECK (currency ~ '^[A-Z]{3}$'),
  notes TEXT NOT NULL DEFAULT '',
  include_in_analysis BOOLEAN NOT NULL DEFAULT TRUE,
  recurring_rule_id TEXT REFERENCES tracker_recurring_rules(id) ON DELETE RESTRICT,
  occurrence_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT tracker_transactions_occurrence_pair_ck CHECK (
    (recurring_rule_id IS NULL AND occurrence_date IS NULL) OR
    (recurring_rule_id IS NOT NULL AND occurrence_date IS NOT NULL)
  ),
  CONSTRAINT tracker_transactions_recurring_occurrence_key UNIQUE (recurring_rule_id, occurrence_date)
);
CREATE INDEX IF NOT EXISTS tracker_transactions_occurred_idx ON tracker_transactions (occurred_at DESC);
CREATE INDEX IF NOT EXISTS tracker_transactions_excluded_idx ON tracker_transactions (occurred_at DESC) WHERE include_in_analysis = FALSE;
CREATE INDEX IF NOT EXISTS tracker_transactions_analysis_idx ON tracker_transactions (occurred_at DESC, currency) WHERE include_in_analysis = TRUE;

CREATE OR REPLACE VIEW tracker_analysis_transactions AS
SELECT t.*, c.name AS category_name, c.icon AS category_icon
FROM tracker_transactions t
JOIN tracker_categories c ON c.id = t.category_id
WHERE t.include_in_analysis = TRUE;

CREATE TABLE IF NOT EXISTS tracker_sessions (
  token_hash TEXT PRIMARY KEY,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS tracker_sessions_expiry_idx ON tracker_sessions (expires_at);

CREATE TABLE IF NOT EXISTS tracker_login_attempts (
  key_hash TEXT PRIMARY KEY,
  attempts SMALLINT NOT NULL DEFAULT 0,
  window_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  locked_until TIMESTAMPTZ
);

INSERT INTO tracker_categories (name, icon, color) VALUES
  ('Food & drink', 'utensils', '#c28254'),
  ('Transport', 'train-front', '#6687a7'),
  ('Shopping', 'shopping-bag', '#a77591'),
  ('Bills', 'receipt', '#7d8b68'),
  ('Health', 'heart-pulse', '#bb6d66'),
  ('Home', 'house', '#ba9a5d'),
  ('Entertainment', 'ticket', '#8976a2'),
  ('Other', 'circle', '#77827b')
ON CONFLICT (lower(name)) DO NOTHING;

CREATE OR REPLACE FUNCTION tracker_month_occurrence(p_month DATE, p_day SMALLINT)
RETURNS DATE LANGUAGE SQL IMMUTABLE STRICT AS $$
  SELECT (date_trunc('month', p_month)::date
    + (LEAST(p_day, EXTRACT(day FROM (date_trunc('month', p_month) + INTERVAL '1 month - 1 day'))::int) - 1)
      * INTERVAL '1 day')::date
$$;

CREATE OR REPLACE FUNCTION tracker_first_month_occurrence(p_start DATE, p_day SMALLINT)
RETURNS DATE LANGUAGE plpgsql IMMUTABLE STRICT AS $$
DECLARE
  candidate DATE;
BEGIN
  candidate := tracker_month_occurrence(p_start, p_day);
  IF candidate < p_start THEN
    candidate := tracker_month_occurrence((p_start + INTERVAL '1 month')::date, p_day);
  END IF;
  RETURN candidate;
END;
$$;

CREATE OR REPLACE FUNCTION tracker_process_due_rule(p_rule_id TEXT, p_until TIMESTAMPTZ DEFAULT NOW())
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  r tracker_recurring_rules%ROWTYPE;
  local_now TIMESTAMP;
  occurrence DATE;
  occurrence_at TIMESTAMPTZ;
  inserted_count INTEGER := 0;
  result_count INTEGER := 0;
BEGIN
  SELECT * INTO r FROM tracker_recurring_rules WHERE id = p_rule_id FOR UPDATE;
  IF NOT FOUND OR r.paused OR r.archived OR r.cadence <> 'monthly' THEN
    RETURN 0;
  END IF;

  local_now := p_until AT TIME ZONE 'Asia/Kolkata';
  occurrence := r.next_occurrence_date;
  WHILE occurrence <= local_now::date
    AND (occurrence < local_now::date OR r.run_at_local_time <= local_now::time)
    AND (r.end_date IS NULL OR occurrence <= r.end_date)
  LOOP
    occurrence_at := (occurrence + r.run_at_local_time) AT TIME ZONE 'Asia/Kolkata';
    IF occurrence_at <= p_until THEN
      INSERT INTO tracker_transactions (
        id, occurred_at, category_id, amount, currency, notes,
        include_in_analysis, recurring_rule_id, occurrence_date
      ) VALUES (
        gen_random_uuid()::text, occurrence_at, r.category_id, r.amount,
        r.currency, r.notes, TRUE, r.id, occurrence
      )
      ON CONFLICT ON CONSTRAINT tracker_transactions_recurring_occurrence_key DO NOTHING;

      GET DIAGNOSTICS inserted_count = ROW_COUNT;
      result_count := result_count + inserted_count;
      UPDATE tracker_recurring_rules
      SET last_generated = occurrence, updated_at = NOW()
      WHERE id = r.id;
    END IF;

    occurrence := tracker_month_occurrence((occurrence + INTERVAL '1 month')::date, r.day_of_month);
    UPDATE tracker_recurring_rules
    SET next_occurrence_date = occurrence, updated_at = NOW()
    WHERE id = r.id;
  END LOOP;

  IF r.end_date IS NOT NULL AND occurrence > r.end_date THEN
    UPDATE tracker_recurring_rules
    SET archived = TRUE, updated_at = NOW()
    WHERE id = r.id;
  END IF;
  RETURN result_count;
END;
$$;

CREATE OR REPLACE FUNCTION tracker_process_due_recurring(p_until TIMESTAMPTZ DEFAULT NOW())
RETURNS INTEGER LANGUAGE plpgsql AS $$
DECLARE
  rule_row RECORD;
  total_count INTEGER := 0;
BEGIN
  FOR rule_row IN
    SELECT id FROM tracker_recurring_rules
    WHERE paused = FALSE AND archived = FALSE AND cadence = 'monthly'
      AND next_occurrence_date <= (p_until AT TIME ZONE 'Asia/Kolkata')::date
    ORDER BY next_occurrence_date
  LOOP
    total_count := total_count + tracker_process_due_rule(rule_row.id, p_until);
  END LOOP;
  RETURN total_count;
END;
$$;
