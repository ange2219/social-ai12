'use client'

import { useEffect, useState } from 'react'

export function TypingGreeting({ firstName }: { firstName: string }) {
  const msg = `Bonjour, ${firstName} !`
  const [displayed, setDisplayed] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    let i = 0
    const delay = setTimeout(() => {
      const t = setInterval(() => {
        i++
        setDisplayed(msg.slice(0, i))
        if (i >= msg.length) { clearInterval(t); setDone(true) }
      }, 45)
      return () => clearInterval(t)
    }, 300)
    return () => clearTimeout(delay)
  }, [msg])

  return (
    <h1>
      {displayed}
      {!done && (
        <span style={{
          display: 'inline-block', width: 2, height: '1em',
          background: 'var(--purple)', marginLeft: 2,
          verticalAlign: 'text-bottom',
          animation: 'blink .7s step-end infinite',
        }} />
      )}
      <style>{`@keyframes blink{0%,100%{opacity:1}50%{opacity:0}}`}</style>
    </h1>
  )
}
