'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import {
  Save, Send, Upload, X, ArrowLeft, Clock,
  ChevronDown, Settings2, Layers, Zap, Check, Target,
} from 'lucide-react'
import { IconInstagram, IconFacebook, IconTikTok, IconTwitterX, IconLinkedIn, IconYouTube, IconPinterest } from '@/components/icons/BrandIcons'
import {
  PLATFORM_NAMES, FREE_PLATFORMS, OBJECTIVE_LABELS, OBJECTIVE_DEFAULTS, OBJECTIVE_DESCRIPTIONS,
  LENGTH_LABELS, FORMAT_LABELS, POSTTONE_LABELS, CTA_LABELS, PLATFORM_CONSTRAINTS_INFO,
  type Platform, type PostObjective, type DistributionMode, type GenerationParams,
  type PostLength, type PostFormat, type PostTone, type PostCTA,
} from '@/types'

// ─── Constantes ───────────────────────────────────────────────────────────────

const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin', 'youtube', 'pinterest']

const PLATFORM_COLORS: Record<Platform, string> = {
  instagram: '#E1306C', facebook: '#1877F2', tiktok: '#000',
  twitter: '#1DA1F2', linkedin: '#0077B5', youtube: '#FF0000', pinterest: '#E60023',
}

const STEPS_SINGLE = [
  'Analyse du profil de marque',
  'Recherche d\'idées créatives',
  'Rédaction du post',
  'Optimisation par plateforme',
  'Prêt pour validation',
]

function PlatformIcon({ platform, size = 16 }: { platform: Platform; size?: number }) {
  switch (platform) {
    case 'instagram': return <IconInstagram size={size} />
    case 'facebook':  return <IconFacebook  size={size} />
    case 'tiktok':    return <IconTikTok    size={size} />
    case 'twitter':   return <IconTwitterX  size={size} />
    case 'linkedin':  return <IconLinkedIn  size={size} />
    case 'youtube':   return <IconYouTube   size={size} />
    case 'pinterest': return <IconPinterest size={size} />
  }
}

// ─── Chip selector helper ──────────────────────────────────────────────────────

