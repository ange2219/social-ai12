import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/utils'

const GRAPH = 'https://graph.facebook.com/v19.0'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { content } = await req.json()
  if (!content?.trim()) return NextResponse.json({ error: 'content requis' }, { status: 400 })

  const admin = createAdminClient()

  const { data: post } = await admin
    .from('posts')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
  if (post.status !== 'published') return NextResponse.json({ error: 'Post non publié' }, { status: 400 })

  const fbPostId = post.meta_post_ids?.facebook
  if (!fbPostId) return NextResponse.json({ error: 'Aucun post Facebook associé à ce post' }, { status: 400 })

  // Récupère le compte Facebook actif
  const { data: account } = await admin
    .from('social_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', 'facebook')
    .eq('is_active', true)
    .single()

  if (!account) return NextResponse.json({ error: 'Compte Facebook non connecté' }, { status: 400 })

  const token = decryptToken(account.access_token)

  // Mise à jour sur Facebook Graph API
  const res = await fetch(`${GRAPH}/${fbPostId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: content, access_token: token }),
  })

  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    return NextResponse.json(
      { error: e?.error?.message || 'Erreur Facebook Graph API' },
      { status: 500 }
    )
  }

  // Met à jour le contenu en base
  await admin.from('posts').update({ content }).eq('id', params.id)

  return NextResponse.json({ success: true })
}
