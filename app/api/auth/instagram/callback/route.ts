import { NextRequest } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { exchangeInstagramCode, getInstagramLongLivedToken, getInstagramUser } from '@/lib/instagram'
import { encryptToken } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = req.cookies.get('instagram_oauth_state')?.value

  if (!code || state !== storedState) {
    return popupResponse({ error: 'oauth_invalid' })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return popupResponse({ error: 'Non authentifié' })

  try {
    const tokenData = await exchangeInstagramCode(code)
    const longToken = await getInstagramLongLivedToken(tokenData.access_token)
    const igUser = await getInstagramUser(String(tokenData.user_id), longToken)

    const admin = createAdminClient()
    await admin.from('social_accounts').delete().eq('user_id', user.id).eq('platform', 'instagram')
    const { error } = await admin.from('social_accounts').insert({
      user_id: user.id,
      platform: 'instagram',
      platform_user_id: igUser.id,
      platform_username: igUser.username,
      access_token: encryptToken(longToken),
      connected_via: 'meta_direct',
      is_active: true,
    })
    if (error) throw new Error(`Sauvegarde Instagram échouée : ${error.message}`)

    return popupResponse({ success: 'instagram', username: igUser.username })
  } catch (err) {
    console.error('Instagram OAuth error:', err)
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return popupResponse({ error: msg })
  }
}

function popupResponse(data: Record<string, string>) {
  const payload = JSON.stringify({ type: 'instagram_oauth', ...data })
  const html = `<!DOCTYPE html><html><body><script>
    try { window.opener.postMessage(${payload}, '*') } catch(e) {}
    window.close()
  </script><p style="font-family:sans-serif;color:#aaa;text-align:center;margin-top:40px">Connexion en cours...</p></body></html>`
  return new Response(html, { headers: { 'Content-Type': 'text/html' } })
}
