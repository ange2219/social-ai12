import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

const AVATAR_MAX_SIZE = 5 * 1024 * 1024
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
const ALLOWED_EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif',
}

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError) { console.error('[avatar] auth error:', authError.message); return NextResponse.json({ error: 'Auth error' }, { status: 401 }) }
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    let formData: FormData
    try {
      formData = await req.formData()
    } catch (e) {
      console.error('[avatar] formData parse error:', e)
      return NextResponse.json({ error: 'Impossible de lire le fichier' }, { status: 400 })
    }

    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json({ error: `Format non supporté: ${file.type}` }, { status: 400 })
    }
    if (file.size > AVATAR_MAX_SIZE) {
      return NextResponse.json({ error: 'Fichier trop volumineux (max 5MB)' }, { status: 400 })
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const ext = ALLOWED_EXTENSIONS[file.type] || 'jpg'
    const path = `${user.id}/avatar.${ext}`

    console.log(`[avatar] uploading user=${user.id} type=${file.type} size=${file.size} path=${path}`)

    const admin = createAdminClient()

    const { error: uploadError } = await admin.storage
      .from('avatars')
      .upload(path, buffer, { contentType: file.type, upsert: true })

    if (uploadError) {
      console.error('[avatar] storage upload error:', uploadError.message)
      return NextResponse.json({ error: `Upload échoué : ${uploadError.message}` }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)
    const urlWithCache = `${publicUrl}?t=${Date.now()}`

    const { error: dbError } = await admin.from('users').update({ avatar_url: urlWithCache }).eq('id', user.id)
    if (dbError) {
      console.error('[avatar] db update error:', dbError.message)
      return NextResponse.json({ error: `Sauvegarde profil échouée : ${dbError.message}` }, { status: 500 })
    }

    console.log(`[avatar] success url=${urlWithCache}`)
    return NextResponse.json({ url: urlWithCache })

  } catch (err) {
    console.error('[avatar] unhandled error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, { status: 500 })
  }
}
