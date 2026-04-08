import type { Platform } from '@/types'

const AYRSHARE_BASE = 'https://app.ayrshare.com/api'
const API_KEY = process.env.AYRSHARE_API_KEY!
const TIMEOUT_MS = 15000

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AyrsharePostResult {
  id: string
  postIds: Partial<Record<Platform, string>>
  errors?: { platform: Platform; message: string }[]
  status: 'success' | 'error' | 'partial'
}

// ─── Requête de base avec timeout ────────────────────────────────────────────

async function ayrshareRequest(path: string, options: RequestInit = {}) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${AYRSHARE_BASE}${path}`, {
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
      throw new Error(err.message || `Ayrshare error ${res.status}`)
    }

    return res.json()
  } catch (err) {
    clearTimeout(timer)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Ayrshare timeout — service indisponible, réessayez dans quelques instants')
    }
    throw err
  }
}

// ─── Profil ───────────────────────────────────────────────────────────────────

/** Crée un profil Ayrshare pour un utilisateur */
export async function createProfile(userId: string, title: string): Promise<string> {
  const data = await ayrshareRequest('/profiles/user', {
    method: 'POST',
    body: JSON.stringify({ title, internalRef: userId }),
  })
  return data.profileKey as string
}

/** Génère un lien de connexion JWT pour qu'un utilisateur connecte ses réseaux */
export async function getConnectUrl(profileKey: string): Promise<string> {
  const data = await ayrshareRequest(`/profiles/generateJWT?profileKey=${profileKey}`)
  return data.url as string
}

// ─── Publication ──────────────────────────────────────────────────────────────

/** Publie un post via Ayrshare avec gestion des résultats par plateforme */
export async function publishPost(params: {
  profileKey: string
  content: string
  platforms: Platform[]
  mediaUrls?: string[]
  scheduleDate?: string
  contentVariants?: Partial<Record<Platform, string>>
}): Promise<AyrsharePostResult> {
  // Guard : profileKey obligatoire
  if (!params.profileKey) {
    throw new Error('Compte Ayrshare non configuré. Contactez le support pour activer votre compte premium.')
  }

  const body: Record<string, unknown> = {
    post: params.content,
    platforms: params.platforms,
    profileKey: params.profileKey,
  }

  // Utiliser les variantes par plateforme si disponibles
  if (params.contentVariants) {
    const platformSpecificPosts: Record<string, string> = {}
    for (const platform of params.platforms) {
      if (params.contentVariants[platform]) {
        platformSpecificPosts[platform] = params.contentVariants[platform]!
      }
    }
    if (Object.keys(platformSpecificPosts).length > 0) {
      body.platformSpecificPosts = platformSpecificPosts
    }
  }

  if (params.mediaUrls?.length) body.mediaUrls = params.mediaUrls
  if (params.scheduleDate) body.scheduleDate = params.scheduleDate

  const raw = await ayrshareRequest('/post', {
    method: 'POST',
    body: JSON.stringify(body),
  })

  // Normaliser le résultat et détecter les échecs par plateforme
  const postIds: Partial<Record<Platform, string>> = {}
  const errors: { platform: Platform; message: string }[] = []

  if (raw.postIds && typeof raw.postIds === 'object') {
    for (const [platform, value] of Object.entries(raw.postIds)) {
      if (value && typeof value === 'string') {
        postIds[platform as Platform] = value
      }
    }
  }

  if (raw.errors && Array.isArray(raw.errors)) {
    for (const e of raw.errors) {
      errors.push({ platform: e.platform as Platform, message: e.message || 'Échec inconnu' })
    }
  }

  const successCount = Object.keys(postIds).length
  const status: AyrsharePostResult['status'] =
    successCount === 0 ? 'error'
    : errors.length > 0 ? 'partial'
    : 'success'

  if (status === 'error') {
    const errMsg = errors.map(e => `${e.platform}: ${e.message}`).join(', ')
    throw new Error(`Publication échouée sur toutes les plateformes. ${errMsg}`)
  }

  return { id: raw.id || '', postIds, errors, status }
}

// ─── Analytics ────────────────────────────────────────────────────────────────

/** Récupère les analytics d'un post Ayrshare */
export async function getPostAnalytics(ayrsharePostId: string, profileKey: string) {
  return ayrshareRequest(`/analytics/post?id=${ayrsharePostId}&profileKey=${profileKey}`)
}

// ─── Suppression ──────────────────────────────────────────────────────────────

/** Supprime un post Ayrshare programmé */
export async function deleteScheduledPost(ayrsharePostId: string, profileKey: string) {
  return ayrshareRequest('/post', {
    method: 'DELETE',
    body: JSON.stringify({ id: ayrsharePostId, profileKey }),
  })
}
