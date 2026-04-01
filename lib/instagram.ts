/** Instagram Graph API — connexion directe (sans Page Facebook) */

const IG_APP_ID = process.env.INSTAGRAM_APP_ID!
const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!
const IG_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI!

export function getInstagramOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    force_reauth: 'true',
    client_id: IG_APP_ID,
    redirect_uri: IG_REDIRECT_URI,
    scope: 'instagram_basic',
    response_type: 'code',
    state,
  })
  return `https://www.instagram.com/oauth/authorize?${params}`
}

export async function exchangeInstagramCode(code: string): Promise<{ access_token: string; user_id: number }> {
  const body = new URLSearchParams({
    client_id: IG_APP_ID,
    client_secret: IG_APP_SECRET,
    grant_type: 'authorization_code',
    redirect_uri: IG_REDIRECT_URI,
    code,
  })
  const res = await fetch('https://api.instagram.com/oauth/access_token', { method: 'POST', body })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Échange token Instagram échoué : ${err?.error_message || res.status}`)
  }
  return res.json()
}

export async function getInstagramLongLivedToken(shortToken: string): Promise<string> {
  const params = new URLSearchParams({
    grant_type: 'ig_exchange_token',
    client_id: IG_APP_ID,
    client_secret: IG_APP_SECRET,
    access_token: shortToken,
  })
  const res = await fetch(`https://graph.instagram.com/access_token?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token long-lived Instagram échoué : ${err?.error?.message || res.status}`)
  }
  const data = await res.json()
  return data.access_token
}

export async function getInstagramUser(userId: string, accessToken: string): Promise<{ id: string; username: string }> {
  const res = await fetch(`https://graph.instagram.com/${userId}?fields=id,username&access_token=${accessToken}`)
  if (!res.ok) throw new Error('Récupération profil Instagram échouée')
  return res.json()
}
