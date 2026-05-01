'use client'

import { useState, useEffect, useCallback, Fragment } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import {
  IconInstagram, IconFacebook, IconTikTok,
  IconTwitterX, IconLinkedIn, IconYouTube, IconPinterest,
} from '@/components/icons/BrandIcons'

// ─── Constants ────────────────────────────────────────────────────────────────

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C', facebook: '#1877F2', tiktok: '#9333EA',
  twitter: '#1DA1F2', linkedin: '#0077B5', youtube: '#FF0000', pinterest: '#E60023',
}
const PLATFORM_SHORT: Record<string, string> = {
  instagram: 'IG', facebook: 'FB', tiktok: 'TK',
  twitter: 'X', linkedin: 'LI', youtube: 'YT', pinterest: 'PT',
}
const DAY_LABELS        = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam']
const MONTH_NAMES       = ['Janv', 'Févr', 'Mars', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sept', 'Oct', 'Nov', 'Déc']
const MONTH_NAMES_FULL  = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const HOURS             = Array.from({ length: 15 }, (_, i) => i + 7)  // 07h → 21h
const HOUR_H            = 64  // px per hour row

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekStart(date: Date): Date {
  const d   = new Date(date)
  const day = d.getDay()
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day))
  d.setHours(0, 0, 0, 0)
  return d
}

function formatWeekRange(start: Date): string {
  const end = new Date(start)
  end.setDate(end.getDate() + 6)
  const year = end.getFullYear()
  return start.getMonth() === end.getMonth()
    ? `${start.getDate()} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${year}`
    : `${start.getDate()} ${MONTH_NAMES[start.getMonth()]} – ${end.getDate()} ${MONTH_NAMES[end.getMonth()]} ${year}`
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() &&
         a.getMonth()    === b.getMonth()    &&
         a.getDate()     === b.getDate()
}

