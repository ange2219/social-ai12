/** Instagram Graph API — connexion directe (sans Page Facebook) */

const IG_APP_ID = process.env.INSTAGRAM_APP_ID!
const IG_APP_SECRET = process.env.INSTAGRAM_APP_SECRET!
const IG_REDIRECT_URI = process.env.INSTAGRAM_REDIRECT_URI!

export function getInstagramOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    force_reauth: 'true',
    client_id: IG_APP_ID,
    redirect_uri: IG_REDIRECT_URI,
    scope: 'instagram_business_basic,instagram_business_content_publish',
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
  const { access_token } = await getInstagramLongLivedTokenWithExpiry(shortToken)
  return access_token
}

/** Échange le short-lived token et retourne le token + date d'expiration réelle */
export async function getInstagramLongLivedTokenWithExpiry(shortToken: string): Promise<{ access_token: string; expires_at: Date }> {
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
  const expiresIn = data.expires_in || 5183944 // ~60 jours fallback
  return {
    access_token: data.access_token,
    expires_at: new Date(Date.now() + expiresIn * 1000),
  }
}

export async function getInstagramUser(accessToken: string): Promise<{ id: string; username: string }> {
  const res = await fetch(`https://graph.instagram.com/me?fields=id,username&access_token=${accessToken}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Récupération profil Instagram échouée : ${err?.error?.message || res.status}`)
  }
  return res.json()
}

/**
 * Rafraîchit un long-lived token Instagram (valable 60 jours).
 * À appeler lorsque le token expire dans moins de 30 jours.
 * Retourne le nouveau token et la date d'expiration.
 */
export async function refreshInstagramLongLivedToken(accessToken: string): Promise<{ access_token: string; expires_at: Date }> {
  const params = new URLSearchParams({
    grant_type: 'ig_refresh_token',
    access_token: accessToken,
  })
  const res = await fetch(`https://graph.instagram.com/refresh_access_token?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Refresh token Instagram échoué : ${err?.error?.message || res.status}`)
  }
  const data = await res.json()
  const expiresAt = new Date(Date.now() + (data.expires_in || 5183944) * 1000)
  return { access_token: data.access_token, expires_at: expiresAt }
}
