CREATE TABLE IF NOT EXISTS tracker_cron_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id TEXT,
  source TEXT NOT NULL CHECK (source IN ('vercel_cron', 'http')),
  status TEXT NOT NULL CHECK (status IN ('running', 'succeeded', 'failed')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER CHECK (duration_ms IS NULL OR duration_ms >= 0),
  generated_count INTEGER CHECK (generated_count IS NULL OR generated_count >= 0),
  error_name TEXT,
  error_code TEXT,
  CONSTRAINT tracker_cron_runs_result_ck CHECK (
    (status = 'running' AND completed_at IS NULL AND duration_ms IS NULL AND generated_count IS NULL AND error_name IS NULL AND error_code IS NULL)
    OR
    (status = 'succeeded' AND completed_at IS NOT NULL AND duration_ms IS NOT NULL AND generated_count IS NOT NULL AND error_name IS NULL AND error_code IS NULL)
    OR
    (status = 'failed' AND completed_at IS NOT NULL AND duration_ms IS NOT NULL AND generated_count IS NULL AND error_name IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS tracker_cron_runs_started_idx
  ON tracker_cron_runs (started_at DESC);
