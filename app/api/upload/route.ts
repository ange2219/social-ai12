import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime']
const MAX_SIZE_BYTES = 50 * 1024 * 1024 // 50 MB

export async function POST(req: NextRequest) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Type de fichier non autorisé. Types acceptés : ${ALLOWED_TYPES.join(', ')}` },
        { status: 400 }
      )
    }

    if (file.size > MAX_SIZE_BYTES) {
      return NextResponse.json({ error: 'Fichier trop lourd (max 50 MB)' }, { status: 400 })
    }

    const ext = file.type.split('/')[1].replace('quicktime', 'mov')
    const path = `${user.id}/${Date.now()}.${ext}`
    const buffer = Buffer.from(await file.arrayBuffer())

    // Vérification magic number pour les images (premiers bytes)
    if (file.type.startsWith('image/')) {
      const magic = buffer.subarray(0, 4)
      const isJpeg = magic[0] === 0xFF && magic[1] === 0xD8
      const isPng = magic[0] === 0x89 && magic[1] === 0x50
      const isGif = magic[0] === 0x47 && magic[1] === 0x49
      const isWebp = magic[0] === 0x52 && magic[2] === 0x57 // RIFF...WEBP
      if (!isJpeg && !isPng && !isGif && !isWebp) {
        return NextResponse.json({ error: 'Contenu du fichier invalide' }, { status: 400 })
      }
    }

    const admin = createAdminClient()
    const { error } = await admin.storage
      .from('media')
      .upload(path, buffer, { contentType: file.type, upsert: false })

    if (error) {
      console.error('[upload] Supabase storage error:', JSON.stringify(error))
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: { publicUrl } } = admin.storage.from('media').getPublicUrl(path)
    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('[upload] Unhandled error:', err)
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Erreur inconnue' }, { status: 500 })
  }
}
