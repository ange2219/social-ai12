import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { rewritePost } from '@/lib/ai'
import type { Platform, Plan } from '@/types'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userProfile } = await admin.from('users').select('plan').eq('id', user.id).single()
  const plan = (userProfile?.plan || 'free') as Plan

  const { content, platform, instruction } = await req.json()
  if (!content || !platform || !instruction) {
    return NextResponse.json({ error: 'content, platform et instruction requis' }, { status: 400 })
  }

  try {
    const result = await rewritePost(content, platform as Platform, instruction, plan)
    return NextResponse.json({ content: result })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Rewrite failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
