import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { suggestHashtags } from '@/lib/ai'
import type { Platform, Plan } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userProfile } = await admin.from('users').select('plan').eq('id', user.id).single()
  const plan = (userProfile?.plan || 'free') as Plan

  const { content, platform } = await req.json()
  if (!content || !platform) {
    return NextResponse.json({ error: 'content et platform requis' }, { status: 400 })
  }

  try {
    const hashtags = await suggestHashtags(content, platform as Platform, plan)
    return NextResponse.json({ hashtags })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Hashtag suggestion failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
