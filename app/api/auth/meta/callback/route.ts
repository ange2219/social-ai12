import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPages,
  getPersonalProfile,
  getInstagramAccount,
  getInstagramProfile,
} from '@/lib/meta'
import { encryptToken } from '@/lib/utils'

async function saveAccount(admin: ReturnType<typeof createAdminClient>, data: {
  user_id: string
  platform: string
  platform_user_id: string
  platform_username: string
  access_token: string
  connected_via: string
}) {
  // D'abord supprimer l'ancien enregistrement s'il existe
  await admin
    .from('social_accounts')
    .delete()
    .eq('user_id', data.user_id)
    .eq('platform', data.platform)

  // Insérer le nouveau
  const { error } = await admin.from('social_accounts').insert({
    user_id: data.user_id,
    platform: data.platform,
    platform_user_id: data.platform_user_id,
    platform_username: data.platform_username,
    access_token: data.access_token,
    connected_via: data.connected_via,
    is_active: true,
  })

  if (error) throw new Error(`Sauvegarde ${data.platform} échouée : ${error.message}`)
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = req.cookies.get('meta_oauth_state')?.value

  if (!code || state !== storedState) {
    return popupResponse({ error: 'oauth_invalid' })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return popupResponse({ error: 'Non authentifié' })

  try {
    const tokenData = await exchangeCodeForToken(code)
    const longToken = await getLongLivedToken(tokenData.access_token)

    const pages = await getUserPages(longToken)
    console.log('[Meta callback] pages trouvées:', pages.length, JSON.stringify(pages.map(p => ({ id: p.id, name: p.name }))))
    const admin = createAdminClient()

    // Utiliser la Page si dispo, sinon le profil personnel comme fallback
    let fbId: string
    let fbName: string
    let fbToken: string
    let isPage: boolean

    if (pages.length > 0) {
      const page = pages[0]
      fbId = page.id
      fbName = page.name
      fbToken = page.access_token
      isPage = true
    } else {
      const profile = await getPersonalProfile(longToken)
      fbId = profile.id
      fbName = profile.name
      fbToken = longToken
      isPage = false
    }

    await saveAccount(admin, {
      user_id: user.id,
      platform: 'facebook',
      platform_user_id: fbId,
      platform_username: fbName,
      access_token: encryptToken(fbToken),
      connected_via: 'meta_direct',
    })

    // Instagram si disponible (seulement via Page)
    let igConnected = false
    if (isPage) {
      try {
        const igAccount = await getInstagramAccount(fbId, fbToken)
        console.log('[Meta callback] igAccount:', igAccount)
        if (igAccount) {
          const igProfile = await getInstagramProfile(igAccount.id, fbToken)
          await saveAccount(admin, {
            user_id: user.id,
            platform: 'instagram',
            platform_user_id: igAccount.id,
            platform_username: igProfile.username,
            access_token: encryptToken(fbToken),
            connected_via: 'meta_direct',
          })
          igConnected = true
        }
      } catch { /* Instagram optionnel */ }
    }

    const successMsg = igConnected ? 'facebook_instagram' : 'facebook_only'
    return popupResponse({ success: successMsg, page: fbName })
  } catch (err) {
    console.error('Meta OAuth error:', err)
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return popupResponse({ error: msg })
  }
}

function popupResponse(data: Record<string, string>) {
  const payload = JSON.stringify({ type: 'meta_oauth', ...data })
  const html = `<!DOCTYPE html><html><body><script>
    try { window.opener.postMessage(${payload}, '*') } catch(e) {}
    window.close()
  </script><p style="font-family:sans-serif;color:#aaa;text-align:center;margin-top:40px">Connexion en cours...</p></body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html' } })
}
