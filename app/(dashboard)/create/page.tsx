'use client'

import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { PlatformPreview } from '@/components/posts/PlatformPreview'
import { Save, Send, ChevronDown, ChevronUp, Upload, X, ArrowLeft, Clock, Pencil, Image } from 'lucide-react'
import { PLATFORM_NAMES, FREE_PLATFORMS } from '@/types'
import type { Platform, GenerateTone } from '@/types'

const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin']
const TONES: { value: GenerateTone; label: string }[] = [
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'decontracte',   label: 'Décontracté' },
  { value: 'inspirant',     label: 'Inspirant' },
  { value: 'humoristique',  label: 'Humoristique' },
]

const STEPS_SINGLE = [
  'Analyse du profil de marque',
  'Recherche d\'idées créatives',
  'Rédaction du post',
  'Optimisation par plateforme',
  'Prêt pour validation',
]

const STEPS_WEEK = [
  'Analyse du profil de marque',
  'Tendances du secteur',
  'Génération des sujets',
  'Rédaction captions & hashtags',
  'Sélection des images',
  'Programmation automatique',
]

interface WeekPost {
  day: number
  topic: string
  variants: Partial<Record<Platform, string>>
}

// ─── Modal "Que faire avec ce post ?" ─────────────────────────────────────────

interface ActionModalProps {
  content: string
  platforms: Platform[]
  mediaUrls?: string[]
  aiGenerated: boolean
  onClose: () => void
}