function PlatformIcon({ platform, size = 11 }: { platform: string; size?: number }) {
  switch (platform) {
    case 'instagram': return <IconInstagram size={size} />
    case 'facebook':  return <IconFacebook  size={size} />
    case 'tiktok':    return <IconTikTok    size={size} />
    case 'twitter':   return <IconTwitterX  size={size} />
    case 'linkedin':  return <IconLinkedIn  size={size} />
    case 'youtube':   return <IconYouTube   size={size} />
    case 'pinterest': return <IconPinterest size={size} />
    default:          return null
  }
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface Post {
  id:           string
  content:      string
  platforms:    string[]
  status:       string
  scheduled_at: string | null
}

// ─── Month View ───────────────────────────────────────────────────────────────

function MonthView({ monthDate, posts }: { monthDate: Date; posts: Post[] }) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Build the grid: weeks × 7 days
  const year  = monthDate.getFullYear()
  const month = monthDate.getMonth()
  const firstDay = new Date(year, month, 1)
  // Start on Monday (adjust getDay: 0=Sun→6, 1=Mon→0, …)
  const startOffset = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  const cells: (Date | null)[] = []
  for (let i = 0; i < startOffset; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))
  while (cells.length % 7 !== 0) cells.push(null)

  const weeks: (Date | null)[][] = []
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7))

  const WEEK_LABELS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

  function postsForDay(day: Date): Post[] {
    return posts.filter(p => {
      if (!p.scheduled_at) return false
      const d = new Date(p.scheduled_at)
      return sameDay(d, day)
    })
  }

  return (
    <div style={{ padding: '0 1px' }}>
      {/* Week day labels */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {WEEK_LABELS.map(l => (
          <div key={l} style={{
            textAlign: 'center', padding: '.55rem 0',
            fontSize: '.65rem', fontWeight: 600, letterSpacing: '.06em',
            textTransform: 'uppercase', color: 'var(--t3)',
            borderBottom: '1px solid var(--b1)',
          }}>
            {l}
          </div>
        ))}
      </div>

      {/* Day cells */}
      {weeks.map((week, wi) => (
        <div key={wi} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
          {week.map((day, di) => {
            const isToday  = day ? sameDay(day, today) : false
            const dayPosts = day ? postsForDay(day) : []
            return (
              <div
                key={di}
                style={{
                  minHeight: 92,
                  borderBottom: '1px solid var(--b1)',
                  borderLeft: di > 0 ? '1px solid var(--b1)' : 'none',
                  padding: '.35rem .4rem',
                  background: !day ? 'var(--s2)' : isToday ? 'rgba(59,130,246,.04)' : 'transparent',
                }}
              >
                {day && (
                  <>
                    <div style={{
                      fontSize: '.72rem', fontWeight: 600, marginBottom: '.3rem',
                      color: isToday ? 'var(--accent)' : 'var(--t2)',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 22, height: 22, borderRadius: '50%',
                      background: isToday ? 'rgba(59,130,246,.15)' : 'transparent',
                    }}>
                      {day.getDate()}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {dayPosts.slice(0, 3).map(post => {
                        const platform = post.platforms[0] || 'instagram'
                        const color    = PLATFORM_COLORS[platform] || '#3B82F6'
                        const short    = PLATFORM_SHORT[platform] || platform
                        return (
                          <div
                            key={post.id}
                            title={post.content}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '.2rem',
                              padding: '.18rem .35rem',
                              background: color + '1c',
                              borderLeft: `3px solid ${color}`,
                              borderRadius: '4px',
                              fontSize: '.65rem', fontWeight: 600,
                              overflow: 'hidden', whiteSpace: 'nowrap',
                              cursor: 'pointer',
                            }}
                          >
                            <PlatformIcon platform={platform} size={10} />
                            <span style={{ color, flexShrink: 0 }}>{short}</span>
                            <span style={{ color: 'var(--t3)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis', marginLeft: 2 }}>
                              {post.content.slice(0, 18)}
                            </span>
                          </div>
                        )
                      })}
                      {dayPosts.length > 3 && (
                        <div style={{ fontSize: '.62rem', color: 'var(--t3)', paddingLeft: '.35rem' }}>
                          +{dayPosts.length - 3} de plus
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CalendarPage() {
  const [weekStart,  setWeekStart]  = useState(() => getWeekStart(new Date()))
  const [monthDate,  setMonthDate]  = useState(() => { const d = new Date(); d.setDate(1); d.setHours(0,0,0,0); return d })
  const [view,       setView]       = useState<'week' | 'month'>('week')
  const [posts,      setPosts]      = useState<Post[]>([])

  const fetchPosts = useCallback(() => {
    fetch('/api/posts?limit=200')
      .then(r => r.json())
      .then(d => setPosts((d.posts || []).filter((p: Post) => p.scheduled_at)))
      .catch(() => {})
  }, [])

  useEffect(() => {
    fetchPosts()
    // Re-fetch when tab regains focus (catches posts deleted elsewhere)
    function onFocus() { fetchPosts() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [fetchPosts])

  // ── Week view helpers ──────────────────────────────────────────────────────
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart)
    d.setDate(weekStart.getDate() + i)
    return d
  })
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 7)

  const weekPosts = posts.filter(p => {
    const d = new Date(p.scheduled_at!)
    return d >= weekStart && d < weekEnd
  })

  const todayMidnight = new Date()
  todayMidnight.setHours(0, 0, 0, 0)

  // ── Navigation ──────────────────────────────────────────────────────────────
  function prevWeek() { const d = new Date(weekStart); d.setDate(d.getDate() - 7); setWeekStart(d) }
  function nextWeek() { const d = new Date(weekStart); d.setDate(d.getDate() + 7); setWeekStart(d) }
  function prevMonth() { setMonthDate(d => new Date(d.getFullYear(), d.getMonth() - 1, 1)) }
  function nextMonth() { setMonthDate(d => new Date(d.getFullYear(), d.getMonth() + 1, 1)) }
  function goToday() {
    setWeekStart(getWeekStart(new Date()))
    const d = new Date(); d.setDate(1); d.setHours(0,0,0,0)
    setMonthDate(d)
  }

  const headerLabel = view === 'week'
    ? formatWeekRange(weekStart)
    : `${MONTH_NAMES_FULL[monthDate.getMonth()]} ${monthDate.getFullYear()}`

  function handlePrev() { view === 'week' ? prevWeek() : prevMonth() }
  function handleNext() { view === 'week' ? nextWeek() : nextMonth() }

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <div style={{ margin: '-20px', display: 'flex', flexDirection: 'column' }}>

      {/* ── Top bar ── */}
      <div style={{
        position: 'sticky', top: '-20px', zIndex: 20,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '.9rem 1.5rem', borderBottom: '1px solid var(--b1)',
        background: 'var(--bg)',
      }}>
        {/* Left */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
          <span style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.1rem', fontWeight: 700, color: 'var(--t1)' }}>
            Calendrier
          </span>
          <div style={{ display: 'flex', gap: '.2rem' }}>
            {[handlePrev, handleNext].map((fn, i) => (
              <button
                key={i} onClick={fn}
                style={{ display: 'flex', padding: '5px 6px', borderRadius: '7px', border: '1px solid var(--b1)', background: 'var(--card)', cursor: 'pointer', color: 'var(--t3)', transition: '.12s' }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)'; e.currentTarget.style.borderColor = 'var(--b2)' }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)'; e.currentTarget.style.borderColor = 'var(--b1)' }}
              >
                {i === 0 ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
              </button>
            ))}
          </div>
          <span style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--t1)' }}>
            {headerLabel}
          </span>
          <button
            onClick={goToday}
            style={{ padding: '.25rem .6rem', borderRadius: '6px', border: '1px solid var(--b1)', background: 'transparent', color: 'var(--t3)', fontSize: '.73rem', fontWeight: 500, cursor: 'pointer', transition: '.12s' }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--t1)' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--t3)' }}
          >
            Aujourd&apos;hui
          </button>
        </div>

        {/* Right: Semaine / Mois */}
        <div style={{ display: 'flex', background: 'var(--s2)', border: '1px solid var(--b1)', borderRadius: '8px', padding: '3px', gap: '3px' }}>
          {(['week', 'month'] as const).map(v => (
            <button
              key={v} onClick={() => setView(v)}
              style={{
                padding: '.28rem .75rem', borderRadius: '6px', border: 'none',
                background: view === v ? 'var(--card)' : 'transparent',
                color: view === v ? 'var(--t1)' : 'var(--t3)',
                fontSize: '.8rem', fontWeight: 600, cursor: 'pointer', transition: '.12s',
                boxShadow: view === v ? '0 1px 3px rgba(0,0,0,.25)' : 'none',
              }}
            >
              {v === 'week' ? 'Semaine' : 'Mois'}
            </button>
          ))}
        </div>
      </div>

      {/* ── Week view ── */}
      {view === 'week' && (
        <div style={{ overflowX: 'auto' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '52px repeat(7, 1fr)',
            minWidth: '680px',
          }}>

            {/* Day header cells */}
            <div style={{ height: 52, borderBottom: '1px solid var(--b1)' }} />
            {weekDays.map((day, i) => {
              const isToday = sameDay(day, todayMidnight)
              const dayPosts = weekPosts.filter(p => sameDay(new Date(p.scheduled_at!), day))
              return (
                <div
                  key={i}
                  style={{
                    height: 52,
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    borderBottom: '1px solid var(--b1)',
                    borderLeft: '1px solid var(--b1)',
                  }}
                >
                  <span style={{
                    fontSize: '.66rem', fontWeight: 500, textTransform: 'uppercase',
                    letterSpacing: '.06em',
                    color: isToday ? 'var(--accent)' : 'var(--t3)',
                  }}>
                    {DAY_LABELS[day.getDay()]} {day.getDate()}
                  </span>
                  {dayPosts.length > 0 && (
                    <div style={{ display: 'flex', gap: '3px', marginTop: '4px' }}>
                      {dayPosts.slice(0, 3).map(p => (
                        <div
                          key={p.id}
                          style={{
                            width: 6, height: 6, borderRadius: '50%',
                            background: PLATFORM_COLORS[p.platforms[0]] || '#3B82F6',
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Hour rows */}
            {HOURS.map(hour => (
              <Fragment key={hour}>
                {/* Time label */}
                <div style={{
                  height: HOUR_H, borderBottom: '1px solid var(--b1)',
                  padding: '.35rem .5rem 0 0', textAlign: 'right',
                  fontSize: '.63rem', fontWeight: 500, color: 'var(--t3)',
                  userSelect: 'none',
                }}>
                  {`${String(hour).padStart(2, '0')}:00`}
                </div>

                {/* Day cells */}
                {weekDays.map((day, di) => {
                  const isToday = sameDay(day, todayMidnight)
                  const cellPosts = weekPosts.filter(p => {
                    const d = new Date(p.scheduled_at!)
                    return sameDay(d, day) && d.getHours() === hour
                  })
                  return (
                    <div
                      key={`${hour}-${di}`}
                      style={{
                        height: HOUR_H,
                        borderBottom: '1px solid var(--b1)',
                        borderLeft: '1px solid var(--b1)',
                        background: isToday ? 'rgba(59,130,246,.025)' : 'transparent',
                        padding: '3px 5px',
                      }}
                    >
                      {cellPosts.map(post => {
                        const platform = post.platforms[0] || 'instagram'
                        const color    = PLATFORM_COLORS[platform] || '#3B82F6'
                        const short    = PLATFORM_SHORT[platform] || platform
                        const words    = post.content.trim().split(/\s+/)
                        const topic    = words.slice(0, 2).join(' ')
                        return (
                          <div
                            key={post.id}
                            title={post.content}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '.28rem',
                              padding: '.22rem .4rem',
                              background: color + '1c',
                              borderLeft: `3px solid ${color}`,
                              borderRadius: '4px',
                              fontSize: '.71rem', fontWeight: 600,
                              marginBottom: '2px',
                              cursor: 'pointer',
                              overflow: 'hidden', whiteSpace: 'nowrap',
                              transition: '.1s',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.background = color + '30' }}
                            onMouseLeave={e => { e.currentTarget.style.background = color + '1c' }}
                          >
                            <PlatformIcon platform={platform} size={11} />
                            <span style={{ color, flexShrink: 0 }}>{short}</span>
                            <span style={{ color: 'var(--t2)', fontWeight: 400, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              · {topic}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  )
                })}
              </Fragment>
            ))}
          </div>
        </div>
      )}

      {/* ── Month view ── */}
      {view === 'month' && (
        <MonthView monthDate={monthDate} posts={posts} />
      )}
    </div>
  )
}
