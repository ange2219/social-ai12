import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { publishPost as ayrsharePublish } from '@/lib/ayrshare'
import { publishInstagramPost, publishFacebookPost } from '@/lib/meta'
import { decryptToken } from '@/lib/utils'
import type { Platform } from '@/types'

export async function POST(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Récupère le post et le profil user
  const [postResult, userResult] = await Promise.all([
    admin.from('posts').select('*').eq('id', params.id).eq('user_id', user.id).single(),
    admin.from('users').select('plan, ayrshare_profile_key').eq('id', user.id).single(),
  ])

  const post = postResult.data
  const userProfile = userResult.data

  if (!post) return NextResponse.json({ error: 'Post not found' }, { status: 404 })
  if (post.status === 'published') return NextResponse.json({ error: 'Déjà publié' }, { status: 400 })

  try {
    if (userProfile?.plan === 'free') {
      // Publication via Meta Graph API directement
      const accounts = await admin
        .from('social_accounts')
        .select('*')
        .eq('user_id', user.id)
        .in('platform', post.platforms as Platform[])
        .eq('is_active', true)

      const metaPostIds: Record<string, string> = {}

      for (const account of accounts.data || []) {
        const token = decryptToken(account.access_token)

        if (account.platform === 'instagram') {
          const mediaUrl = post.media_urls?.[0]
          if (!mediaUrl) throw new Error('Veuillez ajouter une image pour Instagram.')
          const id = await publishInstagramPost({
            igUserId: account.platform_user_id,
            pageToken: token,
            caption: post.content,
            imageUrl: mediaUrl,
          })
          metaPostIds.instagram = id
        }

        if (account.platform === 'facebook') {
          const id = await publishFacebookPost({
            pageId: account.platform_user_id,
            pageToken: token,
            message: post.content,
            imageUrl: post.media_urls?.[0],
          })
          metaPostIds.facebook = id
        }
      }

      await admin.from('posts').update({
        status: 'published',
        published_at: new Date().toISOString(),
        meta_post_ids: metaPostIds,
      }).eq('id', post.id)

    } else {
      // Publication via Ayrshare
      const result = await ayrsharePublish({
        profileKey: userProfile!.ayrshare_profile_key!,
        content: post.content,
        platforms: post.platforms as Platform[],
        mediaUrls: post.media_urls,
      })

      await admin.from('posts').update({
        status: 'published',
        published_at: new Date().toISOString(),
        ayrshare_post_id: result.id,
        meta_post_ids: result.postIds || {},
      }).eq('id', post.id)
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Publish failed'
    await admin.from('posts').update({ status: 'failed', error_message: message }).eq('id', post.id)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
