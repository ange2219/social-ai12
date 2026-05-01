import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { z } from 'zod'

const OBJECTIVES = ['vendre', 'engager', 'eduquer', 'inspirer', 'annoncer', 'fideliser'] as const

const Schema = z.object({ brief: z.string().min(3).max(2000) })

const githubAI = new OpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: process.env.GITHUB_TOKEN || 'dummy',
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const parsed = Schema.safeParse(await req.json())
  if (!parsed.success) return NextResponse.json({ error: 'brief invalide' }, { status: 400 })

  const { brief } = parsed.data

  try {
    const completion = await githubAI.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      max_tokens: 20,
      messages: [
        {
          role: 'system',
          content: `Tu es un expert en stratégie social media. Analyse le brief ci-dessous et choisis l'objectif le plus adapté parmi ces 6 options :
- vendre : vendre un produit ou service
- engager : obtenir des interactions (likes, commentaires, partages)
- eduquer : partager une connaissance, conseil, information
- inspirer : créer de l'émotion, de la motivation, de l'aspiration
- annoncer : communiquer une nouveauté, un événement, un lancement
- fideliser : renforcer le lien avec la communauté, montrer le côté humain

Réponds UNIQUEMENT avec un seul mot parmi : vendre, engager, eduquer, inspirer, annoncer, fideliser`,
        },
        { role: 'user', content: brief },
      ],
    })

    const raw = completion.choices[0]?.message?.content?.trim().toLowerCase() ?? ''
    const objective = OBJECTIVES.find(o => raw.includes(o)) ?? null
    return NextResponse.json({ objective })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Detection failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
