import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getMetaOAuthUrl } from '@/lib/meta'
import { randomBytes } from 'crypto'

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Encoder l'userId dans le state pour que le callback n'ait pas besoin de la session Supabase
  const nonce = randomBytes(16).toString('hex')
  const state = `${user.id}.${nonce}`

  const response = NextResponse.redirect(getMetaOAuthUrl(state))
  response.cookies.set('meta_oauth_state', state, { httpOnly: true, secure: true, sameSite: 'lax', maxAge: 600, path: '/' })
  return response
}
