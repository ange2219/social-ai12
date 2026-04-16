import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { publishPost as ayrsharePublish } from '@/lib/ayrshare'
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

// Codes d'erreur Meta indiquant un token expiré
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

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = createAdminClient()

  // Appel interne depuis le cron (pas de session user)
  const internalSecret = _req.headers.get('x-internal-secret') || ''
  const isInternalCall = internalSecret && verifyInternalSecret(internalSecret)

  let userId: string

  if (isInternalCall) {
    // Le cron n'a pas de session — on récupère le user_id depuis le post directement
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
    admin.from('users').select('plan, ayrshare_profile_key').eq('id', userId).single(),
  ])

  const post = postResult.data
  const userProfile = userResult.data

  if (!post) return NextResponse.json({ error: 'Post introuvable' }, { status: 404 })
  if (post.status === 'published') return NextResponse.json({ error: 'Déjà publié' }, { status: 400 })

  try {
    if (userProfile?.plan === 'free') {
      // ── Plan gratuit : Meta Graph API directe ─────────────────────────────

      const accounts = await admin
        .from('social_accounts')
        .select('*')
        .eq('user_id', userId)
        .in('platform', post.platforms as Platform[])
        .eq('is_active', true)

      const metaPostIds: Record<string, string> = {}
      const platformErrors: Record<string, string> = {}

      for (const account of accounts.data || []) {
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
            metaPostIds.instagram = id
          } else if (account.platform === 'facebook') {
            const id = await publishFacebookPost({
              pageId: account.platform_user_id,
              pageToken: token,
              message: post.content,
              imageUrl: post.media_urls?.[0],
            })
            metaPostIds.facebook = id
          }
        } catch (err) {
          if (isMetaTokenExpiredError(err)) {
            platformErrors[account.platform] = `Token ${account.platform} expiré — reconnectez votre compte dans Paramètres`
          } else {
            platformErrors[account.platform] = err instanceof Error ? err.message : 'Erreur inconnue'
          }
        }
      }

      const successCount = Object.keys(metaPostIds).length
      const hasErrors = Object.keys(platformErrors).length > 0

      if (successCount === 0 && hasErrors) {
        const errorMsg = Object.entries(platformErrors).map(([p, m]) => `${p}: ${m}`).join(' | ')
        await admin.from('posts').update({
          status: 'failed',
          error_message: errorMsg,
          platform_errors: platformErrors,
        }).eq('id', post.id)
        return NextResponse.json({ error: errorMsg, platformErrors }, { status: 500 })
      }

      await admin.from('posts').update({
        status: hasErrors ? 'partial' : 'published',
        published_at: new Date().toISOString(),
        meta_post_ids: metaPostIds,
        platform_errors: hasErrors ? platformErrors : null,
        error_message: hasErrors
          ? `Partiel — échec sur : ${Object.keys(platformErrors).join(', ')}`
          : null,
      }).eq('id', post.id)

      if (hasErrors) {
        return NextResponse.json({
          success: true,
          partial: true,
          platformErrors,
          message: `Publié partiellement — échec sur : ${Object.keys(platformErrors).join(', ')}`,
        })
      }

    } else {
      // ── Plans payants : Ayrshare ──────────────────────────────────────────

      if (!userProfile?.ayrshare_profile_key) {
        return NextResponse.json({
          error: 'Compte Ayrshare non configuré. Rendez-vous dans Paramètres → Réseaux sociaux pour connecter vos comptes.',
        }, { status: 400 })
      }

      const contentVariants = post.content_variants as Partial<Record<Platform, string>> | null

      const result = await ayrsharePublish({
        profileKey: userProfile.ayrshare_profile_key,
        content: post.content,
        platforms: post.platforms as Platform[],
        mediaUrls: post.media_urls || undefined,
        contentVariants: contentVariants || undefined,
      })

      const platformErrors: Record<string, string> = {}
      for (const e of result.errors || []) {
        platformErrors[e.platform] = e.message
      }

      await admin.from('posts').update({
        status: result.status === 'partial' ? 'partial' : 'published',
        published_at: new Date().toISOString(),
        ayrshare_post_id: result.id,
        meta_post_ids: result.postIds,
        platform_errors: result.errors?.length ? platformErrors : null,
        error_message: result.status === 'partial'
          ? `Partiel — échec sur : ${result.errors?.map(e => e.platform).join(', ')}`
          : null,
      }).eq('id', post.id)

      if (result.status === 'partial') {
        return NextResponse.json({
          success: true,
          partial: true,
          platformErrors,
          message: `Publié partiellement — échec sur : ${Object.keys(platformErrors).join(', ')}`,
        })
      }
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
