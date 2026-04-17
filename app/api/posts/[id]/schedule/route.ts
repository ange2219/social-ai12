import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userProfile } = await admin
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  // Scheduling débloqué pour tous les plans
  const { scheduledAt } = await req.json()
  if (!scheduledAt) return NextResponse.json({ error: 'scheduledAt requis' }, { status: 400 })

  const scheduledDate = new Date(scheduledAt)
  if (isNaN(scheduledDate.getTime())) {
    return NextResponse.json({ error: 'Format de date invalide' }, { status: 400 })
  }
  if (scheduledDate <= new Date()) {
    return NextResponse.json({ error: 'La date doit être dans le futur' }, { status: 400 })
  }

  const maxDate = new Date()
  maxDate.setFullYear(maxDate.getFullYear() + 1)
  if (scheduledDate > maxDate) {
    return NextResponse.json({ error: 'La date ne peut pas dépasser 1 an dans le futur' }, { status: 400 })
  }

  const { data: post, error } = await supabase
    .from('posts')
    .update({ status: 'scheduled', scheduled_at: scheduledDate.toISOString() })
    .eq('id', params.id)
    .eq('user_id', user.id)
    .in('status', ['draft', 'failed'])
    .select()
    .single()

  if (error || !post) return NextResponse.json({ error: 'Post introuvable ou non modifiable' }, { status: 404 })

  // Le cron Vercel (/api/cron/publish) se déclenche chaque minute
  // et publie automatiquement tous les posts dont scheduled_at <= NOW()
  return NextResponse.json({ success: true, scheduled_at: post.scheduled_at })
}
