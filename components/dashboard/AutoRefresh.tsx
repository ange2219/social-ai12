'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Invisible component — refreshes server data on mount and on window focus.
 * Drop it inside any server page to keep KPIs up to date without a full reload.
 */
export function AutoRefresh() {
  const router = useRouter()

  useEffect(() => {
    // Refresh immediately on mount (catches stale router-cache data)
    router.refresh()

    // Refresh again whenever the tab regains focus or becomes visible
    function onFocus() { router.refresh() }
    function onVisible() { if (document.visibilityState === 'visible') router.refresh() }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [router])

  return null
}
