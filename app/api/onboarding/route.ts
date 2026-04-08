import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const data = await req.json()
  const admin = createAdminClient()

  // Sauvegarder le profil de marque complet
  const { error: brandError } = await admin
    .from('brand_profiles')
    .upsert({
      user_id: user.id,
      account_type:        data.account_type,
      brand_name:          data.brand_name,
      industry:            data.industry,
      description:         data.description,
      website:             data.website,
      target_audience:     data.target_audience,
      audience_age:        data.audience_age,
      audience_interests:  data.audience_interests,
      audience_location:   data.audience_location,
      content_pillars:     data.content_pillars.filter(Boolean),
      tone:                data.tone,
      avoid_words:         data.avoid_words,
      objectives:          data.objectives,
      posts_per_week:      data.posts_per_week,
      updated_at:          new Date().toISOString(),
    }, { onConflict: 'user_id' })

  if (brandError) return NextResponse.json({ error: brandError.message }, { status: 500 })

  // Marquer l'utilisateur comme onboardé
  const { error: userError } = await admin
    .from('users')
    .update({ onboarded: true })
    .eq('id', user.id)

  if (userError) return NextResponse.json({ error: userError.message }, { status: 500 })

  const res = NextResponse.json({ success: true })
  res.cookies.set('onboarded', '1', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/',
  })
  return res
}
