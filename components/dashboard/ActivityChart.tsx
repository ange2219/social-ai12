'use client'

import { useEffect, useRef, useState } from 'react'

const DATA = {
  week: {
    labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
    linkedin: [2, 3, 2, 4, 3, 1, 2],
    instagram: [1, 2, 3, 2, 4, 2, 1],
    twitter: [0, 1, 1, 2, 1, 0, 1],
    facebook: [1, 1, 2, 1, 2, 1, 0],
  },
  month: {
    labels: ['S1', 'S2', 'S3', 'S4'],
    linkedin: [5, 8, 6, 9],
    instagram: [3, 5, 7, 4],
    twitter: [1, 2, 3, 2],
    facebook: [2, 3, 2, 4],
  },
  last: {
    labels: ['S1', 'S2', 'S3', 'S4'],
    linkedin: [4, 6, 5, 7],
    instagram: [2, 4, 5, 3],
    twitter: [1, 1, 2, 1],
    facebook: [1, 2, 1, 3],
  },
} as const

type Period = keyof typeof DATA
type Platform = 'linkedin' | 'instagram' | 'twitter' | 'facebook'

const COLORS: Record<Platform, string> = {
  linkedin: '#7B5CF5',
  instagram: '#EC4899',
  twitter: '#06B6D4',
  facebook: '#3B82F6',
}

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin: 'LinkedIn',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  facebook: 'Facebook',
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week', label: 'Semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'last', label: 'Mois passé' },
]

const PLATFORM_OPTIONS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all', label: 'Toutes' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter', label: 'X (Twitter)' },
  { value: 'facebook', label: 'Facebook' },
]

export function ActivityChart({ hasPosts = true }: { hasPosts?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [period, setPeriod] = useState<Period>('week')
  const [activePlat, setActivePlat] = useState<Platform>('facebook')
  const [showPeriodDrop, setShowPeriodDrop] = useState(false)
  const [showPlatDrop, setShowPlatDrop] = useState(false)

  const platforms: Platform[] = activePlat === ('all' as any)
    ? ['linkedin', 'instagram', 'twitter', 'facebook']
    : [activePlat]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = 130
    canvas.width = W * dpr
    canvas.height = H * dpr
    canvas.style.width = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const d = DATA[period]
    const n = d.labels.length
    const pad = { l: 28, r: 12, t: 10, b: 20 }
    const cW = W - pad.l - pad.r
    const cH = H - pad.t - pad.b

    let max = 0
    platforms.forEach(p => d[p].forEach(v => { if (v > max) max = v }))
    if (max === 0) max = 5

    // Grid
    for (let i = 0; i <= 4; i++) {
      const y = pad.t + cH * (i / 4)
      ctx.beginPath(); ctx.moveTo(pad.l, y); ctx.lineTo(W - pad.r, y)
      ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'
      ctx.lineWidth = 1; ctx.stroke()
      const val = Math.round(max * (1 - i / 4))
      ctx.fillStyle = isDark ? '#4B5563' : '#9CA3AF'
      ctx.font = '9px DM Sans,sans-serif'
      ctx.textAlign = 'right'; ctx.fillText(String(val), pad.l - 4, y + 3)
    }

    // X labels
    d.labels.forEach((lbl, i) => {
      const x = pad.l + cW * (i / (n - 1))
      ctx.fillStyle = isDark ? '#4B5563' : '#9CA3AF'
      ctx.font = '9px DM Sans,sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(lbl, x, H - 4)
    })

    // Lines
    platforms.forEach(p => {
      const vals = d[p]
      const col = COLORS[p]
      const pts = vals.map((v, i) => ({
        x: pad.l + cW * (i / (n - 1)),
        y: pad.t + cH * (1 - v / max),
      }))

      const grad = ctx.createLinearGradient(0, pad.t, 0, pad.t + cH)
      grad.addColorStop(0, col + '28'); grad.addColorStop(1, col + '00')

      ctx.beginPath()
      ctx.moveTo(pts[0].x, pad.t + cH)
      pts.forEach(pt => ctx.lineTo(pt.x, pt.y))
      ctx.lineTo(pts[pts.length - 1].x, pad.t + cH)
      ctx.closePath(); ctx.fillStyle = grad; ctx.fill()

      ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y)
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
      ctx.strokeStyle = col; ctx.lineWidth = 2
      ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.stroke()

      pts.forEach(pt => {
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3.5, 0, Math.PI * 2)
        ctx.fillStyle = col; ctx.fill()
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 1.8, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.fill()
      })
    })
  }, [period, activePlat])

  useEffect(() => {
    const close = () => { setShowPeriodDrop(false); setShowPlatDrop(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || 'Semaine'
  const platLabel = activePlat === ('all' as any) ? 'Toutes' : PLATFORM_LABELS[activePlat]

  if (!hasPosts) {
    return (
      <div className="chart-card">
        <div className="card-title" style={{ marginBottom: 6 }}>Activité</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8, color: 'var(--text-muted)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z"/>
          </svg>
          <span style={{ fontSize: 13 }}>Publiez votre premier post pour voir votre activité</span>
        </div>
      </div>
    )
  }

  return (
    <div className="chart-card">
      <div className="card-title" style={{ marginBottom: 6 }}>Activité</div>

      <div className="act-filters">
        {/* Period dropdown */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button className={`period-btn${showPeriodDrop ? ' open' : ''}`} onClick={() => setShowPeriodDrop(v => !v)}>
            <span>{periodLabel}</span>
            <svg viewBox="0 0 24 24"><path d="m19 9-7 7-7-7"/></svg>
          </button>
          {showPeriodDrop && (
            <div className="period-dropdown show">
              {PERIOD_OPTIONS.map(o => (
                <div key={o.value} className={`period-option${period === o.value ? ' selected' : ''}`}
                  onClick={() => { setPeriod(o.value); setShowPeriodDrop(false) }}>
                  {o.label}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Platform dropdown */}
        <div style={{ position: 'relative' }} onClick={e => e.stopPropagation()}>
          <button className={`period-btn${showPlatDrop ? ' open' : ''}`} onClick={() => setShowPlatDrop(v => !v)}>
            <span>{platLabel}</span>
            <svg viewBox="0 0 24 24"><path d="m19 9-7 7-7-7"/></svg>
          </button>
          {showPlatDrop && (
            <div className="period-dropdown show" style={{ right: 0, left: 'auto' }}>
              {PLATFORM_OPTIONS.map(o => (
                <div key={o.value} className={`period-option${activePlat === o.value ? ' selected' : ''}`}
                  onClick={() => { setActivePlat(o.value as Platform); setShowPlatDrop(false) }}>
                  {o.label}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <canvas ref={canvasRef} style={{ width: '100%', display: 'block' }} />

      <div className="chart-legend">
        {(Object.entries(COLORS) as [Platform, string][]).map(([p, col]) => (
          <div key={p} className="chart-legend-item"
            style={{ opacity: activePlat === p || activePlat === ('all' as any) ? 1 : 0.3 }}>
            <span className="cl-dot" style={{ background: col }} />
            {PLATFORM_LABELS[p]}
          </div>
        ))}
      </div>
    </div>
  )
}
