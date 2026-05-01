'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PopupDone() {
  useEffect(() => {
    async function handle() {
      let isNew = false
      try {
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data } = await supabase
            .from('brand_profiles')
            .select('user_id')
            .eq('user_id', user.id)
            .maybeSingle()
          isNew = !data
        }
      } catch {}

      if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type: 'GOOGLE_AUTH_SUCCESS', isNew }, window.location.origin)
        window.close()
      } else {
        window.location.href = isNew ? '/onboarding' : '/dashboard'
      }
    }
    handle()
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0D0D1A', color: '#9CA3AF', fontFamily: 'DM Sans, sans-serif', fontSize: '14px', gap: '10px' }}>
      <div style={{ width: '16px', height: '16px', border: '2px solid rgba(59,130,246,.3)', borderTopColor: '#3B82F6', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      Connexion en cours...
      <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
    </div>
  )
}
