'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

const PLAN_LABELS = { free: 'Plan Gratuit', premium: 'Plan Premium', business: 'Plan Business' }

export function Sidebar({ user, open }: { user: User; open: boolean }) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const initials = (user.full_name || user.email || 'U').slice(0, 2).toUpperCase()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function ni(href: string) {
    return pathname === href || (href !== '/dashboard' && pathname.startsWith(href))
      ? 'ni on' : 'ni'
  }

  return (
    <aside className={`sidebar${open ? ' open' : ''}`}>

      {/* Logo */}
      <div className="sb-logo">
        <Link href="/dashboard" className="sb-logo-link">
          <span className="logo-s">S</span>
          <span className="logo-rest">ocial</span>
          <span className="logo-ai">&nbsp;IA</span>
        </Link>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        <div className="ns">Principal</div>

        <Link href="/dashboard" className={ni('/dashboard')} title="Tableau de bord">
          <span className="sb-icon">
            <svg viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>
          </span>
          <span className="sb-label">Tableau de bord</span>
        </Link>

        <Link href="/posts" className={ni('/posts')} title="Mes Posts">
          <span className="sb-icon">
            <svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          </span>
          <span className="sb-label">Mes Posts</span>
        </Link>

        <Link href="/calendar" className={ni('/calendar')} title="Calendrier">
          <span className="sb-icon">
            <svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </span>
          <span className="sb-label">Calendrier</span>
        </Link>

        <Link href="/analytics" className={ni('/analytics')} title="Analytiques">
          <span className="sb-icon">
            <svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
          </span>
          <span className="sb-label">Analytiques</span>
        </Link>

        <div className="ns">Communauté</div>

        <Link href="/community" className={ni('/community')} title="Mur d'entraide">
          <span className="sb-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </span>
          <span className="sb-label">Mur d'entraide</span>
        </Link>

        <div className="ns">Contenu</div>

        <span className="ni" title="Motion Studio" style={{ opacity: .45, pointerEvents: 'none' }}>
          <span className="sb-icon">
            <svg viewBox="0 0 24 24"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
          </span>
          <span className="sb-label">Motion Studio</span>
          <span className="v2tag">V2</span>
        </span>

        <div className="ns">Compte</div>

        <Link href="/settings" className={ni('/settings')} title="Paramètres">
          <span className="sb-icon">
            <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/></svg>
          </span>
          <span className="sb-label">Paramètres</span>
        </Link>
      </nav>

      {/* Footer */}
      <div className="sb-footer">
        <Link href="/profile" className="sb-user" title={user.full_name || user.email || 'Profil'}>
          <div className="sb-avatar">
            {user.avatar_url
              ? <img src={user.avatar_url} alt="" />
              : initials
            }
          </div>
          <div className="sb-user-info">
            <div className="sb-user-name">{user.full_name || user.email?.split('@')[0]}</div>
            <div className="sb-user-plan">{PLAN_LABELS[user.plan]}</div>
          </div>
        </Link>
        <button onClick={handleLogout} className="sb-logout" title="Se déconnecter">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
        </button>
      </div>
    </aside>
  )
}
