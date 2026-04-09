-- Migration : ajouter le statut 'partial' et la colonne platform_errors

-- 1. Mettre à jour la contrainte de statut pour inclure 'partial'
ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_status_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'scheduled', 'published', 'partial', 'failed', 'deleted'));

-- 2. Ajouter la colonne platform_errors si elle n'existe pas
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS platform_errors JSONB DEFAULT NULL;
