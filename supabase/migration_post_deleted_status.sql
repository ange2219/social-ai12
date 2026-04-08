-- Migration : ajouter 'deleted' aux statuts de posts autorisés
-- Le soft-delete utilise status='deleted' mais la contrainte CHECK ne l'incluait pas

ALTER TABLE public.posts
  DROP CONSTRAINT IF EXISTS posts_status_check;

ALTER TABLE public.posts
  ADD CONSTRAINT posts_status_check
  CHECK (status IN ('draft', 'scheduled', 'published', 'failed', 'deleted'));
