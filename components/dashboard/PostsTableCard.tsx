'use client'

import { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface PostRow {
  id: string
  content: string
  platforms: string[]
  status: 'published' | 'scheduled' | 'draft' | 'failed' | 'deleted'
  created_at: string
  scheduled_at?: string | null
}

export interface AnalyticsRow {
  post_id: string
  platform: string
  likes: number
  comments: number
  shares: number
  impressions: number
}

interface Props {
  posts: PostRow[]
  analytics: AnalyticsRow[]
  aiTip: string
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TABS = ['Performance', 'Programmés', 'Analytiques', 'Suggestions IA'] as const
type Tab = typeof TABS[number]

const PERIODS = ['Cette semaine', 'Ce mois', 'Le mois passé'] as const
type Period = typeof PERIODS[number]

const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
  twitter: 'Twitter / X', linkedin: 'LinkedIn',
}

const PLATFORM_COLOR: Record<string, { bg: string; color: string }> = {
  linkedin:  { bg: 'rgba(10,102,194,.12)',  color: '#0A66C2' },
  instagram: { bg: 'rgba(225,48,108,.12)',  color: '#E1306C' },
  twitter:   { bg: 'rgba(14,165,233,.12)',  color: '#0ea5e9' },
  facebook:  { bg: 'rgba(24,119,242,.12)',  color: '#1877F2' },
  tiktok:    { bg: 'rgba(0,0,0,.08)',        color: '#333' },
}

const AI_SUGGESTIONS = [
  { icon: '✨', color: 'rgba(245,158,11,.12)', textColor: 'var(--gold)',   title: 'Publier 3×/semaine',      sub: 'Doublez votre engagement',         pct: 80, bar: 'var(--blue)' },
  { icon: '🕐', color: 'var(--blue-light)',     textColor: 'var(--blue)',   title: 'Publier entre 18h–20h',   sub: 'Meilleure heure d\'engagement',    pct: 65, bar: '#93c5fd' },
  { icon: '🖼️', color: 'rgba(34,197,94,.12)',  textColor: 'var(--green)',  title: 'Ajouter plus de visuels', sub: '+40% de portée organique',         pct: 45, bar: '#bfdbfe' },
  { icon: '💬', color: 'rgba(139,92,246,.12)', textColor: '#8b5cf6',        title: 'Poser une question',      sub: 'Les questions génèrent 2× plus de commentaires', pct: 55, bar: '#c4b5fd' },
]

// ─── Score /240 ───────────────────────────────────────────────────────────────

function computeScore(rows: AnalyticsRow[]): number {
  const raw = rows.reduce((s, a) =>
    s + (a.likes || 0) * 1 + (a.comments || 0) * 3 + (a.shares || 0) * 5 + (a.impressions || 0) * 0.01
  , 0)
  return Math.min(240, Math.round(raw))
}

function scoreColor(score: number): string {
  if (score >= 192) return 'var(--green)'
  if (score >= 96)  return 'var(--blue)'
  if (score >= 48)  return 'var(--gold)'
  return 'var(--red)'
}

function scoreLabel(score: number): string {
  if (score >= 192) return 'Excellent'
  if (score >= 96)  return 'Bon'
  if (score >= 48)  return 'Moyen'
  return 'Faible'
}

// ─── Period filtering ─────────────────────────────────────────────────────────

function periodRange(period: Period): { start: Date; end: Date } {
  const now = new Date()
  if (period === 'Cette semaine') {
    const start = new Date(now)
    start.setDate(now.getDate() - now.getDay())
    start.setHours(0, 0, 0, 0)
    return { start, end: now }
  }
  if (period === 'Ce mois') {
    return { start: new Date(now.getFullYear(), now.getMonth(), 1), end: now }
  }
  // Le mois passé
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
  const end   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
  return { start, end }
}

function filterByPeriod(posts: PostRow[], period: Period): PostRow[] {
  const { start, end } = periodRange(period)
  return posts.filter(p => {
    const d = new Date(p.created_at)
    return d >= start && d <= end
  })
}

// ─── Platform SVG icons ───────────────────────────────────────────────────────

function PlatformIcon({ platform }: { platform: string }) {
  const svg = (path: React.ReactNode) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{path}</svg>
  )
  switch (platform) {
    case 'linkedin':  return svg(<><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/></>)
    case 'instagram': return svg(<><rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></>)
    case 'twitter':   return svg(<path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>)
    case 'facebook':  return svg(<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>)
    default:          return null
  }
}

// ─── Mini-modal ───────────────────────────────────────────────────────────────

