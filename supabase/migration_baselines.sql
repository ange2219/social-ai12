-- Migration : table social_baselines
-- Stocker les stats abonnés au moment de la connexion + à chaque refresh

CREATE TABLE IF NOT EXISTS social_baselines (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform       TEXT NOT NULL,
  baseline_followers  INTEGER DEFAULT 0,
  current_followers   INTEGER DEFAULT 0,
  posts_count         INTEGER DEFAULT 0,
  baseline_at    TIMESTAMPTZ DEFAULT NOW(),
  refreshed_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

ALTER TABLE social_baselines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own baselines"
  ON social_baselines FOR ALL
  USING (auth.uid() = user_id);
