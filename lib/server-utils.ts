import { createAdminClient } from './supabase/server'
import type { Plan } from '@/types'
import { PLAN_LIMITS } from '@/types'

/** Vérifie + enregistre un appel IA — SERVER ONLY */
export async function checkGenerationLimit(userId: string, plan: Plan): Promise<{
  allowed: boolean
  used: number
  limit: number | 'unlimited'
}> {
  const limits = PLAN_LIMITS[plan]

  if (limits.generationsPerDay === 'unlimited') {
    return { allowed: true, used: 0, limit: 'unlimited' }
  }

  const supabase = createAdminClient()
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)

  const { count } = await supabase
    .from('ai_generation_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .gte('created_at', startOfDay.toISOString())

  const used = count ?? 0
  return {
    allowed: used < (limits.generationsPerDay as number),
    used,
    limit: limits.generationsPerDay,
  }
}

/** Enregistre un appel IA réussi — à appeler après génération */
export async function recordGeneration(userId: string): Promise<void> {
  const supabase = createAdminClient()
  await supabase.from('ai_generation_log').insert({ user_id: userId })
}
