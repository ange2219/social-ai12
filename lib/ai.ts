import Anthropic from '@anthropic-ai/sdk'
import OpenAI from 'openai' // utilisé pour GitHub Models (GPT-4o-mini)
import { GoogleGenerativeAI } from '@google/generative-ai'
import type { GenerateRequest, GenerateResponse, Platform, Plan } from '@/types'

// ─── Clients ──────────────────────────────────────────────────────────────────

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const githubAI = new OpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: process.env.GITHUB_TOKEN,
})

const gemini = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null

// ─── Contraintes par plateforme ────────────────────────────────────────────────

const PLATFORM_CONSTRAINTS: Record<Platform, string> = {
  instagram: 'Max 2000 caractères. 5-10 hashtags pertinents à la fin. Emojis bienvenus. Caption engageante avec CTA. Vise 800-1500 caractères pour un bon engagement.',
  facebook:  'Ton conversationnel. Max 2000 caractères. CTA encouragé. 2-3 hashtags max. Vise 800-1500 caractères, développe le sujet avec du détail et de la valeur ajoutée.',
  twitter:   'Max 280 caractères. Percutant et direct. 1-2 hashtags max. Hook fort en première phrase.',
  linkedin:  'Ton professionnel. Max 1300 caractères recommandés. 3 hashtags max. Structure lisible avec sauts de ligne.',
  tiktok:    'Court et dynamique. Max 300 caractères. Hook fort en première phrase. 3-5 hashtags tendance.',
  youtube:   'Description vidéo optimisée SEO. Mots-clés naturels. CTA pour s\'abonner.',
  pinterest: 'Descriptif et inspirant. Mots-clés importants. Max 500 caractères.',
}

const TONE_INSTRUCTIONS: Record<string, string> = {
  professionnel: 'Adopte un ton professionnel, expert et crédible. Langage soigné, données et faits si pertinents.',
  decontracte:   'Ton décontracté, accessible et authentique. Parle directement à l\'audience, comme un ami.',
  inspirant:     'Ton motivant et inspirant. Élève l\'audience, crée de l\'émotion et de l\'aspiration.',
  humoristique:  'Ton léger et humoristique. Wit intelligent, légèreté, mais reste pertinent au sujet.',
  emotionnel:    'Ton émotionnel et touchant. Crée une connexion profonde avec l\'audience, appelle à l\'émotion.',
  expert:        'Ton expert et autoritaire. Partage une expertise pointue, use de termes techniques maîtrisés.',
}

const LENGTH_INSTRUCTIONS: Record<string, string> = {
  court:  'Rédige un post COURT et percutant (50-150 caractères pour Twitter/TikTok, 200-400 pour les autres plateformes). Va droit au but.',
  moyen:  'Rédige un post de longueur MOYENNE (280 caractères max pour Twitter/TikTok, 500-900 pour les autres). Équilibre entre concision et détail.',
  long:   'Rédige un post LONG et développé. Approche la limite de chaque plateforme. Développe le sujet en profondeur.',
}

const FORMAT_INSTRUCTIONS: Record<string, string> = {
  direct:   'Format DIRECT : affirmation claire, message central en une phrase forte, sans détour.',
  liste:    'Format LISTÉ : utilise des points de liste, emojis ou numéros pour structurer l\'information. Facilite la lecture.',
  narratif: 'Format NARRATIF : commence par une anecdote ou histoire courte, développe le sujet de façon fluide et engageante.',
  question: 'Format QUESTION : commence par une question accrocheuse pour interpeller l\'audience et inciter à répondre.',
}

const CTA_INSTRUCTIONS: Record<string, string> = {
  acheter:        'Inclus un CTA orienté achat/conversion (ex: "Découvrez", "Commandez", "Profitez de", "Obtenez").',
  commenter:      'Inclus un CTA orienté commentaire/interaction (ex: "Donnez votre avis", "Et vous ?", "Racontez-nous").',
  partager:       'Inclus un CTA orienté partage (ex: "Partagez si", "Taguez quelqu\'un qui", "Envoyez à").',
  en_savoir_plus: 'Inclus un CTA orienté information (ex: "En savoir plus", "Lien en bio", "Consultez notre site").',
  aucun:          'N\'inclus pas de CTA explicite. Laisse le message parler de lui-même.',
}

const OBJECTIVE_INSTRUCTIONS: Record<string, string> = {
  vendre:    'OBJECTIF : Vendre. Mets en avant la valeur unique, crée un sentiment d\'urgence ou de désir.',
  engager:   'OBJECTIF : Engager. Favorise les interactions, pose des questions, invite à participer.',
  eduquer:   'OBJECTIF : Éduquer. Apporte de la valeur et du savoir de manière claire et structurée.',
  inspirer:  'OBJECTIF : Inspirer. Crée une connexion émotionnelle forte, partage une vision ou une conviction.',
  annoncer:  'OBJECTIF : Annoncer. Présente la nouveauté de façon claire, enthousiaste et mémorable.',
  fideliser: 'OBJECTIF : Fidéliser. Renforce le lien avec la communauté existante, valorise et remercie.',
}

