/** Meta Graph API — Instagram + Facebook (plan gratuit) */

const APP_ID = process.env.META_APP_ID!
const APP_SECRET = process.env.META_APP_SECRET!
const REDIRECT_URI = process.env.META_REDIRECT_URI!
const GRAPH = 'https://graph.facebook.com/v19.0'

/** URL OAuth Meta pour initier la connexion */
export function getMetaOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: APP_ID,
    redirect_uri: REDIRECT_URI,
    scope: [
      'pages_manage_posts',
      'pages_read_engagement',
      'pages_show_list',
      'public_profile',
      'read_insights',              // impressions + reach des posts Facebook
      'instagram_manage_insights',  // impressions + reach des posts Instagram
    ].join(','),
    response_type: 'code',
    state,
  })
  return `https://www.facebook.com/v19.0/dialog/oauth?${params}`
}

/** Échange le code OAuth contre un access_token */
export async function exchangeCodeForToken(code: string): Promise<{
  access_token: string
  token_type: string
  expires_in?: number
}> {
  const params = new URLSearchParams({
    client_id: APP_ID,
    client_secret: APP_SECRET,
    redirect_uri: REDIRECT_URI,
    code,
  })
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Échange token échoué : ${err?.error?.message || res.status}`)
  }
  return res.json()
}

/** Échange le short-lived token pour un long-lived token (60 jours) */
export async function getLongLivedToken(shortToken: string): Promise<string> {
  const { access_token } = await getLongLivedTokenWithExpiry(shortToken)
  return access_token
}

/** Échange le short-lived token et retourne le token + date d'expiration réelle */
export async function getLongLivedTokenWithExpiry(shortToken: string): Promise<{ access_token: string; expires_at: Date }> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: APP_ID,
    client_secret: APP_SECRET,
    fb_exchange_token: shortToken,
  })
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Token long-lived échoué : ${err?.error?.message || res.status}`)
  }
  const data = await res.json()
  const expiresIn = data.expires_in || 5183944 // ~60 jours fallback
  return {
    access_token: data.access_token,
    expires_at: new Date(Date.now() + expiresIn * 1000),
  }
}

/**
 * Rafraîchit un long-lived token Facebook (valable 60 jours).
 * À appeler lorsque le token expire dans moins de 30 jours.
 */
export async function refreshFacebookLongLivedToken(currentToken: string): Promise<{ access_token: string; expires_at: Date }> {
  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: APP_ID,
    client_secret: APP_SECRET,
    fb_exchange_token: currentToken,
  })
  const res = await fetch(`${GRAPH}/oauth/access_token?${params}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Refresh token Facebook échoué : ${err?.error?.message || res.status}`)
  }
  const data = await res.json()
  const expiresIn = data.expires_in || 5183944 // ~60 jours
  const expiresAt = new Date(Date.now() + expiresIn * 1000)
  return { access_token: data.access_token, expires_at: expiresAt }
}

/** Récupère les Pages Facebook de l'utilisateur */
export async function getUserPages(accessToken: string) {
  const res = await fetch(`${GRAPH}/me/accounts?access_token=${accessToken}&fields=id,name,access_token`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.data || []) as Array<{ id: string; name: string; access_token: string }>
}

/** Récupère le profil personnel Facebook (/me) */
export async function getPersonalProfile(accessToken: string): Promise<{ id: string; name: string }> {
  const res = await fetch(`${GRAPH}/me?fields=id,name&access_token=${accessToken}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Récupération profil échouée : ${err?.error?.message || res.status}`)
  }
  return res.json()
}

/** Récupère le compte Instagram Business lié à une Page */
export async function getInstagramAccount(pageId: string, pageToken: string) {
  const res = await fetch(
    `${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${pageToken}`
  )
  if (!res.ok) throw new Error('Meta get Instagram account failed')
  const data = await res.json()
  return data.instagram_business_account as { id: string } | null
}

/** Récupère le profil Instagram */
export async function getInstagramProfile(igUserId: string, pageToken: string) {
  const res = await fetch(
    `${GRAPH}/${igUserId}?fields=id,username,profile_picture_url,followers_count&access_token=${pageToken}`
  )
  if (!res.ok) throw new Error('Meta get Instagram profile failed')
  return res.json()
}

