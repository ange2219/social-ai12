import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

/**
 * GET /api/social/callback
 * Callback Zernio après connexion OAuth d'un réseau social.
 * Zernio appelle cette URL avec ?accountId=...&platform=...&userId=...
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const accountId = searchParams.get('accountId')
  const platform  = searchParams.get('platform')
  const userId    = searchParams.get('userId')

  if (!accountId || !platform || !userId) {
    return NextResponse.redirect(
      new URL('/settings?social=error&reason=missing_params', req.url)
    )
  }

  const admin = createAdminClient()

  // Sauvegarde l'accountId Zernio dans social_accounts
  const { error } = await admin
    .from('social_accounts')
    .upsert({
      user_id:          userId,
      platform,
      zernio_account_id: accountId,
      is_active:        true,
      // Les champs access_token / platform_user_id ne sont pas utilisés pour Zernio
      access_token:     'zernio_managed',
      platform_user_id: accountId,
    }, { onConflict: 'user_id,platform' })

  if (error) {
    console.error('[social/callback] Upsert error:', error.message)
    return NextResponse.redirect(
      new URL('/settings?social=error&reason=db_error', req.url)
    )
  }

  return NextResponse.redirect(
    new URL(`/settings?social=connected&platform=${platform}`, req.url)
  )
}
