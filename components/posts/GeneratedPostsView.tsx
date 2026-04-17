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
import { Send, Save, Clock, X, Image as ImageIcon, RotateCcw, Hash, ChevronDown, Check } from 'lucide-react'

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
  const containerRef = useRef<HTMLDivElement>(null)
  const ITEM_H = 42
  const lastFiredIdx = useRef(selectedIndex)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.scrollTo({ top: selectedIndex * ITEM_H, behavior: 'smooth' })
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
        background: 'rgba(123,92,245,.12)', borderRadius: '8px',
        border: '1px solid rgba(123,92,245,.2)',
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
  onConfirm, onClose,
}: {
  onConfirm: (scheduledAt: string) => void
  onClose: () => void
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
        background: 'rgba(0,0,0,.65)', backdropFilter: 'blur(4px)',
        zIndex: 600, display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{
        background: 'var(--card)', borderTop: '1px solid var(--b1)',
        borderRadius: '20px 20px 0 0', width: '100%', maxWidth: '480px',
        padding: '0 1.25rem 2rem',
        animation: 'slideUp .25s cubic-bezier(.22,1,.36,1)',
      }}>
        {/* Drag handle */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 6px' }}>
          <div style={{ width: '36px', height: '4px', borderRadius: '2px', background: 'var(--b1)' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.85rem' }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1rem', fontWeight: 700, color: 'var(--t1)' }}>
            Programmer
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', display: 'flex', padding: '4px' }}>
            <X size={17} />
          </button>
        </div>

        {/* Real-time label */}
        <div style={{
          textAlign: 'center', marginBottom: '1rem',
          fontSize: '.9rem', fontWeight: 600, minHeight: '1.6rem',
          color: 'var(--accent)',
        }}>
          {label}
        </div>

        {/* Column labels above wheels */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '4px', marginBottom: '2px', textAlign: 'center' }}>
          {['Jour', 'Heure', 'Min'].map(l => (
            <div key={l} style={{ fontSize: '.62rem', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.06em' }}>{l}</div>
          ))}
        </div>

        {/* Wheel grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '4px', marginBottom: '1.25rem' }}>
          <WheelColumn items={dayItems}    selectedIndex={dayIdx}    onChange={handleDayChange}    />
          <WheelColumn items={hourItems}   selectedIndex={hourIdx}   onChange={handleHourChange}   />
          <WheelColumn items={minuteItems} selectedIndex={minuteIdx} onChange={handleMinuteChange} />
        </div>

        {/* Confirm */}
        <button
          onClick={() => onConfirm(scheduled.toISOString())}
          className="btn-primary"
          style={{ width: '100%', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.7rem' }}
        >
          <Check size={14} /> Terminer
        </button>
      </div>
    </div>
  )
}

// ─── Per-platform card ────────────────────────────────────────────────────────

interface CardState {
  content: string
  imageUrl: string | null
  imageLoading: boolean
}

interface PostPlatformCardProps {
  platform: Platform
  objective: PostObjective | null
  cardState: CardState
  onContentChange: (v: string) => void
  onImageSet: (url: string | null) => void
  onImageLoad: (loading: boolean) => void
  onRewrite: () => void
  onHashtags: () => void
  onSchedule: () => void
  onDraft: () => void
  onPublish: () => void
  isPro: boolean
}

function PostPlatformCard({
  platform, objective, cardState,
  onContentChange, onImageSet, onImageLoad,
  onRewrite, onHashtags,
  onSchedule, onDraft, onPublish,
  isPro,
}: PostPlatformCardProps) {
  const { content, imageUrl, imageLoading } = cardState
  const limit      = CHAR_LIMITS[platform]
  const isOverLimit = limit ? content.length > limit : false
  const color       = PLATFORM_COLORS[platform]

  const [showImageMenu, setShowImageMenu] = useState(false)
  const [imgPanY,       setImgPanY]       = useState(50)
  const [showImgOverlay, setShowImgOverlay] = useState(false)
  const imageMenuRef = useRef<HTMLDivElement>(null)
  const fileRef      = useRef<HTMLInputElement>(null)

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
    } catch { /* silent */ }
    finally { onImageLoad(false) }
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setShowImageMenu(false)
    onImageLoad(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (res.ok) onImageSet(data.url)
    } catch { /* silent */ }
    finally { onImageLoad(false); e.target.value = '' }
  }

  return (
    <div style={{
      background: 'var(--card)', border: '1px solid var(--b1)',
      borderRadius: '14px', overflow: 'hidden',
      display: 'flex', flexDirection: 'column',
    }}>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '.6rem',
        padding: '.8rem 1rem', borderBottom: '1px solid var(--b1)',
        background: `${color}08`,
      }}>
        <PlatformIcon platform={platform} size={18} />
        <span style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--t1)', flex: 1 }}>
          {PLATFORM_NAMES[platform]}
        </span>
        {objective && (
          <span style={{
            fontSize: '.63rem', fontWeight: 600, padding: '.18rem .5rem', borderRadius: '5px',
            background: 'rgba(123,92,245,.12)', color: 'var(--accent)',
            border: '1px solid rgba(123,92,245,.2)', whiteSpace: 'nowrap',
          }}>
            {OBJECTIVE_LABELS[objective]}
          </span>
        )}
      </div>

      {/* Textarea */}
      <div style={{ padding: '.85rem 1rem .4rem', flex: 1 }}>
        <textarea
          value={content}
          onChange={e => onContentChange(e.target.value)}
          style={{
            width: '100%', minHeight: '140px',
            background: 'transparent',
            border: `1px solid ${isOverLimit ? '#EF4444' : 'var(--b1)'}`,
            borderRadius: '8px', padding: '.6rem .75rem',
            fontSize: '.83rem', color: 'var(--t1)',
            lineHeight: 1.65, resize: 'vertical', outline: 'none',
            fontFamily: 'inherit', transition: 'border-color .15s',
          }}
        />
        <div style={{
          textAlign: 'right', fontSize: '.68rem', fontWeight: 500, marginTop: '.2rem',
          color: isOverLimit ? '#EF4444' : 'var(--t3)',
        }}>
          {content.length}{limit ? ` / ${limit}` : ''}
        </div>
      </div>

      {/* Réécrire / Hashtags */}
      <div style={{ display: 'flex', gap: '.45rem', padding: '.2rem 1rem .7rem' }}>
        <button
          onClick={onRewrite}
          style={{
            display: 'flex', alignItems: 'center', gap: '.3rem',
            padding: '.32rem .7rem', borderRadius: '6px',
            border: '1px solid var(--b1)', background: 'transparent',
            color: 'var(--t2)', cursor: 'pointer', fontSize: '.73rem', fontWeight: 500,
            transition: '.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)' }}
        >
          <RotateCcw size={11} /> Réécrire
        </button>
        <button
          onClick={onHashtags}
          style={{
            display: 'flex', alignItems: 'center', gap: '.3rem',
            padding: '.32rem .7rem', borderRadius: '6px',
            border: '1px solid var(--b1)', background: 'transparent',
            color: 'var(--t2)', cursor: 'pointer', fontSize: '.73rem', fontWeight: 500,
            transition: '.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = '#06B6D4'; e.currentTarget.style.color = '#06B6D4' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)' }}
        >
          <Hash size={11} /> Hashtags
        </button>
      </div>

      {/* Image: loading state */}
      {imageLoading && (
        <div style={{
          margin: '0 1rem .75rem',
          borderRadius: '10px', aspectRatio: '1/1',
          background: 'var(--s2)', border: '1px solid var(--b1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            width: '26px', height: '26px',
            border: '3px solid rgba(123,92,245,.2)',
            borderTopColor: 'var(--accent)',
            borderRadius: '50%', animation: 'rot .7s linear infinite',
          }} />
        </div>
      )}

      {/* Image: display */}
      {imageUrl && !imageLoading && (
        <div
          style={{
            margin: '0 1rem .75rem', borderRadius: '10px', overflow: 'hidden',
            border: '1px solid var(--b1)', aspectRatio: '1/1', position: 'relative',
          }}
          onMouseEnter={() => setShowImgOverlay(true)}
          onMouseLeave={() => setShowImgOverlay(false)}
        >
          <img
            src={imageUrl} alt=""
            style={{
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: `center ${imgPanY}%`,
              display: 'block',
            }}
          />
          {showImgOverlay && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(to bottom, rgba(0,0,0,.55) 0%, transparent 35%, transparent 65%, rgba(0,0,0,.55) 100%)',
              display: 'flex', flexDirection: 'column',
              alignItems: 'stretch', justifyContent: 'space-between',
              padding: '.6rem',
            }}>
              {/* Top row: Régénérer + Supprimer */}
              <div style={{ display: 'flex', gap: '.4rem', justifyContent: 'flex-end' }}>
                {isPro && (
                  <button
                    onClick={handleGenerateImage}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '.3rem',
                      padding: '.28rem .55rem', borderRadius: '6px',
                      background: 'rgba(0,0,0,.6)', border: '1px solid rgba(255,255,255,.15)',
                      color: '#fff', cursor: 'pointer', fontSize: '.7rem', fontWeight: 500,
                      backdropFilter: 'blur(4px)',
                    }}
                  >
                    <RotateCcw size={11} /> Régénérer
                  </button>
                )}
                <button
                  onClick={() => onImageSet(null)}
                  style={{
                    display: 'flex', alignItems: 'center', padding: '.28rem .45rem',
                    borderRadius: '6px', background: 'rgba(0,0,0,.6)',
                    border: '1px solid rgba(255,255,255,.15)',
                    color: '#fff', cursor: 'pointer',
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <X size={13} />
                </button>
              </div>
              {/* Bottom: vertical pan slider */}
              <div>
                <input
                  type="range" min={0} max={100} value={imgPanY}
                  onChange={e => setImgPanY(Number(e.target.value))}
                  onClick={e => e.stopPropagation()}
                  style={{ width: '100%', accentColor: 'white', cursor: 'ns-resize' }}
                  title="Cadrage vertical"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Image: add button (no image) */}
      {!imageUrl && !imageLoading && (
        <div style={{ padding: '0 1rem .7rem', position: 'relative' }} ref={imageMenuRef}>
          <button
            onClick={() => setShowImageMenu(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: '.4rem', width: '100%',
              padding: '.35rem .75rem', borderRadius: '7px',
              border: '1px dashed var(--b1)', background: 'transparent',
              color: 'var(--t3)', cursor: 'pointer', fontSize: '.73rem', fontWeight: 500,
              justifyContent: 'center', transition: '.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t3)' }}
          >
            <ImageIcon size={13} /> Ajouter une image
            <ChevronDown size={11} style={{
              marginLeft: 'auto', transition: 'transform .15s',
              transform: showImageMenu ? 'rotate(180deg)' : 'rotate(0)',
            }} />
          </button>
          {showImageMenu && (
            <div style={{
              position: 'absolute', bottom: 'calc(100% + 4px)',
              left: '1rem', right: '1rem',
              background: 'var(--card)', border: '1px solid var(--b1)',
              borderRadius: '10px', overflow: 'hidden',
              boxShadow: '0 8px 24px rgba(0,0,0,.25)', zIndex: 50,
            }}>
              <button
                onClick={handleGenerateImage}
                disabled={!isPro}
                style={{
                  display: 'flex', alignItems: 'center', gap: '.6rem',
                  width: '100%', padding: '.65rem .9rem',
                  background: 'none', border: 'none',
                  cursor: isPro ? 'pointer' : 'not-allowed',
                  color: isPro ? 'var(--t1)' : 'var(--t3)',
                  fontSize: '.82rem', textAlign: 'left',
                  opacity: isPro ? 1 : .5,
                }}
                onMouseEnter={e => { if (isPro) (e.currentTarget as HTMLElement).style.background = 'var(--s2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <div style={{
                  width: '22px', height: '22px', borderRadius: '5px',
                  background: 'rgba(123,92,245,.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: '.8rem' }}>✨</span>
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '.8rem' }}>Générer avec l&apos;IA</div>
                  {!isPro && <div style={{ fontSize: '.67rem', color: '#FBBF24' }}>Pro requis</div>}
                </div>
              </button>
              <div style={{ height: '1px', background: 'var(--b1)' }} />
              <label
                style={{
                  display: 'flex', alignItems: 'center', gap: '.6rem',
                  padding: '.65rem .9rem', cursor: 'pointer',
                  fontSize: '.82rem', color: 'var(--t1)',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'var(--s2)' }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'none' }}
              >
                <input
                  ref={fileRef}
                  type="file" accept="image/*"
                  style={{ display: 'none' }}
                  onChange={handleImportFile}
                />
                <div style={{
                  width: '22px', height: '22px', borderRadius: '5px',
                  background: 'rgba(6,182,212,.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <span style={{ fontSize: '.8rem' }}>📁</span>
                </div>
                <span style={{ fontWeight: 600 }}>Importer une photo</span>
              </label>
            </div>
          )}
        </div>
      )}

      {/* Footer: Brouillon / Programmer / Publier */}
      <div style={{
        display: 'flex', gap: '.45rem', padding: '.7rem 1rem',
        borderTop: '1px solid var(--b1)',
      }}>
        <button
          onClick={onDraft}
          style={{
            flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.3rem',
            padding: '.5rem', borderRadius: '8px',
            border: '1px solid var(--b1)', background: 'transparent',
            color: 'var(--t2)', cursor: 'pointer', fontSize: '.75rem', fontWeight: 500,
            transition: '.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)' }}
        >
          <Save size={12} /> Brouillon
        </button>
        <button
          onClick={onSchedule}
          title="Programmer"
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '.5rem .65rem', borderRadius: '8px',
            border: '1px solid var(--b1)', background: 'transparent',
            color: 'var(--t2)', cursor: 'pointer', transition: '.12s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--b1)'; e.currentTarget.style.color = 'var(--t2)' }}
        >
          <Clock size={14} />
        </button>
        <button
          onClick={onPublish}
          className="btn-primary"
          style={{
            flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.35rem',
            padding: '.5rem', borderRadius: '8px', fontSize: '.78rem', fontWeight: 600,
          }}
        >
          <Send size={12} /> Publier
        </button>
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
      <QuotaItem label="Posts texte" value={textStr} pct={textPct} color="#7B5CF5" />
    </div>
  )
}

