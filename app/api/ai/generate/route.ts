import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generatePosts } from '@/lib/ai'
import { checkGenerationLimit, recordGeneration } from '@/lib/server-utils'
import type { GenerateRequest, Plan } from '@/types'
import { FREE_PLATFORMS, PLAN_LIMITS } from '@/types'
import { z } from 'zod'

const ALLOWED_PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'] as const
const ALLOWED_TONES = ['professionnel', 'decontracte', 'inspirant', 'humoristique', 'emotionnel', 'expert'] as const
const ALLOWED_OBJECTIVES  = ['vendre', 'engager', 'eduquer', 'inspirer', 'annoncer', 'fideliser'] as const
const ALLOWED_LENGTHS     = ['court', 'moyen', 'long'] as const
const ALLOWED_FORMATS     = ['direct', 'liste', 'narratif', 'question'] as const
const ALLOWED_CTAS        = ['acheter', 'commenter', 'partager', 'en_savoir_plus', 'aucun'] as const
const ALLOWED_DIST_MODES  = ['unified', 'custom'] as const

const GenerateSchema = z.object({
  platforms:        z.array(z.enum(ALLOWED_PLATFORMS)).min(1).max(7),
  tone:             z.enum(ALLOWED_TONES),
  brief:            z.string().max(2000).optional(),
  objective:        z.enum(ALLOWED_OBJECTIVES).optional(),
  length:           z.enum(ALLOWED_LENGTHS).optional(),
  format:           z.enum(ALLOWED_FORMATS).optional(),
  cta:              z.enum(ALLOWED_CTAS).optional(),
  distributionMode: z.enum(ALLOWED_DIST_MODES).optional(),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userProfile } = await admin
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (userProfile?.plan || 'free') as Plan

  // Vérifier la limite hebdomadaire
  const { allowed, used, limit } = await checkGenerationLimit(user.id, plan)
  if (!allowed) {
    return NextResponse.json({
      error: `Limite hebdomadaire atteinte (${used}/${limit} générations utilisées)`,
      code: 'WEEKLY_LIMIT_REACHED',
      used,
      limit,
    }, { status: 429 })
  }

  const parsed = GenerateSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }

  // Restreindre les plateformes pour les Free
  if (plan === 'free') {
    const invalid = parsed.data.platforms.filter(p => !FREE_PLATFORMS.includes(p as never))
    if (invalid.length > 0) {
      return NextResponse.json({
        error: `Plan Free : plateformes non disponibles (${invalid.join(', ')}). Disponibles : Instagram, Facebook.`,
        code: 'PLATFORM_NOT_ALLOWED',
      }, { status: 403 })
    }
  }

  const body: GenerateRequest = {
    ...parsed.data,
    objective:        parsed.data.objective,
    length:           parsed.data.length,
    format:           parsed.data.format,
    cta:              parsed.data.cta,
    distributionMode: parsed.data.distributionMode,
  }

  // Enrichir avec le profil de marque complet
  const { data: brandProfile } = await admin
    .from('brand_profiles')
    .select('brand_name, description, industry, tone, target_audience, content_pillars, avoid_words')
    .eq('user_id', user.id)
    .single()

  if (brandProfile) {
    body.brand_name        = brandProfile.brand_name        || undefined
    body.brand_description = brandProfile.description       || undefined
    body.brand_industry    = brandProfile.industry          || undefined
    body.brand_audience    = brandProfile.target_audience   || undefined
    body.brand_pillars     = Array.isArray(brandProfile.content_pillars) && brandProfile.content_pillars.length
                               ? brandProfile.content_pillars
                               : undefined
    body.brand_avoid       = brandProfile.avoid_words       || undefined
    if (!body.tone && brandProfile.tone) body.tone = brandProfile.tone
  }

  try {
    const result = await generatePosts(body, plan)
    await recordGeneration(user.id)
    return NextResponse.json({ ...result, used: used + 1, limit })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
