export type Plan = 'free' | 'premium' | 'business'

export type Platform =
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'twitter'
  | 'linkedin'
  | 'youtube'
  | 'pinterest'

export type PostStatus = 'draft' | 'scheduled' | 'published' | 'partial' | 'failed' | 'deleted'

export type ConnectedVia = 'meta_direct' | 'ayrshare'

export interface User {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  plan: Plan
  stripe_customer_id: string | null
  ayrshare_profile_key: string | null
  created_at: string
}

export interface SocialAccount {
  id: string
  user_id: string
  platform: Platform
  platform_user_id: string
  platform_username: string
  connected_via: ConnectedVia
  is_active: boolean
  created_at: string
}

export interface Post {
  id: string
  user_id: string
  content: string
  media_urls: string[]
  platforms: Platform[]
  status: PostStatus
  scheduled_at: string | null
  published_at: string | null
  ayrshare_post_id: string | null
  meta_post_ids: Record<string, string> | null
  content_variants: Record<string, string> | null
  platform_errors: Record<string, string> | null
  ai_generated: boolean
  error_message: string | null
  created_at: string
}

export interface Analytics {
  id: string
  post_id: string
  platform: Platform
  likes: number
  comments: number
  shares: number
  reach: number
  impressions: number
  fetched_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_price_id: string
  plan: Plan
  status: 'active' | 'canceled' | 'past_due'
  current_period_end: string
  created_at: string
}

export interface PlanLimits {
  platforms: number | 'unlimited'
  generationsPerDay: number | 'unlimited'
  accountsPerPlatform: number
  scheduling: boolean
  advancedAnalytics: boolean
  workspaces: number
  aiProvider: 'github' | 'claude'
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    platforms: 2,
    generationsPerDay: 20,
    accountsPerPlatform: 1,
    scheduling: false,
    advancedAnalytics: false,
    workspaces: 1,
    aiProvider: 'github',
  },
  premium: {
    platforms: 5,
    generationsPerDay: 10,
    accountsPerPlatform: 3,
    scheduling: true,
    advancedAnalytics: true,
    workspaces: 1,
    aiProvider: 'claude',
  },
  business: {
    platforms: 999,
    generationsPerDay: 'unlimited',
    accountsPerPlatform: 10,
    scheduling: true,
    advancedAnalytics: true,
    workspaces: 3,
    aiProvider: 'claude',
  },
}

export const FREE_PLATFORMS: Platform[] = ['instagram', 'facebook']

export const PLATFORM_NAMES: Record<Platform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  pinterest: 'Pinterest',
}

export const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  tiktok: '#000000',
  twitter: '#1DA1F2',
  linkedin: '#0077B5',
  youtube: '#FF0000',
  pinterest: '#E60023',
}

export type GenerateTone = 'professionnel' | 'decontracte' | 'inspirant' | 'humoristique'

export interface GenerateRequest {
  brief: string
  tone: GenerateTone
  platforms: Platform[]
  brand_name?: string
  brand_description?: string
  brand_industry?: string
  brand_audience?: string
  brand_pillars?: string[]
  brand_avoid?: string
}

export interface GenerateResponse {
  variants: Partial<Record<Platform, string>>
}

export interface ApiError {
  error: string
  code?: string
}
