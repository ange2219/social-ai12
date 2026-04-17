import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createProfile, getConnectUrl } from '@/lib/ayrshare'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('plan, ayrshare_profile_key, full_name, email')
    .eq('id', user.id)
    .single()

  if (!profile) {
    return NextResponse.json({ error: 'Profil introuvable' }, { status: 404 })
  }

  try {
    let profileKey = profile.ayrshare_profile_key

    // Crée le profil Ayrshare si inexistant
    if (!profileKey) {
      profileKey = await createProfile(user.id, profile.full_name || profile.email)
      await admin
        .from('users')
        .update({ ayrshare_profile_key: profileKey })
        .eq('id', user.id)
    }

    const connectUrl = await getConnectUrl(profileKey)
    return NextResponse.json({ url: connectUrl })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Ayrshare error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
