-- Adaptive Coach: stores per-session character-level error data
CREATE TABLE IF NOT EXISTS typing_analytics (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES users(id) ON DELETE CASCADE,
  char_errors jsonb    NOT NULL DEFAULT '{}',
  slow_keys   jsonb    NOT NULL DEFAULT '{}',  -- avg ms delay per key (hesitation)
  wpm         integer  NOT NULL DEFAULT 0,
  accuracy    integer  NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Index for fast per-user lookups
CREATE INDEX IF NOT EXISTS idx_typing_analytics_user_id
  ON typing_analytics (user_id, created_at DESC);

-- Row-level security (match existing tables pattern)
ALTER TABLE typing_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own analytics"
  ON typing_analytics FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can read own analytics"
  ON typing_analytics FOR SELECT
  USING (auth.uid() = user_id);
