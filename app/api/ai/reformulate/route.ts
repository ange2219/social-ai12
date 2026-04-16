import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'

const githubAI = new OpenAI({
  baseURL: 'https://models.inference.ai.azure.com',
  apiKey: process.env.GITHUB_TOKEN,
})

export async function POST(req: NextRequest) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { brief } = await req.json()
  if (!brief?.trim()) return NextResponse.json({ reformulation: null })

  if (!process.env.GITHUB_TOKEN) {
    return NextResponse.json({ reformulation: null })
  }

  try {
    const res = await githubAI.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: `Reformule ce brief de post social media en 2 à 3 phrases claires et professionnelles. Reste proche du sens original mais clarifie l'intention et la valeur attendue.

Brief : ${brief.trim().slice(0, 500)}

Réponds uniquement avec la reformulation, sans introduction ni explication.`,
      }],
      max_tokens: 150,
      temperature: 0.4,
    })
    const reformulation = res.choices[0]?.message?.content?.trim() || null
    return NextResponse.json({ reformulation })
  } catch {
    return NextResponse.json({ reformulation: null })
  }
}
