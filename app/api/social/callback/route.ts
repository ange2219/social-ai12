import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listAccounts } from '@/lib/zernio'

/**
 * GET /api/social/callback
 * Callback après OAuth Zernio. Zernio redirige ici avec des params variables
 * selon la plateforme. On récupère l'accountId depuis leur API si absent.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)

  // Log tous les params reçus pour debug
  console.log('[social/callback] params:', Object.fromEntries(searchParams.entries()))

  const platform = searchParams.get('platform')
  const userId   = searchParams.get('userId')

  // accountId peut s'appeler différemment selon Zernio
  const accountId = searchParams.get('accountId') || searchParams.get('account_id') || searchParams.get('id')

  if (!platform || !userId) {
    console.error('[social/callback] Params manquants:', { platform, userId })
    return NextResponse.redirect(new URL('/profile?error=callback_params_manquants', req.url))
  }

  const admin = createAdminClient()

  // Récupère le zernio_profile_id de l'utilisateur
  const { data: userProfile } = await admin
    .from('users')
    .select('zernio_profile_id')
    .eq('id', userId)
    .single()

  let finalAccountId = accountId

  // Si Zernio n'a pas passé l'accountId, on le cherche via leur API
  if (!finalAccountId && userProfile?.zernio_profile_id) {
    try {
      console.log('[social/callback] accountId absent — interroge Zernio API')
      const accounts = await listAccounts(userProfile.zernio_profile_id)
      console.log('[social/callback] comptes Zernio:', JSON.stringify(accounts))
      const match = accounts.find((a: any) =>
        a.platform?.toLowerCase() === platform.toLowerCase()
      )
      finalAccountId = match?._id || match?.id || match?.accountId
    } catch (err) {
      console.error('[social/callback] Erreur listAccounts:', err instanceof Error ? err.message : err)
    }
  }

  if (!finalAccountId) {
    console.error('[social/callback] accountId introuvable pour', platform)
    return NextResponse.redirect(
      new URL(`/profile?error=compte+${platform}+introuvable+dans+Zernio`, req.url)
    )
  }

  const { error } = await admin
    .from('social_accounts')
    .upsert({
      user_id:           userId,
      platform,
      zernio_account_id: finalAccountId,
      is_active:         true,
      access_token:      'zernio_managed',
      platform_user_id:  finalAccountId,
      platform_username: platform, // placeholder — sera mis à jour si dispo
      connected_via:     'zernio',
    }, { onConflict: 'user_id,platform' })

  if (error) {
    console.error('[social/callback] DB upsert error:', error.message)
    return NextResponse.redirect(new URL('/profile?error=erreur_base_de_données', req.url))
  }

  console.log('[social/callback] Compte sauvegardé:', platform, finalAccountId)
  return NextResponse.redirect(
    new URL(`/profile?social=connected&platform=${platform}`, req.url)
  )
}