function PostModal({ post, analytics, onClose }: {
  post: PostRow
  analytics: AnalyticsRow[]
  onClose: () => void
}) {
  const router = useRouter()
  const score = computeScore(analytics)
  const color = scoreColor(score)
  const mainPlatform = post.platforms?.[0] || 'instagram'
  const pc = PLATFORM_COLOR[mainPlatform] || { bg: 'var(--blue-light)', color: 'var(--blue)' }
  const totalLikes     = analytics.reduce((s, a) => s + (a.likes || 0), 0)
  const totalComments  = analytics.reduce((s, a) => s + (a.comments || 0), 0)
  const totalShares    = analytics.reduce((s, a) => s + (a.shares || 0), 0)
  const totalImpressions = analytics.reduce((s, a) => s + (a.impressions || 0), 0)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', backdropFilter: 'blur(6px)',
        zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
        animation: 'fadeUp .2s ease',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: 'var(--card-bg)', border: '1px solid var(--border)', borderRadius: 20,
          padding: '1.5rem', width: '100%', maxWidth: 420,
          boxShadow: '0 24px 64px var(--shadow)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: pc.bg, color: pc.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <PlatformIcon platform={mainPlatform} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {PLATFORM_NAMES[mainPlatform] || mainPlatform}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                {post.status === 'published' ? `Publié le ${new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}` : post.status === 'scheduled' && post.scheduled_at ? `Programmé le ${new Date(post.scheduled_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} à ${new Date(post.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}` : 'Brouillon'}
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 18, lineHeight: 1, padding: '4px 8px', borderRadius: 6 }}>✕</button>
        </div>

        {/* Content */}
        <div style={{ background: 'var(--input-bg)', borderRadius: 12, padding: '1rem', marginBottom: '1.25rem', fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, maxHeight: 120, overflowY: 'auto' }}>
          {post.content || 'Aucun contenu.'}
        </div>

        {/* Score */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)', fontWeight: 500 }}>Score d'engagement</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 120, height: 5, background: 'var(--border)', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(score / 240) * 100}%`, background: color, borderRadius: 3, transition: 'width .6s ease' }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color }}>
              {score} <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text3)' }}>/240</span>
            </span>
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: '1.25rem' }}>
          {[
            { label: 'Likes',       value: totalLikes,       color: '#E1306C' },
            { label: 'Commentaires',value: totalComments,    color: 'var(--blue)' },
            { label: 'Partages',    value: totalShares,      color: 'var(--green)' },
            { label: 'Impressions', value: totalImpressions, color: 'var(--gold)' },
          ].map(s => (
            <div key={s.label} style={{ background: 'var(--input-bg)', borderRadius: 10, padding: '8px 6px', textAlign: 'center' }}>
              <div style={{ fontSize: 15, fontWeight: 700, color: s.color }}>{s.value > 999 ? (s.value / 1000).toFixed(1) + 'K' : s.value}</div>
              <div style={{ fontSize: 9, color: 'var(--text3)', marginTop: 2 }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Platforms */}
        <div style={{ display: 'flex', gap: 6, marginBottom: '1.25rem' }}>
          {post.platforms?.map(p => {
            const c = PLATFORM_COLOR[p] || { bg: 'var(--blue-light)', color: 'var(--blue)' }
            return (
              <div key={p} style={{ width: 28, height: 28, borderRadius: 8, background: c.bg, color: c.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PlatformIcon platform={p} />
              </div>
            )
          })}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px', border: '1px solid var(--border)', borderRadius: 10, background: 'none', color: 'var(--text2)', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: '.15s' }}>
            Fermer
          </button>
          <button
            onClick={() => { router.push(`/posts/${post.id}/edit`); onClose() }}
            style={{ flex: 2, padding: '8px', border: 'none', borderRadius: 10, background: 'var(--blue)', color: '#fff', fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', transition: '.15s' }}
          >
            Modifier le post →
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PostsTableCard({ posts, analytics, aiTip }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('Performance')
  const [period, setPeriod] = useState<Period>('Ce mois')
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [modalPost, setModalPost] = useState<PostRow | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function getAnalyticsFor(postId: string) {
    return analytics.filter(a => a.post_id === postId)
  }

  // ── Tab: Performance ──────────────────────────────────────────────────────
  function TabPerformance() {
    const published = posts.filter(p => p.status === 'published')
    const filtered  = filterByPeriod(published, period)

    return (
      <>
        <div className="legend-row">
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--green)' }} />Excellent (≥192)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--blue)' }} />Bon (≥96)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--gold)' }} />Moyen (≥48)</div>
          <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--red)' }} />Faible</div>
        </div>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text3)', fontSize: 13 }}>
            Aucun post publié sur cette période.
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Publication</th>
                <th>Score</th>
                <th className="th-period">
                  <div ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
                    <button
                      className={`period-btn${dropdownOpen ? ' open' : ''}`}
                      onClick={() => setDropdownOpen(o => !o)}
                    >
                      <span>{period}</span>
                      <svg viewBox="0 0 24 24"><path d="m19 9-7 7-7-7"/></svg>
                    </button>
                    {dropdownOpen && (
                      <div className="period-dropdown show">
                        {PERIODS.map(p => (
                          <div
                            key={p}
                            className={`period-option${p === period ? ' selected' : ''}`}
                            onClick={() => { setPeriod(p); setDropdownOpen(false) }}
                          >
                            {p}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </th>
                <th>Détails</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 6).map(post => {
                const a    = getAnalyticsFor(post.id)
                const score = computeScore(a)
                const color = scoreColor(score)
                const pct   = Math.round((score / 240) * 100)
                const mainPlatform = post.platforms?.[0] || 'instagram'
                const pc = PLATFORM_COLOR[mainPlatform] || { bg: 'var(--blue-light)', color: 'var(--blue)' }
                return (
                  <tr key={post.id}>
                    <td>
                      <div className="post-info">
                        <div className="post-platform" style={{ background: pc.bg, color: pc.color }}>
                          <PlatformIcon platform={mainPlatform} />
                        </div>
                        <div>
                          <div className="post-name">{post.content?.slice(0, 38) || 'Post sans titre'}…</div>
                          <div className="post-sub">{PLATFORM_NAMES[mainPlatform]} · {new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color }}>{score} <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--text3)' }}>/240</span></span>
                        <div style={{ width: 80, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2 }} />
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="score-dot" style={{ color }}>
                        <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block' }} />
                        {scoreLabel(score)} — {pct}%
                      </div>
                    </td>
                    <td>
                      <button className="detail-btn" onClick={() => setModalPost(post)}>
                        <svg viewBox="0 0 24 24"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
                        Détails
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </>
    )
  }

  // ── Tab: Programmés ───────────────────────────────────────────────────────
  function TabProgrammes() {
    const scheduled = posts
      .filter(p => p.status === 'scheduled' && p.scheduled_at)
      .sort((a, b) => new Date(a.scheduled_at!).getTime() - new Date(b.scheduled_at!).getTime())

    if (scheduled.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>📅</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>Aucun post programmé</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>Planifiez vos publications pour maintenir une présence régulière.</div>
          <Link href="/posts/create" className="detail-btn" style={{ display: 'inline-flex' }}>
            <svg viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Créer un post
          </Link>
        </div>
      )
    }

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {scheduled.map((post, i) => {
          const d = new Date(post.scheduled_at!)
          const isToday = d.toDateString() === new Date().toDateString()
          const mainPlatform = post.platforms?.[0] || 'instagram'
          const pc = PLATFORM_COLOR[mainPlatform] || { bg: 'var(--blue-light)', color: 'var(--blue)' }
          return (
            <div
              key={post.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 4px',
                borderBottom: i < scheduled.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', borderRadius: 8, transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => setModalPost(post)}
            >
              <div style={{ width: 44, textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: isToday ? 'var(--blue)' : 'var(--text)', lineHeight: 1 }}>{d.getDate()}</div>
                <div style={{ fontSize: 9, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{d.toLocaleDateString('fr-FR', { month: 'short' })}</div>
              </div>
              <div style={{ width: 1, height: 36, background: 'var(--border)', flexShrink: 0 }} />
              <div style={{ width: 28, height: 28, borderRadius: 8, background: pc.bg, color: pc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PlatformIcon platform={mainPlatform} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.content?.slice(0, 50) || 'Post sans contenu'}…</div>
                <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 2 }}>{PLATFORM_NAMES[mainPlatform]} · {d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 500, color: isToday ? 'var(--blue)' : 'var(--text3)', background: isToday ? 'var(--blue-light)' : 'var(--input-bg)', padding: '3px 8px', borderRadius: 6, whiteSpace: 'nowrap', flexShrink: 0 }}>
                {isToday ? 'Aujourd\'hui' : `Dans ${Math.ceil((d.getTime() - Date.now()) / 86400000)}j`}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Tab: Analytiques ──────────────────────────────────────────────────────
  function TabAnalytiques() {
    const published = posts.filter(p => p.status === 'published')
    const withScore = published
      .map(p => ({ post: p, score: computeScore(getAnalyticsFor(p.id)), analytics: getAnalyticsFor(p.id) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    if (withScore.length === 0) {
      return (
        <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text3)', fontSize: 13 }}>
          Publiez des posts pour voir vos analytiques.
        </div>
      )
    }

    const maxScore = withScore[0]?.score || 1

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        {withScore.map(({ post, score, analytics: a }, i) => {
          const color = scoreColor(score)
          const mainPlatform = post.platforms?.[0] || 'instagram'
          const pc = PLATFORM_COLOR[mainPlatform] || { bg: 'var(--blue-light)', color: 'var(--blue)' }
          const eng = a.reduce((s, r) => s + (r.likes || 0) + (r.comments || 0) + (r.shares || 0), 0)
          const imp = a.reduce((s, r) => s + (r.impressions || 0), 0)
          return (
            <div
              key={post.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px',
                borderBottom: i < withScore.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer', borderRadius: 8, transition: 'background .15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--row-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              onClick={() => setModalPost(post)}
            >
              <div style={{ width: 18, fontSize: 11, fontWeight: 700, color: i === 0 ? 'var(--gold)' : 'var(--text3)', textAlign: 'center', flexShrink: 0 }}>#{i + 1}</div>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: pc.bg, color: pc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PlatformIcon platform={mainPlatform} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.content?.slice(0, 45) || 'Post sans contenu'}…
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 4, alignItems: 'center' }}>
                  <div style={{ flex: 1, height: 4, background: 'var(--border)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${(score / maxScore) * 100}%`, background: color, borderRadius: 2 }} />
                  </div>
                  <span style={{ fontSize: 10, color: 'var(--text3)', whiteSpace: 'nowrap' }}>{eng} eng · {imp > 999 ? (imp / 1000).toFixed(1) + 'K' : imp} imp</span>
                </div>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color, flexShrink: 0 }}>{score}<span style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 400 }}>/240</span></div>
            </div>
          )
        })}
      </div>
    )
  }

  // ── Tab: Suggestions IA ───────────────────────────────────────────────────
  function TabSuggestions() {
    const published  = posts.filter(p => p.status === 'published').length
    const avgPerWeek = parseFloat((posts.filter(p => p.status === 'published' && (Date.now() - new Date(p.created_at).getTime()) < 28 * 86400000).length / 4).toFixed(1))
    const dynamicTip = { icon: '💡', color: 'rgba(59,130,246,.12)', textColor: 'var(--blue)', title: 'Conseil personnalisé', sub: aiTip, pct: 70, bar: 'var(--blue)' }
    const suggestions = [dynamicTip, ...AI_SUGGESTIONS.slice(0, 3)]

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
        <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--blue-light)', padding: '3px 10px', borderRadius: 20, fontWeight: 500 }}>
            {published} posts publiés
          </div>
          <div style={{ fontSize: 11, color: 'var(--text2)', background: 'var(--input-bg)', padding: '3px 10px', borderRadius: 20, fontWeight: 500, border: '1px solid var(--border)' }}>
            {avgPerWeek} posts/semaine en moyenne
          </div>
        </div>
        {suggestions.map((s, i) => (
          <div key={i} className="sugg-item">
            <div className="sugg-avatar" style={{ background: s.color, color: s.textColor, fontSize: 16 }}>
              {s.icon}
            </div>
            <div className="sugg-info">
              <div className="sugg-name">{s.title}</div>
              <div className="sugg-sub">{s.sub}</div>
            </div>
            <div className="sugg-bar-wrap">
              <div className="sugg-bar-bg">
                <div className="sugg-bar-fill" style={{ width: `${s.pct}%`, background: s.bar }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="table-card">
        <div className="card-title">Mes Publications</div>

        {/* Tabs */}
        <div className="tabs-row">
          {TABS.map(tab => (
            <button
              key={tab}
              className={`mini-tab${activeTab === tab ? ' active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {activeTab === 'Performance'   && <TabPerformance />}
        {activeTab === 'Programmés'    && <TabProgrammes />}
        {activeTab === 'Analytiques'   && <TabAnalytiques />}
        {activeTab === 'Suggestions IA'&& <TabSuggestions />}
      </div>

      {/* Modal */}
      {modalPost && (
        <PostModal
          post={modalPost}
          analytics={getAnalyticsFor(modalPost.id)}
          onClose={() => setModalPost(null)}
        />
      )}
    </>
  )
}