// ─── Prompt builder ────────────────────────────────────────────────────────────

function buildBrandContext(req: GenerateRequest): string {
  const lines: string[] = []
  if (req.brand_name)        lines.push(`Marque : ${req.brand_name}`)
  if (req.brand_description) lines.push(`Description : ${req.brand_description}`)
  if (req.brand_industry)    lines.push(`Secteur : ${req.brand_industry}`)
  if (req.brand_audience)    lines.push(`Audience cible : ${req.brand_audience}`)
  if (req.brand_pillars?.length) lines.push(`Piliers de contenu : ${req.brand_pillars.join(', ')}`)
  if (req.brand_avoid)       lines.push(`À éviter absolument : ${req.brand_avoid}`)
  return lines.join('\n')
}

function buildPrompt(req: GenerateRequest): string {
  const isUnified = req.distributionMode === 'unified'

  const platformInstructions = req.platforms
    .map(p => `**${p.toUpperCase()}**: ${PLATFORM_CONSTRAINTS[p]}`)
    .join('\n')

  const brandContext = buildBrandContext(req)

  const briefLine = req.brief
    ? `Sujet / brief : ${req.brief}`
    : `Aucun brief fourni — choisis toi-même un sujet pertinent, engageant et original pour cette marque. Sois créatif.`

  // Nouvelles instructions contextuelles
  const objectiveLine  = req.objective  ? OBJECTIVE_INSTRUCTIONS[req.objective]  : ''
  const lengthLine     = req.length     ? LENGTH_INSTRUCTIONS[req.length]         : ''
  const formatLine     = req.format     ? FORMAT_INSTRUCTIONS[req.format]         : ''
  const ctaLine        = req.cta        ? CTA_INSTRUCTIONS[req.cta]               : ''
  // Le ton PostTone (professionnel/decontracte/emotionnel/expert) prime sur le GenerateTone si présent
  const toneLine       = TONE_INSTRUCTIONS[req.tone] || ''

  const distributionNote = isUnified
    ? `Mode de distribution : UNIFIÉ. Génère UN seul post adaptable à toutes les plateformes (le texte sera le même pour chaque variant, légèrement ajusté aux contraintes de chaque plateforme).`
    : `Mode de distribution : PERSONNALISÉ. Génère un post DIFFÉRENT et spécifiquement optimisé pour chaque plateforme.`

  const contextLines = [objectiveLine, lengthLine, formatLine, toneLine, ctaLine]
    .filter(Boolean)
    .join('\n')

  return `Tu es un expert Community Manager. Génère des posts pour les réseaux sociaux suivants.

${brandContext}
${briefLine}
${contextLines}

${distributionNote}

Contraintes par plateforme :
${platformInstructions}

Réponds UNIQUEMENT en JSON valide avec ce format exact :
{
  "variants": {
    ${req.platforms.map(p => `"${p}": "texte du post"`).join(',\n    ')}
  }
}

Aucun texte avant ou après le JSON.`
}

function buildWeekPrompt(req: GenerateRequest, postsCount: number): string {
  const platformInstructions = req.platforms
    .map(p => `**${p.toUpperCase()}**: ${PLATFORM_CONSTRAINTS[p]}`)
    .join('\n')

  const brandContext = req.brand_name
    ? `Marque : ${req.brand_name}${req.brand_description ? `. Description : ${req.brand_description}` : ''}.`
    : ''

  return `Tu es un expert Community Manager. Génère ${postsCount} posts différents pour la semaine.

${brandContext}
Ton : ${TONE_INSTRUCTIONS[req.tone]}
${req.brief ? `Thème général de la semaine : ${req.brief}` : 'Choisis des sujets variés et pertinents pour chaque post.'}

Contraintes par plateforme :
${platformInstructions}

Génère ${postsCount} posts variés avec des sujets différents. Réponds UNIQUEMENT en JSON :
{
  "week": [
    ${Array.from({ length: postsCount }, (_, i) => `{
      "day": ${i + 1},
      "topic": "sujet court du post",
      "variants": { ${req.platforms.map(p => `"${p}": "texte du post"`).join(', ')} }
    }`).join(',\n    ')}
  ]
}

Aucun texte avant ou après le JSON.`
}

// ─── Génération via GitHub Models (GPT-4o-mini) — plan gratuit ─────────────────

