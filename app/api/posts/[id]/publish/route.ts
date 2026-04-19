import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { publishPost as zernioPublish } from '@/lib/zernio'
import { publishInstagramPost, publishFacebookPost } from '@/lib/meta'
import { decryptToken } from '@/lib/utils'
import { timingSafeEqual } from 'crypto'
import type { Platform } from '@/types'

const INTERNAL_SECRET = process.env.CRON_SECRET!

function verifyInternalSecret(secret: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(INTERNAL_SECRET))
  } catch { return false }
}

function isMetaTokenExpiredError(err: unknown): boolean {
  if (!(err instanceof Error)) return false
  const msg = err.message.toLowerCase()
  return (
    msg.includes('invalid oauth') ||
    msg.includes('token expired') ||
    msg.includes('session has been invalidated') ||
    msg.includes('code 190') ||
    msg.includes('code 102') ||
    msg.includes('code 463')
  )
}

// FB et IG → Meta API directe ; tout le reste → Zernio
const META_PLATFORMS = new Set<Platform>(['facebook', 'instagram'])

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient()

  const internalSecret = _req.headers.get('x-internal-secret') || ''
  const isInternalCall = internalSecret && verifyInternalSecret(internalSecret)

  let userId: string

  if (isInternalCall) {
    const { data: postOwner } = await admin
      .from('posts')
      .select('user_id')
      .eq('id', params.id)
      .single()
    if (!postOwner) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
    userId = postOwner.user_id
  } else {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    userId = user.id
  }

  const [postResult, userResult] = await Promise.all([
    admin.from('posts').select('*').eq('id', params.id).eq('user_id', userId).single(),
    admin.from('users').select('zernio_profile_id').eq('id', userId).single(),
  ])

  const post = postResult.data
  const userProfile = userResult.data

  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
  if (post.status === 'published') return NextResponse.json({ error: 'Déjà publié' }, { status: 400 })

  try {
    const postPlatforms = post.platforms as Platform[]
    const metaPlatforms  = postPlatforms.filter(p => META_PLATFORMS.has(p))
    const zernioPlatforms = postPlatforms.filter(p => !META_PLATFORMS.has(p))

    const publishedIds: Record<string, string> = {}
    const platformErrors: Record<string, string> = {}

    // ── Meta API (Facebook + Instagram) ──────────────────────────────────────
    if (metaPlatforms.length > 0) {
      const { data: metaAccounts } = await admin
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId)
        .in('platform', metaPlatforms)
        .eq('is_active', true)
        .neq('access_token', 'zernio_managed')

      for (const account of metaAccounts || []) {
        let token: string
        try {
          token = decryptToken(account.access_token)
        } catch {
          platformErrors[account.platform] = 'Token invalide — reconnectez votre compte'
          continue
        }

        try {
          if (account.platform === 'instagram') {
            const mediaUrl = post.media_urls?.[0]
            if (!mediaUrl) {
              platformErrors.instagram = 'Une image est requise pour Instagram'
              continue
            }
            const id = await publishInstagramPost({
              igUserId: account.platform_user_id,
              pageToken: token,
              caption: post.content,
              imageUrl: mediaUrl,
            })
            publishedIds.instagram = id
          } else if (account.platform === 'facebook') {
            const id = await publishFacebookPost({
              pageId: account.platform_user_id,
              pageToken: token,
              message: post.content,
              imageUrl: post.media_urls?.[0],
            })
            publishedIds.facebook = id
          }
        } catch (err) {
          if (isMetaTokenExpiredError(err)) {
            platformErrors[account.platform] = `Token ${account.platform} expiré — reconnectez votre compte dans Paramètres`
          } else {
            platformErrors[account.platform] = err instanceof Error ? err.message : 'Erreur inconnue'
          }
        }
      }
    }

    // ── Zernio (TikTok, Twitter, LinkedIn, YouTube, Pinterest…) ──────────────
    if (zernioPlatforms.length > 0) {
      if (!userProfile?.zernio_profile_id) {
        for (const p of zernioPlatforms) {
          platformErrors[p] = 'Compte Zernio non configuré — connectez vos comptes dans Paramètres'
        }
      } else {
        const { data: zernioAccounts } = await admin
          .from('social_accounts')
          .select('platform, zernio_account_id')
          .eq('user_id', userId)
          .in('platform', zernioPlatforms)
          .eq('is_active', true)
          .not('zernio_account_id', 'is', null)

        const platformAccounts = (zernioAccounts || [])
          .filter(a => a.zernio_account_id)
          .map(a => ({ platform: a.platform as Platform, accountId: a.zernio_account_id as string }))

        if (!platformAccounts.length) {
          for (const p of zernioPlatforms) {
            platformErrors[p] = 'Compte non connecté — reconnectez dans Paramètres'
          }
        } else {
          // TikTok requiert un média (vidéo ou image)
          if (platformAccounts.some(a => a.platform === 'tiktok') && !post.media_urls?.length) {
            platformErrors.tiktok = 'Un média (image ou vidéo) est requis pour TikTok'
            platformAccounts.splice(platformAccounts.findIndex(a => a.platform === 'tiktok'), 1)
          }

          const contentVariants = post.content_variants as Partial<Record<Platform, string>> | null
          if (platformAccounts.length > 0) try {
            const result = await zernioPublish({
              platforms: platformAccounts,
              content: post.content,
              mediaUrls: post.media_urls || undefined,
              contentVariants: contentVariants || undefined,
            })
            Object.assign(publishedIds, result.postIds)
            for (const e of result.errors || []) {
              platformErrors[e.platform] = e.message
            }
          } catch (err) {
            for (const { platform } of platformAccounts) {
              platformErrors[platform] = err instanceof Error ? err.message : 'Erreur Zernio'
            }
          }
        }
      }
    }

    // ── Résultat final ────────────────────────────────────────────────────────
    const successCount = Object.keys(publishedIds).length
    const errorCount   = Object.keys(platformErrors).length

    if (successCount === 0 && errorCount > 0) {
      const errorMsg = Object.entries(platformErrors).map(([p, m]) => `${p}: ${m}`).join(' | ')
      await admin.from('posts').update({
        status: 'failed',
        error_message: errorMsg,
        platform_errors: platformErrors,
      }).eq('id', post.id)
      return NextResponse.json({ error: errorMsg, platformErrors }, { status: 500 })
    }

    const finalStatus = errorCount > 0 ? 'partial' : 'published'

    await admin.from('posts').update({
      status: finalStatus,
      published_at: new Date().toISOString(),
      meta_post_ids: publishedIds,
      platform_errors: errorCount > 0 ? platformErrors : null,
      error_message: finalStatus === 'partial'
        ? `Partiel — échec sur : ${Object.keys(platformErrors).join(', ')}`
        : null,
    }).eq('id', post.id)

    if (finalStatus === 'partial') {
      return NextResponse.json({
        success: true,
        partial: true,
        platformErrors,
        message: `Publié partiellement — échec sur : ${Object.keys(platformErrors).join(', ')}`,
      })
    }

    return NextResponse.json({ success: true })

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Publication échouée'
    console.error('[publish] Error:', message)
    await admin.from('posts').update({
      status: 'failed',
      error_message: message,
    }).eq('id', post.id)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
