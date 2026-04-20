import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { z } from 'zod'

const BrandSchema = z.object({
  brand_name:          z.string().min(1).max(100).optional(),
  description:         z.string().max(2000).optional(),
  default_tone:        z.string().max(50).optional(),
  tone:                z.string().max(50).optional(),
  sector:              z.string().max(100).optional(),
  industry:            z.string().max(100).optional(),
  posts_per_week:      z.number().int().min(1).max(30).optional(),
  account_type:        z.string().max(50).optional(),
  website:             z.string().url().optional().or(z.literal('')),
  target_audience:     z.string().max(500).optional(),
  audience_age:        z.string().max(50).optional(),
  audience_interests:  z.string().max(500).optional(),
  audience_location:   z.string().max(200).optional(),
  content_pillars:     z.array(z.string().max(100)).max(10).optional(),
  avoid_words:         z.string().max(500).optional(),
  objectives:          z.array(z.string().max(100)).max(10).optional(),
})

export async function GET() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('brand_profiles').select('*').eq('user_id', user.id).single()
  return NextResponse.json(data || {})
}

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = BrandSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const body = parsed.data

  const { data, error } = await supabase
    .from('brand_profiles')
    .upsert({
      user_id: user.id,
      brand_name:         body.brand_name,
      description:        body.description,
      tone:               body.default_tone || body.tone,
      industry:           body.sector || body.industry,
      posts_per_week:     body.posts_per_week,
      account_type:       body.account_type,
      website:            body.website,
      target_audience:    body.target_audience,
      audience_age:       body.audience_age,
      audience_interests: body.audience_interests,
      audience_location:  body.audience_location,
      content_pillars:    body.content_pillars,
      avoid_words:        body.avoid_words,
      objectives:         body.objectives,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
