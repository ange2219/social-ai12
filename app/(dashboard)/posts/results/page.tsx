'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { GeneratedPostsView, type SocialAccount } from '@/components/posts/GeneratedPostsView'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'
import type { Platform, PostObjective } from '@/types'

interface ResultsData {
  variants:            Partial<Record<Platform, string>>
  platforms:           Platform[]
  objective:           PostObjective | null
  quotaUsed:           number
  quotaLimit:          number | 'unlimited'
  isPro:               boolean
  editPostId?:         string
  initialImages?:      Partial<Record<Platform, string>>
  initialScheduledAt?: string
  pageTitle?:          string
  allowPlatformToggle?: boolean
  distributionMode?:   'unified' | 'custom'
}

export default function ResultsPage() {
  const router    = useRouter()
  const { toast } = useToast()
  const [data, setData]           = useState<ResultsData | null>(null)
  const [ready, setReady]         = useState(false)
  const [userName, setUserName]   = useState<string | null>(null)
  const [socialAccounts, setSocialAccounts] = useState<SocialAccount[]>([])
  const [showLeaveModal, setShowLeaveModal] = useState(false)
  const [leaveSaving, setLeaveSaving]       = useState(false)
  // Plateformes déjà traitées (brouillon/publié/programmé) — retirées de la vue
  const [actedPlatforms, setActedPlatforms] = useState<Set<Platform>>(new Set())

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('social_ia_results')
      if (raw) {
        const parsed = JSON.parse(raw) as ResultsData
        setData(parsed)
      } else {
        router.replace('/posts/create')
      }
    } catch {
      router.replace('/posts/create')
    }
    setReady(true)
    fetch('/api/auth/me').then(r => r.json()).then(d => {
      if (d?.full_name) setUserName(d.full_name)
    }).catch(() => {})
    fetch('/api/social/accounts').then(r => r.json()).then(d => {
      if (Array.isArray(d)) setSocialAccounts(d.filter((a: any) => a.is_active).map((a: any) => ({
        platform: a.platform,
        platform_username: a.platform_username ?? null,
        platform_avatar_url: a.platform_avatar_url ?? null,
      })))
    }).catch(() => {})
  }, [router])

  const isUnified = (d: ResultsData | null) =>
    d?.distributionMode === 'unified' && !d?.editPostId && (d?.platforms?.length ?? 0) > 1

  // ── Crée un post (ou met à jour en mode édition) ──────────────────────────────
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

  // ── Crée UN post multi-plateformes (mode unifié) ──────────────────────────────
  async function saveUnifiedPost(
    content: string, mediaUrl: string | null, status: 'draft' | 'scheduled',
    scheduledAt?: string,
  ): Promise<string> {
    const res = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content, platforms: data!.platforms,
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

  function markPlatformActed(platform: Platform) {
    setActedPlatforms(prev => {
      const next = new Set(prev)
      next.add(platform)
      const remaining = (data?.platforms || []).filter(p => !!data?.variants[p] && !next.has(p))
      if (remaining.length === 0) {
        clearResults()
        router.replace('/posts')
      }
      return next
    })
  }

  async function handleSaveDraft(platform: Platform, content: string, imageUrl: string | null) {
    if (isUnified(data)) {
      await saveUnifiedPost(content, imageUrl, 'draft')
      clearResults()
      toast('Brouillon sauvegardé', 'success')
      router.replace('/posts')
      return
    }
    await savePost(platform, content, imageUrl, 'draft')
    toast('Brouillon sauvegardé', 'success')
    markPlatformActed(platform)
  }

  async function handlePublish(platform: Platform, content: string, imageUrl: string | null) {
    if (isUnified(data)) {
      // En mode unifié le post va sur toutes les plateformes sélectionnées —
      // bloquer si Instagram est inclus et qu'il n'y a pas d'image.
      if (data!.platforms.includes('instagram') && !imageUrl) {
        toast('Veuillez ajouter une image — Instagram n\'accepte pas les posts sans image.', 'warning')
        return
      }
      const id = await saveUnifiedPost(content, imageUrl, 'draft')
      const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      clearResults()
      toast('Post publié !', 'success')
      router.replace('/posts')
      return
    }
    if (platform === 'instagram' && !imageUrl) {
      toast('Veuillez ajouter une image — Instagram n\'accepte pas les posts sans image.', 'warning'); return
    }
    const id = await savePost(platform, content, imageUrl, 'draft')
    const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
    toast('Post publié !', 'success')
    markPlatformActed(platform)
  }

  async function handleSchedule(platform: Platform, content: string, imageUrl: string | null, scheduledAt: string) {
    if (new Date(scheduledAt) <= new Date()) throw new Error('La date doit être dans le futur')
    if (isUnified(data)) {
      const id = await saveUnifiedPost(content, imageUrl, 'draft')
      const res = await fetch(`/api/posts/${id}/schedule`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      clearResults()
      toast('Post programmé !', 'success')
      router.replace('/posts')
      return
    }
    const id = await savePost(platform, content, imageUrl, 'draft')
    const res = await fetch(`/api/posts/${id}/schedule`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt }),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
    toast('Post programmé !', 'success')
    markPlatformActed(platform)
  }

  // ── Popup retour ──────────────────────────────────────────────────────────────
  async function handleLeaveAsDraft() {
    if (!data) return
    setLeaveSaving(true)
    try {
      if (isUnified(data)) {
        const content = data.variants[data.platforms[0]] || ''
        await saveUnifiedPost(content, null, 'draft')
      } else {
        const remaining = data.platforms.filter(p => !!data.variants[p] && !actedPlatforms.has(p))
        await Promise.all(
          remaining.map(p => savePost(p, data.variants[p]!, null, 'draft'))
        )
      }
      clearResults()
      toast('Posts sauvegardés en brouillon', 'success')
      router.replace('/posts')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
      setLeaveSaving(false)
    }
  }

  function handleLeaveDiscard() {
    clearResults()
    setShowLeaveModal(false)
    router.push('/posts')
  }

  if (!ready || !data) return null

  return (
    <div style={{ padding: '0 0 4rem' }}>

      {/* ── Popup confirmation retour ── */}
      {showLeaveModal && (
        <div
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)',
            zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
          }}
          onClick={e => { if (e.target === e.currentTarget) setShowLeaveModal(false) }}
        >
          <div className="anim-fade-scale" style={{
            background: 'var(--card)', border: '1px solid var(--b1)',
            borderRadius: '16px', width: '100%', maxWidth: '360px',
            padding: '1.75rem',
            boxShadow: '0 24px 64px rgba(0,0,0,.45)',
          }}>
            <h2 style={{
              fontFamily: "'Bricolage Grotesque', sans-serif",
              fontSize: '1.05rem', fontWeight: 700, color: 'var(--t1)', marginBottom: '.4rem',
            }}>
              Quitter sans sauvegarder ?
            </h2>
            <p style={{ fontSize: '.82rem', color: 'var(--t3)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Vos posts générés seront perdus. Voulez-vous les enregistrer en brouillon avant de quitter ?
            </p>
            <div style={{ display: 'flex', gap: '.6rem' }}>
              <button
                onClick={handleLeaveDiscard}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '.4rem', padding: '.65rem', borderRadius: '10px',
                  border: '1px solid rgba(239,68,68,.35)', background: 'rgba(239,68,68,.08)',
                  color: '#EF4444', cursor: 'pointer', fontSize: '.83rem', fontWeight: 600,
                  transition: '.12s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,.08)' }}
              >
                <Trash2 size={14} /> Supprimer
              </button>
              <button
                onClick={handleLeaveAsDraft}
                disabled={leaveSaving}
                className="btn-primary"
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  gap: '.4rem', padding: '.65rem', borderRadius: '10px',
                  fontSize: '.83rem', fontWeight: 600,
                  opacity: leaveSaving ? .6 : 1, cursor: leaveSaving ? 'not-allowed' : 'pointer',
                }}
              >
                {leaveSaving
                  ? <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                  : <Save size={14} />
                }
                Brouillon
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.5rem' }}>
        <button
          onClick={() => setShowLeaveModal(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px', transition: '.12s' }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.background = 'var(--s2)' }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'none' }}
        >
          <ArrowLeft size={18} />
        </button>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.02em' }}>
          {data.pageTitle ?? (data.editPostId ? 'Modifier le post' : 'Posts générés')}
        </h1>
      </div>

      <GeneratedPostsView
        platforms={data.platforms.filter(p => !!data.variants[p] && !actedPlatforms.has(p))}
        variants={data.variants}
        objective={data.objective}
        quotaUsed={data.quotaUsed}
        quotaLimit={data.quotaLimit}
        isPro={data.isPro}
        userName={userName}
        socialAccounts={socialAccounts}
        initialImages={data.initialImages}
        initialScheduledAt={data.initialScheduledAt}
        allowPlatformToggle={data.allowPlatformToggle}
        unifiedMode={isUnified(data)}
        onSaveDraft={handleSaveDraft}
        onPublish={handlePublish}
        onSchedule={handleSchedule}
        onClose={() => setShowLeaveModal(true)}
      />
    </div>
  )
}
