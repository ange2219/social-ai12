-- ══════════════════════════════════════════════════════
-- Social IA — Schéma PostgreSQL (Supabase)
-- ══════════════════════════════════════════════════════

-- Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── USERS ───────────────────────────────────────────────
CREATE TABLE public.users (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT UNIQUE NOT NULL,
  full_name             TEXT,
  avatar_url            TEXT,
  plan                  TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free','premium','business')),
  stripe_customer_id    TEXT,
  ayrshare_profile_key  TEXT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS onboarded BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users: own row" ON public.users
  FOR ALL USING (auth.uid() = id);

-- Auto-créer le profil user à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ─── SOCIAL ACCOUNTS ─────────────────────────────────────
CREATE TABLE public.social_accounts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  platform            TEXT NOT NULL CHECK (platform IN ('instagram','facebook','tiktok','twitter','linkedin','youtube','pinterest')),
  platform_user_id    TEXT NOT NULL,
  platform_username   TEXT NOT NULL,
  access_token        TEXT,         -- chiffré
  refresh_token       TEXT,         -- chiffré
  token_expires_at    TIMESTAMPTZ,
  connected_via       TEXT NOT NULL CHECK (connected_via IN ('meta_direct','ayrshare')),
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, platform)
);

ALTER TABLE public.social_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_accounts: own rows" ON public.social_accounts
  FOR ALL USING (auth.uid() = user_id);

-- ─── POSTS ───────────────────────────────────────────────
CREATE TABLE public.posts (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  content             TEXT NOT NULL,
  media_urls          TEXT[] DEFAULT '{}',
  platforms           TEXT[] NOT NULL DEFAULT '{}',
  status              TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','scheduled','published','failed','deleted')),
  scheduled_at        TIMESTAMPTZ,
  published_at        TIMESTAMPTZ,
  ayrshare_post_id    TEXT,
  meta_post_ids       JSONB DEFAULT '{}',
  content_variants    JSONB DEFAULT '{}',
  ai_generated        BOOLEAN NOT NULL DEFAULT false,
  error_message       TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "posts: own rows" ON public.posts
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX posts_user_status ON public.posts (user_id, status);
CREATE INDEX posts_scheduled ON public.posts (scheduled_at) WHERE status = 'scheduled';

-- ─── ANALYTICS ───────────────────────────────────────────
CREATE TABLE public.analytics (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id      UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  platform     TEXT NOT NULL,
  likes        INTEGER NOT NULL DEFAULT 0,
  comments     INTEGER NOT NULL DEFAULT 0,
  shares       INTEGER NOT NULL DEFAULT 0,
  reach        INTEGER NOT NULL DEFAULT 0,
  impressions  INTEGER NOT NULL DEFAULT 0,
  fetched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analytics: own via post" ON public.analytics
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
  );

-- ─── SUBSCRIPTIONS ───────────────────────────────────────
CREATE TABLE public.subscriptions (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  stripe_subscription_id    TEXT UNIQUE NOT NULL,
  stripe_price_id           TEXT NOT NULL,
  plan                      TEXT NOT NULL CHECK (plan IN ('premium','business')),
  status                    TEXT NOT NULL CHECK (status IN ('active','canceled','past_due','trialing')),
  current_period_end        TIMESTAMPTZ NOT NULL,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subscriptions: own rows" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id);

-- ─── BRAND PROFILES ──────────────────────────────────────
CREATE TABLE public.brand_profiles (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  brand_name          TEXT,
  description         TEXT,
  tone                TEXT DEFAULT 'professionnel',
  industry            TEXT,
  website             TEXT,
  account_type        TEXT DEFAULT 'business',
  target_audience     TEXT,
  audience_age        TEXT,
  audience_interests  TEXT,
  audience_location   TEXT,
  content_pillars     TEXT[] DEFAULT '{}',
  avoid_words         TEXT,
  objectives          TEXT[] DEFAULT '{}',
  posts_per_week      INTEGER DEFAULT 5,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.brand_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "brand_profiles: own row" ON public.brand_profiles
  FOR ALL USING (auth.uid() = user_id);

-- ─── SOCIAL BASELINES ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.social_baselines (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  platform            TEXT NOT NULL,
  baseline_followers  INTEGER DEFAULT 0,
  current_followers   INTEGER DEFAULT 0,
  posts_count         INTEGER DEFAULT 0,
  baseline_at         TIMESTAMPTZ DEFAULT NOW(),
  refreshed_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, platform)
);

ALTER TABLE public.social_baselines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "social_baselines: own rows" ON public.social_baselines
  FOR ALL USING (auth.uid() = user_id);

-- ─── AI GENERATION LOG ───────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ai_generation_log (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ai_generation_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_generation_log: own rows" ON public.ai_generation_log
  FOR ALL USING (auth.uid() = user_id);

CREATE INDEX ai_generation_log_user_day ON public.ai_generation_log (user_id, created_at);

-- ─── CONTRAINTE UNIQUE analytics ─────────────────────────
ALTER TABLE public.analytics
  ADD CONSTRAINT IF NOT EXISTS analytics_post_platform_unique UNIQUE (post_id, platform);