/** Publie un post sur Instagram (Professional Login — graph.instagram.com) */
export async function publishInstagramPost(params: {
  igUserId: string
  pageToken: string
  caption: string
  imageUrl?: string
}): Promise<string> {
  const IG_GRAPH = 'https://graph.instagram.com/v19.0'

  // 1. Créer le media container
  const containerBody: Record<string, string> = {
    caption: params.caption,
    access_token: params.pageToken,
  }
  if (params.imageUrl) {
    containerBody.image_url = params.imageUrl
    containerBody.media_type = 'IMAGE'
  } else {
    throw new Error('Instagram nécessite une image')
  }

  const containerRes = await fetch(`${IG_GRAPH}/${params.igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(containerBody),
  })
  if (!containerRes.ok) {
    const e = await containerRes.json().catch(() => ({}))
    throw new Error(`Instagram media container failed: ${e?.error?.message || containerRes.status}`)
  }
  const { id: creationId } = await containerRes.json()

  // 2. Attendre que le container soit prêt
  for (let i = 0; i < 10; i++) {
    await new Promise(r => setTimeout(r, 2000))
    const statusRes = await fetch(`${IG_GRAPH}/${creationId}?fields=status_code&access_token=${params.pageToken}`)
    if (statusRes.ok) {
      const { status_code } = await statusRes.json()
      if (status_code === 'FINISHED') break
      if (status_code === 'ERROR') throw new Error('Instagram media processing failed')
    }
  }

  // 3. Publier le container
  const publishRes = await fetch(`${IG_GRAPH}/${params.igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: params.pageToken }),
  })
  if (!publishRes.ok) {
    const e = await publishRes.json().catch(() => ({}))
    throw new Error(`Instagram publish failed: ${e?.error?.message || publishRes.status}`)
  }
  const { id } = await publishRes.json()
  return id
}

/** Récupère les stats d'une Page Facebook (fans, posts) */
export async function getFacebookPageStats(pageId: string, pageToken: string): Promise<{ followers: number; posts: number }> {
  const res = await fetch(`${GRAPH}/${pageId}?fields=fan_count,published_posts.limit(1).summary(true)&access_token=${pageToken}`)
  if (!res.ok) return { followers: 0, posts: 0 }
  const data = await res.json()
  return {
    followers: data.fan_count || 0,
    posts: data.published_posts?.summary?.total_count || 0,
  }
}

/** Récupère les stats d'un compte Instagram Business */
export async function getInstagramStats(igUserId: string, token: string): Promise<{ followers: number; posts: number }> {
  const res = await fetch(`${GRAPH}/${igUserId}?fields=followers_count,media_count&access_token=${token}`)
  if (!res.ok) return { followers: 0, posts: 0 }
  const data = await res.json()
  return {
    followers: data.followers_count || 0,
    posts: data.media_count || 0,
  }
}

export interface MetaComment {
  id: string
  message: string
  from?: { id: string; name: string }
  created_time: string
  replies?: MetaComment[]
}

/** Récupère les commentaires d'un post Facebook */
export async function getFacebookPostComments(fbPostId: string, pageToken: string): Promise<MetaComment[]> {
  const res = await fetch(
    `${GRAPH}/${fbPostId}/comments?fields=id,message,from,created_time&order=chronological&access_token=${pageToken}`
  )
  if (!res.ok) return []
  const data = await res.json()
  return (data.data || []) as MetaComment[]
}

/** Répond à un commentaire Facebook (Page token requis) */
export async function replyToFacebookComment(commentId: string, message: string, pageToken: string): Promise<string> {
  const res = await fetch(`${GRAPH}/${commentId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: pageToken }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.error?.message || 'Réponse commentaire échouée')
  }
  const data = await res.json()
  return data.id
}

/** Récupère les commentaires d'un média Instagram */
export async function getInstagramComments(mediaId: string, token: string): Promise<MetaComment[]> {
  const IG_GRAPH = 'https://graph.instagram.com/v19.0'
  const res = await fetch(`${IG_GRAPH}/${mediaId}/comments?fields=id,text,username,timestamp&access_token=${token}`)
  if (!res.ok) return []
  const data = await res.json()
  return (data.data || []).map((c: any) => ({
    id: c.id,
    message: c.text,
    from: { id: '', name: c.username || 'Utilisateur' },
    created_time: c.timestamp,
  })) as MetaComment[]
}

/** Répond à un commentaire Instagram */
export async function replyToInstagramComment(commentId: string, message: string, token: string): Promise<string> {
  const IG_GRAPH = 'https://graph.instagram.com/v19.0'
  const res = await fetch(`${IG_GRAPH}/${commentId}/replies`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, access_token: token }),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(e?.error?.message || 'Réponse Instagram échouée')
  }
  const data = await res.json()
  return data.id
}

/** Publie un post sur une Page Facebook */
export async function publishFacebookPost(params: {
  pageId: string
  pageToken: string
  message: string
  link?: string
  imageUrl?: string
}): Promise<string> {
  const body: Record<string, string> = {
    message: params.message,
    access_token: params.pageToken,
  }
  if (params.link) body.link = params.link
  if (params.imageUrl) body.url = params.imageUrl

  const endpoint = params.imageUrl ? `${GRAPH}/${params.pageId}/photos` : `${GRAPH}/${params.pageId}/feed`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) {
    const e = await res.json().catch(() => ({}))
    throw new Error(`Facebook publish failed: ${e?.error?.message || res.status}`)
  }
  const data = await res.json()
  return data.id || data.post_id
}
