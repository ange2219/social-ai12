-- Index manquants identifiés lors de l'audit de performance

-- analytics(post_id) — requêtes IN post_id dans le dashboard posts
CREATE INDEX IF NOT EXISTS analytics_post_id ON public.analytics (post_id);

-- social_accounts(user_id, platform) — déjà couvert par la contrainte UNIQUE mais
-- on s'assure que l'index partiel sur les comptes actifs est présent pour le flow de publication
CREATE INDEX IF NOT EXISTS social_accounts_user_active
  ON public.social_accounts (user_id, platform)
  WHERE is_active = true;

-- posts(user_id, scheduled_at) — requêtes du cron pour les posts à publier
CREATE INDEX IF NOT EXISTS posts_user_scheduled
  ON public.posts (user_id, scheduled_at)
  WHERE status = 'scheduled';
