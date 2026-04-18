import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/utils'
import { timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET!

function verifyCronSecret(secret: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(CRON_SECRET))
  } catch { return false }
}

const GRAPH    = 'https://graph.facebook.com/v19.0'
const IG_GRAPH = 'https://graph.instagram.com/v19.0'

/**
 * GET /api/cron/sync
 * Synchronise les analytics (likes, comments, shares, impressions, reach)
 * pour tous les posts publiés de tous les utilisateurs.
 * Appelé par le scheduler externe (Render cron / Vercel cron) toutes les heures.
 *
 * Authorization: Bearer {CRON_SECRET}
 */
export async function GET(req: NextRequest) {
  const secret = (req.headers.get('authorization') || '').replace('Bearer ', '')
  if (!verifyCronSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Récupère jusqu'à 200 posts publiés avec meta_post_ids non vide
  const { data: posts, error: postsErr } = await admin
    .from('posts')
    .select('id, user_id, meta_post_ids, platforms, platform_errors')
    .eq('status', 'published')
    .not('meta_post_ids', 'eq', '{}')
    .order('published_at', { ascending: false })
    .limit(200)

  if (postsErr) {
    console.error('[cron/sync] Lecture posts échouée:', postsErr.message)
    return NextResponse.json({ error: postsErr.message }, { status: 500 })
  }
  if (!posts?.length) return NextResponse.json({ synced: 0 })

  // Récupère tous les comptes actifs concernés
  const userIds = [...new Set(posts.map(p => p.user_id))]
  const { data: accounts } = await admin
    .from('social_accounts')
    .select('user_id, platform, access_token, platform_user_id')
    .in('user_id', userIds)
    .eq('is_active', true)

  // Index : user_id → platform → { token, userId }
  const tokenIndex: Record<string, Record<string, { token: string; userId: string }>> = {}
  for (const acc of accounts || []) {
    try {
      if (!tokenIndex[acc.user_id]) tokenIndex[acc.user_id] = {}
      tokenIndex[acc.user_id][acc.platform] = {
        token: decryptToken(acc.access_token),
        userId: acc.platform_user_id,
      }
    } catch { /* token malformé — ignoré */ }
  }

  async function removePlatformOrDeletePost(postId: string, platform: string) {
    const { data: current } = await admin
      .from('posts')
      .select('platforms, meta_post_ids, platform_errors')
      .eq('id', postId)
      .single()
    if (!current) return

    const currentMetaIds = (current.meta_post_ids as Record<string, string>) || {}
    const currentErrors  = (current.platform_errors as Record<string, string>) || {}

    const updatedMetaIds = { ...currentMetaIds }
    delete updatedMetaIds[platform]

    const updatedErrors = { ...currentErrors, [platform]: 'removed_externally' }

    if (Object.keys(updatedMetaIds).length === 0) {
      await admin.from('posts').update({ status: 'deleted' }).eq('id', postId)
    } else {
      await admin.from('posts').update({
        meta_post_ids:   updatedMetaIds,
        platform_errors: updatedErrors,
      }).eq('id', postId)
    }
  }

  // Si un post était incorrectement grisé (ex: erreur 400 transitoire), on réactive l'icône.
  async function clearPlatformError(postId: string, platform: string) {
    const { data: current } = await admin
      .from('posts')
      .select('platform_errors')
      .eq('id', postId)
      .single()
    if (!current) return
    const errs = (current.platform_errors as Record<string, string>) || {}
    if (errs[platform] !== 'removed_externally') return
    const updated = { ...errs }
    delete updated[platform]
    await admin.from('posts').update({ platform_errors: updated }).eq('id', postId)
  }

  let synced = 0

  await Promise.allSettled(posts.map(async post => {
    const metaIds      = (post.meta_post_ids   as Record<string, string>) || {}
    const platformErrs = (post.platform_errors as Record<string, string>) || {}
    const userTokens   = tokenIndex[post.user_id] || {}

    const tasks: Promise<void>[] = []

    for (const [platform, postId] of Object.entries(metaIds)) {
      if (!postId) continue
      if (platformErrs[platform] === 'removed_externally') continue

      const acc = userTokens[platform]
      if (!acc?.token) continue

      if (platform === 'facebook') {
        tasks.push((async () => {
          const res = await fetch(
            `${GRAPH}/${postId}?fields=likes.limit(0).summary(true),comments.limit(0).summary(true),shares&access_token=${acc.token}`
          )
          if (res.status === 404) {
            await removePlatformOrDeletePost(post.id, 'facebook'); return
          }
          if (!res.ok) return
          const data = await res.json()

          await clearPlatformError(post.id, 'facebook')

          let impressions = 0, reach = 0
          try {
            const insRes = await fetch(
              `${GRAPH}/${postId}/insights?metric=post_impressions,post_impressions_unique&period=lifetime&access_token=${acc.token}`
            )
            if (insRes.ok) {
              const ins = await insRes.json()
              for (const m of ins.data || []) {
                const val = m.values?.[0]?.value || 0
                if (m.name === 'post_impressions')        impressions = val
                if (m.name === 'post_impressions_unique') reach       = val
              }
            }
          } catch { /* permission absente */ }

          await admin.from('analytics').upsert({
            post_id: post.id, platform: 'facebook',
            likes:       data.likes?.summary?.total_count || 0,
            comments:    data.comments?.summary?.total_count || 0,
            shares:      data.shares?.count || 0,
            impressions, reach,
          }, { onConflict: 'post_id,platform' })
        })())
      }

      if (platform === 'instagram') {
        tasks.push((async () => {
          const res = await fetch(
            `${IG_GRAPH}/${postId}?fields=like_count,comments_count&access_token=${acc.token}`
          )
          if (res.status === 404) {
            await removePlatformOrDeletePost(post.id, 'instagram'); return
          }
          if (!res.ok) return
          const data = await res.json()

          await clearPlatformError(post.id, 'instagram')

          let impressions = 0, reach = 0
          try {
            const insRes = await fetch(
              `${IG_GRAPH}/${postId}/insights?metric=impressions,reach&access_token=${acc.token}`
            )
            if (insRes.ok) {
              const ins = await insRes.json()
              for (const m of ins.data || []) {
                const val = m.values?.[0]?.value || 0
                if (m.name === 'impressions') impressions = val
                if (m.name === 'reach')       reach       = val
              }
            }
          } catch { /* permission absente */ }

          await admin.from('analytics').upsert({
            post_id: post.id, platform: 'instagram',
            likes:       data.like_count || 0,
            comments:    data.comments_count || 0,
            shares:      0,
            impressions, reach,
          }, { onConflict: 'post_id,platform' })
        })())
      }
    }

    await Promise.allSettled(tasks)
    synced++
  }))

  console.log(`[cron/sync] ${synced} posts synchronisés`)
  return NextResponse.json({ synced })
}
