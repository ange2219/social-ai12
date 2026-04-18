import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const ALLOWED_PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'] as const

const CreatePostSchema = z.object({
  content:          z.string().min(1).max(10000),
  platforms:        z.array(z.enum(ALLOWED_PLATFORMS)).min(1).max(7),
  media_urls:       z.array(z.string().url()).max(10).optional(),
  ai_generated:     z.boolean().optional(),
  status:           z.enum(['draft', 'failed', 'rejected']).optional(),
  content_variants: z.record(z.string()).optional(),
})

export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const limit = Math.min(Math.max(1, parseInt(searchParams.get('limit') || '20')), 100)
  const offset = Math.max(0, parseInt(searchParams.get('offset') || '0'))

  const includeDeleted = searchParams.get('includeDeleted') === 'true'

  let query = supabase
    .from('posts')
    .select('*', { count: 'exact' })
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (status) {
    query = query.eq('status', status)
  } else if (!includeDeleted) {
    query = query.neq('status', 'deleted')
  }

  const { data: posts, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Joindre les analytics pour chaque post
  const postIds = (posts || []).map((p: any) => p.id)
  let analyticsMap: Record<string, { likes: number; comments: number; shares: number; impressions: number; reach: number }> = {}
  if (postIds.length > 0) {
    const { data: analyticsRows } = await supabase
      .from('analytics')
      .select('post_id, likes, comments, shares, impressions, reach')
      .in('post_id', postIds)
    for (const row of analyticsRows || []) {
      if (!analyticsMap[row.post_id]) {
        analyticsMap[row.post_id] = { likes: 0, comments: 0, shares: 0, impressions: 0, reach: 0 }
      }
      analyticsMap[row.post_id].likes       += row.likes || 0
      analyticsMap[row.post_id].comments    += row.comments || 0
      analyticsMap[row.post_id].shares      += row.shares || 0
      analyticsMap[row.post_id].impressions += row.impressions || 0
      analyticsMap[row.post_id].reach       += row.reach || 0
    }
  }

  const enriched = (posts || []).map((p: any) => ({
    ...p,
    analytics: analyticsMap[p.id] || null,
  }))

  return NextResponse.json({ posts: enriched, total: count })
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = CreatePostSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const { content, platforms, media_urls, ai_generated, status, content_variants } = parsed.data
  const insertStatus = status ?? 'draft'

  const { data, error } = await supabase
    .from('posts')
    .insert({
      user_id: user.id,
      content,
      platforms,
      media_urls: media_urls || [],
      ai_generated: ai_generated || false,
      status: insertStatus,
      ...(content_variants ? { content_variants } : {}),
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