// ─── Main GeneratedPostsView ──────────────────────────────────────────────────

export interface GeneratedPostsViewProps {
  platforms:    Platform[]
  variants:     Partial<Record<Platform, string>>
  objective:    PostObjective | null
  quotaUsed:    number
  quotaLimit:   number | 'unlimited'
  isPro:        boolean
  onSaveDraft:  (platform: Platform, content: string, imageUrl: string | null) => Promise<void>
  onPublish:    (platform: Platform, content: string, imageUrl: string | null) => Promise<void>
  onSchedule:   (platform: Platform, content: string, imageUrl: string | null, scheduledAt: string) => Promise<void>
}

export function GeneratedPostsView({
  platforms, variants, objective,
  quotaUsed, quotaLimit, isPro,
  onSaveDraft, onPublish, onSchedule,
}: GeneratedPostsViewProps) {
  const { toast } = useToast()

  // Per-card state
  const [cards, setCards] = useState<Record<string, CardState>>(() => {
    const init: Record<string, CardState> = {}
    for (const p of platforms) {
      init[p] = { content: variants[p] || '', imageUrl: null, imageLoading: false }
    }
    return init
  })

  // Sync content when variants prop changes (e.g. after external rewrite)
  useEffect(() => {
    setCards(prev => {
      const next = { ...prev }
      for (const p of platforms) {
        if (!next[p]) next[p] = { content: variants[p] || '', imageUrl: null, imageLoading: false }
        else next[p] = { ...next[p], content: variants[p] || next[p].content }
      }
      return next
    })
  }, [variants, platforms])

  // Active tab / mobile index
  const [activeTab,      setActiveTab]      = useState<Platform>(platforms[0])
  const [activeMobileIdx, setActiveMobileIdx] = useState(0)
  const [schedulerPlatform, setSchedulerPlatform] = useState<Platform | null>(null)
  const [loadingAction,  setLoadingAction]  = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)

  function updateCard(platform: Platform, partial: Partial<CardState>) {
    setCards(prev => ({ ...prev, [platform]: { ...prev[platform], ...partial } }))
  }

  function handleMobileScroll() {
    const el = scrollRef.current
    if (!el) return
    const idx = Math.max(0, Math.min(Math.round(el.scrollLeft / el.offsetWidth), platforms.length - 1))
    if (idx !== activeMobileIdx) {
      setActiveMobileIdx(idx)
      if (platforms[idx]) setActiveTab(platforms[idx])
    }
  }

  function scrollToIdx(idx: number) {
    scrollRef.current?.scrollTo({ left: idx * (scrollRef.current?.offsetWidth ?? 0), behavior: 'smooth' })
  }

  function tabClick(platform: Platform, idx: number) {
    setActiveTab(platform)
    scrollToIdx(idx)
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

  async function handleScheduleConfirm(scheduledAt: string) {
    const platform = schedulerPlatform
    setSchedulerPlatform(null)
    if (!platform || loadingAction) return
    setLoadingAction(`schedule-${platform}`)
    try {
      await onSchedule(platform, cards[platform]?.content || '', cards[platform]?.imageUrl || null, scheduledAt)
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
      if (res.ok && data.content) updateCard(platform, { content: data.content })
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
        updateCard(platform, { content: c.trimEnd() + '\n\n' + data.hashtags.join(' ') })
      } else toast(data.error || 'Erreur hashtags', 'error')
    } catch { toast('Erreur hashtags', 'error') }
    finally { setLoadingAction(null) }
  }

  function cardProps(p: Platform): PostPlatformCardProps {
    return {
      platform: p,
      objective,
      cardState: cards[p] || { content: '', imageUrl: null, imageLoading: false },
      onContentChange: v => updateCard(p, { content: v }),
      onImageSet:      url => updateCard(p, { imageUrl: url }),
      onImageLoad:     loading => updateCard(p, { imageLoading: loading }),
      onRewrite:   () => handleRewrite(p),
      onHashtags:  () => handleHashtags(p),
      onSchedule:  () => setSchedulerPlatform(p),
      onDraft:     () => handleDraft(p),
      onPublish:   () => handlePublish(p),
      isPro,
    }
  }

  return (
    <div>
      {/* Quota bar */}
      <QuotaBar textUsed={quotaUsed} textLimit={quotaLimit} />

      {/* Platform tabs */}
      <div style={{
        display: 'flex', gap: '.35rem', flexWrap: 'wrap',
        marginBottom: '.9rem', overflowX: 'auto',
        scrollbarWidth: 'none',
      } as React.CSSProperties}>
        {platforms.map((p, i) => {
          const isActive = p === activeTab
          const col = PLATFORM_COLORS[p]
          return (
            <button
              key={p}
              onClick={() => tabClick(p, i)}
              style={{
                display: 'flex', alignItems: 'center', gap: '.4rem',
                padding: '.38rem .8rem', borderRadius: '20px',
                border: `1px solid ${isActive ? col + '55' : 'var(--b1)'}`,
                background: isActive ? col + '14' : 'transparent',
                color: isActive ? col : 'var(--t3)',
                cursor: 'pointer', fontSize: '.76rem', fontWeight: 500,
                transition: '.15s', whiteSpace: 'nowrap',
              }}
            >
              <PlatformIcon platform={p} size={13} />
              {PLATFORM_NAMES[p]}
            </button>
          )
        })}
      </div>

      {/* ── Mobile: horizontal swipe ── */}
      <div className="gpv-mobile">
        <div
          ref={scrollRef}
          onScroll={handleMobileScroll}
          style={{
            display: 'flex', overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            scrollbarWidth: 'none',
          } as React.CSSProperties}
        >
          {platforms.map(p => (
            <div key={p} style={{ minWidth: '100%', scrollSnapAlign: 'start' }}>
              <PostPlatformCard {...cardProps(p)} />
            </div>
          ))}
        </div>
        {/* Dot indicators */}
        {platforms.length > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: '.4rem', marginTop: '.75rem' }}>
            {platforms.map((_, i) => (
              <div
                key={i} onClick={() => scrollToIdx(i)}
                style={{
                  width: i === activeMobileIdx ? '16px' : '6px', height: '6px',
                  borderRadius: '3px', cursor: 'pointer',
                  background: i === activeMobileIdx ? 'var(--accent)' : 'var(--b1)',
                  transition: 'all .2s',
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Desktop: 2-col grid ── */}
      <div className="gpv-desktop">
        <div style={{
          display: 'grid',
          gridTemplateColumns: platforms.length === 1 ? '1fr' : 'repeat(2, 1fr)',
          gap: '1rem',
        }}>
          {platforms.map(p => (
            <PostPlatformCard key={p} {...cardProps(p)} />
          ))}
        </div>
      </div>

      {/* Scheduler */}
      {schedulerPlatform && (
        <SchedulerSheet
          onConfirm={handleScheduleConfirm}
          onClose={() => setSchedulerPlatform(null)}
        />
      )}
    </div>
  )
}
