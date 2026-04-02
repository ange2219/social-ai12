import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  getFacebookPostComments,
  replyToFacebookComment,
  getInstagramComments,
  replyToInstagramComment,
} from '@/lib/meta'
import { decryptToken } from '@/lib/utils'

/** GET — récupère les commentaires d'un post publié */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const { data: post } = await admin
    .from('posts')
    .select('platforms, meta_post_ids, status')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
  if (post.status !== 'published') return NextResponse.json({ comments: [] })

  const metaIds = post.meta_post_ids || {}
  const results: Array<{ platform: string; comments: any[] }> = []

  // Facebook comments
  if (metaIds.facebook) {
    const { data: fbAccount } = await admin
      .from('social_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'facebook')
      .eq('is_active', true)
      .single()

    if (fbAccount) {
      const token = decryptToken(fbAccount.access_token)
      const comments = await getFacebookPostComments(metaIds.facebook, token)
      results.push({ platform: 'facebook', comments })
    }
  }

  // Instagram comments
  if (metaIds.instagram) {
    const { data: igAccount } = await admin
      .from('social_accounts')
      .select('access_token')
      .eq('user_id', user.id)
      .eq('platform', 'instagram')
      .eq('is_active', true)
      .single()

    if (igAccount) {
      const token = decryptToken(igAccount.access_token)
      const comments = await getInstagramComments(metaIds.instagram, token)
      results.push({ platform: 'instagram', comments })
    }
  }

  return NextResponse.json({ results })
}

/** POST — répond à un commentaire
 *  body: { platform: 'facebook' | 'instagram', commentId: string, message: string }
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { platform, commentId, message } = await req.json()
  if (!platform || !commentId || !message?.trim()) {
    return NextResponse.json({ error: 'platform, commentId et message requis' }, { status: 400 })
  }

  const admin = createAdminClient()

  // Vérifie que le post appartient bien à l'user
  const { data: post } = await admin
    .from('posts')
    .select('meta_post_ids')
    .eq('id', params.id)
    .eq('user_id', user.id)
    .single()

  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })

  const { data: account } = await admin
    .from('social_accounts')
    .select('access_token, platform_user_id')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .eq('is_active', true)
    .single()

  if (!account) return NextResponse.json({ error: 'Compte non connecté' }, { status: 400 })

  const token = decryptToken(account.access_token)

  try {
    let replyId: string
    if (platform === 'facebook') {
      replyId = await replyToFacebookComment(commentId, message, token)
    } else if (platform === 'instagram') {
      const mediaId = post.meta_post_ids?.instagram
      if (!mediaId) return NextResponse.json({ error: 'ID média Instagram manquant' }, { status: 400 })
      replyId = await replyToInstagramComment(mediaId, message, token)
    } else {
      return NextResponse.json({ error: 'Plateforme non supportée' }, { status: 400 })
    }
    return NextResponse.json({ success: true, replyId })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
