'use client'

import { useEffect } from 'react'

export default function PopupDone() {
  useEffect(() => {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS' }, window.location.origin)
      window.close()
    } else {
      window.location.href = '/dashboard'
    }
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0D0D1A', color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', gap: '10px' }}>
      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(123,92,245,.3)', borderTopColor: '#7B5CF5', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      Connexion en cours...
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
