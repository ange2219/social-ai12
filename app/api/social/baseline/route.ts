import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { getFacebookPageStats, getInstagramStats } from '@/lib/meta'
import { decryptToken } from '@/lib/utils'

/** GET — retourne les baselines stockées pour l'utilisateur */
export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('social_baselines')
    .select('*')
    .eq('user_id', user.id)

  if (error) return NextResponse.json({ baselines: [] })
  return NextResponse.json({ baselines: data || [] })
}

/** POST — fetch les stats Meta et upsert dans social_baselines
 *  body: { platform: 'facebook' | 'instagram', mode: 'baseline' | 'refresh' }
 *  Si mode = 'baseline' : initialise baseline_followers = current_followers
 *  Si mode = 'refresh'  : met à jour seulement current_followers
 */
export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { platform, mode = 'refresh' } = await req.json()
  if (!platform) return NextResponse.json({ error: 'platform requis' }, { status: 400 })

  const admin = createAdminClient()

  const { data: account } = await admin
    .from('social_accounts')
    .select('*')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .eq('is_active', true)
    .single()

  if (!account) return NextResponse.json({ error: 'Compte non connecté' }, { status: 400 })

  const token = decryptToken(account.access_token)

  let stats = { followers: 0, posts: 0 }
  try {
    if (platform === 'facebook') {
      stats = await getFacebookPageStats(account.platform_user_id, token)
    } else if (platform === 'instagram') {
      stats = await getInstagramStats(account.platform_user_id, token)
    }
  } catch {
    return NextResponse.json({ error: 'Erreur API Meta' }, { status: 500 })
  }

  // Récupère baseline existante
  const { data: existing } = await admin
    .from('social_baselines')
    .select('baseline_followers, baseline_at')
    .eq('user_id', user.id)
    .eq('platform', platform)
    .single()

  const upsertData: Record<string, unknown> = {
    user_id: user.id,
    platform,
    current_followers: stats.followers,
    posts_count: stats.posts,
    refreshed_at: new Date().toISOString(),
  }

  // Première connexion ou mode baseline explicite : initialise le baseline
  if (!existing || mode === 'baseline') {
    upsertData.baseline_followers = stats.followers
    upsertData.baseline_at = new Date().toISOString()
  }

  const { error } = await admin
    .from('social_baselines')
    .upsert(upsertData, { onConflict: 'user_id,platform' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true, followers: stats.followers })
}
