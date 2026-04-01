import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getInstagramOAuthUrl } from '@/lib/instagram'
import { randomBytes } from 'crypto'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const state = randomBytes(16).toString('hex')
  const oauthUrl = getInstagramOAuthUrl(state)
  console.log('[Instagram start] OAuth URL:', oauthUrl)
  const response = NextResponse.redirect(oauthUrl)
  response.cookies.set('instagram_oauth_state', state, { httpOnly: true, maxAge: 600, path: '/' })
  return response
}
