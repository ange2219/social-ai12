import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()

  // Supprimer les données liées
  await admin.from('posts').delete().eq('user_id', user.id)
  await admin.from('social_accounts').delete().eq('user_id', user.id)
  await admin.from('brand_profiles').delete().eq('user_id', user.id)
  await admin.from('users').delete().eq('id', user.id)

  // Supprimer le compte auth
  const { error } = await admin.auth.admin.deleteUser(user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
