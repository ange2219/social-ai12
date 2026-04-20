import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { classifyImageType, buildImagePrompt, generateBrandedImage } from '@/lib/image-generation'
import { uploadImageFromUrl, uploadImageFromBase64 } from '@/lib/storage'
import { checkImageLimit, recordImageGeneration } from '@/lib/server-utils'
import type { Platform, Plan } from '@/types'
import { z } from 'zod'

const ALLOWED_PLATFORMS = ['instagram', 'facebook', 'twitter', 'linkedin', 'tiktok', 'youtube', 'pinterest'] as const

const GenerateImageSchema = z.object({
  postContent: z.string().min(1).max(5000),
  platform:    z.enum(ALLOWED_PLATFORMS).optional().default('instagram'),
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const admin = createAdminClient()
  const { data: userProfile } = await admin
    .from('users')
    .select('plan')
    .eq('id', user.id)
    .single()

  const plan = (userProfile?.plan || 'free') as Plan

  // Vérifier le quota d'images hebdomadaire
  const { allowed: imgAllowed, used: imgUsed, limit: imgLimit } = await checkImageLimit(user.id, plan)
  if (!imgAllowed) {
    const msg = imgLimit === 0
      ? 'La génération d\'images est réservée aux plans Premium et Business.'
      : `Quota d'images atteint (${imgUsed}/${imgLimit} cette semaine).`
    return NextResponse.json({
      error: msg,
      code: imgLimit === 0 ? 'PLAN_REQUIRED' : 'IMAGE_LIMIT_REACHED',
      used: imgUsed,
      limit: imgLimit,
    }, { status: 403 })
  }

  const parsed = GenerateImageSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: 'Données invalides', details: parsed.error.flatten() }, { status: 400 })
  }
  const { postContent, platform } = parsed.data as { postContent: string; platform: Platform }

  // Charger le profil de marque complet
  const { data: brandProfile } = await admin
    .from('brand_profiles')
    .select('brand_name, description, industry, tone, target_audience, color_primary, color_secondary, visual_style')
    .eq('user_id', user.id)
    .single()

  const brand = {
    brand_name:      brandProfile?.brand_name     || 'Ma marque',
    industry:        brandProfile?.industry        || 'Autre',
    tone:            brandProfile?.tone            || 'professionnel',
    description:     brandProfile?.description    || undefined,
    target_audience: brandProfile?.target_audience || undefined,
    color_primary:   brandProfile?.color_primary  || undefined,
    color_secondary: brandProfile?.color_secondary || undefined,
    visual_style:    brandProfile?.visual_style   || undefined,
  }

  // Couche 1 — Classification automatique
  const imageType = classifyImageType(postContent, brand.industry)

  // Couche 2 — Prompt intelligent
  const ctx = { postContent, imageType, brand, platform }
  const prompt = buildImagePrompt(ctx)

  console.log(`[generate-image] user=${user.id} type=${imageType} platform=${platform}`)
  console.log(`[generate-image] prompt=${prompt.slice(0, 200)}...`)

  try {
    // Couche 3 — Génération avec fallback
    const result = await generateBrandedImage(ctx, plan)

    // Upload vers Supabase Storage (URL permanente)
    let permanentUrl: string
    if (result.url.startsWith('data:')) {
      permanentUrl = await uploadImageFromBase64(result.url, user.id)
    } else {
      permanentUrl = await uploadImageFromUrl(result.url, user.id)
    }

    await recordImageGeneration(user.id)
    return NextResponse.json({
      url: permanentUrl,
      imageType: result.imageType,
      provider: result.provider,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Génération échouée'
    console.error('[generate-image] Error:', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
