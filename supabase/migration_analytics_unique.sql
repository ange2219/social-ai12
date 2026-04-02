-- Ajoute une contrainte unique sur (post_id, platform) pour permettre l'upsert
ALTER TABLE public.analytics
  ADD CONSTRAINT analytics_post_platform_unique UNIQUE (post_id, platform);
