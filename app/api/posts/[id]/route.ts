import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/utils'
import { deletePostMediaFiles } from '@/lib/storage'

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
  const allowed = ['content', 'platforms', 'media_urls', 'content_variants', 'status', 'scheduled_at']
  const updates = Object.fromEntries(
    Object.entries(body).filter(([k]) => allowed.includes(k))
  )
  if (updates.status !== undefined && !['draft', 'failed', 'scheduled'].includes(updates.status as string)) {
    return NextResponse.json({ error: 'Statut invalide' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('posts')
    .update(updates)
    .eq('id', params.id)
    .eq('user_id', user.id)
    .in('status', ['draft', 'failed', 'scheduled'])
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

  // Récupère le post pour avoir les IDs des posts publiés et les médias
  const { data: post } = await admin
    .from('posts')
    .select('meta_post_ids, platforms, status, media_urls')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  // Si le post a été publié, supprimer sur les plateformes
  if (post?.status === 'published' && post?.meta_post_ids) {
    const metaPostIds = post.meta_post_ids as Record<string, string>

    const { data: accounts } = await admin
      .from('social_accounts')
      .select('platform, access_token, platform_user_id')
      .eq('user_id', user.id)
      .eq('is_active', true)

    const GRAPH = 'https://graph.facebook.com/v19.0'
    const IG_GRAPH = 'https://graph.instagram.com/v19.0'

    for (const account of accounts || []) {
      let token: string
      try {
        token = decryptToken(account.access_token)
      } catch {
        continue
      }
      const postId = metaPostIds[account.platform]
      if (!postId) continue

      try {
        if (account.platform === 'facebook') {
          await fetch(`${GRAPH}/${postId}?access_token=${token}`, { method: 'DELETE' })
        } else if (account.platform === 'instagram') {
          await fetch(`${IG_GRAPH}/${postId}?access_token=${token}`, { method: 'DELETE' })
        }
      } catch { /* continue même si la suppression échoue */ }
    }
  }

  // Soft delete → corbeille
  const { error } = await admin
    .from('posts')
    .update({ status: 'deleted' })
    .eq('id', params.id)
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Nettoyage des fichiers médias en storage (non critique)
  if (post?.media_urls?.length) {
    deletePostMediaFiles(post.media_urls as string[]).catch(() => {})
  }

  return NextResponse.json({ success: true })
}

export async function PATCH(_req: NextRequest, { params }: { params: { id: string } }) {
  // Restaurer depuis la corbeille
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('posts')
    .update({ status: 'draft' })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .eq('status', 'deleted')
    .select()
    .single()

  if (error || !data) return NextResponse.json({ error: 'Post introuvable dans la corbeille' }, { status: 404 })
  return NextResponse.json({ success: true })
}
