import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { suggestHashtags } from '@/lib/ai'
import type { Platform, Plan } from '@/types'
import { z } from 'zod'

const ALLOWED_PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'] as const

const HashtagsSchema = z.object({
  content:  z.string().min(1).max(10000),
  platform: z.enum(ALLOWED_PLATFORMS),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userProfile } = await admin.from('users').select('plan').eq('id', user.id).single()
  const plan = (userProfile?.plan || 'free') as Plan

  const parsed = HashtagsSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const { content, platform } = parsed.data

  try {
    const hashtags = await suggestHashtags(content, platform as Platform, plan)
    return NextResponse.json({ hashtags })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Hashtag suggestion failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
