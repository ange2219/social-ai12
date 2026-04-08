-- ─── Migration : brand_profiles + image_cache + posts.platform_errors ───────

-- 1. Colonnes visuelles sur brand_profiles
ALTER TABLE brand_profiles
  ADD COLUMN IF NOT EXISTS visual_style   TEXT DEFAULT 'modern',
  ADD COLUMN IF NOT EXISTS color_primary  TEXT,
  ADD COLUMN IF NOT EXISTS color_secondary TEXT,
  ADD COLUMN IF NOT EXISTS image_style    TEXT DEFAULT 'mixed';

-- 2. Colonne platform_errors sur posts (erreurs par plateforme)
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS platform_errors JSONB;

-- Nouveau statut 'partial' pour les publications partiellement réussies
-- (PostgreSQL ne permet pas ALTER TYPE ENUM directement dans toutes versions,
--  on utilise une vérification conditionnelle)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'partial'
    AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'post_status')
  ) THEN
    ALTER TYPE post_status ADD VALUE 'partial';
  END IF;
EXCEPTION WHEN others THEN
  -- Si post_status est un TEXT simple, rien à faire
  NULL;
END $$;

-- 3. Cache d'images générées
CREATE TABLE IF NOT EXISTS image_cache (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_hash  TEXT UNIQUE NOT NULL,
  image_url    TEXT NOT NULL,
  provider     TEXT NOT NULL,
  image_type   TEXT NOT NULL,
  expires_at   TIMESTAMPTZ NOT NULL,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_image_cache_prompt_hash ON image_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_image_cache_expires_at  ON image_cache(expires_at);

-- RLS sur image_cache (lecture publique, écriture service role uniquement)
ALTER TABLE image_cache ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "image_cache_select" ON image_cache;
CREATE POLICY "image_cache_select" ON image_cache FOR SELECT USING (true);

-- 4. Bucket Storage pour les médias (à exécuter via Supabase dashboard si inexistant)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('post-media', 'post-media', true)
-- ON CONFLICT (id) DO NOTHING;
