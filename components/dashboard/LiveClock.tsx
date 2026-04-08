'use client'

import { useState, useEffect } from 'react'

export function LiveClock() {
  const [display, setDisplay] = useState('')

  useEffect(() => {
    function update() {
      const now = new Date()
      const d = now.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
      const t = now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
      setDisplay(`${d}, ${t}`)
    }
    update()
    const id = setInterval(update, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="time-box">
      <div>
        <div className="time-label">Date &amp; Heure</div>
        <div className="time-val">{display}</div>
      </div>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/>
      </svg>
    </div>
  )
}
