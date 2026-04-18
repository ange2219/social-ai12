import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createProfile, getConnectUrl } from '@/lib/zernio'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { platform } = await req.json().catch(() => ({}))
  if (!platform) return NextResponse.json({ error: 'Plateforme requise' }, { status: 400 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('plan, zernio_profile_id, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile) return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })

  try {
    let profileId = profile.zernio_profile_id

    // Crée le profil Zernio si inexistant
    if (!profileId) {
      profileId = await createProfile(user.id, profile.full_name || profile.email || user.id)
      await admin
        .from('users')
        .update({ zernio_profile_id: profileId })
        .eq('id', user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const redirectUrl = `${appUrl}/api/social/callback?platform=${platform}&userId=${user.id}`

    const connectUrl = await getConnectUrl(profileId, platform, redirectUrl)
    return NextResponse.json({ url: connectUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Zernio error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
