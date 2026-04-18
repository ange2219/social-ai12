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

  if (!process.env.ZERNIO_API_KEY) {
    console.error('[social/start] ZERNIO_API_KEY non configurée')
    return NextResponse.redirect(new URL('/profile?error=ZERNIO_API_KEY+manquante+dans+Vercel', req.url))
  }

  try {
    let profileId = (profile as any)?.zernio_profile_id as string | null | undefined

    if (!profileId) {
      console.log('[social/start] Création profil Zernio pour', user.id)
      profileId = await createProfile(user.id, (profile as any)?.full_name || (profile as any)?.email || user.id)
      console.log('[social/start] Profil Zernio créé:', profileId)
      await admin.from('users').update({ zernio_profile_id: profileId } as any).eq('id', user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL!
    const redirectUrl = `${appUrl}/api/social/callback?platform=${platform}&userId=${user.id}`

    console.log('[social/start] Récupération URL OAuth Zernio pour', platform)
    const connectUrl = await getConnectUrl(profileId, platform, redirectUrl)
    console.log('[social/start] Redirection vers:', connectUrl.slice(0, 80))

    return NextResponse.redirect(connectUrl)
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur de connexion'
    console.error('[social/start] Erreur:', msg)
    return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(msg)}`, req.url))
  }
}
