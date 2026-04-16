import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 60 // Vercel Pro max

const CRON_SECRET = process.env.CRON_SECRET!

function verifyCronSecret(secret: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(CRON_SECRET))
  } catch { return false }
}

export async function GET(req: NextRequest) {
  // Vercel Cron envoie le secret dans le header Authorization
  const authHeader = req.headers.get('authorization')
  const secret = authHeader?.replace('Bearer ', '') || ''

  if (!verifyCronSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()

  // Récupère tous les posts à publier (scheduled_at passé)
  const { data: duePosts, error } = await admin
    .from('posts')
    .select('id')
    .eq('status', 'scheduled')
    .lte('scheduled_at', new Date().toISOString())
    .limit(50) // traite 50 posts max par exécution

  if (error) {
    console.error('[cron/publish] Erreur lecture posts:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!duePosts?.length) {
    return NextResponse.json({ published: 0 })
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL!
  const results = await Promise.allSettled(
    duePosts.map(post =>
      fetch(`${appUrl}/api/posts/${post.id}/publish`, {
        method: 'POST',
        headers: { 'x-internal-secret': CRON_SECRET },
      })
    )
  )

  const succeeded = results.filter(r => r.status === 'fulfilled' && (r as PromiseFulfilledResult<Response>).value.ok).length
  const failed = results.length - succeeded

  console.log(`[cron/publish] ${succeeded} publiés, ${failed} échoués`)
  return NextResponse.json({ published: succeeded, failed })
}
