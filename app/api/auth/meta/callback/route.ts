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
  // D'abord supprimer l'ancien enregistrement s'il existe
  await admin
    .from('social_accounts')
    .delete()
    .eq('user_id', data.user_id)
    .eq('platform', data.platform)

  // Insérer le nouveau
  const { error } = await admin.from('social_accounts').insert({
    user_id: data.user_id,
    platform: data.platform,
    platform_user_id: data.platform_user_id,
    platform_username: data.platform_username,
    access_token: data.access_token,
    connected_via: data.connected_via,
    is_active: true,
  })

  if (error) throw new Error(`Sauvegarde ${data.platform} échouée : ${error.message}`)
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
      return NextResponse.redirect(new URL('/profile?error=Aucune+Page+Facebook+trouvée.+Créez+une+Page+Facebook+d\'abord.', req.url))
    }

    const admin = createAdminClient()
    const page = pages[0]

    await saveAccount(admin, {
      user_id: user.id,
      platform: 'facebook',
      platform_user_id: page.id,
      platform_username: page.name,
      access_token: encryptToken(page.access_token),
      connected_via: 'meta_direct',
    })

    // Instagram si disponible
    let igConnected = false
    try {
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
        igConnected = true
      }
    } catch { /* Instagram optionnel */ }

    const successMsg = igConnected ? 'facebook_instagram' : 'facebook_only'
    return NextResponse.redirect(new URL(`/profile?success=${successMsg}&page=${encodeURIComponent(page.name)}`, req.url))
  } catch (err) {
    console.error('Meta OAuth error:', err)
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    return NextResponse.redirect(new URL(`/profile?error=${encodeURIComponent(msg)}`, req.url))
  }
}
