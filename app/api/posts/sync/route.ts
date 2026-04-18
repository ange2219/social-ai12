import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/utils'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  const [{ data: posts }, { data: accounts }] = await Promise.all([
    admin
      .from('posts')
      .select('id, meta_post_ids, platforms, status, platform_errors')
      .eq('user_id', user.id)
      .eq('status', 'published')
      .not('meta_post_ids', 'eq', '{}')
      .limit(50),
    admin
      .from('social_accounts')
      .select('platform, access_token, platform_user_id')
      .eq('user_id', user.id)
      .eq('is_active', true),
  ])

  if (!posts?.length) return NextResponse.json({ updated: 0 })

  const accountByPlatform: Record<string, { token: string; userId: string }> = {}
  for (const acc of accounts || []) {
    try {
      accountByPlatform[acc.platform] = {
        token: decryptToken(acc.access_token),
        userId: acc.platform_user_id,
      }
    } catch {
      console.error(`[sync] Token malformé pour la plateforme ${acc.platform} — compte ignoré`)
    }
  }

  const GRAPH = 'https://graph.facebook.com/v19.0'
  const IG_GRAPH = 'https://graph.instagram.com/v19.0'

  // When a post is not found on a platform (deleted directly from the platform),
  // we keep the post visible in the app but mark the platform as removed in
  // platform_errors. The platform icon is grayed out in the UI.
  // Only sets status:'deleted' when ALL published platforms are gone.
  async function removePlatformOrDeletePost(postId: string, platform: string) {
    const { data: current } = await admin
      .from('posts')
      .select('platforms, meta_post_ids, platform_errors')
      .eq('id', postId)
      .single()

    if (!current) return

    const currentMetaIds = (current.meta_post_ids as Record<string, string>) || {}
    const currentErrors  = (current.platform_errors as Record<string, string>) || {}

    // Remove the meta post ID so future syncs don't re-check this platform
    const updatedMetaIds = { ...currentMetaIds }
    delete updatedMetaIds[platform]

    // Mark the platform as removed externally (keeps it in `platforms` array for UI)
    const updatedErrors = { ...currentErrors, [platform]: 'removed_externally' }

    // If no more active meta IDs remain, the post is fully gone from all platforms
    if (Object.keys(updatedMetaIds).length === 0) {
      await admin.from('posts').update({ status: 'deleted' }).eq('id', postId)
    } else {
      await admin.from('posts').update({
        meta_post_ids:   updatedMetaIds,
        platform_errors: updatedErrors,
        // platforms array is intentionally left intact — the UI uses platform_errors
        // to show which platforms have been removed, keeping the grayed-out icon
      }).eq('id', postId)
    }
  }

  // If a platform was wrongly marked removed_externally (e.g. due to a transient API error),
  // clear the flag so the icon becomes active again.
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

  async function syncPost(post: { id: string; meta_post_ids: Record<string, string>; platforms: string[]; platform_errors?: Record<string, string> | null }) {
    const tasks: Promise<void>[] = []

    for (const [platform, postId] of Object.entries(post.meta_post_ids)) {
      const acc = accountByPlatform[platform]
      if (!acc?.token || !postId) continue

      // Skip platforms already marked as removed externally
      if (post.platform_errors?.[platform] === 'removed_externally') continue

      if (platform === 'facebook') {
        tasks.push((async () => {
          const res = await fetch(
            `${GRAPH}/${postId}?fields=likes.limit(0).summary(true),comments.limit(0).summary(true),shares&access_token=${acc.token}`
          )
          if (!res.ok) {
            // Meta retourne 400 (code 100/803) quand un objet est introuvable, pas 404.
            // On parse le corps pour distinguer "post supprimé" vs erreur de config/permission.
            if (res.status === 400 || res.status === 404) {
              try {
                const err = await res.clone().json()
                const code = err?.error?.code
                const subcode = err?.error?.error_subcode
                if (code === 100 && subcode === 33 || code === 803 || res.status === 404) {
                  await removePlatformOrDeletePost(post.id, 'facebook')
                }
              } catch { /* corps non-JSON — erreur réseau, on ignore */ }
            }
            // Autres erreurs (401, 403, 429…) : erreur de config/token — on ne grise pas
            return
          }
          const data = await res.json()

          // Réponse 200 — si le post était incorrectement grisé, on réactive l'icône
          await clearPlatformError(post.id, 'facebook')

          // Impressions + reach via l'endpoint Insights (requiert read_insights)
          let impressions = 0
          let reach = 0
          try {
            const insRes = await fetch(
              `${GRAPH}/${postId}/insights?metric=post_impressions,post_impressions_unique&period=lifetime&access_token=${acc.token}`
            )
            if (insRes.ok) {
              const ins = await insRes.json()
              for (const metric of ins.data || []) {
                const val = metric.values?.[0]?.value || 0
                if (metric.name === 'post_impressions')        impressions = val
                if (metric.name === 'post_impressions_unique') reach       = val
              }
            }
          } catch { /* permission absente — on garde 0 */ }

          await admin.from('analytics').upsert({
            post_id: post.id,
            platform: 'facebook',
            likes: data.likes?.summary?.total_count || 0,
            comments: data.comments?.summary?.total_count || 0,
            shares: data.shares?.count || 0,
            impressions,
            reach,
          }, { onConflict: 'post_id,platform' })
        })())
      }

      if (platform === 'instagram') {
        tasks.push((async () => {
          const res = await fetch(
            `${IG_GRAPH}/${postId}?fields=like_count,comments_count&access_token=${acc.token}`
          )
          if (!res.ok) {
            if (res.status === 400 || res.status === 404) {
              try {
                const err = await res.clone().json()
                const code = err?.error?.code
                const subcode = err?.error?.error_subcode
                if (code === 100 && subcode === 33 || code === 803 || res.status === 404) {
                  await removePlatformOrDeletePost(post.id, 'instagram')
                }
              } catch { /* corps non-JSON — on ignore */ }
            }
            return
          }
          const data = await res.json()

          // Réponse 200 — si le post était incorrectement grisé, on réactive l'icône
          await clearPlatformError(post.id, 'instagram')

          // Impressions + reach via l'endpoint Insights IG (requiert instagram_manage_insights)
          let impressions = 0
          let reach = 0
          try {
            const insRes = await fetch(
              `${IG_GRAPH}/${postId}/insights?metric=impressions,reach&access_token=${acc.token}`
            )
            if (insRes.ok) {
              const ins = await insRes.json()
              for (const metric of ins.data || []) {
                const val = metric.values?.[0]?.value || 0
                if (metric.name === 'impressions') impressions = val
                if (metric.name === 'reach')       reach       = val
              }
            }
          } catch { /* permission absente — on garde 0 */ }

          await admin.from('analytics').upsert({
            post_id: post.id,
            platform: 'instagram',
            likes: data.like_count || 0,
            comments: data.comments_count || 0,
            shares: 0,
            impressions,
            reach,
          }, { onConflict: 'post_id,platform' })
        })())
      }
    }

    await Promise.allSettled(tasks)
  }

  const results = await Promise.allSettled(
    posts.map(p => syncPost({ id: p.id, meta_post_ids: p.meta_post_ids as Record<string, string>, platforms: (p.platforms as string[]) || [], platform_errors: p.platform_errors as Record<string, string> | null }))
  )

  const updated = results.filter(r => r.status === 'fulfilled').length
  return NextResponse.json({ updated })
}
