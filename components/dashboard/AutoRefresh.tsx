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

    // Refresh again whenever the tab regains focus
    function onFocus() { router.refresh() }
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [router])

  return null
}
