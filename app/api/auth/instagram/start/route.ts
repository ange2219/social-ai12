import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInstagramOAuthUrl } from '@/lib/instagram'
import { randomBytes } from 'crypto'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const nonce = randomBytes(16).toString('hex')
  const state = `${user.id}.${nonce}`
  const oauthUrl = getInstagramOAuthUrl(state)
  const response = NextResponse.redirect(oauthUrl)
  response.cookies.set('instagram_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' })
  return response
}
