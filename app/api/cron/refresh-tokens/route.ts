import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { refreshInstagramLongLivedToken } from '@/lib/instagram'
import { refreshFacebookLongLivedToken } from '@/lib/meta'
import { encryptToken, decryptToken } from '@/lib/utils'
import { timingSafeEqual } from 'crypto'

export const runtime = 'nodejs'
export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET!

function verifyCronSecret(secret: string): boolean {
  try {
    return timingSafeEqual(Buffer.from(secret), Buffer.from(CRON_SECRET))
  } catch { return false }
}

// Seuil : rafraîchir les tokens qui expirent dans moins de 30 jours
const REFRESH_THRESHOLD_DAYS = 30

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const secret = authHeader?.replace('Bearer ', '') || ''
  if (!verifyCronSecret(secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const thresholdDate = new Date()
  thresholdDate.setDate(thresholdDate.getDate() + REFRESH_THRESHOLD_DAYS)

  // Récupère les comptes directs (meta_direct) dont le token expire bientôt
  // ou dont on ne connaît pas encore la date d'expiration (token_expires_at IS NULL)
  const { data: accounts, error } = await admin
    .from('social_accounts')
    .select('id, user_id, platform, access_token, token_expires_at')
    .eq('connected_via', 'meta_direct')
    .eq('is_active', true)
    .or(`token_expires_at.is.null,token_expires_at.lte.${thresholdDate.toISOString()}`)

  if (error) {
    console.error('[cron/refresh-tokens] Lecture comptes échouée:', error.message)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!accounts?.length) {
    return NextResponse.json({ refreshed: 0, skipped: 0 })
  }

  let refreshed = 0
  let failed = 0

  for (const account of accounts) {
    try {
      const currentToken = decryptToken(account.access_token)

      let newToken: string
      let expiresAt: Date

      if (account.platform === 'instagram') {
        const result = await refreshInstagramLongLivedToken(currentToken)
        newToken = result.access_token
        expiresAt = result.expires_at
      } else if (account.platform === 'facebook') {
        const result = await refreshFacebookLongLivedToken(currentToken)
        newToken = result.access_token
        expiresAt = result.expires_at
      } else {
        continue // Autres plateformes non gérées ici
      }

      await admin
        .from('social_accounts')
        .update({
          access_token: encryptToken(newToken),
          token_expires_at: expiresAt.toISOString(),
        })
        .eq('id', account.id)

      refreshed++
      console.log(`[cron/refresh-tokens] Token ${account.platform} rafraîchi pour user ${account.user_id}, expire le ${expiresAt.toISOString()}`)
    } catch (err) {
      failed++
      console.error(`[cron/refresh-tokens] Échec refresh ${account.platform} pour user ${account.user_id}:`, err instanceof Error ? err.message : err)
    }
  }

  console.log(`[cron/refresh-tokens] ${refreshed} rafraîchis, ${failed} échoués`)
  return NextResponse.json({ refreshed, failed })
}
