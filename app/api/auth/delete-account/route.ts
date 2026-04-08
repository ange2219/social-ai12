import { NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function DELETE() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const errors: string[] = []

  // Supprimer les données liées (erreurs loggées mais non bloquantes)
  const tables = [
    { name: 'posts', col: 'user_id' },
    { name: 'social_accounts', col: 'user_id' },
    { name: 'brand_profiles', col: 'user_id' },
    { name: 'users', col: 'id' },
  ]

  for (const { name, col } of tables) {
    const { error } = await admin.from(name).delete().eq(col, user.id)
    if (error) {
      console.error(`[delete-account] Erreur suppression ${name}:`, error.message)
      errors.push(`${name}: ${error.message}`)
    }
  }

  // Supprimer le compte auth Supabase (opération critique)
  const { error: authError } = await admin.auth.admin.deleteUser(user.id)
  if (authError) {
    console.error('[delete-account] Erreur suppression auth:', authError.message)
    return NextResponse.json({ error: authError.message, dataErrors: errors }, { status: 500 })
  }

  return NextResponse.json({ success: true, dataErrors: errors.length > 0 ? errors : undefined })
}
