'use client'

import { useState, useRef, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import {
  Platform, PostObjective,
  PLATFORM_NAMES, PLATFORM_COLORS, OBJECTIVE_LABELS,
} from '@/types'
import {
  IconInstagram, IconFacebook, IconTikTok,
  IconTwitterX, IconLinkedIn, IconYouTube, IconPinterest,
} from '@/components/icons/BrandIcons'
import { Send, Save, Clock, X, Image as ImageIcon, RotateCcw, Hash, ChevronDown, ChevronRight, Check } from 'lucide-react'

// ─── Platform icon ────────────────────────────────────────────────────────────

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

// ─── Helpers ─────────────────────────────────────────────────────────────────

function lowercaseHashtags(text: string): string {
  return text.replace(/#(\w+)/g, (_, tag) => '#' + tag.toLowerCase())
}

function formatScheduled(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) +
    ', ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

// ─── Objective icons ──────────────────────────────────────────────────────────

const OBJ_COLORS: Record<string, string> = {
  vendre: '#EF4444', engager: '#3B82F6', eduquer: '#06B6D4',
  inspirer: '#F59E0B', annoncer: '#10B981', fideliser: '#EC4899',
}

function ObjIcon({ objective, size = 10 }: { objective: string; size?: number }) {
  const color = OBJ_COLORS[objective] || 'var(--t3)'
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

// ─── Char limits per platform ─────────────────────────────────────────────────

const CHAR_LIMITS: Partial<Record<Platform, number>> = {
  twitter:   280,
  instagram: 2200,
  facebook:  2000,
  linkedin:  1300,
  tiktok:    300,
  youtube:   5000,
  pinterest: 500,
}

// ─── WheelColumn ─────────────────────────────────────────────────────────────

function WheelColumn({
  items, selectedIndex, onChange,
}: {
  items: string[]
  selectedIndex: number
  onChange: (index: number) => void
}) {
  const containerRef  = useRef<HTMLDivElement>(null)
  const ITEM_H        = 42
  const lastFiredIdx  = useRef(selectedIndex)
  const didMount      = useRef(false)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (!didMount.current) {
      // Premier rendu : position instantanée sans animation
      didMount.current = true
      el.scrollTop = selectedIndex * ITEM_H
    } else {
      el.scrollTo({ top: selectedIndex * ITEM_H, behavior: 'smooth' })
    }
  }, [selectedIndex])

  function handleScroll() {
    const el = containerRef.current
    if (!el) return
    const idx = Math.max(0, Math.min(Math.round(el.scrollTop / ITEM_H), items.length - 1))
    if (idx !== lastFiredIdx.current) {
      lastFiredIdx.current = idx
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate(8)
      onChange(idx)
    }
  }

  return (
    <div style={{ position: 'relative', height: ITEM_H * 5, overflow: 'hidden' }}>
      {/* Gradient top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_H * 2,
        background: 'linear-gradient(to bottom, var(--card) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Gradient bottom */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_H * 2,
        background: 'linear-gradient(to top, var(--card) 0%, transparent 100%)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Highlight bar */}
      <div style={{
        position: 'absolute', top: ITEM_H * 2, left: 6, right: 6, height: ITEM_H,
        background: 'rgba(59,130,246,.12)', borderRadius: '8px',
        border: '1px solid rgba(59,130,246,.2)',
        pointerEvents: 'none', zIndex: 1,
      }} />
      {/* Scrollable */}
      <div
        ref={containerRef}
        onScroll={handleScroll}
        style={{
          height: '100%',
          overflowY: 'scroll',
          scrollSnapType: 'y mandatory',
          paddingTop: ITEM_H * 2,
          paddingBottom: ITEM_H * 2,
          scrollbarWidth: 'none',
        } as React.CSSProperties}
      >
        {items.map((item, i) => (
          <div
            key={i}
            onClick={() => {
              containerRef.current?.scrollTo({ top: i * ITEM_H, behavior: 'smooth' })
              onChange(i)
            }}
            style={{
              height: ITEM_H,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              scrollSnapAlign: 'center',
              fontSize: i === selectedIndex ? '.95rem' : '.85rem',
              fontWeight: i === selectedIndex ? 600 : 400,
              color: i === selectedIndex ? 'var(--t1)' : 'var(--t3)',
              cursor: 'pointer', userSelect: 'none',
              transition: 'color .12s, font-size .12s',
            }}
          >
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── SchedulerSheet ───────────────────────────────────────────────────────────

function SchedulerSheet({
  onConfirm, onClose, alreadyScheduled, onDeactivate,
}: {
  onConfirm: (scheduledAt: string) => void
  onClose: () => void
  alreadyScheduled?: boolean
  onDeactivate?: () => void
}) {
  // Build day list: today + 89 days
  const dayItems: string[] = []
  const dayDates: Date[]   = []
  for (let i = 0; i < 90; i++) {
    const d = new Date(); d.setDate(d.getDate() + i); d.setHours(0, 0, 0, 0)
    const label =
      i === 0 ? "Aujourd'hui" :
      i === 1 ? 'Demain' :
      d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })
    dayItems.push(label)
    dayDates.push(d)
  }
  const hourItems   = Array.from({ length: 24 }, (_, i) => `${i}h`)
  const minuteItems = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55']

  // Initialise to now + 45 min
  const initDate = new Date(Date.now() + 45 * 60 * 1000)
  const [dayIdx,    setDayIdx]    = useState(0)
  const [hourIdx,   setHourIdx]   = useState(initDate.getHours())
  const [minuteIdx, setMinuteIdx] = useState(Math.min(Math.ceil(initDate.getMinutes() / 5), 11))

  // Retourne {hour, minuteIdx} minimum pour aujourd'hui
  function getMinToday() {
    const m = new Date(Date.now() + 45 * 60 * 1000)
    return { hour: m.getHours(), minIdx: Math.min(Math.ceil(m.getMinutes() / 5), 11) }
  }

  function handleDayChange(idx: number) {
    setDayIdx(idx)
    if (idx === 0) {
      const min = getMinToday()
      if (hourIdx < min.hour || (hourIdx === min.hour && minuteIdx < min.minIdx)) {
        setHourIdx(min.hour)
        setMinuteIdx(min.minIdx)
      }
    }
  }

  function handleHourChange(idx: number) {
    if (dayIdx === 0) {
      const min = getMinToday()
      if (idx < min.hour) { setHourIdx(min.hour); return }
      if (idx === min.hour && minuteIdx < min.minIdx) setMinuteIdx(min.minIdx)
    }
    setHourIdx(idx)
  }

  function handleMinuteChange(idx: number) {
    if (dayIdx === 0) {
      const min = getMinToday()
      if (hourIdx <= min.hour && idx < min.minIdx) { setMinuteIdx(min.minIdx); return }
    }
    setMinuteIdx(idx)
  }

  // Compute selected datetime
  const scheduled = new Date(dayDates[dayIdx])
  scheduled.setHours(hourIdx, parseInt(minuteItems[minuteIdx]), 0, 0)

  const isToday    = dayIdx === 0
  const isTomorrow = dayIdx === 1
  const label = isToday    ? `Aujourd'hui à ${hourIdx}h${minuteItems[minuteIdx]}` :
                isTomorrow ? `Demain à ${hourIdx}h${minuteItems[minuteIdx]}` :
                `${dayItems[dayIdx]} à ${hourIdx}h${minuteItems[minuteIdx]}`

  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(6px)',
        zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="anim-fade-scale" style={{
        background: 'var(--card)', border: '1px solid var(--b1)',
        borderRadius: '20px', width: '100%', maxWidth: '380px',
        padding: '0 1.5rem 1.5rem',
        boxShadow: '0 24px 64px rgba(0,0,0,.45)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 0 .5rem' }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.05rem', fontWeight: 700, color: 'var(--t1)' }}>
            Date et heure de publication
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: '4px', borderRadius: '6px', transition: '.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Wheel grid — no column labels */}
        <div style={{
          display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '6px',
          marginBottom: '1.1rem',
          background: 'var(--s2)', borderRadius: '14px', padding: '.25rem',
          border: '1px solid var(--b1)',
        }}>
          <WheelColumn items={dayItems}    selectedIndex={dayIdx}    onChange={handleDayChange}    />
          <WheelColumn items={hourItems}   selectedIndex={hourIdx}   onChange={handleHourChange}   />
          <WheelColumn items={minuteItems} selectedIndex={minuteIdx} onChange={handleMinuteChange} />
        </div>

        {/* Note */}
        <p style={{ fontSize: '.72rem', color: 'var(--t3)', textAlign: 'center', lineHeight: 1.55, margin: '0 0 1.1rem' }}>
          En continuant, tu donnes ton accord pour que ta publication soit importée et stockée sur nos serveurs jusqu&apos;à la date de publication planifiée.
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: '.6rem' }}>
          {alreadyScheduled && onDeactivate && (
            <button
              onClick={onDeactivate}
              style={{
                flex: 1, padding: '.7rem', borderRadius: '12px',
                border: '1px solid var(--b1)', background: 'var(--s2)',
                color: 'var(--t2)', cursor: 'pointer', fontSize: '.88rem', fontWeight: 600,
                transition: '.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = '#EF4444'; e.currentTarget.style.color = '#EF4444' }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)' }}
            >
              Désactiver
            </button>
          )}
          <button
            onClick={() => onConfirm(scheduled.toISOString())}
            className="btn-primary"
            style={{ flex: 2, justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.7rem', borderRadius: '12px', fontSize: '.88rem' }}
          >
            Terminé
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Per-platform card ────────────────────────────────────────────────────────

interface CardState {
  content: string
  imageUrl: string | null
  imageLoading: boolean
  scheduledAt: string | null
}

interface PostPlatformCardProps {
  platform: Platform
  allPlatforms?: Platform[]   // unified mode: show all icons in header
  objective: PostObjective | null
  cardState: CardState
  onContentChange: (v: string) => void
  onImageSet: (url: string | null) => void
  onImageLoad: (loading: boolean) => void
  onRewrite: () => void
  onHashtags: () => void
  onScheduleOpen: () => void
  onPublishScheduled: () => void
  onDraft: () => void
  onPublish: () => void
  isPro: boolean
  isRewriting: boolean
  isDrafting: boolean
  isPublishing: boolean
  onClose?: () => void
  userName?: string | null
  socialAccounts?: SocialAccount[]
}

function PostPlatformCard({
  platform, allPlatforms, objective, cardState,
  onContentChange, onImageSet, onImageLoad,
  onRewrite, onHashtags,
  onScheduleOpen, onPublishScheduled,
  onDraft, onPublish,
  isPro, isRewriting, isDrafting, isPublishing, onClose, userName, socialAccounts,
}: PostPlatformCardProps) {
  const isActing = isDrafting || isPublishing
  const { content, imageUrl, imageLoading, scheduledAt } = cardState
  const isUnifiedCard = allPlatforms && allPlatforms.length > 1
  // In unified mode, use the most restrictive char limit
  const limit = isUnifiedCard
    ? (() => {
        const limits = allPlatforms.map(p => CHAR_LIMITS[p]).filter((l): l is number => l !== undefined)
        return limits.length > 0 ? Math.min(...limits) : undefined
      })()
    : CHAR_LIMITS[platform]
  const isOverLimit = limit ? content.length > limit : false
  const color       = PLATFORM_COLORS[platform]

  const { toast: cardToast } = useToast()
  const [showImageMenu, setShowImageMenu] = useState(false)
  const imageMenuRef = useRef<HTMLDivElement>(null)
  const fileRef      = useRef<HTMLInputElement>(null)
  const fileRef2     = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (imageMenuRef.current && !imageMenuRef.current.contains(e.target as Node))
        setShowImageMenu(false)
    }
    if (showImageMenu) document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showImageMenu])

  async function handleGenerateImage() {
    setShowImageMenu(false)
    onImageLoad(true)
    try {
      const res = await fetch('/api/ai/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postContent: content.slice(0, 300), platform }),
      })
      const data = await res.json()
      if (res.ok) onImageSet(data.url)
      else cardToast(data.error || 'Erreur génération image', 'error')
    } catch { cardToast('Erreur génération image', 'error') }
    finally { onImageLoad(false) }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>, ref: React.RefObject<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setShowImageMenu(false)
    onImageLoad(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) onImageSet(data.url)
      else cardToast(data.error || 'Erreur upload', 'error')
    } catch { cardToast('Erreur upload', 'error') }
    finally { onImageLoad(false); if (ref.current) ref.current.value = '' }
  }

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--b1)',
      borderRadius: '16px', overflow: 'visible',
      display: 'flex', flexDirection: 'column',
    }}>

      {/* ── Platform header ── */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '.65rem 1rem', position: 'relative',
        background: isUnifiedCard ? 'var(--s2)' : `${color}0d`,
        borderBottom: '1px solid var(--b1)',
        borderRadius: '16px 16px 0 0', overflow: 'hidden',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
          {isUnifiedCard ? (
            <>
              <div style={{ display: 'flex', gap: '3px' }}>
                {allPlatforms!.slice(0, 6).map(p => (
                  <div key={p} style={{ width: 22, height: 22, borderRadius: '5px', overflow: 'hidden', flexShrink: 0 }}>
                    <PlatformIcon platform={p} size={22} />
                  </div>
                ))}
                {allPlatforms!.length > 6 && (
                  <span style={{ fontSize: '.72rem', color: 'var(--t3)', alignSelf: 'center', marginLeft: '2px' }}>+{allPlatforms!.length - 6}</span>
                )}
              </div>
              <span style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--t1)' }}>
                {allPlatforms!.length} plateformes
              </span>
            </>
          ) : (
            <>
              <PlatformIcon platform={platform} size={20} />
              <span style={{ fontSize: '.92rem', fontWeight: 700, color: 'var(--t1)' }}>
                {PLATFORM_NAMES[platform]}
              </span>
            </>
          )}
        </div>
        {onClose && (
          <button
            onClick={onClose}
            style={{ position: 'absolute', right: '.7rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: '4px', borderRadius: '6px', transition: '.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.background = 'var(--s2)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.background = 'none' }}
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* ── User header ── */}
      {(() => {
        const platformAccount = !isUnifiedCard ? socialAccounts?.find(a => a.platform === platform) : null
        const displayName = platformAccount?.platform_username || userName || 'Votre compte'
        const avatarUrl   = platformAccount?.platform_avatar_url || null
        return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.8rem 1rem .3rem' }}>
        {avatarUrl ? (
          <img src={avatarUrl} alt="" style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{
            width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
            background: `linear-gradient(135deg, ${color}, ${color}88)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '.88rem', fontWeight: 700, color: '#fff',
          }}>{displayName.charAt(0).toUpperCase()}</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '.83rem', fontWeight: 600, color: 'var(--t1)' }}>{displayName}</div>
          {objective && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '.25rem',
              background: 'var(--s2)', border: '1px solid var(--b1)',
              borderRadius: '4px', padding: '.1rem .4rem',
              fontSize: '.62rem', color: 'var(--t3)', marginTop: '.15rem',
            }}>
              <ObjIcon objective={objective} size={10} />
              <span>{OBJECTIVE_LABELS[objective]}</span>
              <ChevronDown size={9} />
            </div>
          )}
        </div>
      </div>
        )
      })()}

      {/* ── Textarea ── */}
      <div style={{ padding: '.2rem 1rem .15rem' }}>
        <textarea
          value={content}
          onChange={e => onContentChange(e.target.value)}
          style={{
            width: '100%', minHeight: '115px',
            background: 'transparent', border: 'none', outline: 'none',
            fontSize: '.84rem', color: 'var(--t1)',
            lineHeight: 1.65, resize: 'none', fontFamily: 'inherit',
          }}
        />
        <div style={{ textAlign: 'right', fontSize: '.68rem', fontWeight: 500, color: isOverLimit ? '#EF4444' : 'var(--t3)' }}>
          {content.length}{limit ? ` / ${limit}` : ''}
        </div>
      </div>

      {/* ── Réécrire / Hashtags ── */}
      <div style={{ display: 'flex', gap: '.4rem', padding: '.15rem 1rem .6rem' }}>
        <button
          onClick={isRewriting ? undefined : onRewrite}
          disabled={isRewriting}
          style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.28rem .6rem', borderRadius: '6px', border: '1px solid var(--b1)', background: 'transparent', color: isRewriting ? 'var(--accent)' : 'var(--t3)', cursor: isRewriting ? 'not-allowed' : 'pointer', fontSize: '.7rem', fontWeight: 500, transition: '.12s', opacity: isRewriting ? .7 : 1 }}
          onMouseEnter={e => { if (!isRewriting) { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' } }}
          onMouseLeave={e => { if (!isRewriting) { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t3)' } }}
        >
          {isRewriting ? <div style={{ width: '9px', height: '9px', border: '1.5px solid rgba(59,130,246,.25)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'rot .7s linear infinite', flexShrink: 0 }} /> : <RotateCcw size={10} />}
          Réécrire
        </button>
        <button
          onClick={onHashtags}
          style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.28rem .6rem', borderRadius: '6px', border: '1px solid var(--b1)', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: '.7rem', fontWeight: 500, transition: '.12s' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#06B6D4'; e.currentTarget.style.color = '#06B6D4' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t3)' }}
        >
          <Hash size={10} /> Hashtags
        </button>
      </div>

      {/* ── Image loading ── */}
      {imageLoading && (
        <div style={{ margin: '0 1rem .6rem', borderRadius: '12px', aspectRatio: '16/9', background: 'var(--s2)', border: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '24px', height: '24px', border: '3px solid rgba(59,130,246,.2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
        </div>
      )}

      {/* ── Image display ── */}
      {imageUrl && !imageLoading && (
        <div style={{ position: 'relative', margin: '0 1rem .6rem' }}>
          <img src={imageUrl} alt="" style={{ width: '100%', borderRadius: '12px', display: 'block', maxHeight: '260px', objectFit: 'cover' }} />
          <button
            onClick={() => setShowImageMenu(v => !v)}
            style={{ position: 'absolute', top: '8px', left: '8px', display: 'flex', alignItems: 'center', gap: '.25rem', padding: '.25rem .55rem', borderRadius: '6px', background: 'rgba(0,0,0,.65)', border: '1px solid rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', color: '#fff', cursor: 'pointer', fontSize: '.72rem', fontWeight: 500 }}
          >
            <RotateCcw size={10} /> changer
          </button>
          <button
            onClick={() => onImageSet(null)}
            style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', padding: '.25rem .3rem', borderRadius: '6px', background: 'rgba(0,0,0,.65)', border: '1px solid rgba(255,255,255,.15)', backdropFilter: 'blur(4px)', color: '#fff', cursor: 'pointer' }}
          >
            <X size={13} />
          </button>
          {showImageMenu && (
            <div style={{ position: 'absolute', top: '44px', left: '8px', background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.3)', zIndex: 50, minWidth: '190px' }}>
              <button onClick={handleGenerateImage} disabled={!isPro} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', width: '100%', padding: '.65rem .9rem', background: 'none', border: 'none', cursor: isPro ? 'pointer' : 'not-allowed', color: isPro ? 'var(--t1)' : 'var(--t3)', fontSize: '.82rem', textAlign: 'left', opacity: isPro ? 1 : .5 }} onMouseEnter={e => { if (isPro) (e.currentTarget as HTMLElement).style.background = 'var(--s2)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '.8rem' }}>✨</span></div>
                <div><div style={{ fontWeight: 600, fontSize: '.8rem' }}>Générer avec l&apos;IA</div>{!isPro && <div style={{ fontSize: '.67rem', color: '#FBBF24' }}>Pro requis</div>}</div>
              </button>
              <div style={{ height: '1px', background: 'var(--b1)' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.65rem .9rem', cursor: 'pointer', fontSize: '.82rem', color: 'var(--t1)' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--s2)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImportFile(e, fileRef)} />
                <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(6,182,212,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '.8rem' }}>📁</span></div>
                <span style={{ fontWeight: 600 }}>Importer une photo</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* ── Action rows ── */}
      <div style={{ borderTop: '1px solid var(--b1)' }}>

        {/* Ajouter une image */}
        <div style={{ position: 'relative' }} ref={imageMenuRef}>
          <button
            onClick={() => setShowImageMenu(v => !v)}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t1)', fontSize: '.83rem', fontFamily: 'inherit', transition: '.1s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--s2)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
          >
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--s2)', border: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ImageIcon size={14} color="var(--t2)" />
            </div>
            <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>{imageUrl ? "Changer l'image" : 'Ajouter une image'}</span>
            <ChevronRight size={15} color="var(--t3)" />
          </button>
          {!imageUrl && showImageMenu && (
            <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: '1rem', right: '1rem', background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: '10px', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,.25)', zIndex: 50 }}>
              <button onClick={handleGenerateImage} disabled={!isPro} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', width: '100%', padding: '.65rem .9rem', background: 'none', border: 'none', cursor: isPro ? 'pointer' : 'not-allowed', color: isPro ? 'var(--t1)' : 'var(--t3)', fontSize: '.82rem', textAlign: 'left', opacity: isPro ? 1 : .5 }} onMouseEnter={e => { if (isPro) (e.currentTarget as HTMLElement).style.background = 'var(--s2)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(59,130,246,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '.8rem' }}>✨</span></div>
                <div><div style={{ fontWeight: 600, fontSize: '.8rem' }}>Générer avec l&apos;IA</div>{!isPro && <div style={{ fontSize: '.67rem', color: '#FBBF24' }}>Pro requis</div>}</div>
              </button>
              <div style={{ height: '1px', background: 'var(--b1)' }} />
              <label style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.65rem .9rem', cursor: 'pointer', fontSize: '.82rem', color: 'var(--t1)' }} onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--s2)' }} onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}>
                <input ref={fileRef2} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleImportFile(e, fileRef2)} />
                <div style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(6,182,212,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><span style={{ fontSize: '.8rem' }}>📁</span></div>
                <span style={{ fontWeight: 600 }}>Importer une photo</span>
              </label>
            </div>
          )}
        </div>

        <div style={{ height: '1px', background: 'var(--b1)', margin: '0 1rem' }} />

        {/* Programmer la publication */}
        <button
          onClick={onScheduleOpen}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '.7rem', padding: '.75rem 1rem', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t1)', fontSize: '.83rem', fontFamily: 'inherit', transition: '.1s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--s2)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
        >
          <div style={{ width: 30, height: 30, borderRadius: '50%', background: scheduledAt ? 'rgba(59,130,246,.1)' : 'var(--s2)', border: `1px solid ${scheduledAt ? 'rgba(59,130,246,.3)' : 'var(--b1)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <Clock size={14} color={scheduledAt ? 'var(--accent)' : 'var(--t2)'} />
          </div>
          <span style={{ flex: 1, textAlign: 'left', fontWeight: 500 }}>Programmer la publication</span>
          {scheduledAt && (
            <span style={{ fontSize: '.75rem', color: 'var(--accent)', fontWeight: 600, marginRight: '.2rem' }}>
              {formatScheduled(scheduledAt)}
            </span>
          )}
          <ChevronRight size={15} color="var(--t3)" />
        </button>

      </div>

      {/* ── Footer buttons ── */}
      <div style={{ display: 'flex', gap: '.6rem', padding: '.9rem 1rem', borderTop: '1px solid var(--b1)', borderRadius: '0 0 16px 16px' }}>
        <button
          onClick={isActing ? undefined : onDraft}
          disabled={isActing}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.35rem', padding: '.65rem', borderRadius: '10px', border: '1px solid var(--b1)', background: 'var(--s2)', color: 'var(--t2)', cursor: isActing ? 'not-allowed' : 'pointer', fontSize: '.82rem', fontWeight: 600, transition: '.12s', opacity: isActing ? .6 : 1 }}
          onMouseEnter={e => { if (!isActing) { e.currentTarget.style.borderColor = 'var(--b2)'; e.currentTarget.style.color = 'var(--t1)' } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)' }}
        >
          {isDrafting ? <div style={{ width: '13px', height: '13px', border: '2px solid rgba(59,130,246,.2)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'rot .7s linear infinite', flexShrink: 0 }} /> : <Save size={14} />}
          Brouillons
        </button>
        {scheduledAt ? (
          <button
            onClick={isActing ? undefined : onPublishScheduled}
            disabled={isActing}
            className="btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.35rem', padding: '.65rem', borderRadius: '10px', fontSize: '.82rem', fontWeight: 600, opacity: isActing ? .6 : 1, cursor: isActing ? 'not-allowed' : 'pointer' }}
          >
            {isPublishing ? <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rot .7s linear infinite', flexShrink: 0 }} /> : <Clock size={14} />}
            Programmer
          </button>
        ) : (
          <button
            onClick={isActing ? undefined : onPublish}
            disabled={isActing}
            className="btn-primary"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.35rem', padding: '.65rem', borderRadius: '10px', fontSize: '.82rem', fontWeight: 600, opacity: isActing ? .6 : 1, cursor: isActing ? 'not-allowed' : 'pointer' }}
          >
            {isPublishing ? <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rot .7s linear infinite', flexShrink: 0 }} /> : <Send size={14} />}
            Publier
          </button>
        )}
      </div>
    </div>
  )
}

// ─── QuotaBar ─────────────────────────────────────────────────────────────────

function QuotaItem({ label, value, pct, color }: {
  label: string; value: string; pct: number; color: string
}) {
  return (
    <div style={{ flex: 1, minWidth: '110px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '.2rem' }}>
        <span style={{ fontSize: '.68rem', color: 'var(--t3)', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '.68rem', color: 'var(--t2)', fontWeight: 600 }}>{value}</span>
      </div>
      <div style={{ height: '3px', background: 'var(--b1)', borderRadius: '2px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '2px', transition: 'width .4s' }} />
      </div>
    </div>
  )
}

function QuotaBar({ textUsed, textLimit }: {
  textUsed: number
  textLimit: number | 'unlimited'
}) {
  const textPct = textLimit === 'unlimited' ? 0 : Math.min(100, (textUsed / (textLimit as number)) * 100)
  const textStr = textLimit === 'unlimited' ? `${textUsed} / ∞` : `${textUsed} / ${textLimit}`

  return (
    <div style={{
      display: 'flex', gap: '1.25rem', alignItems: 'center', flexWrap: 'wrap',
      padding: '.55rem 1rem',
      background: 'var(--card)', border: '1px solid var(--b1)',
      borderRadius: '10px', marginBottom: '1.25rem',
    }}>
      <span style={{ fontSize: '.68rem', color: 'var(--t3)', fontWeight: 500, whiteSpace: 'nowrap' }}>Quotas du jour</span>
      <QuotaItem label="Posts texte" value={textStr} pct={textPct} color="#3B82F6" />
    </div>
  )
}

// ─── Main GeneratedPostsView ──────────────────────────────────────────────────

export interface SocialAccount {
  platform: Platform
  platform_username: string | null
  platform_avatar_url: string | null
}

export interface GeneratedPostsViewProps {
  platforms:             Platform[]
  variants:              Partial<Record<Platform, string>>
  objective:             PostObjective | null
  quotaUsed:             number
  quotaLimit:            number | 'unlimited'
  isPro:                 boolean
  userName?:             string | null
  socialAccounts?:       SocialAccount[]
  initialImages?:        Partial<Record<Platform, string>>
  initialScheduledAt?:   string
  allowPlatformToggle?:  boolean   // true seulement pour création manuelle
  unifiedMode?:          boolean   // true = une seule carte pour toutes les plateformes
  onSaveDraft:           (platform: Platform, content: string, imageUrl: string | null) => Promise<void>
  onPublish:             (platform: Platform, content: string, imageUrl: string | null) => Promise<void>
  onSchedule:            (platform: Platform, content: string, imageUrl: string | null, scheduledAt: string) => Promise<void>
  onClose?:              () => void
}

export function GeneratedPostsView({
  platforms, variants, objective,
  quotaUsed, quotaLimit, isPro, userName, socialAccounts, initialImages, initialScheduledAt,
  allowPlatformToggle, unifiedMode,
  onSaveDraft, onPublish, onSchedule, onClose,
}: GeneratedPostsViewProps) {
  const { toast } = useToast()

  // Per-card state
  const [cards, setCards] = useState<Record<string, CardState>>(() => {
    const init: Record<string, CardState> = {}
    for (const p of platforms) {
      init[p] = {
        content: lowercaseHashtags(variants[p] || ''),
        imageUrl: initialImages?.[p] || null,
        imageLoading: false,
        scheduledAt: initialScheduledAt || null,
      }
    }
    return init
  })

  // Sync content when variants prop changes (e.g. after external rewrite)
  useEffect(() => {
    setCards(prev => {
      const next = { ...prev }
      for (const p of platforms) {
        if (!next[p]) next[p] = { content: lowercaseHashtags(variants[p] || ''), imageUrl: null, imageLoading: false, scheduledAt: null }
        else next[p] = { ...next[p], content: lowercaseHashtags(variants[p] || next[p].content) }
      }
      return next
    })
  }, [variants, platforms])

  const [activePlatforms, setActivePlatforms] = useState<Platform[]>(platforms)
  const [schedulerPlatform, setSchedulerPlatform] = useState<Platform | null>(null)
  const [loadingAction,     setLoadingAction]     = useState<string | null>(null)

  // Sync active platforms when parent removes a platform (e.g. after per-platform action)
  useEffect(() => {
    setActivePlatforms(prev => prev.filter(p => platforms.includes(p)))
  }, [platforms])

  function togglePlatform(p: Platform) {
    setActivePlatforms(prev => {
      if (prev.includes(p)) {
        if (prev.length === 1) return prev // garder au moins une
        return prev.filter(x => x !== p)
      }
      // Ajouter : init carte si pas encore créée
      setCards(c => c[p] ? c : {
        ...c,
        [p]: {
          content: variants[p] ? lowercaseHashtags(variants[p]!) : '',
          imageUrl: initialImages?.[p] ?? null,
          imageLoading: false,
          scheduledAt: initialScheduledAt ?? null,
        },
      })
      return [...prev, p]
    })
  }

  function updateCard(platform: Platform, partial: Partial<CardState>) {
    setCards(prev => ({ ...prev, [platform]: { ...prev[platform], ...partial } }))
  }

  async function handleDraft(platform: Platform) {
    const key = `draft-${platform}`
    if (loadingAction) return
    setLoadingAction(key)
    try {
      await onSaveDraft(platform, cards[platform]?.content || '', cards[platform]?.imageUrl || null)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally { setLoadingAction(null) }
  }

  async function handlePublish(platform: Platform) {
    if (loadingAction) return
    setLoadingAction(`publish-${platform}`)
    try {
      await onPublish(platform, cards[platform]?.content || '', cards[platform]?.imageUrl || null)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur de publication', 'error')
    } finally { setLoadingAction(null) }
  }

  function handleScheduleConfirm(scheduledAt: string) {
    const platform = schedulerPlatform
    setSchedulerPlatform(null)
    if (!platform) return
    updateCard(platform, { scheduledAt })
  }

  function handleScheduleDeactivate() {
    const platform = schedulerPlatform
    setSchedulerPlatform(null)
    if (!platform) return
    updateCard(platform, { scheduledAt: null })
  }

  async function handlePublishScheduled(platform: Platform) {
    const scheduled = cards[platform]?.scheduledAt
    if (!scheduled || loadingAction) return
    setLoadingAction(`schedule-${platform}`)
    try {
      await onSchedule(platform, cards[platform]?.content || '', cards[platform]?.imageUrl || null, scheduled)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur de programmation', 'error')
    } finally { setLoadingAction(null) }
  }

  async function handleRewrite(platform: Platform) {
    if (loadingAction) return
    setLoadingAction(`rewrite-${platform}`)
    try {
      const res = await fetch('/api/ai/rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cards[platform]?.content, platform, instruction: 'Améliore ce post' }),
      })
      const data = await res.json()
      if (res.ok && data.content) updateCard(platform, { content: lowercaseHashtags(data.content) })
      else toast(data.error || 'Erreur réécriture', 'error')
    } catch { toast('Erreur réécriture', 'error') }
    finally { setLoadingAction(null) }
  }

  async function handleHashtags(platform: Platform) {
    if (loadingAction) return
    setLoadingAction(`hashtags-${platform}`)
    try {
      const res = await fetch('/api/ai/hashtags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cards[platform]?.content, platform }),
      })
      const data = await res.json()
      if (res.ok && data.hashtags) {
        const c = cards[platform]?.content || ''
        const tags = (data.hashtags as string[]).map((h: string) => h.toLowerCase()).join(' ')
        updateCard(platform, { content: c.trimEnd() + '\n\n' + tags })
      } else toast(data.error || 'Erreur hashtags', 'error')
    } catch { toast('Erreur hashtags', 'error') }
    finally { setLoadingAction(null) }
  }

  function cardProps(p: Platform, allPlatformsOverride?: Platform[]): PostPlatformCardProps {
    return {
      platform:    p,
      allPlatforms: allPlatformsOverride,
      objective,
      cardState:   cards[p] || { content: '', imageUrl: null, imageLoading: false, scheduledAt: null },
      onContentChange:    v       => updateCard(p, { content: v }),
      onImageSet:         url     => updateCard(p, { imageUrl: url }),
      onImageLoad:        loading => updateCard(p, { imageLoading: loading }),
      onRewrite:          () => handleRewrite(p),
      onHashtags:         () => handleHashtags(p),
      onScheduleOpen:     () => setSchedulerPlatform(p),
      onPublishScheduled: () => handlePublishScheduled(p),
      onDraft:            () => handleDraft(p),
      onPublish:          () => handlePublish(p),
      isPro,
      isRewriting:  loadingAction === `rewrite-${p}`,
      isDrafting:   loadingAction === `draft-${p}`,
      isPublishing: loadingAction === `publish-${p}` || loadingAction === `schedule-${p}`,
      onClose:      allowPlatformToggle && activePlatforms.length > 1 ? () => togglePlatform(p) : undefined,
      userName,
      socialAccounts,
    }
  }

  const ALL_PLATFORMS_LIST: Platform[] = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin', 'youtube', 'pinterest']
  const connectedPlatforms: Platform[] = socialAccounts && socialAccounts.length > 0
    ? ALL_PLATFORMS_LIST.filter(p => socialAccounts.some(a => a.platform === p))
    : ALL_PLATFORMS_LIST

  return (
    <div>
      {/* ── Sélecteur de plateformes (création manuelle uniquement) ── */}
      {allowPlatformToggle && (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginBottom: '1.25rem' }}>
        {connectedPlatforms.map(p => {
          const isActive = activePlatforms.includes(p)
          const color    = PLATFORM_COLORS[p]
          return (
            <button
              key={p}
              onClick={() => togglePlatform(p)}
              style={{
                display: 'flex', alignItems: 'center', gap: '.35rem',
                padding: '.32rem .7rem', borderRadius: '8px', fontSize: '.76rem', fontWeight: 500,
                border: `1px solid ${isActive ? color + '55' : 'var(--b1)'}`,
                background: isActive ? color + '14' : 'var(--card)',
                color: isActive ? color : 'var(--t3)',
                cursor: 'pointer', transition: '.12s',
              }}
              onMouseEnter={e => { if (!isActive) { e.currentTarget.style.borderColor = color + '44'; e.currentTarget.style.color = color } }}
              onMouseLeave={e => { if (!isActive) { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t3)' } }}
            >
              <PlatformIcon platform={p} size={13} />
              {PLATFORM_NAMES[p]}
            </button>
          )
        })}
      </div>
      )}

      {/* ── Cards ── */}
      {unifiedMode && activePlatforms.length > 0 ? (
        // Mode unifié : une seule carte pour toutes les plateformes
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <PostPlatformCard {...cardProps(activePlatforms[0], activePlatforms)} />
        </div>
      ) : (
        // Mode normal : une carte par plateforme
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: '1rem',
          maxWidth: '860px', margin: '0 auto', justifyContent: 'center',
        }}>
          {activePlatforms.map(p => (
            <div key={p} style={{ width: activePlatforms.length === 1 ? 'min(420px, 100%)' : 'calc(50% - 0.5rem)' }}>
              <PostPlatformCard {...cardProps(p)} />
            </div>
          ))}
        </div>
      )}

      {/* Scheduler sheet */}
      {schedulerPlatform && (
        <SchedulerSheet
          onConfirm={handleScheduleConfirm}
          onClose={() => setSchedulerPlatform(null)}
          alreadyScheduled={!!cards[schedulerPlatform]?.scheduledAt}
          onDeactivate={handleScheduleDeactivate}
        />
      )}
    </div>
  )
}
