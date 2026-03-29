import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import {
  exchangeCodeForToken,
  getLongLivedToken,
  getUserPages,
  getInstagramAccount,
  getInstagramProfile,
} from '@/lib/meta'
import { encryptToken } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = req.cookies.get('meta_oauth_state')?.value

  if (!code || state !== storedState) {
    return NextResponse.redirect(new URL('/settings?error=oauth_invalid', req.url))
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  try {
    // Échange du code et obtention du long-lived token
    const tokenData = await exchangeCodeForToken(code)
    const longToken = await getLongLivedToken(tokenData.access_token)

    // Récupération des pages Facebook
    const pages = await getUserPages(longToken)
    if (!pages.length) {
      return NextResponse.redirect(new URL('/settings?error=no_pages', req.url))
    }

    const admin = createAdminClient()
    const page = pages[0]

    // Connexion Facebook
    await admin.from('social_accounts').upsert({
      user_id: user.id,
      platform: 'facebook',
      platform_user_id: page.id,
      platform_username: page.name,
      access_token: encryptToken(page.access_token),
      connected_via: 'meta_direct',
      is_active: true,
    }, { onConflict: 'user_id,platform' })

    // Connexion Instagram si disponible
    const igAccount = await getInstagramAccount(page.id, page.access_token)
    if (igAccount) {
      const igProfile = await getInstagramProfile(igAccount.id, page.access_token)
      await admin.from('social_accounts').upsert({
        user_id: user.id,
        platform: 'instagram',
        platform_user_id: igAccount.id,
        platform_username: igProfile.username,
        access_token: encryptToken(page.access_token),
        connected_via: 'meta_direct',
        is_active: true,
      }, { onConflict: 'user_id,platform' })
    }

    return NextResponse.redirect(new URL('/profile?success=meta_connected', req.url))
  } catch (err) {
    console.error('Meta OAuth error:', err)
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(msg)}`, req.url))
  }
}
