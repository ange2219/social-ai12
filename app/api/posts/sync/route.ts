import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/utils'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Récupère tous les posts publiés avec des IDs Meta
  const { data: posts } = await admin
    .from('posts')
    .select('id, meta_post_ids, platforms')
    .eq('user_id', user.id)
    .eq('status', 'published')
    .not('meta_post_ids', 'eq', '{}')

  if (!posts?.length) return NextResponse.json({ updated: 0 })

  // Récupère les tokens
  const { data: accounts } = await admin
    .from('social_accounts')
    .select('platform, access_token, platform_user_id')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const accountByPlatform: Record<string, { token: string; userId: string }> = {}
  for (const acc of accounts || []) {
    accountByPlatform[acc.platform] = {
      token: decryptToken(acc.access_token),
      userId: acc.platform_user_id,
    }
  }

  const GRAPH = 'https://graph.facebook.com/v19.0'
  const IG_GRAPH = 'https://graph.instagram.com/v19.0'

  let updated = 0

  for (const post of posts) {
    const metaPostIds = post.meta_post_ids as Record<string, string>

    for (const [platform, postId] of Object.entries(metaPostIds)) {
      const acc = accountByPlatform[platform]
      if (!acc?.token || !postId) continue

      try {
        if (platform === 'facebook') {
          // Récupère likes, commentaires, partages
          const res = await fetch(
            `${GRAPH}/${postId}?fields=likes.limit(0).summary(true),comments.limit(0).summary(true),shares&access_token=${acc.token}`
          )
          if (res.status === 404 || res.status === 400) {
            await admin.from('posts').update({ status: 'deleted' }).eq('id', post.id)
            updated++
            break
          }
          if (!res.ok) continue
          const data = await res.json()

          const likes       = data.likes?.summary?.total_count || 0
          const comments    = data.comments?.summary?.total_count || 0
          const shares      = data.shares?.count || 0

          await admin.from('analytics').upsert({
            post_id:     post.id,
            platform:    'facebook',
            likes,
            comments,
            shares,
            impressions: 0,
            reach:       0,
          }, { onConflict: 'post_id,platform' })

          updated++
        }

        if (platform === 'instagram') {
          // Récupère like_count et comments_count
          const res = await fetch(
            `${IG_GRAPH}/${postId}?fields=like_count,comments_count&access_token=${acc.token}`
          )
          if (res.status === 404 || res.status === 400) {
            await admin.from('posts').update({ status: 'deleted' }).eq('id', post.id)
            updated++
            break
          }
          if (!res.ok) continue
          const data = await res.json()

          await admin.from('analytics').upsert({
            post_id:     post.id,
            platform:    'instagram',
            likes:       data.like_count || 0,
            comments:    data.comments_count || 0,
            shares:      0,
            impressions: 0,
            reach:       0,
          }, { onConflict: 'post_id,platform' })

          updated++
        }
      } catch { /* ignore erreurs réseau */ }
    }
  }

  return NextResponse.json({ updated })
}
