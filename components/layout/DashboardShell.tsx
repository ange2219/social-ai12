'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { TopNav } from './TopNav'
import type { User } from '@/types'

function MobileNav({ pathname }: { pathname: string }) {
  function ni(href: string) { return pathname === href ? 'on' : '' }
  return (
    <nav className="mobile-nav">
      <Link href="/dashboard" className={ni('/dashboard')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
          <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
        </svg>
        Accueil
      </Link>
      <Link href="/posts" className={ni('/posts')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
        </svg>
        Mes Posts
      </Link>
      <Link href="/posts/create" className="mob-create">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </Link>
      <Link href="/calendar" className={ni('/calendar')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="18" rx="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Calendrier
      </Link>
      <Link href="/settings" className={ni('/settings')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <circle cx="12" cy="12" r="3"/>
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
        </svg>
        Paramètres
      </Link>
    </nav>
  )
}

export function DashboardShell({ user, children }: {
  user: User
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  // L'onboarding s'affiche sans shell (pas de sidebar/topnav)
  if (pathname === '/onboarding') {
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg)' }}>
      <Sidebar user={user} open={open} />
      <div className="main">
        <TopNav user={user} sidebarOpen={open} onToggleSidebar={() => setOpen(o => !o)} />
        <div className="content">
          {children}
        </div>
      </div>
      <MobileNav pathname={pathname} />
    </div>
  )
}
