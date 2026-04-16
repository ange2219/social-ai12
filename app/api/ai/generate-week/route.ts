import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateWeekPosts } from '@/lib/ai'
import { checkGenerationLimit, recordGeneration } from '@/lib/server-utils'
import type { GenerateRequest, Plan } from '@/types'
import { z } from 'zod'

const ALLOWED_PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'] as const
const ALLOWED_TONES = ['professionnel', 'decontracte', 'inspirant', 'humoristique'] as const

const GenerateWeekSchema = z.object({
  platforms:   z.array(z.enum(ALLOWED_PLATFORMS)).min(1).max(7),
  tone:        z.enum(ALLOWED_TONES),
  brief:       z.string().max(2000).optional(),
  posts_count: z.number().int().min(1).max(14).optional(),
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

  if (plan === 'free') {
    return NextResponse.json({ error: 'Fonctionnalité réservée aux plans Premium et Business' }, { status: 403 })
  }

  const parsedBody = GenerateWeekSchema.safeParse(await req.json())
  if (!parsedBody.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsedBody.error.flatten() }, { status: 400 })
  }
  const body: GenerateRequest & { posts_count?: number } = parsedBody.data

  const { data: brandProfile } = await admin
    .from('brand_profiles')
    .select('brand_name, description, posts_per_week')
    .eq('user_id', user.id)
    .single()

  if (brandProfile) {
    body.brand_name = brandProfile.brand_name || undefined
    body.brand_description = brandProfile.description || undefined
  }

  const postsCount = body.posts_count || brandProfile?.posts_per_week || 5

  // Vérifier la limite journalière — une génération semaine coûte postsCount crédits
  const { allowed, used, limit } = await checkGenerationLimit(user.id, plan)
  const remainingCredits = limit === 'unlimited' ? Infinity : (limit as number) - used
  if (!allowed || remainingCredits < postsCount) {
    const needed = postsCount
    const available = limit === 'unlimited' ? '∞' : Math.max(0, (limit as number) - used)
    return NextResponse.json({
      error: `Crédits insuffisants — cette génération nécessite ${needed} crédits, il vous en reste ${available}`,
      code: 'DAILY_LIMIT_REACHED',
      used,
      limit,
    }, { status: 429 })
  }

  try {
    const result = await generateWeekPosts(body, postsCount, plan)
    // Enregistrer postsCount crédits consommés
    await Promise.all(Array.from({ length: postsCount }, () => recordGeneration(user.id)))
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
