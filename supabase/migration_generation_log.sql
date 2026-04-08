-- Table de log des appels IA (pour limiter par jour, indépendamment des sauvegardes)
CREATE TABLE IF NOT EXISTS public.ai_generation_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_generation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_generation_log: own rows" ON public.ai_generation_log
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX ai_generation_log_user_day ON public.ai_generation_log (user_id, created_at);
