'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Send, Clock, Save, ArrowLeft, X } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const STEPS = [
  'Analyse du profil de marque',
  'Tendances du secteur',
  'Génération des sujets',
  'Rédaction captions & hashtags',
  'Sélection des images',
  'Finalisation',
]

function PostActionModal({ content, imageUrl, onClose }: {
  content: string
  imageUrl: string | null
  onClose: () => void
}) {
  const { toast } = useToast()
  const [view, setView] = useState<'main' | 'schedule'>('main')
  const [schedDate, setSchedDate] = useState('')
  const [schedTime, setSchedTime] = useState('')
  const [loading, setLoading] = useState(false)

  async function savePost(): Promise<string> {
    const res = await fetch('/api/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content,
        platforms: ['instagram', 'facebook'],
        media_urls: imageUrl ? [imageUrl] : [],
        ai_generated: true,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erreur')
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

  async function handlePublish() {
    setLoading(true)
    try {
      const id = await savePost()
      const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast('Post publié !', 'success')
      onClose()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally { setLoading(false) }
  }

  async function handleSchedule() {
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
      toast('Post programmé !', 'success')
      onClose()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally { setLoading(false) }
  }

  const minDate = new Date(Date.now() + 5 * 60 * 1000)
  const minDateStr = minDate.toISOString().split('T')[0]
  const minTimeStr = minDate.toTimeString().slice(0, 5)

  return (
    <div className="modal-ov" onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-box" style={{ maxWidth: '480px' }}>

        {/* Aperçu du post */}
        {imageUrl && (
          <img src={imageUrl} alt="" style={{ width: '100%', borderRadius: '10px', marginBottom: '1.25rem', maxHeight: '200px', objectFit: 'cover' }} />
        )}
        <div style={{
          background: 'var(--s2)', borderRadius: '8px', padding: '.75rem', marginBottom: '1.25rem',
          fontSize: '.83rem', color: '#C4C4CC', lineHeight: 1.6,
          maxHeight: '120px', overflow: 'hidden',
          overflowY: 'auto',
        }}>
          {content}
        </div>

        {view === 'main' ? (
          <>
            <div className="modal-actions">
              <button className="modal-btn modal-btn-blue" onClick={handlePublish} disabled={loading}>
                <Send size={15} /> Publier maintenant
              </button>
              <button className="modal-btn modal-btn-border" onClick={() => setView('schedule')} disabled={loading}>
                <Clock size={15} /> Programmer pour plus tard
              </button>
              <hr className="modal-sep" />
              <button className="modal-btn modal-btn-border" onClick={handleDraft} disabled={loading}>
                <Save size={15} /> Sauvegarder en brouillon
              </button>
              <button className="modal-btn modal-btn-ghost" onClick={onClose}>Annuler</button>
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
                <input type="date" value={schedDate} min={minDateStr} onChange={e => setSchedDate(e.target.value)} />
                <input type="time" value={schedTime} min={schedDate === minDateStr ? minTimeStr : undefined} onChange={e => setSchedTime(e.target.value)} />
              </div>
              <button className="modal-btn modal-btn-blue" onClick={handleSchedule} disabled={loading}>
                <Clock size={15} /> {loading ? 'Programmation...' : 'Confirmer'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export function GenerateButton({ compact }: { compact?: boolean } = {}) {
  const { toast } = useToast()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [stepStates, setStepStates] = useState<string[]>(STEPS.map(() => ''))
  const [modal, setModal] = useState<{ content: string; imageUrl: string | null } | null>(null)

  async function startGen() {
    setStepStates(STEPS.map(() => ''))
    setOpen(true)
    let result: { content: string; imageUrl: string | null } | null = null

    // API en parallèle avec l'animation
    const apiPromise = (async () => {
      try {
        const res = await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ tone: 'professionnel', platforms: ['instagram', 'facebook'] }),
        })
        const data = await res.json()
        if (res.ok && data.variants) {
          const content = data.variants.instagram || data.variants.facebook || Object.values(data.variants)[0] as string
          result = { content, imageUrl: data.imageUrl || null }
        }
      } catch { /* silencieux */ }
    })()

    // Animation des étapes
    for (let i = 0; i < STEPS.length; i++) {
      setStepStates(prev => prev.map((_, idx) =>
        idx === i ? 'on' : idx < i ? 'done' : ''
      ))
      await new Promise(r => setTimeout(r, 680))
    }
    setStepStates(STEPS.map(() => 'done'))
    await apiPromise
    await new Promise(r => setTimeout(r, 400))
    setOpen(false)

    if (result) {
      router.refresh()
      setModal(result)
    } else {
      toast('Erreur de génération', 'error')
    }
  }

  return (
    <>
      {compact ? (
        <button
          onClick={startGen}
          className="upgrade-btn"
          title="Générer des posts IA"
          style={{ background: 'linear-gradient(135deg,#8b5cf6,#6366f1)' }}
        >
          <svg viewBox="0 0 24 24" style={{ width: 10, height: 10, stroke: '#fff', fill: 'none', strokeWidth: 2.5, strokeLinecap: 'round' }}>
            <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/>
          </svg>
          Générer
        </button>
      ) : (
        <button className="btn-gen" onClick={startGen}>
          <div className="btn-gen-dot" />
          Générer maintenant
        </button>
      )}

      {open && (
        <div className="gen-ov on">
          <div className="spin" />
          <div className="gen-label">Génération en cours…</div>
          <div className="gen-steps">
            {STEPS.map((label, i) => (
              <div key={i} className={`gs${stepStates[i] ? ' ' + stepStates[i] : ''}`}>
                <div className="gs-d" />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {modal && (
        <PostActionModal
          content={modal.content}
          imageUrl={modal.imageUrl}
          onClose={() => setModal(null)}
        />
      )}
    </>
  )
}
