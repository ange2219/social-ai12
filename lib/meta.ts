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
  return data.access_token
}

/** Récupère les Pages Facebook de l'utilisateur */
export async function getUserPages(accessToken: string) {
  // Tentative 1 : endpoint classique
  const res = await fetch(`${GRAPH}/me/accounts?access_token=${accessToken}&fields=id,name,access_token`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(`Récupération Pages échouée : ${err?.error?.message || res.status}`)
  }
  const data = await res.json()
  const pages = data.data as Array<{ id: string; name: string; access_token: string }>
  if (pages.length > 0) return pages

  // Tentative 2 : via businesses (Facebook Login for Business)
  const bizRes = await fetch(`${GRAPH}/me/businesses?fields=owned_pages{id,name,access_token}&access_token=${accessToken}`)
  if (bizRes.ok) {
    const bizData = await bizRes.json()
    const bizPages: Array<{ id: string; name: string; access_token: string }> = []
    for (const biz of bizData.data || []) {
      for (const p of biz.owned_pages?.data || []) {
        bizPages.push(p)
      }
    }
    if (bizPages.length > 0) return bizPages
  }

  // Tentative 3 : /me/accounts avec champ supplémentaire
  const res3 = await fetch(`${GRAPH}/me/accounts?access_token=${accessToken}&fields=id,name,access_token&limit=100`)
  if (res3.ok) {
    const d3 = await res3.json()
    if (d3.data?.length > 0) return d3.data
  }

  return []
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

/** Publie un post sur Instagram */
export async function publishInstagramPost(params: {
  igUserId: string
  pageToken: string
  caption: string
  imageUrl?: string
}): Promise<string> {
  // 1. Créer le media container
  const containerBody: Record<string, string> = {
    caption: params.caption,
    access_token: params.pageToken,
  }
  if (params.imageUrl) {
    containerBody.image_url = params.imageUrl
    containerBody.media_type = 'IMAGE'
  } else {
    // Post texte seul non supporté sur Instagram — utiliser une image requise
    throw new Error('Instagram nécessite une image')
  }

  const containerRes = await fetch(`${GRAPH}/${params.igUserId}/media`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(containerBody),
  })
  if (!containerRes.ok) throw new Error('Instagram media container failed')
  const { id: creationId } = await containerRes.json()

  // 2. Publier le container
  const publishRes = await fetch(`${GRAPH}/${params.igUserId}/media_publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creation_id: creationId, access_token: params.pageToken }),
  })
  if (!publishRes.ok) throw new Error('Instagram publish failed')
  const { id } = await publishRes.json()
  return id
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
  if (!res.ok) throw new Error('Facebook publish failed')
  const data = await res.json()
  return data.id || data.post_id
}
