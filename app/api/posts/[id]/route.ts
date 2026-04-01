import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { decryptToken } from '@/lib/utils'

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('posts')
    .select('*, analytics(*)')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const allowed = ['content', 'platforms', 'media_urls']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .eq('status', 'draft')
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Récupère le post pour avoir les IDs des posts publiés
  const { data: post } = await admin
    .from('posts')
    .select('meta_post_ids, platforms, status')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  // Si le post a été publié, supprimer sur les plateformes
  if (post?.status === 'published' && post?.meta_post_ids) {
    const metaPostIds = post.meta_post_ids as Record<string, string>

    // Récupère les tokens des comptes connectés
    const { data: accounts } = await admin
      .from('social_accounts')
      .select('platform, access_token, platform_user_id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const GRAPH = 'https://graph.facebook.com/v19.0'
    const IG_GRAPH = 'https://graph.instagram.com/v19.0'

    for (const account of accounts || []) {
      const token = decryptToken(account.access_token)
      const postId = metaPostIds[account.platform]
      if (!postId) continue

      try {
        if (account.platform === 'facebook') {
          await fetch(`${GRAPH}/${postId}?access_token=${token}`, { method: 'DELETE' })
        } else if (account.platform === 'instagram') {
          await fetch(`${IG_GRAPH}/${postId}?access_token=${token}`, { method: 'DELETE' })
        }
      } catch {
        // On continue même si la suppression sur la plateforme échoue
      }
    }
  }

  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
