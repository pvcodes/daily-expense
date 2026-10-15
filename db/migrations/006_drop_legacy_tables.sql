-- The tracker tables are now authoritative. The legacy tables remain only as
-- migration sources and create duplicate schemas in the live database.
DO $$
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.transactions source
    WHERE source.user_id = 'me'
      AND source.created_at > (
        SELECT applied_at FROM tracker_migrations
        WHERE version = '002_copy_legacy_data'
      )
      AND NOT EXISTS (
        SELECT 1 FROM tracker_transactions target WHERE target.id = source.id
      )
  ) THEN
    RAISE EXCEPTION 'A post-migration legacy transaction is missing from tracker_transactions';
  END IF;

  IF to_regclass('public.recurring') IS NOT NULL AND EXISTS (
    SELECT 1
    FROM public.recurring source
    WHERE source.user_id = 'me'
      AND source.created_at > (
        SELECT applied_at FROM tracker_migrations
        WHERE version = '002_copy_legacy_data'
      )
      AND NOT EXISTS (
        SELECT 1 FROM tracker_recurring_rules target WHERE target.id = source.id
      )
  ) THEN
    RAISE EXCEPTION 'A post-migration legacy recurring rule is missing from tracker_recurring_rules';
  END IF;
END;
$$;

DROP TABLE IF EXISTS public.transactions;
DROP TABLE IF EXISTS public.recurring;
