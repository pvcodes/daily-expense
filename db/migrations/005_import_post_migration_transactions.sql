-- The legacy app remained active after the initial data copy. Bring across
-- owner transactions created since that copy, without resurrecting older rows
-- that may have been intentionally deleted from the tracker.
DO $$
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL THEN
    EXECUTE $sql$
INSERT INTO tracker_transactions (
  id, occurred_at, category_id, amount, currency, notes,
  include_in_analysis, recurring_rule_id, occurrence_date,
  created_at, updated_at
)
SELECT
  source.id,
  (source.date::timestamp + CASE
    WHEN source.time ~ '^[0-2][0-9]:[0-5][0-9](:[0-5][0-9])?$' THEN source.time::time
    ELSE TIME '00:00'
  END) AT TIME ZONE 'Asia/Kolkata',
  category.id,
  source.price::numeric(18,4),
  upper(COALESCE(NULLIF(source.currency, ''), 'INR')),
  COALESCE(source.notes, ''),
  COALESCE(source.include_in_analysis, TRUE),
  NULL,
  NULL,
  COALESCE(source.created_at, NOW()),
  COALESCE(source.updated_at, NOW())
FROM public.transactions source
JOIN tracker_categories category
  ON lower(category.name) = lower(COALESCE(NULLIF(BTRIM(source.category), ''), 'Other'))
WHERE source.user_id = 'me'
  AND source.recurring_rule_id IS NULL
  AND source.created_at > (
    SELECT applied_at FROM tracker_migrations
    WHERE version = '002_copy_legacy_data'
  )
  AND NOT EXISTS (
    SELECT 1 FROM tracker_transactions existing WHERE existing.id = source.id
  )
    $sql$;
  END IF;
END;
$$;
