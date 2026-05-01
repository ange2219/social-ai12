'use client'

import { useEffect, useState } from 'react'

export function WelcomeBanner({ firstName }: { firstName: string }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const key = 'social_ia_welcome_day'
    const today = new Date().toDateString()
    const lastShown = localStorage.getItem(key)
    if (lastShown === today) return // already shown today

    localStorage.setItem(key, today)
    const t1 = setTimeout(() => setVisible(true), 400)
    const t2 = setTimeout(() => setVisible(false), 4500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [])

  if (!visible) return null

  return (
    <div style={{
      position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 500,
      background: 'var(--card)', border: '1px solid var(--b1)',
      borderRadius: '14px', padding: '.85rem 1.2rem',
      display: 'flex', alignItems: 'center', gap: '.75rem',
      boxShadow: '0 16px 48px rgba(59,130,246,.12)',
      maxWidth: '280px',
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      opacity: visible ? 1 : 0,
      transition: 'transform .35s ease, opacity .35s ease',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: 34, height: 34, borderRadius: '9px',
        background: 'linear-gradient(135deg, var(--accent), #7c3aed)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
          <path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/>
        </svg>
      </div>
      <div>
        <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--t1)' }}>
          Bienvenue, {firstName}
        </div>
        <div style={{ fontSize: '.75rem', color: 'var(--t3)', marginTop: '.1rem' }}>
          Prêt à publier aujourd'hui ?
        </div>
      </div>
    </div>
  )
}
