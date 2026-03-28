import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { generateWeekPosts } from '@/lib/ai'
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

  if (plan === 'free') {
    return NextResponse.json({ error: 'Fonctionnalité réservée aux plans Premium et Business' }, { status: 403 })
  }

  const body: GenerateRequest & { posts_count?: number } = await req.json()

  if (!body.platforms?.length || !body.tone) {
    return NextResponse.json({ error: 'platforms et tone requis' }, { status: 400 })
  }

  if (plan === 'free') {
    body.platforms = body.platforms.filter(p => ['instagram', 'facebook'].includes(p))
    if (!body.platforms.length) {
      return NextResponse.json({ error: 'Plateforme non disponible sur le plan gratuit' }, { status: 403 })
    }
  }

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

  try {
    const result = await generateWeekPosts(body, postsCount, plan)
    return NextResponse.json(result)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Generation failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
