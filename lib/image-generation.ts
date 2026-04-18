/**
 * Système de génération d'images personnalisées par marque
 * Couche 1 : Classification automatique du type d'image
 * Couche 2 : Constructeur de prompt intelligent
 * Couche 3 : Multi-provider avec fallback (Imagen 3 → DALL-E 3)
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { Platform, Plan } from '@/types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ImageType =
  | 'infographic'   // Schéma, étapes numérotées, organigramme
  | 'cover'         // Visuel épuré avec titre centré
  | 'lifestyle'     // Photo réaliste, ambiance, émotion
  | 'product'       // Mise en valeur d'un produit/service
  | 'quote'         // Citation sur fond graphique
  | 'data_visual'   // Graphique, stats, dashboard
  | 'tutorial'      // Étapes illustrées, how-to

export interface BrandContext {
  brand_name: string
  industry: string
  tone: string
  description?: string
  target_audience?: string
  color_primary?: string
  color_secondary?: string
  visual_style?: string
}

export interface ImagePromptContext {
  postContent: string
  imageType: ImageType
  brand: BrandContext
  platform: Platform
  tone?: string
}

export interface ImageResult {
  url: string
  provider: 'imagen3'
  imageType: ImageType
}

// ─── Couche 1 : Classification ────────────────────────────────────────────────

const KEYWORD_TYPE_MAP: Record<ImageType, string[]> = {
  infographic: ['étapes', 'comment', 'guide', 'processus', 'workflow', 'schéma', 'structure', 'liste', 'méthode en', 'top ', 'les ', 'clés'],
  data_visual: ['statistiques', 'données', 'résultats', 'chiffres', '%', 'étude', 'analyse', 'rapport', 'croissance', 'performance'],
  quote:       ['citation', 'inspiration', 'leçon', 'conseil', 'vérité', '"', '«', 'croire', 'mantra', 'mindset'],
  tutorial:    ['tutoriel', 'apprendre', 'astuce', 'tip', 'comment faire', 'tuto', 'formation', 'explique', 'découvrez'],
  lifestyle:   ['expérience', 'moment', 'vécu', 'ressenti', 'partage', 'vie', 'quotidien', 'équipe', 'coulisses', 'derrière'],
  product:     ['produit', 'service', 'offre', 'lancement', 'nouveau', 'disponible', 'commandez', 'découvrez notre', 'promo'],
  cover:       ['annonce', 'événement', 'news', 'webinar', 'podcast', 'partenariat', 'collaboration', 'live'],
}

const INDUSTRY_TYPE_MAP: Record<string, ImageType[]> = {
  'Tech & SaaS':          ['infographic', 'data_visual', 'tutorial', 'cover'],
  'E-commerce':           ['product', 'lifestyle', 'cover'],
  'Mode & Beauté':        ['lifestyle', 'product', 'cover'],
  'Restauration & Food':  ['lifestyle', 'product', 'cover'],
  'Finance & Crypto':     ['data_visual', 'infographic', 'cover'],
  'Santé & Bien-être':    ['lifestyle', 'quote', 'infographic'],
  'Éducation':            ['tutorial', 'infographic', 'quote'],
  'Sport & Fitness':      ['lifestyle', 'quote', 'infographic'],
  'Immobilier':           ['lifestyle', 'cover', 'product'],
  'Art & Créativité':     ['lifestyle', 'cover', 'quote'],
  'Voyage & Tourisme':    ['lifestyle', 'cover', 'product'],
  'Autre':                ['cover', 'lifestyle', 'infographic'],
}

export function classifyImageType(postContent: string, industry: string): ImageType {
  const content = postContent.toLowerCase()

  // 1. Check keywords (priorité haute — plus précis)
  let bestType: ImageType = 'cover'
  let bestScore = 0

  for (const [type, keywords] of Object.entries(KEYWORD_TYPE_MAP) as [ImageType, string[]][]) {
    const score = keywords.filter(kw => content.includes(kw)).length
    if (score > bestScore) {
      bestScore = score
      bestType = type
    }
  }

  if (bestScore > 0) return bestType

  // 2. Fallback sur le secteur
  const industryTypes = INDUSTRY_TYPE_MAP[industry] || ['cover', 'lifestyle']
  return industryTypes[0]
}

// ─── Couche 2 : Prompt builder ────────────────────────────────────────────────

const IMAGE_STYLE_GUIDES: Record<ImageType, { base: string; negative: string }> = {
  infographic: {
    base: 'Clean professional infographic, white or light background, numbered steps or flow diagram with connecting arrows, flat design icons, modern sans-serif typography, structured layout',
    negative: 'NO photography, NO gradients, NO decorative clutter, NO realistic people',
  },
  data_visual: {
    base: 'Professional data visualization, clean dashboard style, bar charts or line graphs or pie charts, minimal design, data-driven aesthetic, corporate clean look',
    negative: 'NO stock photos, NO people, NO decorative elements unrelated to data',
  },
  cover: {
    base: 'Bold cover design, strong centered typography, clean background, professional composition, high contrast, editorial quality',
    negative: 'NO cluttered layout, NO multiple competing elements',
  },
  lifestyle: {
    base: 'Authentic lifestyle photography style, natural lighting, real environment, emotional and human, candid feel, editorial quality',
    negative: 'NO obvious stock photo look, NO overly staged scenes',
  },
  product: {
    base: 'Professional product photography, clean or contextual background, sharp focus, flattering lighting, commercial quality',
    negative: 'NO cluttered backgrounds, NO distracting elements',
  },
  quote: {
    base: 'Elegant quote card design, strong typography as focal point, minimal background texture or gradient, sophisticated layout',
    negative: 'NO complex imagery, NO competing visual elements',
  },
  tutorial: {
    base: 'Step-by-step illustrated guide, numbered sequence, clear visual flow from step 1 to finish, instructional design aesthetic, easy to follow',
    negative: 'NO random images, NO non-sequential layout',
  },
}

const TONE_VISUAL_STYLES: Record<string, string> = {
  professionnel: 'expert and corporate visual tone, clean minimal aesthetic, authoritative and trustworthy',
  decontracte:   'friendly and approachable visual tone, warm colors, casual and authentic feel',
  inspirant:     'uplifting and aspirational visual tone, dramatic lighting, motivational energy',
  humoristique:  'playful and vibrant visual tone, bold colors, dynamic and fun composition',
}

const PLATFORM_SPECS: Record<Platform, string> = {
  instagram: '1:1 square or 4:5 portrait format, visually bold for mobile feed',
  facebook:  '1.91:1 landscape format, clear at small size in feed',
  linkedin:  '1.91:1 landscape format, professional context, readable text elements',
  twitter:   '16:9 landscape format, high contrast for timeline',
  tiktok:    '9:16 vertical format, dynamic and eye-catching',
  youtube:   '16:9 landscape format, thumbnail-optimized, bold text',
  pinterest: '2:3 portrait format, vertical scroll-stopping composition',
}

const INDUSTRY_COLOR_HINTS: Record<string, string> = {
  'Tech & SaaS':         'dark blue, electric blue, white, indigo palette',
  'E-commerce':          'brand-appropriate, clean white with accent colors',
  'Mode & Beauté':       'sophisticated neutrals or brand palette, luxurious feel',
  'Restauration & Food': 'warm earthy tones, appetizing warm lighting',
  'Finance & Crypto':    'deep navy, gold accents, professional green or blue',
  'Santé & Bien-être':   'calming greens, soft blues, natural tones',
  'Éducation':           'bright and accessible, blue and yellow palette',
  'Sport & Fitness':     'energetic bold colors, high contrast, dynamic',
  'Immobilier':          'sophisticated neutrals, premium feel, grey and gold',
  'Art & Créativité':    'vibrant creative palette, expressive colors',
  'Voyage & Tourisme':   'vivid travel colors, sky blue, warm sunsets',
  'Autre':               'clean professional palette',
}

export function buildImagePrompt(ctx: ImagePromptContext): string {
  const styleGuide = IMAGE_STYLE_GUIDES[ctx.imageType]
  const platformSpec = PLATFORM_SPECS[ctx.platform]
  const toneStyle = (ctx.tone ? TONE_VISUAL_STYLES[ctx.tone] : undefined) || TONE_VISUAL_STYLES.professionnel
  const colorHint = ctx.brand.color_primary
    ? `Color palette: primary ${ctx.brand.color_primary}${ctx.brand.color_secondary ? `, secondary ${ctx.brand.color_secondary}` : ''}`
    : `Color palette: ${INDUSTRY_COLOR_HINTS[ctx.brand.industry] || 'clean professional palette'}`

  const contentSnippet = ctx.postContent.slice(0, 250)

  return [
    styleGuide.base,
    `Brand: ${ctx.brand.brand_name}, ${ctx.brand.industry} industry.`,
    `Visual tone: ${toneStyle}.`,
    colorHint + '.',
    `Platform optimized: ${platformSpec}.`,
    ctx.brand.target_audience ? `Target audience: ${ctx.brand.target_audience}.` : '',
    `Content to illustrate: "${contentSnippet}".`,
    styleGuide.negative,
  ].filter(Boolean).join(' ')
}

// ─── Couche 3 : Providers ─────────────────────────────────────────────────────

// Noms de modèles candidats pour la génération d'image — testés dans l'ordre
const IMAGE_MODEL_CANDIDATES = [
  'gemini-2.0-flash-preview-image-generation',
  'gemini-2.0-flash-image-generation',
  'gemini-2.0-flash',
  'gemini-2.0-flash-exp',
]

async function findImageModel(apiKey: string): Promise<string> {
  // Appel ListModels pour trouver dynamiquement un modèle supportant generateContent
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`)
  if (!res.ok) {
    console.warn('[gemini] ListModels failed, using first candidate')
    return IMAGE_MODEL_CANDIDATES[0]
  }
  const data = await res.json() as { models?: Array<{ name: string; supportedGenerationMethods?: string[] }> }
  const models = data.models || []
  console.log('[gemini] Available models (image-related):', models
    .filter(m => m.name.includes('flash') || m.name.includes('image'))
    .map(m => m.name)
  )

  // Cherche un modèle candidat dans la liste disponible
  for (const candidate of IMAGE_MODEL_CANDIDATES) {
    const found = models.find(m => m.name === `models/${candidate}` || m.name.endsWith(candidate))
    if (found && found.supportedGenerationMethods?.includes('generateContent')) {
      console.log('[gemini] Selected model:', found.name)
      return candidate
    }
  }

  // Fallback : premier modèle "flash" disponible
  const flashModel = models.find(m => m.name.includes('flash') && m.supportedGenerationMethods?.includes('generateContent'))
  if (flashModel) {
    const name = flashModel.name.replace('models/', '')
    console.log('[gemini] Fallback model:', name)
    return name
  }

  console.warn('[gemini] No model found via ListModels, using default candidate')
  return IMAGE_MODEL_CANDIDATES[0]
}

async function generateWithGeminiFlash(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY
  if (!apiKey) throw new Error('GEMINI_API_KEY non configurée — ajoutez-la dans les variables d\'environnement Vercel')

  const modelName = await findImageModel(apiKey)
  const genAI = new GoogleGenerativeAI(apiKey)
  const model = genAI.getGenerativeModel({ model: modelName })

  console.log('[gemini] Generating with model:', modelName)

  let result: Awaited<ReturnType<typeof model.generateContent>>
  try {
    result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        // @ts-expect-error responseModalities non encore typé dans le SDK
        responseModalities: ['IMAGE', 'TEXT'],
      },
    })
  } catch (apiErr) {
    console.error('[gemini] API call failed:', JSON.stringify(apiErr, null, 2))
    throw apiErr
  }

  const candidate = result.response.candidates?.[0]
  console.log('[gemini] finishReason:', candidate?.finishReason)

  const parts = candidate?.content?.parts || []
  for (const part of parts) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const p = part as any
    if (p.inlineData?.mimeType?.startsWith('image/')) {
      return `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`
    }
  }

  console.error('[gemini] No image in response:', JSON.stringify({
    finishReason: candidate?.finishReason,
    safetyRatings: candidate?.safetyRatings,
    partTypes: parts.map((p: any) => p.inlineData?.mimeType ?? (p.text ? 'text' : 'unknown')),
  }))
  throw new Error(`Gemini: aucune image — modèle=${modelName}, finishReason=${candidate?.finishReason ?? 'unknown'}`)
}

// ─── Export principal ─────────────────────────────────────────────────────────

export async function generateBrandedImage(
  ctx: ImagePromptContext,
  plan: Plan
): Promise<ImageResult> {
  const prompt = buildImagePrompt(ctx)
  console.log(`[image-generation] type=${ctx.imageType} platform=${ctx.platform}`)

  const url = await generateWithGeminiFlash(prompt)
  return { url, provider: 'imagen3', imageType: ctx.imageType }
}
