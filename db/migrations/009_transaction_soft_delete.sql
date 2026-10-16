ALTER TABLE tracker_transactions
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS delete_remark TEXT;

ALTER TABLE tracker_transactions DROP CONSTRAINT IF EXISTS tracker_transactions_deleted_remark_ck;
ALTER TABLE tracker_transactions
  ADD CONSTRAINT tracker_transactions_deleted_remark_ck
  CHECK (deleted_at IS NULL OR (delete_remark IS NOT NULL AND btrim(delete_remark) <> ''));

DROP INDEX IF EXISTS tracker_transactions_included_page_idx;
CREATE INDEX IF NOT EXISTS tracker_transactions_included_page_idx
  ON tracker_transactions (occurred_at DESC, id DESC)
  WHERE include_in_analysis = TRUE AND deleted_at IS NULL;

DROP INDEX IF EXISTS tracker_transactions_excluded_page_idx;
CREATE INDEX IF NOT EXISTS tracker_transactions_excluded_page_idx
  ON tracker_transactions (occurred_at DESC, id DESC)
  WHERE include_in_analysis = FALSE AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS tracker_transactions_live_idx
  ON tracker_transactions (occurred_at DESC, id DESC)
  WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS tracker_transactions_deleted_idx
  ON tracker_transactions (deleted_at DESC)
  WHERE deleted_at IS NOT NULL;

CREATE OR REPLACE VIEW tracker_analysis_transactions AS
SELECT t.id, t.occurred_at, t.category_id, t.amount, t.currency, t.notes,
       t.include_in_analysis, t.recurring_rule_id, t.occurrence_date,
       t.created_at, t.updated_at,
       c.name AS category_name, c.icon AS category_icon,
       t.deleted_at, t.delete_remark
FROM tracker_transactions t
JOIN tracker_categories c ON c.id = t.category_id
WHERE t.include_in_analysis = TRUE AND t.deleted_at IS NULL;
