import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { listAccounts } from '@/lib/zernio'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  console.log('[social/callback] params:', Object.fromEntries(searchParams.entries()))

  const platform = searchParams.get('platform')
  const userId   = searchParams.get('userId')
  const accountId = searchParams.get('accountId') || searchParams.get('account_id') || searchParams.get('id')

  if (!platform || !userId) {
    return NextResponse.redirect(new URL('/profile?error=callback_params_manquants', req.url))
  }

  const admin = createAdminClient()
  const { data: userProfile } = await admin
    .from('users')
    .select('zernio_profile_id')
    .eq('id', userId)
    .single()

  let finalAccountId = accountId
  let platformUsername: string = platform
  let platformAvatarUrl: string | null = null

  if (userProfile?.zernio_profile_id) {
    try {
      console.log('[social/callback] Interroge Zernio API pour les infos du compte')
      const accounts = await listAccounts(userProfile.zernio_profile_id)
      console.log('[social/callback] comptes Zernio:', JSON.stringify(accounts))

      const match = accounts.find((a: any) =>
        a.platform?.toLowerCase() === platform.toLowerCase()
      )

      if (match) {
        finalAccountId = finalAccountId || match._id || match.id || match.accountId
        platformUsername = match.displayName || match.name || match.display_name || match.username || match.handle || platform
        platformAvatarUrl = match.avatar || match.profilePicture || match.picture || match.avatarUrl || match.profile_picture_url || null
      }
    } catch (err) {
      console.error('[social/callback] Erreur listAccounts:', err instanceof Error ? err.message : err)
    }
  }

  if (!finalAccountId) {
    console.error('[social/callback] accountId introuvable pour', platform)
    return NextResponse.redirect(new URL(`/profile?error=compte+${platform}+introuvable+dans+Zernio`, req.url))
  }

  // Vérifie si un token Meta direct existe déjà pour cette plateforme
  const { data: existing } = await admin
    .from('social_accounts')
    .select('access_token, connected_via')
    .eq('user_id', userId)
    .eq('platform', platform)
    .single()

  const hasMetaToken = existing?.access_token && existing.access_token !== 'zernio_managed'
  const connectedVia = hasMetaToken ? 'both' : 'zernio'

  // Si un token Meta existe, on ne l'écrase pas — on ajoute seulement Zernio par-dessus
  const upsertPayload: Record<string, unknown> = {
    user_id:              userId,
    platform,
    zernio_account_id:    finalAccountId,
    is_active:            true,
    platform_username:    platformUsername,
    platform_avatar_url:  platformAvatarUrl,
    connected_via:        connectedVia,
  }
  if (!hasMetaToken) {
    // Pas de token Meta → connexion pure Zernio
    upsertPayload.access_token    = 'zernio_managed'
    upsertPayload.platform_user_id = finalAccountId
  }
  // Si hasMetaToken : on ne touche ni access_token ni platform_user_id (IDs Meta conservés)

  const { error } = await admin
    .from('social_accounts')
    .upsert(upsertPayload, { onConflict: 'user_id,platform' })

  if (error) {
    console.error('[social/callback] DB upsert error:', error.message)
    return NextResponse.redirect(new URL('/profile?error=erreur_base_de_données', req.url))
  }

  // Réponse popup : ferme la fenêtre et notifie le parent
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || ''
  const payload = JSON.stringify({ type: 'zernio_oauth', success: true, platform })
    .replace(/</g, '\\u003c').replace(/>/g, '\\u003e')
  const html = `<!DOCTYPE html><html><body><script>
    var d = ${payload};
    try { window.opener.postMessage(d, ${JSON.stringify(appOrigin)}) } catch(e) {}
    try { localStorage.setItem('_oauth_result', JSON.stringify(d)) } catch(e) {}
    window.close()
  <\/script><p style="font-family:sans-serif;color:#aaa;text-align:center;margin-top:40px">Connexion en cours...</p></body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
