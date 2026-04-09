import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { rewritePost } from '@/lib/ai'
import type { Platform, Plan } from '@/types'
import { z } from 'zod'

const ALLOWED_PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'] as const

const RewriteSchema = z.object({
  content:     z.string().min(1).max(10000),
  platform:    z.enum(ALLOWED_PLATFORMS),
  instruction: z.string().min(1).max(500),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userProfile } = await admin.from('users').select('plan').eq('id', user.id).single()
  const plan = (userProfile?.plan || 'free') as Plan

  const parsed = RewriteSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const { content, platform, instruction } = parsed.data

  try {
    const result = await rewritePost(content, platform as Platform, instruction, plan)
    return NextResponse.json({ content: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Rewrite failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
