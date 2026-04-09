/**
 * Supabase Storage — upload et gestion des médias
 * Convertit les URLs temporaires (DALL-E, Imagen3 base64) en URLs permanentes
 */

import { createAdminClient } from '@/lib/supabase/server'

const BUCKET = 'post-media'
const IMAGE_EXPIRY_SECONDS = 60 * 60 * 24 * 365 // 1 an

/**
 * Upload une image depuis une URL externe vers Supabase Storage.
 * Utilisé pour DALL-E (URL temporaire ~1h).
 */
export async function uploadImageFromUrl(
  url: string,
  userId: string,
  filename?: string
): Promise<string> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Impossible de télécharger l'image : ${res.status}`)

  const buffer = await res.arrayBuffer()
  const contentType = res.headers.get('content-type') || 'image/png'
  const ext = contentType.includes('jpeg') ? 'jpg' : 'png'
  const name = filename || `${Date.now()}.${ext}`
  const path = `${userId}/generated/${name}`

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false })

  if (error) throw new Error(`Upload Storage échoué : ${error.message}`)

  return getPublicUrl(path)
}

/**
 * Upload une image depuis un base64 data URL vers Supabase Storage.
 * Utilisé pour Imagen 3 (retourne base64 inline).
 */
export async function uploadImageFromBase64(
  dataUrl: string,
  userId: string,
  filename?: string
): Promise<string> {
  const [header, base64] = dataUrl.split(',')
  if (!base64) throw new Error('Format base64 invalide')

  const contentType = header.match(/data:([^;]+)/)?.[1] || 'image/png'
  const ext = contentType.includes('jpeg') ? 'jpg' : 'png'
  const name = filename || `${Date.now()}.${ext}`
  const path = `${userId}/generated/${name}`

  const buffer = Buffer.from(base64, 'base64')

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType, upsert: false })

  if (error) throw new Error(`Upload Storage échoué : ${error.message}`)

  return getPublicUrl(path)
}

/**
 * Upload un fichier média (image utilisateur) pour un post.
 */
export async function uploadPostMedia(
  file: ArrayBuffer,
  contentType: string,
  userId: string,
  postId?: string
): Promise<string> {
  const ext = contentType.includes('jpeg') ? 'jpg'
    : contentType.includes('png') ? 'png'
    : contentType.includes('gif') ? 'gif'
    : contentType.includes('mp4') ? 'mp4'
    : 'bin'

  const folder = postId ? `${userId}/${postId}` : `${userId}/uploads`
  const path = `${folder}/${Date.now()}.${ext}`

  const admin = createAdminClient()
  const { error } = await admin.storage
    .from(BUCKET)
    .upload(path, file, { contentType, upsert: false })

  if (error) throw new Error(`Upload Storage échoué : ${error.message}`)

  return getPublicUrl(path)
}

/**
 * Retourne l'URL publique permanente d'un fichier Storage.
 */
function getPublicUrl(path: string): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  return `${supabaseUrl}/storage/v1/object/public/${BUCKET}/${path}`
}

/**
 * Supprime un fichier du Storage (ex: quand un post est supprimé).
 * Gère les deux buckets : post-media (images AI) et media (uploads utilisateur).
 */
export async function deleteStorageFile(url: string): Promise<void> {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const storageBase = `${supabaseUrl}/storage/v1/object/public/`
    if (!url.startsWith(storageBase)) return

    const rest = url.slice(storageBase.length)
    const slashIdx = rest.indexOf('/')
    if (slashIdx === -1) return

    const bucket = rest.slice(0, slashIdx)
    const path = rest.slice(slashIdx + 1).split('?')[0] // enlève les query params éventuels

    const admin = createAdminClient()
    await admin.storage.from(bucket).remove([path])
  } catch {
    // Non critique — on continue même si la suppression du fichier échoue
  }
}

/**
 * Supprime tous les fichiers médias associés à un post.
 */
export async function deletePostMediaFiles(mediaUrls: string[]): Promise<void> {
  await Promise.allSettled(mediaUrls.map(url => deleteStorageFile(url)))
}
