'use client'

import { useEffect, useRef, useState, useMemo } from 'react'

type Period = 'week' | 'month' | 'last'
type Platform = 'linkedin' | 'instagram' | 'twitter' | 'facebook'

interface PostData {
  id: string
  created_at: string
  status?: string
}

interface AnalyticsData {
  post_id: string
  platform: string
  likes?: number
  comments?: number
  shares?: number
  impressions?: number
}

type ChartData = {
  labels: string[]
  linkedin: number[]
  instagram: number[]
  twitter: number[]
  facebook: number[]
}

function computeChartData(
  posts: PostData[],
  analytics: AnalyticsData[],
  period: Period,
): ChartData {
  const now = new Date()

  type Bucket = { label: string; start: Date; end: Date }
  let buckets: Bucket[]

  if (period === 'week') {
    const monday = new Date(now)
    const dow = now.getDay() || 7 // 0=Sunday → treat as 7
    monday.setDate(now.getDate() - dow + 1)
    monday.setHours(0, 0, 0, 0)
    buckets = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((label, i) => {
      const start = new Date(monday)
      start.setDate(monday.getDate() + i)
      const end = new Date(start)
      end.setHours(23, 59, 59, 999)
      return { label, start, end }
    })
  } else if (period === 'month') {
    const year = now.getFullYear()
    const month = now.getMonth()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    buckets = [0, 1, 2, 3].map(i => ({
      label: `S${i + 1}`,
      start: new Date(year, month, i * 7 + 1),
      end: new Date(year, month, Math.min((i + 1) * 7, daysInMonth), 23, 59, 59, 999),
    }))
  } else {
    // last month
    const year = now.getFullYear()
    const month = now.getMonth() - 1
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    buckets = [0, 1, 2, 3].map(i => ({
      label: `S${i + 1}`,
      start: new Date(year, month, i * 7 + 1),
      end: new Date(year, month, Math.min((i + 1) * 7, daysInMonth), 23, 59, 59, 999),
    }))
  }

  const postDates: Record<string, Date> = {}
  for (const p of posts) postDates[p.id] = new Date(p.created_at)

  const result: ChartData = {
    labels:    buckets.map(b => b.label),
    linkedin:  buckets.map(() => 0),
    instagram: buckets.map(() => 0),
    twitter:   buckets.map(() => 0),
    facebook:  buckets.map(() => 0),
  }

  for (const a of analytics) {
    const postDate = postDates[a.post_id]
    if (!postDate) continue
    const platKey = a.platform as keyof ChartData
    if (!(platKey in result) || platKey === 'labels') continue
    const bi = buckets.findIndex(b => postDate >= b.start && postDate <= b.end)
    if (bi === -1) continue
    ;(result[platKey] as number[])[bi] += (a.likes || 0) + (a.comments || 0) + (a.shares || 0)
  }

  return result
}

const COLORS: Record<Platform, string> = {
  linkedin:  '#7B5CF5',
  instagram: '#EC4899',
  twitter:   '#06B6D4',
  facebook:  '#3B82F6',
}

const PLATFORM_LABELS: Record<Platform, string> = {
  linkedin:  'LinkedIn',
  instagram: 'Instagram',
  twitter:   'X (Twitter)',
  facebook:  'Facebook',
}

const PERIOD_OPTIONS: { value: Period; label: string }[] = [
  { value: 'week',  label: 'Semaine' },
  { value: 'month', label: 'Ce mois' },
  { value: 'last',  label: 'Mois passé' },
]

const PLATFORM_OPTIONS: { value: Platform | 'all'; label: string }[] = [
  { value: 'all',       label: 'Toutes' },
  { value: 'linkedin',  label: 'LinkedIn' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'twitter',   label: 'X (Twitter)' },
  { value: 'facebook',  label: 'Facebook' },
]

export function ActivityChart({
  hasPosts = false,
  posts = [],
  analytics = [],
}: {
  hasPosts?: boolean
  posts?: PostData[]
  analytics?: AnalyticsData[]
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [period, setPeriod]           = useState<Period>('week')
  const [activePlat, setActivePlat]   = useState<Platform | 'all'>('all')
  const [showPeriodDrop, setShowPeriodDrop] = useState(false)
  const [showPlatDrop,   setShowPlatDrop]   = useState(false)

  const chartData = useMemo(
    () => computeChartData(posts, analytics, period),
    [posts, analytics, period],
  )

  const hasRealData = useMemo(
    () => [...chartData.linkedin, ...chartData.instagram, ...chartData.twitter, ...chartData.facebook].some(v => v > 0),
    [chartData],
  )

  const platforms: Platform[] = activePlat === 'all'
    ? ['linkedin', 'instagram', 'twitter', 'facebook']
    : [activePlat]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light'
    const dpr = window.devicePixelRatio || 1
    const W = canvas.offsetWidth
    const H = 130
    canvas.width  = W * dpr
    canvas.height = H * dpr
    canvas.style.width  = W + 'px'
    canvas.style.height = H + 'px'
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, W, H)

    const d = chartData
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
      const col  = COLORS[p]
      const pts  = vals.map((v, i) => ({
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
  }, [period, activePlat, chartData])

  useEffect(() => {
    const close = () => { setShowPeriodDrop(false); setShowPlatDrop(false) }
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const periodLabel = PERIOD_OPTIONS.find(o => o.value === period)?.label || 'Semaine'
  const platLabel   = activePlat === 'all' ? 'Toutes' : PLATFORM_LABELS[activePlat]

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

  if (!hasRealData) {
    return (
      <div className="chart-card">
        <div className="card-title" style={{ marginBottom: 6 }}>Activité</div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 160, gap: 8, color: 'var(--text-muted)' }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M7.5 14.25v2.25m3-4.5v4.5m3-6.75v6.75m3-9v9M6 20.25h12A2.25 2.25 0 0 0 20.25 18V6A2.25 2.25 0 0 0 18 3.75H6A2.25 2.25 0 0 0 3.75 6v12A2.25 2.25 0 0 0 6 20.25Z"/>
          </svg>
          <span style={{ fontSize: 13 }}>Synchronisez vos réseaux pour voir les statistiques</span>
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
                  onClick={() => { setActivePlat(o.value as Platform | 'all'); setShowPlatDrop(false) }}>
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
            style={{ opacity: activePlat === p || activePlat === 'all' ? 1 : 0.3 }}>
            <span className="cl-dot" style={{ background: col }} />
            {PLATFORM_LABELS[p]}
          </div>
        ))}
      </div>
    </div>
  )
}
