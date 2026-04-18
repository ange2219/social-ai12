'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { GeneratedPostsView } from '@/components/posts/GeneratedPostsView'
import { ArrowLeft } from 'lucide-react'
import type { Platform, PostObjective } from '@/types'

interface ResultsData {
  variants:       Partial<Record<Platform, string>>
  platforms:      Platform[]
  objective:      PostObjective | null
  quotaUsed:      number
  quotaLimit:     number | 'unlimited'
  isPro:          boolean
  editPostId?:    string
  initialImages?: Partial<Record<Platform, string>>
}

export default function ResultsPage() {
  const router     = useRouter()
  const { toast }  = useToast()
  const [data, setData] = useState<ResultsData | null>(null)
  const [ready, setReady] = useState(false)
  const [userName, setUserName] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('social_ia_results')
      if (raw) {
        const parsed = JSON.parse(raw) as ResultsData
        setData(parsed)
      } else {
        // Pas de données — retourner à la création
        router.replace('/posts/create')
      }
    } catch {
      router.replace('/posts/create')
    }
    setReady(true)
    // Fetch user name
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d?.full_name) setUserName(d.full_name)
    }).catch(() => {})
  }, [router])

  async function savePost(
    platform: Platform, content: string, mediaUrl: string | null,
    status: 'draft' | 'scheduled', scheduledAt?: string,
  ): Promise<string> {
    if (data?.editPostId) {
      const res = await fetch(`/api/posts/${data.editPostId}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content, platforms: [platform],
          media_urls: mediaUrl ? [mediaUrl] : [],
          status, scheduled_at: scheduledAt,
        }),
      })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error || 'Erreur')
      return data.editPostId
    }
    const res = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content, platforms: [platform],
        media_urls: mediaUrl ? [mediaUrl] : [],
        ai_generated: true, status, scheduled_at: scheduledAt,
      }),
    })
    const d = await res.json()
    if (!res.ok) throw new Error(d.error || 'Erreur')
    return d.id
  }

  function clearResults() {
    try { sessionStorage.removeItem('social_ia_results') } catch {}
  }

  async function handleSaveDraft(platform: Platform, content: string, imageUrl: string | null) {
    await savePost(platform, content, imageUrl, 'draft')
    clearResults()
    toast('Brouillon sauvegardé', 'success')
    router.replace('/posts')
  }

  async function handlePublish(platform: Platform, content: string, imageUrl: string | null) {
    if (platform === 'instagram' && !imageUrl) {
      toast('Veuillez ajouter une image pour Instagram.', 'warning'); return
    }
    const id = await savePost(platform, content, imageUrl, 'draft')
    const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
    clearResults()
    toast('Post publié !', 'success')
    router.replace('/posts')
  }

  async function handleSchedule(platform: Platform, content: string, imageUrl: string | null, scheduledAt: string) {
    if (new Date(scheduledAt) <= new Date()) throw new Error('La date doit être dans le futur')
    const id = await savePost(platform, content, imageUrl, 'draft')
    const res = await fetch(`/api/posts/${id}/schedule`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt }),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
    clearResults()
    toast('Post programmé !', 'success')
    router.replace('/posts')
  }

  if (!ready || !data) return null

  return (
    <div style={{ maxWidth: '1200px', padding: '0 0 4rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => { clearResults(); router.push('/posts/create') }}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px', transition: '.12s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.background = 'var(--s2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'none' }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.02em' }}>
          Posts générés
        </h1>
      </div>

      <GeneratedPostsView
        platforms={data.platforms.filter(p => !!data.variants[p])}
        variants={data.variants}
        objective={data.objective}
        quotaUsed={data.quotaUsed}
        quotaLimit={data.quotaLimit}
        isPro={data.isPro}
        userName={userName}
        initialImages={data.initialImages}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onSchedule={handleSchedule}
        onClose={() => { clearResults(); router.push('/posts/create') }}
      />
    </div>
  )
}
