import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { createProfile, getConnectUrl } from '@/lib/zernio'

/**
 * GET /api/social/start?platform=twitter
 * Proxy de connexion OAuth — cache Zernio derrière notre domaine.
 * L'utilisateur voit uniquement notre URL, puis est redirigé vers
 * l'OAuth de la plateforme (Twitter, LinkedIn, TikTok…).
 */
export async function GET(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  const platform = req.nextUrl.searchParams.get('platform')
  if (!platform) {
    return NextResponse.redirect(new URL('/profile?error=missing_platform', req.url))
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('users')
    .select('zernio_profile_id, full_name, email')
    .eq('id', user.id)
    .single()

  try {
    let profileId = profile?.zernio_profile_id

    if (!profileId) {
      profileId = await createProfile(user.id, profile?.full_name || profile?.email || user.id)
      await admin.from('users').update({ zernio_profile_id: profileId }).eq('id', user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const redirectUrl = `${appUrl}/api/social/callback?platform=${platform}&userId=${user.id}`

    // Récupère l'URL OAuth depuis Zernio (côté serveur — invisible pour l'utilisateur)
    const connectUrl = await getConnectUrl(profileId, platform, redirectUrl)

    // Redirige directement vers l'OAuth de la plateforme
    return NextResponse.redirect(connectUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur de connexion'
    return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(msg)}`, req.url))
  }
}
