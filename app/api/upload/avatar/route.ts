import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const AVATAR_MAX_SIZE = 5 * 1024 * 1024 // 5 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Format non supporté. Utilisez JPEG, PNG, WebP ou GIF.' }, { status: 400 })
  }

  if (file.size > AVATAR_MAX_SIZE) {
    return NextResponse.json({ error: 'Fichier trop volumineux. Maximum 5 MB.' }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())

  // Vérification magic bytes pour éviter le spoofing du Content-Type
  const magic = buffer.subarray(0, 4)
  const isJpeg = magic[0] === 0xFF && magic[1] === 0xD8
  const isPng  = magic[0] === 0x89 && magic[1] === 0x50 && magic[2] === 0x4E && magic[3] === 0x47
  const isWebp = buffer.subarray(0, 12).toString('ascii', 8, 12) === 'WEBP'
  const isGif  = magic[0] === 0x47 && magic[1] === 0x49 && magic[2] === 0x46
  if (!isJpeg && !isPng && !isWebp && !isGif) {
    return NextResponse.json({ error: 'Contenu du fichier invalide.' }, { status: 400 })
  }

  const ext = ALLOWED_EXTENSIONS[file.type] || 'jpg'
  const path = `${user.id}/avatar.${ext}`

  const admin = createAdminClient()

  const { error: uploadError } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) {
    // Si le bucket n'existe pas, le créer puis réessayer
    if (uploadError.message.toLowerCase().includes('bucket') || uploadError.message.includes('not found')) {
      await admin.storage.createBucket('avatars', { public: true }).catch(() => {})
      const { error: retry } = await admin.storage.from('avatars').upload(path, buffer, { contentType: file.type, upsert: true })
      if (retry) return NextResponse.json({ error: `Upload échoué : ${retry.message}` }, { status: 500 })
    } else {
      return NextResponse.json({ error: `Upload échoué : ${uploadError.message}` }, { status: 500 })
    }
  }

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
  const urlWithCache = `${publicUrl}?t=${Date.now()}`

  await admin.from('users').update({ avatar_url: urlWithCache }).eq('id', user.id)

  return NextResponse.json({ url: urlWithCache })
}
