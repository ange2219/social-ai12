'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PWAInstall() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [show, setShow] = useState(false)

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {})
    }

    // Capture install prompt (Android Chrome)
    const handler = (e: Event) => {
      e.preventDefault()
      setPrompt(e as BeforeInstallPromptEvent)
      // Only show banner if not already installed
      if (!window.matchMedia('(display-mode: standalone)').matches) {
        setShow(true)
      }
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  if (!show || !prompt) return null

  async function install() {
    if (!prompt) return
    await prompt.prompt()
    const { outcome } = await prompt.userChoice
    if (outcome === 'accepted') setShow(false)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 70,
      left: '50%',
      transform: 'translateX(-50%)',
      background: '#18181B',
      border: '1px solid #27272A',
      borderRadius: 12,
      padding: '0.75rem 1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      zIndex: 9999,
      boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
      maxWidth: 340,
      width: 'calc(100% - 2rem)',
    }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#fff' }}>Installer Social IA</div>
        <div style={{ fontSize: '0.75rem', color: '#888' }}>Accès rapide depuis l'écran d'accueil</div>
      </div>
      <button
        onClick={install}
        style={{
          padding: '0.4rem 0.9rem',
          background: '#3B7BF6',
          border: 'none',
          borderRadius: 8,
          color: '#fff',
          fontWeight: 600,
          cursor: 'pointer',
          fontSize: '0.8rem',
          whiteSpace: 'nowrap',
        }}
      >
        Installer
      </button>
      <button
        onClick={() => setShow(false)}
        style={{
          background: 'none',
          border: 'none',
          color: '#666',
          cursor: 'pointer',
          padding: '0 0.2rem',
          fontSize: '1rem',
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}
