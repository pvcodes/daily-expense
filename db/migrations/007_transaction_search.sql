CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS tracker_transactions_notes_trgm_idx
  ON tracker_transactions USING GIN (notes gin_trgm_ops);

CREATE INDEX IF NOT EXISTS tracker_categories_name_trgm_idx
  ON tracker_categories USING GIN (name gin_trgm_ops);
