'use client'

import { useEffect, useState } from 'react'

export function WelcomeBanner({ firstName }: { firstName: string }) {
  const [msg, setMsg] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const key = 'social_ia_visited'
    const isReturn = localStorage.getItem(key)
    localStorage.setItem(key, '1')

    const text = isReturn
      ? `Bon retour, ${firstName} 👋`
      : `Bienvenue sur Social IA, ${firstName} 🎉`

    setMsg(text)

    // Apparition après 300ms, disparition après 4s
    const t1 = setTimeout(() => setVisible(true), 300)
    const t2 = setTimeout(() => setVisible(false), 4500)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [firstName])

  if (!msg) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      zIndex: 500,
      background: '#18181C',
      border: '1px solid #27272D',
      borderRadius: '12px',
      padding: '.85rem 1.2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '.75rem',
      boxShadow: '0 16px 48px rgba(0,0,0,.5)',
      maxWidth: '300px',
      transform: visible ? 'translateY(0)' : 'translateY(20px)',
      opacity: visible ? 1 : 0,
      transition: 'transform .35s ease, opacity .35s ease',
      pointerEvents: 'none',
    }}>
      <div style={{
        width: '36px', height: '36px', borderRadius: '9px',
        background: '#4646FF', display: 'flex', alignItems: 'center',
        justifyContent: 'center', flexShrink: 0, fontSize: '1.1rem',
      }}>
        ✨
      </div>
      <div>
        <div style={{ fontSize: '.85rem', fontWeight: 600, color: '#F4F4F6' }}>{msg}</div>
        <div style={{ fontSize: '.75rem', color: '#52525C', marginTop: '.1rem' }}>
          Prêt à publier aujourd'hui ?
        </div>
      </div>
    </div>
  )
}
