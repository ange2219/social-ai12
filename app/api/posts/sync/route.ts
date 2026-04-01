import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { decryptToken } from '@/lib/utils'

export const runtime = 'nodejs'

export async function POST() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Récupère tous les posts publiés avec des IDs de publication
  const { data: posts } = await admin
    .from('posts')
    .select('id, meta_post_ids, platforms')
    .eq('user_id', user.id)
    .eq('status', 'published')
    .not('meta_post_ids', 'eq', '{}')

  if (!posts?.length) return NextResponse.json({ updated: 0 })

  // Récupère les tokens
  const { data: accounts } = await admin
    .from('social_accounts')
    .select('platform, access_token')
    .eq('user_id', user.id)
    .eq('is_active', true)

  const tokenByPlatform: Record<string, string> = {}
  for (const acc of accounts || []) {
    tokenByPlatform[acc.platform] = decryptToken(acc.access_token)
  }

  const GRAPH = 'https://graph.facebook.com/v19.0'
  const IG_GRAPH = 'https://graph.instagram.com/v19.0'

  let updated = 0

  for (const post of posts) {
    const metaPostIds = post.meta_post_ids as Record<string, string>
    let stillExists = true

    for (const [platform, postId] of Object.entries(metaPostIds)) {
      const token = tokenByPlatform[platform]
      if (!token || !postId) continue

      try {
        let url = ''
        if (platform === 'facebook') url = `${GRAPH}/${postId}?fields=id&access_token=${token}`
        else if (platform === 'instagram') url = `${IG_GRAPH}/${postId}?fields=id&access_token=${token}`
        else continue

        const res = await fetch(url)
        if (res.status === 404 || res.status === 400) {
          stillExists = false
          break
        }
      } catch { /* ignore */ }
    }

    if (!stillExists) {
      await admin.from('posts').update({ status: 'deleted' }).eq('id', post.id)
      updated++
    }
  }

  return NextResponse.json({ updated })
}