function PostActionModal({ content, platforms, mediaUrls, aiGenerated, onClose }: ActionModalProps) {
  const { toast } = useToast()
  const [view, setView] = useState<'main' | 'schedule'>('main')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [loading, setLoading] = useState(false)

  async function savePost(): Promise<string> {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, platforms, media_urls: mediaUrls || [], ai_generated: aiGenerated }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erreur de sauvegarde')
    return data.id
  }

  async function handleDraft() {
    setLoading(true)
    try {
      await savePost()
      toast('Post sauvegardé en brouillon', 'success')
      onClose()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally { setLoading(false) }
  }

  async function handleReject() {
    setLoading(true)
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, platforms, media_urls: mediaUrls || [], ai_generated: aiGenerated, status: 'failed' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erreur')
      toast('Post rejeté', 'success')
      onClose()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally { setLoading(false) }
  }

  function checkInstagramImage(): boolean {
    if (platforms.includes('instagram') && (!mediaUrls || mediaUrls.length === 0)) {
      toast('Veuillez ajouter une image pour Instagram.', 'warning')
      return false
    }
    return true
  }

  async function handlePublish() {
    if (!checkInstagramImage()) return
    setLoading(true)
    try {
      const id = await savePost()
      const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast('Post publié avec succès !', 'success')
      onClose()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur de publication', 'error')
    } finally { setLoading(false) }
  }

  async function handleSchedule() {
    if (!checkInstagramImage()) return
    if (!schedDate || !schedTime) { toast('Choisissez une date et une heure', 'error'); return }
    const scheduledAt = new Date(`${schedDate}T${schedTime}`).toISOString()
    if (new Date(scheduledAt) <= new Date()) { toast('La date doit être dans le futur', 'error'); return }
    setLoading(true)
    try {
      const id = await savePost()
      const res = await fetch(`/api/posts/${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast('Post programmé avec succès !', 'success')
      onClose()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur de programmation', 'error')
    } finally { setLoading(false) }
  }

  // Date min = maintenant + 5min
  const minDate = new Date(Date.now() + 5 * 60 * 1000)
  const minDateStr = minDate.toISOString().split('T')[0]
  const minTimeStr = minDate.toTimeString().slice(0, 5)

  return (
    <div className="modal-ov" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box">
        {view === 'main' ? (
          <>
            <div className="modal-title">Que faire avec ce post ?</div>
            <div className="modal-sub">Choisissez comment publier ou conserver ce contenu.</div>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-blue" onClick={handlePublish} disabled={loading}>
                <Send size={15} />
                Publier maintenant
              </button>
              <button className="modal-btn modal-btn-border" onClick={() => setView('schedule')} disabled={loading}>
                <Clock size={15} />
                Programmer pour plus tard
              </button>
              <hr className="modal-sep" />
              <button className="modal-btn modal-btn-border" onClick={handleDraft} disabled={loading}>
                <Save size={15} />
                Sauvegarder en brouillon
              </button>
              <button className="modal-btn modal-btn-red" onClick={handleReject} disabled={loading}>
                <X size={15} />
                Rejeter ce post
              </button>
              <button className="modal-btn modal-btn-ghost" onClick={onClose} disabled={loading}>
                Annuler
              </button>
            </div>
          </>
        ) : (
          <>
            <button className="modal-back" onClick={() => setView('main')}>
              <ArrowLeft size={13} /> Retour
            </button>
            <div className="modal-title">Programmer le post</div>
            <div className="modal-sub">Choisissez la date et l'heure de publication.</div>
            <div className="modal-sched">
              <div className="modal-sched-row">
                <input
                  type="date"
                  value={schedDate}
                  min={minDateStr}
                  onChange={e => setSchedDate(e.target.value)}
                />
                <input
                  type="time"
                  value={schedTime}
                  min={schedDate === minDateStr ? minTimeStr : undefined}
                  onChange={e => setSchedTime(e.target.value)}
                />
              </div>
              <button className="modal-btn modal-btn-blue" onClick={handleSchedule} disabled={loading}>
                <Clock size={15} />
                {loading ? 'Programmation...' : 'Confirmer la programmation'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Page principale ───────────────────────────────────────────────────────────

export default function CreatePage() {
  const { toast } = useToast()
  const fileRef = useRef<HTMLInputElement>(null)

  const [mode, setMode] = useState<'single' | 'week' | 'manual'>('single')
  const [brief, setBrief] = useState('')
  const [tone, setTone] = useState<GenerateTone>('professionnel')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram'])

  // AI résultats
  const [variants, setVariants] = useState<Partial<Record<Platform, string>>>({})
  const [activePreview, setActivePreview] = useState<Platform | null>(null)
  const [weekPosts, setWeekPosts] = useState<WeekPost[]>([])
  const [expandedDay, setExpandedDay] = useState<number | null>(null)

  // Création manuelle
  const [manualContent, setManualContent] = useState('')
  const [manualFile, setManualFile] = useState<File | null>(null)
  const [manualPreviewUrl, setManualPreviewUrl] = useState<string | null>(null)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null)

  // AI mode image upload
  const [aiUploadedUrl, setAiUploadedUrl] = useState<string | null>(null)
  const aiFileRef = useRef<HTMLInputElement>(null)

  // Overlay génération
  const [overlayOpen, setOverlayOpen] = useState(false)
  const [overlaySteps, setOverlaySteps] = useState<string[]>([])
  const [stepStates, setStepStates] = useState<string[]>([])

  // Plan
  const [isPro, setIsPro] = useState(false)

  useEffect(() => {
    createClient().from('users').select('plan').single().then(({ data }) => {
      if (data?.plan && data.plan !== 'free') setIsPro(true)
    })
  }, [])

  // Restore draft from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('social_ia_create_draft')
      if (saved) {
        const d = JSON.parse(saved)
        if (d.brief !== undefined) setBrief(d.brief)
        if (d.tone) setTone(d.tone)
        if (d.selectedPlatforms) setSelectedPlatforms(d.selectedPlatforms)
        if (d.variants) { setVariants(d.variants); if (d.selectedPlatforms?.[0]) setActivePreview(d.selectedPlatforms[0]) }
        if (d.manualContent !== undefined) setManualContent(d.manualContent)
        if (d.aiUploadedUrl) setAiUploadedUrl(d.aiUploadedUrl)
        if (d.generatedImageUrl) setGeneratedImageUrl(d.generatedImageUrl)
      }
    } catch { /* ignore */ }
  }, [])

  // Persist draft to sessionStorage
  useEffect(() => {
    try {
      sessionStorage.setItem('social_ia_create_draft', JSON.stringify({
        brief, tone, selectedPlatforms, variants, manualContent, aiUploadedUrl, generatedImageUrl,
      }))
    } catch { /* ignore */ }
  }, [brief, tone, selectedPlatforms, variants, manualContent, aiUploadedUrl, generatedImageUrl])

  // Modal action
  const [actionModal, setActionModal] = useState<{
    content: string
    platforms: Platform[]
    mediaUrls?: string[]
    aiGenerated: boolean
  } | null>(null)

  // Inline post actions
  const [showSchedule, setShowSchedule] = useState(false)
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [postAction, setPostAction] = useState(false)

  function togglePlatform(p: Platform) {
    setSelectedPlatforms(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    )
  }

  async function runOverlay(steps: string[], apiFn: () => Promise<void>) {
    setOverlaySteps(steps)
    setStepStates(steps.map(() => ''))
    setOverlayOpen(true)
    const apiPromise = apiFn()
    for (let i = 0; i < steps.length; i++) {
      setStepStates(prev => prev.map((_, idx) =>
        idx === i ? 'on' : idx < i ? 'done' : ''
      ))
      await new Promise(r => setTimeout(r, 680))
    }
    setStepStates(steps.map(() => 'done'))
    await apiPromise
    await new Promise(r => setTimeout(r, 400))
    setOverlayOpen(false)
  }

  async function handleGenerate() {
    if (!selectedPlatforms.length) { toast('Sélectionnez au moins une plateforme', 'error'); return }
    setMode('single')
    let generatedVariants: Partial<Record<Platform, string>> = {}

    await runOverlay(STEPS_SINGLE, async () => {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: brief.trim() || undefined, tone, platforms: selectedPlatforms }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(data.code === 'DAILY_LIMIT_REACHED'
          ? 'Limite journalière atteinte — passez à Premium'
          : data.error || 'Erreur de génération', 'error')
        return
      }
      generatedVariants = data.variants
      setVariants(data.variants)
      setActivePreview(selectedPlatforms[0])
      setAiUploadedUrl(null)
      if (aiFileRef.current) aiFileRef.current.value = ''
    })

    // Post is shown directly in the preview — no modal
  }

  async function handleGenerateWeek() {
    if (!selectedPlatforms.length) { toast('Sélectionnez au moins une plateforme', 'error'); return }
    setMode('week')

    await runOverlay(STEPS_WEEK, async () => {
      const res = await fetch('/api/ai/generate-week', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: brief.trim() || undefined, tone, platforms: selectedPlatforms }),
      })
      const data = await res.json()
      if (!res.ok) { toast(data.error || 'Erreur', 'error'); return }
      setWeekPosts(data.week || [])
      setExpandedDay(1)
      toast(`${data.week?.length || 0} posts générés !`, 'success')
    })
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setManualFile(file)
    setManualPreviewUrl(URL.createObjectURL(file))
    setUploadedMediaUrl(null)
  }

  async function handleAiImageUpload(file: File) {
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAiUploadedUrl(data.url)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur upload', 'error')
    }
  }

  async function handleGenerateImage() {
    const content = activePreview ? variants[activePreview] : Object.values(variants)[0]
    if (!content) { return }
    setGeneratingImage(true)
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: content.slice(0, 300) }),
      })
      const data = await res.json()
      if (res.ok) setGeneratedImageUrl(data.url)
    } catch { /* silencieux */ }
    finally { setGeneratingImage(false) }
  }

  async function handleManualSubmit() {
    if (!manualContent.trim()) { toast('Écrivez votre post avant de continuer', 'error'); return }
    if (!selectedPlatforms.length) { toast('Sélectionnez au moins une plateforme', 'error'); return }

    let mediaUrl: string | undefined

    if (manualFile && !uploadedMediaUrl) {
      setUploadingFile(true)
      try {
        const fd = new FormData()
        fd.append('file', manualFile)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        mediaUrl = data.url
        setUploadedMediaUrl(data.url)
      } catch (err: unknown) {
        toast(err instanceof Error ? err.message : 'Erreur upload', 'error')
        setUploadingFile(false)
        return
      }
      setUploadingFile(false)
    } else if (uploadedMediaUrl) {
      mediaUrl = uploadedMediaUrl
    }

    setActionModal({
      content: manualContent,
      platforms: selectedPlatforms,
      mediaUrls: mediaUrl ? [mediaUrl] : [],
      aiGenerated: false,
    })
  }

  async function saveVariantPost(status: 'draft' | 'scheduled', scheduledAt?: string): Promise<string> {
    const content = activePreview ? variants[activePreview] : Object.values(variants)[0] || ''
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        platforms: selectedPlatforms,
        media_urls: (() => { const u = aiUploadedUrl || generatedImageUrl; return u ? [u] : [] })(),
        ai_generated: true,
        status,
        scheduled_at: scheduledAt,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erreur')
    return data.id
  }

  async function handlePublishVariant() {
    if (postAction) return
    const mediaUrl = aiUploadedUrl || generatedImageUrl
    if (selectedPlatforms.includes('instagram') && !mediaUrl) {
      toast('Veuillez ajouter une image pour Instagram.', 'warning')
      return
    }
    setPostAction(true)
    try {
      const id = await saveVariantPost('draft')
      const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast('Post publié !', 'success')
      setVariants({})
      sessionStorage.removeItem('social_ia_create_draft')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally { setPostAction(false) }
  }

  async function handleSaveDraft() {
    if (postAction) return
    setPostAction(true)
    try {
      await saveVariantPost('draft')
      toast('Post sauvegardé en brouillon', 'success')
      setVariants({})
      sessionStorage.removeItem('social_ia_create_draft')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally { setPostAction(false) }
  }

  async function handleRejectVariant() {
    if (postAction) return
    setPostAction(true)
    try {
      const content = selectedPlatforms[0] ? variants[selectedPlatforms[0]] : Object.values(variants)[0]
      await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: content || '',
          platforms: selectedPlatforms,
          media_urls: (() => { const u = aiUploadedUrl || generatedImageUrl; return u ? [u] : [] })(),
          ai_generated: true,
          status: 'failed',
        }),
      })
      toast('Post rejeté', 'success')
      setVariants({})
      sessionStorage.removeItem('social_ia_create_draft')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally { setPostAction(false) }
  }

  async function handleScheduleVariant() {
    if (!schedDate || !schedTime) { toast('Choisissez une date et une heure', 'error'); return }
    const scheduledAt = new Date(`${schedDate}T${schedTime}`).toISOString()
    if (new Date(scheduledAt) <= new Date()) { toast('La date doit être dans le futur', 'error'); return }
    if (postAction) return
    setPostAction(true)
    try {
      const id = await saveVariantPost('scheduled', scheduledAt)
      const res = await fetch(`/api/posts/${id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast('Post programmé !', 'success')
      setVariants({})
      sessionStorage.removeItem('social_ia_create_draft')
      setShowSchedule(false)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally { setPostAction(false) }
  }

  const hasVariants = Object.keys(variants).length > 0
  const hasWeek = weekPosts.length > 0

  return (
    <div className="pc">

      {/* Overlay génération */}
      {overlayOpen && (
        <div className="gen-ov on">
          <div className="spin" />
          <div className="gen-label">Génération en cours…</div>
          <div className="gen-steps">
            {overlaySteps.map((label, i) => (
              <div key={i} className={`gs${stepStates[i] ? ' ' + stepStates[i] : ''}`}>
                <div className="gs-d" />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Header + boutons */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <div style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: '#F4F4F6', letterSpacing: '-.02em' }}>
            {mode === 'manual' ? 'Créer manuellement' : 'Créer un post'}
          </div>
          <div style={{ fontSize: '.82rem', color: '#8E8E98', marginTop: '.2rem' }}>
            {mode === 'manual'
              ? 'Rédigez votre contenu et importez vos médias'
              : 'Brief optionnel — l\'IA trouve les idées pour vous'}
          </div>
        </div>

        <div style={{ display: 'flex', gap: '.5rem' }}>
          <button className="btn-gen" onClick={handleGenerate} style={{ padding: '.65rem 1.1rem', fontSize: '.83rem' }}>
            <div className="btn-gen-dot" />
            Générer un post
          </button>
          <button
            onClick={isPro ? handleGenerateWeek : undefined}
            title={isPro ? undefined : 'Réservé aux plans Premium et Business'}
            style={{
              background: 'transparent',
              border: `1px solid ${isPro ? '#27272D' : '#1E1E24'}`,
              color: isPro ? '#8E8E98' : '#52525C',
              padding: '.65rem 1.1rem', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif",
              fontSize: '.83rem', fontWeight: 500,
              cursor: isPro ? 'pointer' : 'not-allowed',
              display: 'flex', alignItems: 'center', gap: '.5rem', whiteSpace: 'nowrap', transition: '.15s',
              opacity: isPro ? 1 : .55,
            }}
            onMouseEnter={e => { if (isPro) { e.currentTarget.style.borderColor = '#303038'; e.currentTarget.style.color = '#F4F4F6' } }}
            onMouseLeave={e => { if (isPro) { e.currentTarget.style.borderColor = '#27272D'; e.currentTarget.style.color = '#8E8E98' } }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            Posts de la semaine
            {!isPro && <span className="v2tag" style={{ background: 'rgba(251,191,36,.12)', color: '#FBBF24', border: '1px solid rgba(251,191,36,.2)' }}>Pro</span>}
          </button>
          <button
            onClick={() => setMode(mode === 'manual' ? 'single' : 'manual')}
            style={{
              background: mode === 'manual' ? 'rgba(59,123,246,.1)' : 'transparent',
              border: `1px solid ${mode === 'manual' ? '#3B7BF6' : '#27272D'}`,
              color: mode === 'manual' ? '#3B7BF6' : '#8E8E98',
              padding: '.65rem 1.1rem', borderRadius: '8px', fontFamily: "'DM Sans', sans-serif",
              fontSize: '.83rem', fontWeight: 500, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '.5rem', whiteSpace: 'nowrap', transition: '.15s',
            }}
          >
            <Pencil size={13} />
            Créer moi-même
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Colonne gauche — Config */}
        <div className="space-y-4">

          {mode !== 'manual' && (
            <div className="card p-5">
              <label className="label">
                Sujet / brief
                <span className="text-t3 font-normal ml-1 text-xs">(optionnel)</span>
              </label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="Laissez vide pour que l'IA choisisse le sujet automatiquement..."
                value={brief}
                onChange={e => setBrief(e.target.value)}
              />
            </div>
          )}

          <div className="card p-5">
            <label className="label">Ton</label>
            <div className="grid grid-cols-2 gap-2">
              {TONES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTone(t.value)}
                  className={`px-3 py-2 rounded-lg text-sm border transition-colors ${
                    tone === t.value ? 'border-accent bg-accent/10 text-accent' : 'border-b1 text-t2 hover:border-b2 hover:text-t1'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <label className="label">Plateformes</label>
            <div className="flex flex-wrap gap-2">
              {ALL_PLATFORMS.map(p => {
                const isLocked = !FREE_PLATFORMS.includes(p)
                const isSelected = selectedPlatforms.includes(p)
                return (
                  <button
                    key={p}
                    onClick={() => !isLocked && togglePlatform(p)}
                    className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                      isLocked ? 'border-b1 text-t3 cursor-not-allowed opacity-50' :
                      isSelected ? 'border-accent bg-accent/10 text-accent' :
                      'border-b1 text-t2 hover:border-b2 hover:text-t1'
                    }`}
                  >
                    {PLATFORM_NAMES[p]}
                    {isLocked && <span className="ml-1 text-xs opacity-60">Pro</span>}
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-4">

          {/* Mode manuel */}
          {mode === 'manual' && (
            <div className="manual-form">
              <div className="card p-5">
                <label className="label">Votre post</label>
                <textarea
                  className="input resize-none"
                  rows={6}
                  placeholder="Rédigez votre contenu ici..."
                  value={manualContent}
                  onChange={e => setManualContent(e.target.value)}
                />
                <div style={{ fontSize: '.75rem', color: '#52525C', marginTop: '.4rem', textAlign: 'right' }}>
                  {manualContent.length} caractères
                </div>
              </div>

              {/* Upload image/vidéo */}
              <div className="card p-5">
                <label className="label">Image ou vidéo <span className="text-t3 font-normal text-xs">(optionnel)</span></label>
                {manualPreviewUrl ? (
                  <div style={{ position: 'relative' }}>
                    {manualFile?.type.startsWith('video') ? (
                      <video src={manualPreviewUrl} controls className="manual-preview-img" />
                    ) : (
                      <img src={manualPreviewUrl} alt="Aperçu" className="manual-preview-img" />
                    )}
                    <button
                      onClick={() => { setManualFile(null); setManualPreviewUrl(null); setUploadedMediaUrl(null) }}
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(0,0,0,.7)', border: 'none', borderRadius: '50%',
                        width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', color: '#fff',
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <label className="manual-upload">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                    <Upload size={22} color="#52525C" />
                    <div className="manual-upload-label">Cliquez pour importer une image ou vidéo</div>
                    <div style={{ fontSize: '.74rem', color: '#3f3f46', marginTop: '.25rem' }}>JPG, PNG, MP4, MOV — max 50 Mo</div>
                  </label>
                )}
              </div>

              <button
                onClick={handleManualSubmit}
                disabled={uploadingFile}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {uploadingFile ? (
                  <>
                    <div style={{ width: '14px', height: '14px', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                    Upload en cours…
                  </>
                ) : (
                  <>
                    <Send size={14} />
                    Continuer
                  </>
                )}
              </button>
            </div>
          )}

          {/* Mode post unique IA */}
          {mode === 'single' && (
            hasVariants ? (
              <>
                {selectedPlatforms.filter(p => variants[p]).map(p => (
                  <div key={p} className="space-y-2">
                    <div style={{ fontSize: '.75rem', color: '#8E8E98', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 600 }}>
                      {PLATFORM_NAMES[p]}
                    </div>
                    <PlatformPreview platform={p} content={variants[p]!} />
                    <div className="card p-4">
                      <label className="label">Modifier le texte</label>
                      <textarea
                        className="input resize-none"
                        rows={5}
                        value={variants[p] || ''}
                        onChange={e => setVariants(prev => ({ ...prev, [p]: e.target.value }))}
                      />
                    </div>
                  </div>
                ))}
                {/* Image générée */}
                {generatedImageUrl && (
                  <div className="card overflow-hidden">
                    <img src={generatedImageUrl} alt="Image générée" style={{ width: '100%', display: 'block' }} />
                  </div>
                )}

                {/* Bouton générer image */}
                <button
                  onClick={isPro ? handleGenerateImage : undefined}
                  disabled={generatingImage || !isPro}
                  title={!isPro ? 'Génération d\'image réservée aux plans Premium et Business' : undefined}
                  className="btn-outline w-full flex items-center justify-center gap-2 py-2.5"
                  style={!isPro ? { opacity: .45, cursor: 'not-allowed' } : undefined}
                >
                  {generatingImage ? (
                    <>
                      <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,.2)', borderTopColor: '#8E8E98', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                      Génération de l'image…
                    </>
                  ) : (
                    <>
                      <Image size={14} />
                      {generatedImageUrl ? 'Régénérer l\'image' : 'Générer une image'}
                      {!isPro && <span className="v2tag" style={{ background: 'rgba(251,191,36,.12)', color: '#FBBF24', border: '1px solid rgba(251,191,36,.2)', marginLeft: '.3rem' }}>Pro</span>}
                    </>
                  )}
                </button>

                {/* Importer une photo (mode IA — free users) */}
                <input
                  ref={aiFileRef}
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleAiImageUpload(f) }}
                />
                {aiUploadedUrl ? (
                  <div className="card overflow-hidden" style={{ position: 'relative' }}>
                    <img src={aiUploadedUrl} alt="Photo importée" style={{ width: '100%', display: 'block' }} />
                    <button
                      onClick={() => setAiUploadedUrl(null)}
                      style={{
                        position: 'absolute', top: '8px', right: '8px',
                        background: 'rgba(0,0,0,.7)', border: 'none', borderRadius: '50%',
                        width: '28px', height: '28px', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', cursor: 'pointer', color: '#fff',
                      }}
                    >
                      <X size={13} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => aiFileRef.current?.click()}
                    className="btn-outline w-full flex items-center justify-center gap-2 py-2.5"
                  >
                    <Upload size={14} />
                    Importer une photo
                  </button>
                )}

                {hasVariants && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem', marginTop: '1rem' }}>
                    <div style={{ fontSize: '.8rem', color: '#52525C', textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 500 }}>
                      Que faire avec ce post ?
                    </div>
                    <div style={{ display: 'flex', gap: '.5rem', flexWrap: 'wrap' }}>
                      <button className="modal-btn modal-btn-blue" style={{ flex: 1, minWidth: '140px' }} onClick={handlePublishVariant}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
                        Publier maintenant
                      </button>
                      <button className="modal-btn modal-btn-border" style={{ flex: 1, minWidth: '140px' }} onClick={() => setShowSchedule(p => !p)}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                        Programmer
                      </button>
                      <button className="modal-btn modal-btn-border" style={{ flex: 1, minWidth: '140px' }} onClick={handleSaveDraft}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                        Brouillon
                      </button>
                      <button className="modal-btn modal-btn-red" style={{ flex: 1, minWidth: '140px' }} onClick={handleRejectVariant}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        Rejeter
                      </button>
                    </div>
                    {showSchedule && (
                      <div className="modal-sched" style={{ background: '#111113', border: '1px solid #27272D', borderRadius: '10px', padding: '1rem' }}>
                        <div className="modal-sched-row">
                          <input type="date" value={schedDate} min={new Date(Date.now() + 5*60000).toISOString().split('T')[0]} onChange={e => setSchedDate(e.target.value)} />
                          <input type="time" value={schedTime} onChange={e => setSchedTime(e.target.value)} />
                        </div>
                        <button className="modal-btn modal-btn-blue" onClick={handleScheduleVariant}>
                          Confirmer la programmation
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="card h-72 flex flex-col items-center justify-center text-center p-8">
                <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>✨</div>
                <p className="text-t2 font-medium mb-1 text-sm">Aperçu du post</p>
                <p className="text-t3 text-xs">Cliquez sur "Générer un post" — le brief est optionnel</p>
              </div>
            )
          )}

          {/* Mode semaine */}
          {mode === 'week' && (
            hasWeek ? (
              <div className="space-y-3">
                <p className="text-t2 text-sm font-medium">{weekPosts.length} posts générés</p>
                {weekPosts.map(post => (
                  <div key={post.day} className="card overflow-hidden">
                    <button
                      onClick={() => setExpandedDay(expandedDay === post.day ? null : post.day)}
                      className="w-full flex items-center justify-between p-4 hover:bg-s2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div style={{
                          width: '30px', height: '30px', borderRadius: '7px',
                          background: 'rgba(59,123,246,.1)', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: '#3B7BF6', fontSize: '.8rem', fontWeight: 700, flexShrink: 0,
                        }}>
                          J{post.day}
                        </div>
                        <span className="text-t2 text-sm font-medium">{post.topic}</span>
                      </div>
                      {expandedDay === post.day ? <ChevronUp size={15} className="text-t3" /> : <ChevronDown size={15} className="text-t3" />}
                    </button>
                    {expandedDay === post.day && (
                      <div className="px-4 pb-4 space-y-3 border-t border-b1">
                        {selectedPlatforms.filter(p => post.variants[p]).map(p => (
                          <div key={p}>
                            <p className="text-t3 text-xs font-medium mt-3 mb-1">{PLATFORM_NAMES[p]}</p>
                            <textarea
                              className="input resize-none text-sm"
                              rows={4}
                              value={post.variants[p] || ''}
                              onChange={e => {
                                const updated = [...weekPosts]
                                updated[post.day - 1] = { ...post, variants: { ...post.variants, [p]: e.target.value } }
                                setWeekPosts(updated)
                              }}
                            />
                          </div>
                        ))}
                        <button
                          onClick={() => {
                            const content = selectedPlatforms[0] ? post.variants[selectedPlatforms[0]] : Object.values(post.variants)[0]
                            if (content) setActionModal({ content, platforms: selectedPlatforms, aiGenerated: true })
                          }}
                          className="btn-primary w-full flex items-center justify-center gap-2 py-2 text-sm mt-2"
                        >
                          <Send size={13} />
                          Publier ou programmer ce post
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="card h-72 flex flex-col items-center justify-center text-center p-8">
                <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>📅</div>
                <p className="text-t2 font-medium mb-1 text-sm">Posts de la semaine</p>
                <p className="text-t3 text-xs">Cliquez sur "Posts de la semaine" pour générer 7 posts d'un coup</p>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}
