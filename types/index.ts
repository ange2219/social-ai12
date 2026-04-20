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
  onboarded?: boolean
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
  objective: PostObjective | null
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
  generationsPerWeek: number | 'unlimited'
  imagesPerWeek: number | 'unlimited'
  accountsPerPlatform: number
  scheduling: boolean
  advancedAnalytics: boolean
  generateWeek: boolean
  workspaces: number
  aiProvider: 'github' | 'claude'
}

export const PLAN_LIMITS: Record<Plan, PlanLimits> = {
  free: {
    platforms: 2,
    generationsPerWeek: 15,
    imagesPerWeek: 0,
    accountsPerPlatform: 1,
    scheduling: false,
    advancedAnalytics: false,
    generateWeek: false,
    workspaces: 1,
    aiProvider: 'github',
  },
  premium: {
    platforms: 5,
    generationsPerWeek: 20,
    imagesPerWeek: 7,
    accountsPerPlatform: 3,
    scheduling: true,
    advancedAnalytics: true,
    generateWeek: true,
    workspaces: 1,
    aiProvider: 'claude',
  },
  business: {
    platforms: 999,
    generationsPerWeek: 'unlimited',
    imagesPerWeek: 'unlimited',
    accountsPerPlatform: 10,
    scheduling: true,
    advancedAnalytics: true,
    generateWeek: true,
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

// ─── Generation types ──────────────────────────────────────────────────────────

export type PostObjective =
  | 'vendre'
  | 'engager'
  | 'eduquer'
  | 'inspirer'
  | 'annoncer'
  | 'fideliser'

export type DistributionMode = 'unified' | 'custom'

export type PostLength = 'court' | 'moyen' | 'long'

export type PostFormat = 'direct' | 'liste' | 'narratif' | 'question'

export type PostTone = 'professionnel' | 'decontracte' | 'emotionnel' | 'expert'

export type PostCTA =
  | 'acheter'
  | 'commenter'
  | 'partager'
  | 'en_savoir_plus'
  | 'aucun'

export interface GenerationParams {
  length: PostLength
  format: PostFormat
  tone: PostTone
  cta: PostCTA
}

export const OBJECTIVE_LABELS: Record<PostObjective, string> = {
  vendre:    'Vendre',
  engager:   'Engager',
  eduquer:   'Éduquer',
  inspirer:  'Inspirer',
  annoncer:  'Annoncer',
  fideliser: 'Fidéliser',
}

export const OBJECTIVE_DEFAULTS: Record<PostObjective, GenerationParams> = {
  vendre:    { length: 'court',  format: 'direct',    tone: 'professionnel', cta: 'acheter'       },
  engager:   { length: 'court',  format: 'question',  tone: 'decontracte',   cta: 'commenter'     },
  eduquer:   { length: 'long',   format: 'liste',     tone: 'expert',        cta: 'en_savoir_plus' },
  inspirer:  { length: 'moyen',  format: 'narratif',  tone: 'emotionnel',    cta: 'partager'      },
  annoncer:  { length: 'court',  format: 'direct',    tone: 'professionnel', cta: 'en_savoir_plus' },
  fideliser: { length: 'moyen',  format: 'narratif',  tone: 'decontracte',   cta: 'aucun'         },
}

export const OBJECTIVE_DESCRIPTIONS: Record<PostObjective, string> = {
  vendre:    'Persuader votre audience d\'acheter un produit ou service',
  engager:   'Susciter des interactions : likes, commentaires, partages',
  eduquer:   'Partager des connaissances et apporter de la valeur',
  inspirer:  'Créer de l\'émotion et de la motivation',
  annoncer:  'Communiquer une nouveauté ou un événement',
  fideliser: 'Renforcer le lien avec votre communauté existante',
}

export const LENGTH_LABELS: Record<PostLength, string> = {
  court: 'Court',
  moyen: 'Moyen',
  long:  'Long',
}

export const FORMAT_LABELS: Record<PostFormat, string> = {
  direct:   'Direct',
  liste:    'Listé',
  narratif: 'Narratif',
  question: 'Question',
}

export const POSTTONE_LABELS: Record<PostTone, string> = {
  professionnel: 'Professionnel',
  decontracte:   'Décontracté',
  emotionnel:    'Émotionnel',
  expert:        'Expert',
}

export const CTA_LABELS: Record<PostCTA, string> = {
  acheter:       'Acheter',
  commenter:     'Commenter',
  partager:      'Partager',
  en_savoir_plus: 'En savoir plus',
  aucun:         'Aucun',
}

export const PLATFORM_CONSTRAINTS_INFO: Partial<Record<Platform, { limit: string; hashtags: string; tone: string }>> = {
  instagram: { limit: '2 000 car.', hashtags: '5-10 hashtags', tone: 'Engageant' },
  facebook:  { limit: '2 000 car.', hashtags: '2-3 hashtags',  tone: 'Conversationnel' },
  twitter:   { limit: '280 car.',   hashtags: '1-2 hashtags',  tone: 'Percutant' },
  linkedin:  { limit: '1 300 car.', hashtags: '3 hashtags',    tone: 'Professionnel' },
  tiktok:    { limit: '300 car.',   hashtags: '3-5 hashtags',  tone: 'Dynamique' },
  youtube:   { limit: 'SEO optimisé', hashtags: 'Mots-clés',   tone: 'Descriptif' },
  pinterest: { limit: '500 car.',   hashtags: 'Mots-clés',     tone: 'Inspirant' },
}

// ─── AI generation types ───────────────────────────────────────────────────────

export type GenerateTone =
  | 'professionnel'
  | 'decontracte'
  | 'inspirant'
  | 'humoristique'
  | 'emotionnel'
  | 'expert'

export interface GenerateRequest {
  brief?: string
  tone: GenerateTone
  platforms: Platform[]
  brand_name?: string
  brand_description?: string
  brand_industry?: string
  brand_audience?: string
  brand_pillars?: string[]
  brand_avoid?: string
  // New generation params
  objective?: PostObjective
  length?: PostLength
  format?: PostFormat
  cta?: PostCTA
  distributionMode?: DistributionMode
}

export interface GenerateResponse {
  variants: Partial<Record<Platform, string>>
  used?: number
  limit?: number | 'unlimited'
}

export interface ApiError {
  error: string
  code?: string
}
