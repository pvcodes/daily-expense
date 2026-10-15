-- This tracker uses one password and one personal data set. The source app
-- retained multiple user_id values, so only the owner's `me` rows belong here.
DO $$
BEGIN
  IF to_regclass('public.transactions') IS NOT NULL THEN
    EXECUTE $sql$
      DELETE FROM tracker_transactions target
      USING public.transactions source
      WHERE target.id = source.id
        AND source.user_id IS DISTINCT FROM 'me'
    $sql$;
  END IF;

  IF to_regclass('public.recurring') IS NOT NULL THEN
    EXECUTE $sql$
      DELETE FROM tracker_recurring_rules target
      USING public.recurring source
      WHERE target.id = source.id
        AND source.user_id IS DISTINCT FROM 'me'
        AND NOT EXISTS (
          SELECT 1 FROM tracker_transactions transaction_row
          WHERE transaction_row.recurring_rule_id = target.id
        )
    $sql$;
  END IF;
END;
$$;

-- Older generated IDs encode their originating rule and scheduled date. Those
-- immutable identifiers are the reliable origin metadata for edited rows.
UPDATE tracker_transactions transaction_row
SET recurring_rule_id = substring(transaction_row.id FROM '^r-([A-Za-z0-9]+)-'),
    occurrence_date = substring(transaction_row.id FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})$')::date
FROM tracker_recurring_rules rule_row
WHERE transaction_row.id ~ '^r-[A-Za-z0-9]+-[0-9]{4}-[0-9]{2}-[0-9]{2}$'
  AND rule_row.id = substring(transaction_row.id FROM '^r-([A-Za-z0-9]+)-')
  AND (
    transaction_row.recurring_rule_id IS DISTINCT FROM rule_row.id
    OR transaction_row.occurrence_date IS DISTINCT FROM
      substring(transaction_row.id FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})$')::date
  );

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM tracker_transactions transaction_row
    WHERE transaction_row.id ~ '^r-[A-Za-z0-9]+-[0-9]{4}-[0-9]{2}-[0-9]{2}$'
      AND (
        transaction_row.recurring_rule_id IS DISTINCT FROM
          substring(transaction_row.id FROM '^r-([A-Za-z0-9]+)-')
        OR transaction_row.occurrence_date IS DISTINCT FROM
          substring(transaction_row.id FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})$')::date
      )
  ) THEN
    RAISE EXCEPTION 'Legacy recurring transaction has no matching tracker rule/date';
  END IF;
END;
$$;

CREATE TABLE tracker_currencies (
  code VARCHAR(3) PRIMARY KEY CHECK (code ~ '^[A-Z]{3}$'),
  name TEXT NOT NULL CHECK (BTRIM(name) <> '')
);
INSERT INTO tracker_currencies (code, name) VALUES ('INR', 'Indian Rupee');

ALTER TABLE tracker_transactions
  ADD CONSTRAINT tracker_transactions_currency_fk
  FOREIGN KEY (currency) REFERENCES tracker_currencies(code) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE tracker_recurring_rules
  ADD CONSTRAINT tracker_recurring_rules_currency_fk
  FOREIGN KEY (currency) REFERENCES tracker_currencies(code) ON UPDATE RESTRICT ON DELETE RESTRICT;
ALTER TABLE tracker_recurring_rules
  ADD CONSTRAINT tracker_recurring_rules_monthly_cadence_ck CHECK (cadence = 'monthly');

CREATE FUNCTION tracker_validate_legacy_occurrence_link()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  encoded_rule_id TEXT;
  encoded_occurrence DATE;
BEGIN
  IF NEW.id ~ '^r-[A-Za-z0-9]+-[0-9]{4}-[0-9]{2}-[0-9]{2}$' THEN
    encoded_rule_id := substring(NEW.id FROM '^r-([A-Za-z0-9]+)-');
    encoded_occurrence := substring(NEW.id FROM '([0-9]{4}-[0-9]{2}-[0-9]{2})$')::date;
    IF NEW.recurring_rule_id IS DISTINCT FROM encoded_rule_id
      OR NEW.occurrence_date IS DISTINCT FROM encoded_occurrence THEN
      RAISE EXCEPTION 'Legacy recurring transaction ID, rule, and occurrence date must agree';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tracker_transactions_legacy_occurrence_link_trg
BEFORE INSERT OR UPDATE OF id, recurring_rule_id, occurrence_date
ON tracker_transactions
FOR EACH ROW EXECUTE FUNCTION tracker_validate_legacy_occurrence_link();
