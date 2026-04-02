import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'Fichier requis' }, { status: 400 })

  if (!file.type.startsWith('image/')) {
    return NextResponse.json({ error: 'Fichier image requis' }, { status: 400 })
  }

  const ext = file.name.split('.').pop() || 'jpg'
  const path = `${user.id}/avatar.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const admin = createAdminClient()

  // Créer le bucket s'il n'existe pas encore
  await admin.storage.createBucket('avatars', { public: true }).catch(() => {})

  const { error } = await admin.storage
    .from('avatars')
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (error) return NextResponse.json({ error: `Upload échoué : ${error.message}` }, { status: 500 })

  const { data: { publicUrl } } = admin.storage.from('avatars').getPublicUrl(path)

  // Ajouter un timestamp pour invalider le cache
  const urlWithCache = `${publicUrl}?t=${Date.now()}`

  // Sauvegarder dans le profil utilisateur
  await admin.from('users').update({ avatar_url: urlWithCache }).eq('id', user.id)

  return NextResponse.json({ url: urlWithCache })
}
