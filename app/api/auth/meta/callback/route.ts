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

async function saveAccount(admin: ReturnType<typeof createAdminClient>, data: {
  user_id: string
  platform: string
  platform_user_id: string
  platform_username: string
  access_token: string
  connected_via: string
}) {
  // Cherche si un compte existe déjà
  const { data: existing } = await admin
    .from('social_accounts')
    .select('id')
    .eq('user_id', data.user_id)
    .eq('platform', data.platform)
    .single()

  if (existing?.id) {
    // Mise à jour
    await admin.from('social_accounts').update({
      platform_user_id: data.platform_user_id,
      platform_username: data.platform_username,
      access_token: data.access_token,
      connected_via: data.connected_via,
      is_active: true,
      updated_at: new Date().toISOString(),
    }).eq('id', existing.id)
  } else {
    // Insertion
    await admin.from('social_accounts').insert({
      ...data,
      is_active: true,
    })
  }
}

export async function GET(req: NextRequest) {
  const url = req.nextUrl
  const code = url.searchParams.get('code')
  const state = url.searchParams.get('state')
  const storedState = req.cookies.get('meta_oauth_state')?.value

  if (!code || state !== storedState) {
    return NextResponse.redirect(new URL('/profile?error=oauth_invalid', req.url))
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  try {
    const tokenData = await exchangeCodeForToken(code)
    const longToken = await getLongLivedToken(tokenData.access_token)

    const pages = await getUserPages(longToken)
    if (!pages.length) {
      return NextResponse.redirect(new URL('/profile?error=no_facebook_page', req.url))
    }

    const admin = createAdminClient()
    const page = pages[0]

    // Sauvegarde Facebook
    await saveAccount(admin, {
      user_id: user.id,
      platform: 'facebook',
      platform_user_id: page.id,
      platform_username: page.name,
      access_token: encryptToken(page.access_token),
      connected_via: 'meta_direct',
    })

    // Sauvegarde Instagram si disponible
    const igAccount = await getInstagramAccount(page.id, page.access_token)
    if (igAccount) {
      const igProfile = await getInstagramProfile(igAccount.id, page.access_token)
      await saveAccount(admin, {
        user_id: user.id,
        platform: 'instagram',
        platform_user_id: igAccount.id,
        platform_username: igProfile.username,
        access_token: encryptToken(page.access_token),
        connected_via: 'meta_direct',
      })
    }

    return NextResponse.redirect(new URL('/profile?success=meta_connected', req.url))
  } catch (err) {
    console.error('Meta OAuth error:', err)
    const msg = err instanceof Error ? err.message : 'unknown'
    return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(msg)}`, req.url))
  }
}
