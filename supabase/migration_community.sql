-- ============================================================
-- Migration : Fonctionnalité Communauté (Mur d'entraide)
-- À exécuter dans l'onglet "SQL Editor" de Supabase
-- ============================================================

-- 1. Table des posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content     text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 2000),
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

-- Tout le monde peut lire les posts
CREATE POLICY "community_posts_select" ON public.community_posts
  FOR SELECT USING (true);

-- Un utilisateur authentifié peut créer un post
CREATE POLICY "community_posts_insert" ON public.community_posts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Un utilisateur peut supprimer ses propres posts
CREATE POLICY "community_posts_delete" ON public.community_posts
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Table des likes
CREATE TABLE IF NOT EXISTS public.community_likes (
  post_id    uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_likes_select" ON public.community_likes
  FOR SELECT USING (true);

CREATE POLICY "community_likes_insert" ON public.community_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_likes_delete" ON public.community_likes
  FOR DELETE USING (auth.uid() = user_id);

-- 3. Table des commentaires (prévu pour V2, structure créée maintenant)
CREATE TABLE IF NOT EXISTS public.community_comments (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id    uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "community_comments_select" ON public.community_comments
  FOR SELECT USING (true);

CREATE POLICY "community_comments_insert" ON public.community_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "community_comments_delete" ON public.community_comments
  FOR DELETE USING (auth.uid() = user_id);

-- 4. Vue dénormalisée — utilise public.users (accessible en REST) au lieu de auth.users
--    ⚠️  Si vous aviez déjà créé cette vue, SUPPRIMEZ-LA d'abord : DROP VIEW IF EXISTS public.vw_community_posts;
CREATE OR REPLACE VIEW public.vw_community_posts AS
SELECT
  p.id,
  p.user_id,
  p.content,
  p.created_at,
  p.updated_at,
  u.full_name,
  u.avatar_url,
  u.plan,
  (SELECT COUNT(*) FROM public.community_likes l WHERE l.post_id = p.id)::int    AS likes_count,
  (SELECT COUNT(*) FROM public.community_comments c WHERE c.post_id = p.id)::int AS comments_count
FROM public.community_posts p
JOIN public.users u ON u.id = p.user_id;

-- 5. Index pour les performances
CREATE INDEX IF NOT EXISTS idx_community_posts_created_at ON public.community_posts (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_community_likes_post_id    ON public.community_likes (post_id);
CREATE INDEX IF NOT EXISTS idx_community_comments_post_id ON public.community_comments (post_id);
