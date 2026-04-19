import type { Platform } from '@/types'

const ZERNIO_BASE = 'https://zernio.com/api/v1'
const API_KEY = process.env.ZERNIO_API_KEY!
const TIMEOUT_MS = 20000

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ZernioPostResult {
  id: string
  postIds: Partial<Record<Platform, string>>
  errors?: { platform: Platform; message: string }[]
  status: 'success' | 'error' | 'partial'
}

// ─── Requête de base avec timeout ─────────────────────────────────────────────

async function zernioRequest(path: string, options: RequestInit = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${ZERNIO_BASE}${path}`, {
      ...options,
      signal: controller.signal,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    clearTimeout(timer)

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }))
      throw new Error(err.message || `Zernio error ${res.status}`)
    }

    return res.json()
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Zernio timeout — service indisponible, réessayez dans quelques instants')
    }
    throw err
  }
}

// ─── Profil ───────────────────────────────────────────────────────────────────

/** Crée un profil Zernio pour un utilisateur */
export async function createProfile(userId: string, name: string): Promise<string> {
  const data = await zernioRequest('/profiles', {
    method: 'POST',
    body: JSON.stringify({ name, description: `User ${userId}` }),
  })
  return data.profile._id as string
}

/** Retourne l'URL OAuth Zernio pour connecter un réseau social */
export async function getConnectUrl(profileId: string, platform: string, redirectUrl: string): Promise<string> {
  const params = new URLSearchParams({ profileId, redirect_url: redirectUrl })
  const data = await zernioRequest(`/connect/${platform}?${params}`)
  console.log('[zernio] getConnectUrl response:', JSON.stringify(data))
  const url = data.url || data.connectUrl || data.authUrl || data.link || data.redirectUrl || data.oauth_url
  if (!url) throw new Error(`Zernio: champ URL introuvable dans la réponse: ${JSON.stringify(data)}`)
  return url as string
}

/** Liste les comptes connectés d'un profil Zernio */
export async function listAccounts(profileId: string): Promise<Array<{ _id: string; platform: string }>> {
  const data = await zernioRequest(`/accounts?profileId=${encodeURIComponent(profileId)}`)
  return (data.accounts || []) as Array<{ _id: string; platform: string }>
}

// ─── Publication ──────────────────────────────────────────────────────────────

/** Publie un post via Zernio avec gestion des résultats par plateforme */
export async function publishPost(params: {
  platforms: { platform: Platform; accountId: string }[]
  content: string
  mediaUrls?: string[]
  scheduleDate?: string
  contentVariants?: Partial<Record<Platform, string>>
}): Promise<ZernioPostResult> {
  if (!params.platforms.length) {
    throw new Error('Aucun compte Zernio configuré pour ces plateformes.')
  }

  const body: Record<string, unknown> = {
    content: params.content,
    platforms: params.platforms,
    publishNow: !params.scheduleDate, // publication immédiate si pas de date programmée
  }

  // Variantes par plateforme
  if (params.contentVariants) {
    const overrides: Record<string, string> = {}
    for (const { platform } of params.platforms) {
      if (params.contentVariants[platform]) {
        overrides[platform] = params.contentVariants[platform]!
      }
    }
    if (Object.keys(overrides).length > 0) {
      body.contentVariants = overrides
    }
  }

  // mediaItems (format Zernio) — détecte video vs image par extension
  if (params.mediaUrls?.length) {
    body.mediaItems = params.mediaUrls.map(url => {
      const isVideo = /\.(mp4|mov|webm|avi|mkv)$/i.test(url)
      return { type: isVideo ? 'video' : 'image', url }
    })
  }

  // TikTok settings au niveau racine (obligatoire pour Direct Post)
  if (params.platforms.some(p => p.platform === 'tiktok')) {
    body.tiktokSettings = {
      privacy_level: 'PUBLIC_TO_EVERYONE',
      allow_comment: true,
      allow_duet: true,
      allow_stitch: true,
      content_preview_confirmed: true,
      express_consent_given: true,
    }
  }

  if (params.scheduleDate) {
    body.scheduledFor = params.scheduleDate
    body.timezone = 'UTC'
  }

  const raw = await zernioRequest('/posts', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  // Normaliser la réponse Zernio
  console.log('[zernio/publish] raw response:', JSON.stringify(raw))

  const postIds: Partial<Record<Platform, string>> = {}
  const errors: { platform: Platform; message: string }[] = []

  const zernioPostId: string = raw.post?._id || raw._id || ''
  const zernioStatus: string = raw.post?.status || raw.status || ''

  // Zernio peut répondre de deux façons :
  // 1. Publication synchrone → post.postIds contient les IDs par plateforme
  // 2. Publication asynchrone (draft/pending) → on stocke l'ID Zernio comme référence
  const rawPostIds = raw.post?.postIds || raw.post?.platformPostIds || raw.postIds || raw.platformPostIds || {}
  for (const [platform, value] of Object.entries(rawPostIds)) {
    if (value && typeof value === 'string') {
      postIds[platform as Platform] = value
    }
  }

  // Si Zernio a mis le post en file d'attente (draft/pending), utiliser l'ID Zernio
  if (Object.keys(postIds).length === 0 && zernioPostId && ['draft', 'pending', 'queued', 'scheduled'].includes(zernioStatus)) {
    for (const { platform } of params.platforms) {
      postIds[platform] = `zernio:${zernioPostId}`
    }
  }

  // Erreurs par plateforme
  const rawErrors = raw.post?.errors || raw.post?.platformErrors || raw.errors || raw.platformErrors || []
  for (const e of rawErrors) {
    errors.push({ platform: e.platform as Platform, message: e.message || e.error || 'Échec inconnu' })
  }

  const successCount = Object.keys(postIds).length
  const status: ZernioPostResult['status'] =
    successCount === 0 ? 'error'
    : errors.length > 0 ? 'partial'
    : 'success'

  if (status === 'error') {
    const errMsg = errors.length
      ? errors.map(e => `${e.platform}: ${e.message}`).join(', ')
      : 'Zernio n\'a pas confirmé la publication'
    throw new Error(`Publication Zernio échouée. ${errMsg}`)
  }

  return { id: zernioPostId, postIds, errors, status }
}

// ─── Suppression ──────────────────────────────────────────────────────────────

/** Supprime un post Zernio */
export async function deletePost(zernioPostId: string) {
  return zernioRequest(`/posts/${zernioPostId}`, { method: 'DELETE' })
}
