import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = (await import('@/lib/supabase/server')).createAdminClient()
  const { data: userProfile } = await admin.from('users').select('plan').eq('id', user.id).single()
  if (userProfile?.plan === 'free') {
    return NextResponse.json({ error: 'Génération d\'image réservée aux plans Premium et Business' }, { status: 403 })
  }

  const { prompt } = await req.json()
  if (!prompt) return NextResponse.json({ error: 'prompt requis' }, { status: 400 })

  const url = await generateImage(prompt)
  if (!url) return NextResponse.json({ error: 'Génération d\'image échouée' }, { status: 500 })

  return NextResponse.json({ url })
}
