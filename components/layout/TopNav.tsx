'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type { User } from '@/types'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Tableau de bord',
  '/posts': 'Mes Posts',
  '/calendar': 'Calendrier',
  '/analytics': 'Analytiques',
  '/settings': 'Paramètres',
  '/profile': 'Profil',
}

function toggleTheme() {
  const html = document.documentElement
  const current = html.getAttribute('data-theme')
  const next = current === 'dark' ? 'light' : 'dark'
  html.setAttribute('data-theme', next)
  localStorage.setItem('theme', next)
}

export function TopNav({
  user,
  sidebarOpen,
  onToggleSidebar,
}: {
  user: User
  sidebarOpen: boolean
  onToggleSidebar: () => void
}) {
  const pathname = usePathname()
  const initials = (user.full_name || user.email || 'U').slice(0, 2).toUpperCase()

  const pageTitle =
    PAGE_TITLES[pathname] ||
    Object.entries(PAGE_TITLES).find(([k]) => k !== '/dashboard' && pathname.startsWith(k))?.[1] ||
    'Tableau de bord'

  return (
    <div className="topnav">
      <button
        className={`hamburger${sidebarOpen ? ' open' : ''}`}
        onClick={onToggleSidebar}
        title={sidebarOpen ? 'Réduire le menu' : 'Ouvrir le menu'}
      >
        <span className="ham-line" />
        <span className="ham-line" />
        <span className="ham-line" />
      </button>

      <span className="page-title">{pageTitle}</span>
      <div className="topnav-spacer" />

      <div className="topnav-right">
        {/* Dark mode toggle */}
        <button className="toggle-btn" onClick={toggleTheme} title="Changer le thème">
          <svg className="icon-moon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75 9.75 9.75 0 0 1 8.25 6c0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 12c0 5.385 4.365 9.75 9.75 9.75 4.282 0 7.937-2.764 9.002-6.998Z"/>
          </svg>
          <svg className="icon-sun" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <path d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/>
          </svg>
        </button>

        {/* Notifications */}
        <div className="icon-btn" title="Notifications">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/></svg>
        </div>

        {/* Avatar */}
        <Link href="/profile" className="avatar-btn" title={user.full_name || user.email || 'Profil'}>
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" />
            : initials
          }
        </Link>
      </div>
    </div>
  )
}
