'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

const NAV = [
  {
    href: '/dashboard', label: 'Accueil',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>,
  },
  {
    href: '/posts', label: 'Posts',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>,
  },
  {
    href: '/calendar', label: 'Calendrier',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  },
  {
    href: '/analytics', label: 'Analytiques',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  },
  {
    href: '/settings', label: 'Paramètres',
    icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>,
  },
]

const PLAN_LABELS = { free: 'Gratuit', premium: 'Premium', business: 'Business' }

export function TopNav({ user }: { user: User }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const initials = (user.full_name || user.email || 'U').slice(0, 2).toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="tnav">
      {/* Left — Logo */}
      <div className="tnav-left">
        <Link href="/dashboard" className="tnav-logo">
          <div className="logo-mark" style={{ width: 26, height: 26, borderRadius: 6 }}>
            <svg width="14" height="14" viewBox="0 0 20 20" fill="none">
              <path d="M18 13a2 2 0 0 1-2 2H6l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8z" fill="white" fillOpacity=".9"/>
            </svg>
          </div>
          <span className="logo-name" style={{ fontSize: '.9rem' }}>Social <span>IA</span></span>
        </Link>
      </div>

      {/* Center — Nav */}
      <nav className="tnav-center">
        {NAV.map(item => (
          <Link
            key={item.href}
            href={item.href}
            className={`tnav-item${pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)) ? ' on' : ''}`}
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Right — Actions + User */}
      <div className="tnav-right">
        {/* New post button */}
        <Link href="/posts/create" className="tnav-cta">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Créer
        </Link>

        {/* Notifications */}
        <button className="tnav-icon" title="Notifications">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>

        {/* Plan badge */}
        <div className="tnav-plan">{PLAN_LABELS[user.plan]}</div>

        {/* Avatar */}
        <Link href="/profile" className="tnav-avatar" title={user.full_name || user.email || 'Profil'}>
          {user.avatar_url
            ? <img src={user.avatar_url} alt="" style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
            : <div className="av" style={{ width: 30, height: 30, fontSize: '.72rem' }}>{initials}</div>
          }
          <div className="tnav-avatar-info">
            <span className="u-name" style={{ fontSize: '.78rem' }}>{user.full_name || user.email?.split('@')[0]}</span>
          </div>
        </Link>

        {/* Logout */}
        <button onClick={handleLogout} className="tnav-icon" title="Se déconnecter">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </header>
  )
}