async function generateWithGitHub(req: GenerateRequest): Promise<GenerateResponse> {
  const response = await githubAI.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{ role: 'user', content: buildPrompt(req) }],
    max_tokens: 1500,
    temperature: 0.8,
    response_format: { type: 'json_object' },
  })

  const text = response.choices[0]?.message?.content || '{}'
  return JSON.parse(text) as GenerateResponse
}

// ─── Génération via Claude (Anthropic) — plans payants ────────────────────────

async function generateWithClaude(req: GenerateRequest): Promise<GenerateResponse> {
  const message = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 2048,
    messages: [{ role: 'user', content: buildPrompt(req) }],
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  return JSON.parse(text.trim()) as GenerateResponse
}

// ─── Réécriture ────────────────────────────────────────────────────────────────

export async function rewritePost(content: string, platform: Platform, instruction: string, plan: Plan): Promise<string> {
  const prompt = `Réécris ce post ${platform} selon cette instruction : "${instruction}"

Post original :
${content}

Contraintes ${platform} : ${PLATFORM_CONSTRAINTS[platform]}

Réponds UNIQUEMENT avec le texte du post réécrit, sans explication.`

  if (plan === 'free') {
    const res = await githubAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    })
    return res.choices[0]?.message?.content?.trim() || content
  }

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1024,
    messages: [{ role: 'user', content: prompt }],
  })
  return msg.content[0].type === 'text' ? msg.content[0].text.trim() : content
}

// ─── Hashtags ──────────────────────────────────────────────────────────────────

export async function suggestHashtags(content: string, platform: Platform, plan: Plan): Promise<string[]> {
  const prompt = `Suggère 10 hashtags pertinents pour ce post ${platform}. Mélange populaires et de niche.

Post : ${content}

Réponds UNIQUEMENT en JSON : {"hashtags": ["#tag1", "#tag2", ...]}`

  if (plan === 'free') {
    const res = await githubAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 200,
      response_format: { type: 'json_object' },
    })
    const parsed = JSON.parse(res.choices[0]?.message?.content || '{}')
    return parsed.hashtags || []
  }

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 256,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{}'
  return JSON.parse(text.trim()).hashtags || []
}

// ─── Génération d'image via Gemini 2.0 Flash (Imagen 3 / "Nano Banana 2") ─────

export async function generateImage(prompt: string): Promise<string | null> {
  try {
    if (!gemini) return null

    const model = gemini.getGenerativeModel({
      model: 'gemini-2.0-flash-exp-image-generation',
    })

    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: `Image professionnelle pour un post social media : ${prompt.slice(0, 800)}` }] }],
      generationConfig: {
        // @ts-expect-error responseModalities est un param Gemini image non encore typé dans le SDK
        responseModalities: ['image', 'text'],
      },
    })

    const parts = result.response.candidates?.[0]?.content?.parts || []
    for (const part of parts) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = part as any
      if (p.inlineData?.mimeType?.startsWith('image/')) {
        return `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`
      }
    }
    return null
  } catch (err) {
    console.error('[generateImage] Gemini error:', err)
    return null
  }
}

// ─── Export principal ──────────────────────────────────────────────────────────

export async function generatePosts(req: GenerateRequest, plan: Plan): Promise<GenerateResponse> {
  if (plan === 'free' && process.env.GITHUB_TOKEN) {
    try {
      return await generateWithGitHub(req)
    } catch (err) {
      console.error('[ai/generatePosts] GitHub Models failed, falling back to Claude:', err instanceof Error ? err.message : err)
    }
  }
  return generateWithClaude(req)
}

export async function generateWeekPosts(req: GenerateRequest, postsCount: number, plan: Plan): Promise<{ week: { day: number; topic: string; variants: Partial<Record<Platform, string>> }[] }> {
  const prompt = buildWeekPrompt(req, postsCount)

  if (plan === 'free' && process.env.GITHUB_TOKEN) {
    try {
      const res = await githubAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 3000,
        temperature: 0.8,
        response_format: { type: 'json_object' },
      })
      const parsed = JSON.parse(res.choices[0]?.message?.content || '{"week":[]}')
      if (!Array.isArray(parsed.week) || parsed.week.length === 0) {
        console.warn('[ai/generateWeekPosts] GitHub Models returned empty week, falling back to Claude')
        throw new Error('Empty week response from GitHub Models')
      }
      return parsed
    } catch (err) {
      console.error('[ai/generateWeekPosts] GitHub Models failed, falling back to Claude:', err instanceof Error ? err.message : err)
    }
  }

  const msg = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  })
  const text = msg.content[0].type === 'text' ? msg.content[0].text : '{"week":[]}'
  const parsed = JSON.parse(text.trim())
  if (!Array.isArray(parsed.week)) {
    console.error('[ai/generateWeekPosts] Claude returned invalid week structure')
    throw new Error('Réponse invalide du modèle — veuillez réessayer')
  }
  return parsed
}