function ChipGroup<T extends string>({
  options, value, onChange,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
      {options.map(o => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          style={{
            padding: '.3rem .75rem', borderRadius: '6px', fontSize: '.78rem', fontWeight: 500,
            border: `1px solid ${value === o.value ? 'var(--accent)' : 'var(--b1)'}`,
            background: value === o.value ? 'rgba(123,92,245,.12)' : 'transparent',
            color: value === o.value ? 'var(--accent)' : 'var(--t2)',
            cursor: 'pointer', transition: '.12s',
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

// ─── Popup Autres paramètres ──────────────────────────────────────────────────

function ParamsPopup({
  params, onChange, onClose,
}: {
  params: GenerationParams
  onChange: (p: GenerationParams) => void
  onClose: () => void
}) {
  const [local, setLocal] = useState<GenerationParams>(params)

  // Fermer avec Échap
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function save() { onChange(local); onClose() }

  const lengthOptions: { value: PostLength; label: string }[] = [
    { value: 'court', label: 'Court' },
    { value: 'moyen', label: 'Moyen' },
    { value: 'long',  label: 'Long'  },
  ]
  const formatOptions: { value: PostFormat; label: string }[] = [
    { value: 'direct',   label: 'Direct' },
    { value: 'liste',    label: 'Listé' },
    { value: 'narratif', label: 'Narratif' },
    { value: 'question', label: 'Question' },
  ]
  const toneOptions: { value: PostTone; label: string }[] = [
    { value: 'professionnel', label: 'Professionnel' },
    { value: 'decontracte',   label: 'Décontracté' },
    { value: 'emotionnel',    label: 'Émotionnel' },
    { value: 'expert',        label: 'Expert' },
  ]
  const ctaOptions: { value: PostCTA; label: string }[] = [
    { value: 'acheter',        label: 'Acheter' },
    { value: 'commenter',      label: 'Commenter' },
    { value: 'partager',       label: 'Partager' },
    { value: 'en_savoir_plus', label: 'En savoir plus' },
    { value: 'aucun',          label: 'Aucun' },
  ]

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(6px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="anim-fade-scale" style={{ background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: '16px', width: '100%', maxWidth: '440px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--b1)' }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--t1)' }}>Autres paramètres</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: '4px' }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Longueur */}
          <div>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', marginBottom: '.5rem' }}>Longueur</label>
            <ChipGroup options={lengthOptions} value={local.length} onChange={v => setLocal(p => ({ ...p, length: v }))} />
          </div>

          {/* Format */}
          <div>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', marginBottom: '.5rem' }}>Format</label>
            <ChipGroup options={formatOptions} value={local.format} onChange={v => setLocal(p => ({ ...p, format: v }))} />
          </div>

          {/* Ton */}
          <div>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', marginBottom: '.5rem' }}>Ton</label>
            <ChipGroup options={toneOptions} value={local.tone} onChange={v => setLocal(p => ({ ...p, tone: v }))} />
          </div>

          {/* CTA */}
          <div>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', marginBottom: '.5rem' }}>CTA</label>
            <ChipGroup options={ctaOptions} value={local.cta} onChange={v => setLocal(p => ({ ...p, cta: v }))} />
          </div>

          {/* Note */}
          <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: '8px', padding: '.7rem .9rem', display: 'flex', gap: '.5rem' }}>
            <span style={{ fontSize: '.85rem', flexShrink: 0 }}>ℹ️</span>
            <p style={{ fontSize: '.73rem', color: 'var(--t3)', lineHeight: 1.55, margin: 0 }}>
              Ces paramètres sont définis selon votre objectif. Vous pouvez les ajuster selon vos préférences.
            </p>
          </div>

          {/* Terminer */}
          <button
            onClick={save}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.65rem' }}
          >
            <Check size={14} /> Terminer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Popup Plateforme ─────────────────────────────────────────────────────────

function PlatformPopup({
  selected, onChange,
  distributionMode, onDistributionChange,
  isPro, onClose,
}: {
  selected: Platform[]
  onChange: (p: Platform[]) => void
  distributionMode: DistributionMode
  onDistributionChange: (m: DistributionMode) => void
  isPro: boolean
  onClose: () => void
}) {
  const [localSelected, setLocalSelected] = useState<Platform[]>(selected)
  const [localMode, setLocalMode] = useState<DistributionMode>(distributionMode)

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  function toggle(p: Platform) {
    const isLocked = !isPro && !FREE_PLATFORMS.includes(p)
    if (isLocked) return
    setLocalSelected(prev =>
      prev.includes(p) ? (prev.length > 1 ? prev.filter(x => x !== p) : prev) : [...prev, p]
    )
  }

  function save() {
    onChange(localSelected)
    // Si une seule plateforme, toujours unified
    onDistributionChange(localSelected.length <= 1 ? 'unified' : localMode)
    onClose()
  }

  const effectiveMode = localSelected.length <= 1 ? 'unified' : localMode
  const quotas = effectiveMode === 'unified' ? 1 : localSelected.length

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.72)', backdropFilter: 'blur(6px)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="anim-fade-scale" style={{ background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: '16px', width: '100%', maxWidth: '420px', maxHeight: '90vh', overflow: 'auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--b1)' }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--t1)' }}>Plateformes</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: '4px' }}>
            <X size={17} />
          </button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Sélection des plateformes */}
          <div>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', marginBottom: '.6rem' }}>Plateformes disponibles</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '.5rem' }}>
              {ALL_PLATFORMS.map(p => {
                const isLocked = !isPro && !FREE_PLATFORMS.includes(p)
                const isSelected = localSelected.includes(p)
                return (
                  <button
                    key={p}
                    onClick={() => toggle(p)}
                    title={isLocked ? 'Réservé au plan Pro' : PLATFORM_NAMES[p]}
                    style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.3rem',
                      padding: '.6rem .4rem', borderRadius: '10px',
                      border: `1px solid ${isSelected && !isLocked ? PLATFORM_COLORS[p] + '60' : 'var(--b1)'}`,
                      background: isSelected && !isLocked ? PLATFORM_COLORS[p] + '12' : 'transparent',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? .35 : 1,
                      transition: '.12s',
                    }}
                  >
                    <div style={{ opacity: isLocked ? .5 : 1 }}>
                      <PlatformIcon platform={p} size={18} />
                    </div>
                    <span style={{ fontSize: '.6rem', color: isSelected && !isLocked ? PLATFORM_COLORS[p] : 'var(--t3)', fontWeight: 500 }}>
                      {PLATFORM_NAMES[p].split(' ')[0]}
                    </span>
                    {isLocked && (
                      <span style={{ fontSize: '.52rem', color: '#FBBF24', background: 'rgba(251,191,36,.12)', border: '1px solid rgba(251,191,36,.2)', borderRadius: '3px', padding: '0 4px', lineHeight: '1.5' }}>Pro</span>
                    )}
                    {isSelected && !isLocked && (
                      <div style={{ position: 'absolute', top: '4px', right: '4px' }}>
                        <Check size={10} color={PLATFORM_COLORS[p]} />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Mode de distribution — masqué si une seule plateforme */}
          {localSelected.length > 1 && (
            <div>
              <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', marginBottom: '.6rem' }}>Mode de distribution</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
                {([
                  { value: 'unified' as const, label: 'Unifié', desc: 'Même post distribué sur toutes les plateformes', quota: '1 quota utilisé' },
                  { value: 'custom' as const,  label: 'Personnalisé', desc: 'Post adapté et optimisé pour chaque plateforme', quota: '1 quota par plateforme' },
                ]).map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setLocalMode(opt.value)}
                    style={{
                      display: 'flex', alignItems: 'flex-start', gap: '.75rem', padding: '.75rem .9rem',
                      borderRadius: '10px', border: `1px solid ${localMode === opt.value ? 'var(--accent)' : 'var(--b1)'}`,
                      background: localMode === opt.value ? 'rgba(123,92,245,.08)' : 'transparent',
                      cursor: 'pointer', textAlign: 'left', transition: '.12s',
                    }}
                  >
                    <div style={{
                      width: '16px', height: '16px', borderRadius: '50%', flexShrink: 0, marginTop: '1px',
                      border: `2px solid ${localMode === opt.value ? 'var(--accent)' : 'var(--b1)'}`,
                      background: localMode === opt.value ? 'var(--accent)' : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {localMode === opt.value && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#fff' }} />}
                    </div>
                    <div>
                      <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--t1)', marginBottom: '.15rem' }}>{opt.label}</div>
                      <div style={{ fontSize: '.72rem', color: 'var(--t3)', lineHeight: 1.45 }}>{opt.desc}</div>
                      <div style={{ fontSize: '.68rem', color: localMode === opt.value ? 'var(--accent)' : 'var(--t3)', marginTop: '.25rem', fontWeight: 500 }}>{opt.quota}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Compteur de quotas */}
          <div style={{ background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: '8px', padding: '.65rem .9rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '.75rem', color: 'var(--t3)' }}>Quotas qui seront consommés</span>
            <span style={{ fontSize: '.82rem', fontWeight: 700, color: 'var(--accent)' }}>
              {quotas} génération{quotas > 1 ? 's' : ''}
            </span>
          </div>

          {/* Terminer */}
          <button
            onClick={save}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.65rem' }}
          >
            <Check size={14} /> Terminer
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Panneau aperçu live ───────────────────────────────────────────────────────

function LivePreviewPanel({
  objective, params, selectedPlatforms, distributionMode, brief, onClose,
}: {
  objective: PostObjective | null
  params: GenerationParams
  selectedPlatforms: Platform[]
  distributionMode: DistributionMode
  brief: string
  onClose: () => void
}) {
  const [reformulation, setReformulation] = useState<string | null>(null)
  const [reformulating, setReformulating] = useState(false)

  useEffect(() => {
    if (!brief.trim()) { setReformulation(null); return }
    const timer = setTimeout(async () => {
      setReformulating(true)
      try {
        const res = await fetch('/api/ai/reformulate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: brief.trim() }),
        })
        const data = await res.json()
        if (res.ok && data.reformulation) setReformulation(data.reformulation)
      } catch { /* silencieux */ }
      finally { setReformulating(false) }
    }, 1000)
    return () => clearTimeout(timer)
  }, [brief])

  const quotas = distributionMode === 'unified' ? 1 : selectedPlatforms.length

  const sep = (
    <div style={{ borderTop: '1px solid var(--b1)', margin: '.1rem 0' }} />
  )

  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: '14px', overflow: 'hidden', position: 'sticky', top: '80px' }}>
      {/* Titre */}
      <div style={{ padding: '.9rem 1.1rem', borderBottom: '1px solid var(--b1)', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
        <Zap size={14} style={{ color: 'var(--accent)', flexShrink: 0 }} />
        <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', flex: 1 }}>Aperçu en direct</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: '2px' }}>
          <X size={15} />
        </button>
      </div>

      <div style={{ padding: '.85rem 1.1rem', display: 'flex', flexDirection: 'column', gap: '.9rem' }}>

        {/* Objectif */}
        <div>
          <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.35rem' }}>Objectif</div>
          {objective ? (
            <div>
              <div style={{ fontSize: '.82rem', fontWeight: 600, color: 'var(--t1)', marginBottom: '.15rem' }}>{OBJECTIVE_LABELS[objective]}</div>
              <div style={{ fontSize: '.72rem', color: 'var(--t3)', lineHeight: 1.5 }}>{OBJECTIVE_DESCRIPTIONS[objective]}</div>
            </div>
          ) : (
            <div style={{ fontSize: '.75rem', color: 'var(--t3)', fontStyle: 'italic' }}>Non défini — cliquez sur «&nbsp;Objectif&nbsp;»</div>
          )}
        </div>

        {sep}

        {/* Plateformes */}
        <div>
          <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>Plateformes</div>
          {selectedPlatforms.length === 0 ? (
            <div style={{ fontSize: '.75rem', color: 'var(--t3)', fontStyle: 'italic' }}>Aucune sélectionnée</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
              {selectedPlatforms.map(p => {
                const info = PLATFORM_CONSTRAINTS_INFO[p]
                return (
                  <div key={p} style={{ display: 'flex', alignItems: 'flex-start', gap: '.5rem' }}>
                    <div style={{ flexShrink: 0, marginTop: '1px' }}>
                      <PlatformIcon platform={p} size={14} />
                    </div>
                    <div>
                      <span style={{ fontSize: '.75rem', fontWeight: 600, color: 'var(--t1)' }}>{PLATFORM_NAMES[p]}</span>
                      {info && (
                        <span style={{ fontSize: '.67rem', color: 'var(--t3)', marginLeft: '.4rem' }}>
                          {info.limit} · {info.hashtags} · {info.tone}
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {sep}

        {/* Distribution + quotas */}
        <div>
          <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.35rem' }}>Distribution</div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <span style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--t1)' }}>
                {distributionMode === 'unified' ? 'Unifié' : 'Personnalisé'}
              </span>
              <div style={{ fontSize: '.68rem', color: 'var(--t3)', marginTop: '.1rem' }}>
                {distributionMode === 'unified' ? 'Même post pour toutes les plateformes' : 'Post adapté par plateforme'}
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--accent)' }}>{quotas}</div>
              <div style={{ fontSize: '.62rem', color: 'var(--t3)' }}>quota{quotas > 1 ? 's' : ''}</div>
            </div>
          </div>
        </div>

        {/* Paramètres actifs — seulement si objectif choisi */}
        {objective && (
          <>
            {sep}
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.4rem' }}>Paramètres</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.3rem' }}>
                {[
                  { label: LENGTH_LABELS[params.length], color: '#7B5CF5' },
                  { label: FORMAT_LABELS[params.format], color: '#06B6D4' },
                  { label: POSTTONE_LABELS[params.tone],  color: '#10B981' },
                  { label: CTA_LABELS[params.cta],        color: '#F59E0B' },
                ].map(tag => (
                  <span key={tag.label} style={{
                    fontSize: '.67rem', fontWeight: 500, padding: '.2rem .55rem', borderRadius: '5px',
                    background: tag.color + '15', color: tag.color, border: `1px solid ${tag.color}30`,
                  }}>
                    {tag.label}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Brief reformulé */}
        {(brief.trim() || reformulating) && (
          <>
            {sep}
            <div>
              <div style={{ fontSize: '.65rem', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: '.35rem', display: 'flex', alignItems: 'center', gap: '.35rem' }}>
                Contexte IA
                {reformulating && (
                  <div style={{ width: '8px', height: '8px', border: '1.5px solid rgba(123,92,245,.3)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                )}
              </div>
              {reformulating ? (
                <div style={{ display: 'flex', gap: '.35rem', alignItems: 'center' }}>
                  <span style={{ fontSize: '.72rem', color: 'var(--t3)', fontStyle: 'italic' }}>Analyse du brief…</span>
                </div>
              ) : reformulation ? (
                <p style={{ fontSize: '.73rem', color: 'var(--t2)', lineHeight: 1.6, margin: 0 }}>{reformulation}</p>
              ) : null}
            </div>
          </>
        )}

      </div>
    </div>
  )
}

// ─── Modal action post (mode manuel) ─────────────────────────────────────────

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
    try { await savePost(); toast('Post sauvegardé en brouillon', 'success'); onClose() }
    catch (err: unknown) { toast(err instanceof Error ? err.message : 'Erreur', 'error') }
    finally { setLoading(false) }
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
      toast('Post publié avec succès !', 'success'); onClose()
    } catch (err: unknown) { toast(err instanceof Error ? err.message : 'Erreur de publication', 'error') }
    finally { setLoading(false) }
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
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scheduledAt }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
      toast('Post programmé avec succès !', 'success'); onClose()
    } catch (err: unknown) { toast(err instanceof Error ? err.message : 'Erreur de programmation', 'error') }
    finally { setLoading(false) }
  }

  const minDate    = new Date(Date.now() + 5 * 60 * 1000)
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
              <button className="modal-btn modal-btn-blue" onClick={handlePublish} disabled={loading}><Send size={15} />Publier maintenant</button>
              <button className="modal-btn modal-btn-border" onClick={() => setView('schedule')} disabled={loading}><Clock size={15} />Programmer pour plus tard</button>
              <hr className="modal-sep" />
              <button className="modal-btn modal-btn-border" onClick={handleDraft} disabled={loading}><Save size={15} />Sauvegarder en brouillon</button>
              <button className="modal-btn modal-btn-ghost" onClick={onClose} disabled={loading}>Annuler</button>
            </div>
          </>
        ) : (
          <>
            <button className="modal-back" onClick={() => setView('main')}><ArrowLeft size={13} /> Retour</button>
            <div className="modal-title">Programmer le post</div>
            <div className="modal-sub">Choisissez la date et l'heure de publication.</div>
            <div className="modal-sched">
              <div className="modal-sched-row">
                <input type="date" value={schedDate} min={minDateStr} onChange={e => setSchedDate(e.target.value)} />
                <input type="time" value={schedTime} min={schedDate === minDateStr ? minTimeStr : undefined} onChange={e => setSchedTime(e.target.value)} />
              </div>
              <button className="modal-btn modal-btn-blue" onClick={handleSchedule} disabled={loading}>
                <Clock size={15} />{loading ? 'Programmation...' : 'Confirmer la programmation'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Icônes d'objectif (petites, colorées) ────────────────────────────────────

const OBJ_COLORS: Record<string, string> = {
  vendre: '#EF4444', engager: '#7B5CF5', eduquer: '#06B6D4',
  inspirer: '#F59E0B', annoncer: '#10B981', fideliser: '#EC4899',
}

function ObjIcon({ objective, active, size = 13 }: { objective: string; active: boolean; size?: number }) {
  const color = OBJ_COLORS[objective] || (active ? 'var(--accent)' : 'var(--t3)')
  const s = size
  switch (objective) {
    case 'vendre':    return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
    case 'engager':   return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    case 'eduquer':   return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
    case 'inspirer':  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
    case 'annoncer':  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    case 'fideliser': return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2.2" strokeLinecap="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
    default:          return <div style={{ width: s, height: s, borderRadius: '50%', background: color }} />
  }
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function CreatePage() {
  const { toast }  = useToast()
  const router     = useRouter()
  const fileRef    = useRef<HTMLInputElement>(null)
  const objMenuRef = useRef<HTMLDivElement>(null)

  // Mode : AI (défaut) ou manuel (?mode=manual)
  const [mode, setMode] = useState<'ai' | 'manual'>('ai')

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search)
      if (p.get('mode') === 'manual') setMode('manual')
    }
  }, [])

  // ── Paramètres IA ──
  const [objective, setObjective]           = useState<PostObjective | null>(null)
  const [objectiveMenuOpen, setObjMenuOpen] = useState(false)
  const [brief, setBrief]                   = useState('')
  const [params, setParams]                 = useState<GenerationParams>({
    length: 'moyen', format: 'direct', tone: 'professionnel', cta: 'aucun',
  })
  const [distributionMode, setDistributionMode] = useState<DistributionMode>('unified')
  const [selectedPlatforms, setSelectedPlatforms] = useState<Platform[]>(['instagram'])

  // ── Popups ──
  const [showParamsPopup,   setShowParamsPopup]   = useState(false)
  const [showPlatformPopup, setShowPlatformPopup] = useState(false)
  const [showLive,          setShowLive]          = useState(false)

  // ── Résultats IA ──
  const [variants,           setVariants]          = useState<Partial<Record<Platform, string>>>({})
  const [aiUploadedUrl,      setAiUploadedUrl]     = useState<string | null>(null)
  const [generatedImageUrl,  setGeneratedImageUrl] = useState<string | null>(null)
  const [quotaUsed,          setQuotaUsed]         = useState(0)
  const [quotaLimit,         setQuotaLimit]        = useState<number | 'unlimited'>('unlimited')

  // ── Overlay ──
  const [overlayOpen,  setOverlayOpen]  = useState(false)
  const [overlaySteps, setOverlaySteps] = useState<string[]>([])
  const [stepStates,   setStepStates]   = useState<string[]>([])

  // ── Mode manuel ──
  const [manualContent,    setManualContent]    = useState('')
  const [manualFile,       setManualFile]       = useState<File | null>(null)
  const [manualPreviewUrl, setManualPreviewUrl] = useState<string | null>(null)
  const [uploadedMediaUrl, setUploadedMediaUrl] = useState<string | null>(null)
  const [uploadingFile,    setUploadingFile]    = useState(false)
  const [actionModal, setActionModal] = useState<{
    content: string; platforms: Platform[]; mediaUrls?: string[]; aiGenerated: boolean
  } | null>(null)

  // ── Plan ──
  const [isPro, setIsPro] = useState(false)

  // ──────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    createClient().from('users').select('plan').single().then(({ data }) => {
      if (data) setIsPro(true) // toutes les fonctionnalités débloquées
    })
    fetch('/api/brand').then(r => r.ok ? r.json() : null).then(b => {
      if (b?.tone) {
        // Mapper l'ancien GenerateTone vers PostTone si possible
        const toneMap: Record<string, PostTone> = {
          professionnel: 'professionnel', decontracte: 'decontracte',
          inspirant: 'emotionnel', humoristique: 'decontracte',
          emotionnel: 'emotionnel', expert: 'expert',
        }
        const mapped = toneMap[b.tone as string]
        if (mapped) setParams(p => ({ ...p, tone: mapped }))
      }
    }).catch(() => {})
  }, [])

  // Restaurer brouillon sessionStorage (brief + objective toujours vides au démarrage)
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('social_ia_create_draft')
      if (saved) {
        const d = JSON.parse(saved)
        // brief et objective ne sont PAS restaurés — toujours commencer vide
        if (d.params)                    setParams(d.params)
        if (d.selectedPlatforms)         setSelectedPlatforms(d.selectedPlatforms)
        if (d.distributionMode)          setDistributionMode(d.distributionMode)
        if (d.manualContent !== undefined) setManualContent(d.manualContent)
      }
    } catch { /* ignore */ }
  }, [])

  // Persister brouillon
  useEffect(() => {
    try {
      sessionStorage.setItem('social_ia_create_draft', JSON.stringify({
        brief, params, objective, selectedPlatforms, distributionMode,
        variants, manualContent, aiUploadedUrl, generatedImageUrl,
      }))
    } catch { /* ignore */ }
  }, [brief, params, objective, selectedPlatforms, distributionMode, variants, manualContent, aiUploadedUrl, generatedImageUrl])

  // Pré-remplir params quand l'objectif change
  useEffect(() => {
    if (objective) setParams(OBJECTIVE_DEFAULTS[objective])
  }, [objective])

  // Auto-détecter l'objectif à partir du brief (debounce 1.4s)
  const [aiDetecting, setAiDetecting] = useState(false)
  const [autoDetected, setAutoDetected] = useState(false)
  useEffect(() => {
    if (brief.trim().length < 8) return
    if (objective && !autoDetected) return // objectif choisi manuellement → pas d'override
    const timer = setTimeout(async () => {
      setAiDetecting(true)
      try {
        const res = await fetch('/api/ai/detect-objective', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ brief: brief.trim() }),
        })
        const data = await res.json()
        if (res.ok && data.objective && data.objective !== objective) {
          setObjective(data.objective as PostObjective)
          setAutoDetected(true)
        }
      } catch { /* silencieux */ }
      finally { setAiDetecting(false) }
    }, 1400)
    return () => clearTimeout(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brief])

  // Fermer le menu objectif si clic extérieur
  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (objMenuRef.current && !objMenuRef.current.contains(e.target as Node))
        setObjMenuOpen(false)
    }
    if (objectiveMenuOpen) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [objectiveMenuOpen])

  // ──────────────────────────────────────────────────────────────────────────

  async function runOverlay(steps: string[], apiFn: () => Promise<void>) {
    setOverlaySteps(steps)
    setStepStates(steps.map(() => ''))
    setOverlayOpen(true)
    const apiPromise = apiFn()
    for (let i = 0; i < steps.length; i++) {
      setStepStates(prev => prev.map((_, idx) => idx === i ? 'on' : idx < i ? 'done' : ''))
      await new Promise(r => setTimeout(r, 680))
    }
    setStepStates(steps.map(() => 'done'))
    await apiPromise
    await new Promise(r => setTimeout(r, 400))
    setOverlayOpen(false)
  }

  async function handleGenerate() {
    if (!selectedPlatforms.length) { toast('Sélectionnez au moins une plateforme via "Plateforme"', 'error'); return }
    await runOverlay(STEPS_SINGLE, async () => {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief:            brief.trim() || undefined,
          tone:             params.tone,
          platforms:        selectedPlatforms,
          objective:        objective || undefined,
          length:           params.length,
          format:           params.format,
          cta:              params.cta,
          distributionMode: distributionMode,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast(
          data.code === 'DAILY_LIMIT_REACHED'
            ? 'Limite journalière atteinte — passez à Premium'
            : data.error || 'Erreur de génération',
          'error'
        )
        return
      }
      // Enregistrer les résultats et naviguer vers la page dédiée
      sessionStorage.setItem('social_ia_results', JSON.stringify({
        variants:    data.variants,
        platforms:   selectedPlatforms,
        objective,
        quotaUsed:   data.used  ?? 0,
        quotaLimit:  data.limit ?? 'unlimited',
        isPro,
      }))
      setBrief('')
      setObjective(null)
      setAutoDetected(false)
      sessionStorage.removeItem('social_ia_create_draft')
      router.push('/posts/results')
    })
  }

  async function savePost(
    platform: Platform, content: string, mediaUrl: string | null,
    status: 'draft' | 'scheduled', scheduledAt?: string,
  ): Promise<string> {
    const res = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content, platforms: [platform],
        media_urls: mediaUrl ? [mediaUrl] : [],
        ai_generated: true, status, scheduled_at: scheduledAt,
      }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Erreur')
    return data.id
  }

  async function handlePublishVariant(platform: Platform, content: string, imageUrl: string | null) {
    if (platform === 'instagram' && !imageUrl) {
      toast('Veuillez ajouter une image pour Instagram.', 'warning'); return
    }
    const id = await savePost(platform, content, imageUrl, 'draft')
    const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
  }

  async function handleSaveDraft(platform: Platform, content: string, imageUrl: string | null) {
    await savePost(platform, content, imageUrl, 'draft')
  }

  async function handleScheduleVariant(platform: Platform, content: string, imageUrl: string | null, scheduledAt: string) {
    if (new Date(scheduledAt) <= new Date()) throw new Error('La date doit être dans le futur')
    const id = await savePost(platform, content, imageUrl, 'draft')
    const res = await fetch(`/api/posts/${id}/schedule`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scheduledAt }),
    })
    if (!res.ok) { const d = await res.json(); throw new Error(d.error) }
  }

  // ── Mode manuel ──

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setManualFile(file); setManualPreviewUrl(URL.createObjectURL(file)); setUploadedMediaUrl(null)
  }

  async function handleManualSubmit() {
    if (!manualContent.trim()) { toast('Écrivez votre post avant de continuer', 'error'); return }
    if (!selectedPlatforms.length) { toast('Sélectionnez au moins une plateforme', 'error'); return }
    let mediaUrl: string | undefined
    if (manualFile && !uploadedMediaUrl) {
      setUploadingFile(true)
      try {
        const fd = new FormData(); fd.append('file', manualFile)
        const res = await fetch('/api/upload', { method: 'POST', body: fd })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error)
        mediaUrl = data.url; setUploadedMediaUrl(data.url)
      } catch (err: unknown) {
        toast(err instanceof Error ? err.message : 'Erreur upload', 'error')
        setUploadingFile(false); return
      }
      setUploadingFile(false)
    } else if (uploadedMediaUrl) {
      mediaUrl = uploadedMediaUrl
    }
    const variants: Partial<Record<string, string>> = {}
    const initialImages: Partial<Record<string, string>> = {}
    for (const p of selectedPlatforms) {
      variants[p] = manualContent
      if (mediaUrl) initialImages[p] = mediaUrl
    }
    try {
      sessionStorage.setItem('social_ia_results', JSON.stringify({
        variants,
        platforms: selectedPlatforms,
        objective: null,
        quotaUsed: 0,
        quotaLimit: 'unlimited',
        isPro: true,
        initialImages: Object.keys(initialImages).length > 0 ? initialImages : undefined,
      }))
    } catch {}
    router.push('/posts/results')
  }

  // ──────────────────────────────────────────────────────────────────────────

  const hasVariants = Object.keys(variants).length > 0

  // ── Label bouton objectif ──
  const objectiveBtnLabel = objective ? OBJECTIVE_LABELS[objective] : 'Objectif'

  return (
    <div className="pc" style={{ maxWidth: '1200px' }}>

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

      {/* Popups */}
      {showParamsPopup && (
        <ParamsPopup
          params={params}
          onChange={setParams}
          onClose={() => setShowParamsPopup(false)}
        />
      )}
      {showPlatformPopup && (
        <PlatformPopup
          selected={selectedPlatforms}
          onChange={setSelectedPlatforms}
          distributionMode={distributionMode}
          onDistributionChange={setDistributionMode}
          isPro={isPro}
          onClose={() => setShowPlatformPopup(false)}
        />
      )}

      {/* Modal action (mode manuel) */}
      {actionModal && (
        <PostActionModal
          {...actionModal}
          onClose={() => setActionModal(null)}
        />
      )}

      {/* ── Mode manuel ────────────────────────────────────────────────── */}
      {mode === 'manual' && (
        <div style={{ maxWidth: '480px' }}>
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', marginBottom: '1.5rem' }}>
            <button
              onClick={() => setMode('ai')}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', alignItems: 'center', padding: '4px', borderRadius: '6px', transition: '.12s' }}
              onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.background = 'var(--s2)' }}
              onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'none' }}
            >
              <ArrowLeft size={18} />
            </button>
            <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.15rem', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.02em' }}>
              Créer manuellement
            </h1>
          </div>

          {/* Plateformes */}
          <div style={{ background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: '14px', padding: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '.78rem', fontWeight: 600, color: 'var(--t2)', marginBottom: '.75rem' }}>
              Choisissez vos plateformes
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem', marginBottom: '1.25rem' }}>
              {ALL_PLATFORMS.map(p => {
                const isLocked   = !isPro && !FREE_PLATFORMS.includes(p)
                const isSelected = selectedPlatforms.includes(p)
                return (
                  <button
                    key={p}
                    onClick={() => {
                      if (isLocked) return
                      setSelectedPlatforms(prev =>
                        prev.includes(p)
                          ? prev.length > 1 ? prev.filter(x => x !== p) : prev
                          : [...prev, p]
                      )
                    }}
                    title={isLocked ? 'Plan Pro requis' : PLATFORM_NAMES[p]}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '.4rem',
                      padding: '.35rem .75rem', borderRadius: '8px', fontSize: '.8rem', fontWeight: 500,
                      border: `1px solid ${isLocked ? 'var(--b1)' : isSelected ? PLATFORM_COLORS[p] + '60' : 'var(--b1)'}`,
                      background: isSelected && !isLocked ? PLATFORM_COLORS[p] + '12' : 'transparent',
                      color: isLocked ? 'var(--t3)' : isSelected ? PLATFORM_COLORS[p] : 'var(--t2)',
                      cursor: isLocked ? 'not-allowed' : 'pointer',
                      opacity: isLocked ? .4 : 1, transition: '.12s',
                    }}
                  >
                    <PlatformIcon platform={p} size={14} />
                    {PLATFORM_NAMES[p]}
                    {isLocked && <span style={{ fontSize: '.6rem', color: '#FBBF24', marginLeft: '.1rem' }}>Pro</span>}
                  </button>
                )
              })}
            </div>
            <p style={{ fontSize: '.73rem', color: 'var(--t3)', marginBottom: '1rem', lineHeight: 1.5 }}>
              Vous rédigerez votre contenu directement dans l&apos;éditeur — une carte par plateforme.
            </p>
            <button
              onClick={() => {
                if (!selectedPlatforms.length) { toast('Sélectionnez au moins une plateforme', 'error'); return }
                const variants: Partial<Record<string, string>> = {}
                for (const p of selectedPlatforms) variants[p] = ''
                try {
                  sessionStorage.setItem('social_ia_results', JSON.stringify({
                    variants, platforms: selectedPlatforms,
                    objective: null, quotaUsed: 0, quotaLimit: 'unlimited', isPro: true,
                  }))
                } catch {}
                router.push('/posts/results')
              }}
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.7rem' }}
            >
              <Send size={14} /> Ouvrir l&apos;éditeur
            </button>
          </div>
        </div>
      )}

      {/* ── Mode IA ────────────────────────────────────────────────────── */}
      {mode === 'ai' && (
        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Colonne gauche : formulaire ── */}
          <div style={{ flex: 1, minWidth: 0 }}>

            {/* Header : titre + objectif + live */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '.75rem' }}>
              <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.25rem', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.02em' }}>
                Générer un post
              </h1>

              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>

              {/* Bouton Objectif */}
              <div ref={objMenuRef} style={{ position: 'relative' }}>
                <button
                  onClick={() => { setObjMenuOpen(o => !o); setAutoDetected(false) }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '.5rem',
                    padding: '.45rem .85rem', borderRadius: '8px',
                    border: `1px solid ${objective ? 'var(--accent)' : 'var(--b1)'}`,
                    background: objective ? 'rgba(123,92,245,.1)' : 'var(--card)',
                    color: objective ? 'var(--accent)' : 'var(--t2)',
                    cursor: 'pointer', fontSize: '.82rem', fontWeight: 500, transition: 'all .18s',
                  }}
                >
                  {aiDetecting ? (
                    <div style={{ width: '10px', height: '10px', border: '1.5px solid rgba(123,92,245,.25)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'rot .7s linear infinite', flexShrink: 0 }} />
                  ) : objective ? (
                    <ObjIcon objective={objective} active={true} size={12} />
                  ) : (
                    <Target size={12} style={{ flexShrink: 0, opacity: .4 }} />
                  )}
                  <span>{objectiveBtnLabel}</span>
                  <ChevronDown size={13} style={{ transition: 'transform .18s', transform: objectiveMenuOpen ? 'rotate(180deg)' : 'rotate(0)' }} />
                </button>

                {objectiveMenuOpen && (
                  <div className="anim-fade-down" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: '10px', padding: '.3rem', minWidth: '210px', boxShadow: '0 8px 32px rgba(0,0,0,.2)', zIndex: 60 }}>
                    {/* Aucun */}
                    <button
                      onClick={() => { setObjective(null); setAutoDetected(false); setObjMenuOpen(false) }}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem',
                        padding: '.5rem .75rem', borderRadius: '7px', border: 'none',
                        background: objective === null ? 'rgba(123,92,245,.08)' : 'transparent',
                        color: objective === null ? 'var(--accent)' : 'var(--t3)',
                        cursor: 'pointer', fontSize: '.82rem', textAlign: 'left', transition: 'background .1s',
                        fontStyle: 'italic',
                      }}
                      onMouseEnter={e => { if (objective !== null) e.currentTarget.style.background = 'var(--s2)' }}
                      onMouseLeave={e => { if (objective !== null) e.currentTarget.style.background = 'transparent' }}
                    >
                      <div style={{ width: 13, height: 13, borderRadius: '50%', border: '1.5px dashed var(--t3)', flexShrink: 0 }} />
                      <span style={{ flex: 1 }}>Aucun</span>
                      {objective === null && <Check size={12} style={{ flexShrink: 0, opacity: .7 }} />}
                    </button>
                    <div style={{ borderTop: '1px solid var(--b1)', margin: '.2rem 0' }} />
                    {(Object.entries(OBJECTIVE_LABELS) as [PostObjective, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => { setObjective(key); setAutoDetected(false); setObjMenuOpen(false) }}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem',
                          padding: '.5rem .75rem', borderRadius: '7px', border: 'none',
                          background: objective === key ? 'rgba(123,92,245,.1)' : 'transparent',
                          color: objective === key ? 'var(--accent)' : 'var(--t1)',
                          cursor: 'pointer', fontSize: '.82rem', textAlign: 'left', transition: 'background .1s',
                        }}
                        onMouseEnter={e => { if (objective !== key) e.currentTarget.style.background = 'var(--s2)' }}
                        onMouseLeave={e => { if (objective !== key) e.currentTarget.style.background = 'transparent' }}
                      >
                        <ObjIcon objective={key} active={objective === key} />
                        <span style={{ flex: 1 }}>{label}</span>
                        {objective === key && <Check size={12} style={{ flexShrink: 0, opacity: .7 }} />}
                      </button>
                    ))}
                  </div>
                )}
                {/* Hint sous le bouton quand aucun objectif */}
                {!objective && !objectiveMenuOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 4px)', right: 0, fontSize: '.68rem', color: 'var(--t3)', whiteSpace: 'nowrap', fontStyle: 'italic', pointerEvents: 'none' }}>
                    L&apos;IA le devinera pour vous
                  </div>
                )}
              </div>

              {/* Bouton Live — après Objectif, visible seulement si objectif ou brief */}
              {(objective || brief.trim()) && (
                <button
                  onClick={() => setShowLive(v => !v)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '.4rem',
                    padding: '.45rem .75rem', borderRadius: '8px',
                    border: `1px solid ${showLive ? 'rgba(16,185,129,.5)' : 'var(--b1)'}`,
                    background: showLive ? 'rgba(16,185,129,.1)' : 'var(--card)',
                    color: showLive ? '#10B981' : 'var(--t3)',
                    cursor: 'pointer', fontSize: '.78rem', fontWeight: 500, transition: 'all .18s',
                  }}
                >
                  <Zap size={12} />
                  Live
                </button>
              )}

              </div>{/* fin flex boutons */}
            </div>

            {/* Brief */}
            <div style={{ marginBottom: '.75rem' }}>
              <label style={{ display: 'block', fontSize: '.82rem', fontWeight: 500, color: 'var(--t2)', marginBottom: '.5rem' }}>
                Sujet / brief <span style={{ fontWeight: 400, color: 'var(--t3)', fontSize: '.76rem' }}>(optionnel)</span>
              </label>
              <textarea
                className="input resize-none"
                rows={4}
                placeholder="Laissez vide pour que l'IA choisisse le sujet automatiquement..."
                value={brief}
                onChange={e => setBrief(e.target.value)}
                style={{ width: '100%' }}
              />
            </div>

            {/* Boutons params + plateforme */}
            <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <button
                onClick={() => setShowParamsPopup(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.45rem',
                  padding: '.45rem .9rem', borderRadius: '8px',
                  border: '1px solid var(--b1)', background: 'var(--card)',
                  color: 'var(--t2)', cursor: 'pointer', fontSize: '.82rem', fontWeight: 500,
                  transition: '.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)' }}
              >
                <Settings2 size={14} />
                Autres paramètres
              </button>

              <button
                onClick={() => setShowPlatformPopup(true)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.45rem',
                  padding: '.45rem .9rem', borderRadius: '8px',
                  border: `1px solid ${selectedPlatforms.length > 0 ? 'rgba(123,92,245,.4)' : 'var(--b1)'}`,
                  background: selectedPlatforms.length > 0 ? 'rgba(123,92,245,.07)' : 'var(--card)',
                  color: selectedPlatforms.length > 0 ? 'var(--accent)' : 'var(--t2)',
                  cursor: 'pointer', fontSize: '.82rem', fontWeight: 500, transition: '.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = selectedPlatforms.length > 0 ? 'rgba(123,92,245,.4)' : 'var(--b1)' }}
              >
                <Layers size={14} />
                Plateforme
                {selectedPlatforms.length > 0 && (
                  <span style={{ background: 'var(--accent)', color: '#fff', borderRadius: '999px', fontSize: '.6rem', fontWeight: 700, padding: '1px 6px', lineHeight: '1.5' }}>
                    {selectedPlatforms.length}
                  </span>
                )}
              </button>
            </div>

            {/* Bouton Générer */}
            <button className="btn-gen" onClick={handleGenerate} style={{ padding: '.7rem 1.4rem', fontSize: '.88rem', marginBottom: '1.5rem' }}>
              <div className="btn-gen-dot" />
              Générer
            </button>

          </div>

          {/* ── Colonne droite : aperçu live (seulement si activé) ── */}
          {showLive && (objective || brief.trim()) && (
            <div className="anim-fade-right w-full lg:w-[360px] shrink-0">
              <LivePreviewPanel
                objective={objective}
                params={params}
                selectedPlatforms={selectedPlatforms}
                distributionMode={distributionMode}
                brief={brief}
                onClose={() => setShowLive(false)}
              />
            </div>
          )}

        </div>
      )}

    </div>
  )
}
