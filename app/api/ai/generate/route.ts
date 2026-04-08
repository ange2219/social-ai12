import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generatePosts } from '@/lib/ai'
import { checkGenerationLimit, recordGeneration } from '@/lib/server-utils'
import type { GenerateRequest, Plan } from '@/types'

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

  // Vérifier la limite journalière
  const { allowed, used, limit } = await checkGenerationLimit(user.id, plan)
  if (!allowed) {
    return NextResponse.json({
      error: `Limite journalière atteinte (${used}/${limit})`,
      code: 'DAILY_LIMIT_REACHED',
      used,
      limit,
    }, { status: 429 })
  }

  const body: GenerateRequest = await req.json()

  if (!body.platforms?.length || !body.tone) {
    return NextResponse.json({ error: 'platforms et tone requis' }, { status: 400 })
  }

  // Filtrer les plateformes selon le plan
  if (plan === 'free') {
    body.platforms = body.platforms.filter(p => ['instagram', 'facebook'].includes(p))
    if (!body.platforms.length) {
      return NextResponse.json({ error: 'Plateforme non disponible sur le plan gratuit' }, { status: 403 })
    }
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
    // Utiliser le ton du profil si non fourni par le frontend
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
