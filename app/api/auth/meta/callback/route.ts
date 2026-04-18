import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { exchangeCodeForToken, getLongLivedToken, getLongLivedTokenWithExpiry, getUserPages, getPersonalProfile, getFacebookPageStats } from '@/lib/meta'
import { encryptToken } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = req.cookies.get('meta_oauth_state')?.value

  if (!code || !storedState || state !== storedState) {
    return popupResponse({ error: 'oauth_invalid' })
  }

  // Extraire l'userId depuis le state vérifié (state = userId.nonce)
  const userId = storedState.split('.')[0]
  if (!userId) return popupResponse({ error: 'State invalide' })

  try {
    const tokenData = await exchangeCodeForToken(code)
    const longTokenData = await getLongLivedTokenWithExpiry(tokenData.access_token)
    const longToken = longTokenData.access_token

    const pages = await getUserPages(longToken)
    const admin = createAdminClient()

    let fbId: string
    let fbName: string
    let fbToken: string
    let fbAvatar: string | null = null

    if (pages.length > 0) {
      const page = pages[0]
      fbId = page.id
      fbName = page.name
      fbToken = page.access_token
      // Photo de la Page Facebook
      try {
        const picRes = await fetch(`https://graph.facebook.com/${fbId}/picture?redirect=false&type=large&access_token=${fbToken}`)
        if (picRes.ok) {
          const picData = await picRes.json()
          fbAvatar = picData?.data?.url || null
        }
      } catch { /* non critique */ }
    } else {
      const profile = await getPersonalProfile(longToken)
      fbId = profile.id
      fbName = profile.name
      fbToken = longToken
      // Photo profil personnel
      try {
        const picRes = await fetch(`https://graph.facebook.com/${fbId}/picture?redirect=false&type=large&access_token=${fbToken}`)
        if (picRes.ok) {
          const picData = await picRes.json()
          fbAvatar = picData?.data?.url || null
        }
      } catch { /* non critique */ }
    }

    const tokenExpiresAt = longTokenData.expires_at
    await admin.from('social_accounts').delete().eq('user_id', userId).eq('platform', 'facebook')
    const { error } = await admin.from('social_accounts').insert({
      user_id: userId,
      platform: 'facebook',
      platform_user_id: fbId,
      platform_username: fbName,
      platform_avatar_url: fbAvatar,
      access_token: encryptToken(fbToken),
      token_expires_at: tokenExpiresAt.toISOString(),
      connected_via: 'meta_direct',
      is_active: true,
    })
    if (error) throw new Error(`Sauvegarde Facebook échouée : ${error.message}`)

    // Auto-fetch baseline au moment de la connexion
    try {
      const stats = await getFacebookPageStats(fbId, fbToken)
      await admin.from('social_baselines').upsert({
        user_id: userId,
        platform: 'facebook',
        baseline_followers: stats.followers,
        current_followers: stats.followers,
        posts_count: stats.posts,
        baseline_at: new Date().toISOString(),
        refreshed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,platform' })
    } catch { /* baseline non critique */ }

    const response = popupResponse({ success: 'facebook', page: fbName })
    // Invalider le state cookie après usage pour éviter le replay
    response.cookies.set('meta_oauth_state', '', { maxAge: 0, path: '/' })
    return response
  } catch (err) {
    console.error('Meta OAuth error:', err)
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return popupResponse({ error: msg })
  }
}

function popupResponse(data: Record<string, string>): NextResponse {
  // Escape </script> pour éviter l'injection HTML dans le tag script
  const payload = JSON.stringify({ type: 'meta_oauth', ...data })
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
  const appOrigin = process.env.NEXT_PUBLIC_APP_URL || ''
  const html = `<!DOCTYPE html><html><body><script>
    var d = ${payload};
    try { window.opener.postMessage(d, ${JSON.stringify(appOrigin)}) } catch(e) {}
    window.close()
  </script><p style="font-family:sans-serif;color:#aaa;text-align:center;margin-top:40px">Connexion en cours...</p></body></html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
