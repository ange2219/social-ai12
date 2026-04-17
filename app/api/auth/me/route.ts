import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { checkGenerationLimit } from '@/lib/server-utils'
import { z } from 'zod'

const PatchMeSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
})

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data } = await admin.from('users').select('id, email, full_name, plan, avatar_url').eq('id', user.id).single()
  if (!data) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const quota = await checkGenerationLimit(user.id, data.plan)

  return NextResponse.json({ ...data, generationsUsed: quota.used, generationsLimit: quota.limit })
}

export async function PATCH(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = PatchMeSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const admin = createAdminClient()
  const { error } = await admin.from('users').update({ full_name: parsed.data.full_name }).eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
