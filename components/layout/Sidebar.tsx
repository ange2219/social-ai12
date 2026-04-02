'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { User } from '@/types'

const PLAN_LABELS = { free: 'Plan Gratuit', premium: 'Plan Premium', business: 'Plan Business' }

export function Sidebar({ user, collapsed, onToggle }: {
  user: User
  collapsed: boolean
  onToggle: () => void
}) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const initials = (user.full_name || user.email || 'U').slice(0, 2).toUpperCase()
  const avatar = user.avatar_url

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  function ni(href: string) {
    return pathname === href ? 'ni on' : 'ni'
  }

  return (
    <aside className={`sidebar${collapsed ? ' sidebar-col' : ''}`}>

      {/* Logo + toggle */}
      <div className="sb-logo" style={{ justifyContent: collapsed ? 'center' : undefined, position: 'relative' }}>
        {!collapsed && <span className="logo-name">Social <span>IA</span></span>}
        <button
          onClick={onToggle}
          title={collapsed ? 'Ouvrir le menu' : 'Réduire le menu'}
          style={{
            position: collapsed ? 'static' : 'absolute',
            right: collapsed ? undefined : '10px',
            marginLeft: collapsed ? undefined : 'auto',
            background: 'none', border: 'none', cursor: 'pointer',
            color: '#52525C', padding: '4px', borderRadius: '6px',
            display: 'flex', alignItems: 'center', transition: '.15s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#F4F4F6')}
          onMouseLeave={e => (e.currentTarget.style.color = '#52525C')}
        >
          {collapsed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          )}
        </button>
      </div>

      {/* Nav */}
      <nav className="sb-nav">
        {!collapsed && <div className="ns">Principal</div>}

        <Link href="/dashboard" className={ni('/dashboard')} title="Tableau de bord">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
            <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
          </svg>
          {!collapsed && 'Tableau de bord'}
        </Link>

        <Link href="/posts" className={ni('/posts')} title="Mes Posts">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          {!collapsed && 'Mes Posts'}
        </Link>

        <Link href="/calendar" className={ni('/calendar')} title="Calendrier">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <rect x="3" y="4" width="18" height="18" rx="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          {!collapsed && 'Calendrier'}
        </Link>

        <Link href="/analytics" className={ni('/analytics')} title="Analytiques">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <line x1="18" y1="20" x2="18" y2="10"/>
            <line x1="12" y1="20" x2="12" y2="4"/>
            <line x1="6" y1="20" x2="6" y2="14"/>
          </svg>
          {!collapsed && 'Analytiques'}
        </Link>

        {!collapsed && <div className="ns">Contenu</div>}

        <Link href="/create" className="ni" title="Motion Studio" style={{ opacity: .5, cursor: 'default', pointerEvents: 'none' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/>
          </svg>
          {!collapsed && <>Motion Studio<span className="v2tag">V2</span></>}
        </Link>

        {!collapsed && <div className="ns">Compte</div>}

        <Link href="/settings" className={ni('/settings')} title="Paramètres">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="12" cy="12" r="3"/>
            <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
          </svg>
          {!collapsed && 'Paramètres'}
        </Link>
      </nav>

      {/* Footer */}
      <div className="sb-foot">
        {!collapsed && (
          <div className="plan-box">
            <div className="plan-label">{PLAN_LABELS[user.plan]}</div>
            <div className="plan-bar-wrap">
              <div className="plan-bar" style={{ width: user.plan === 'free' ? '30%' : '100%' }} />
            </div>
            <div className="plan-desc">
              {user.plan === 'free' ? '3 générations/jour · 2 plateformes' : 'Accès complet'}
            </div>
            {user.plan === 'free' && (
              <button className="btn-upgrade">Passer au Pro →</button>
            )}
          </div>
        )}

        <div className="user-row" style={{ justifyContent: collapsed ? 'center' : undefined }}>
          {collapsed ? (
            <Link href="/profile" title={user.full_name || user.email || 'Profil'}>
              {avatar
                ? <img src={avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                : <div className="av">{initials}</div>
              }
            </Link>
          ) : (
            <>
              <Link href="/profile" style={{ display: 'flex', alignItems: 'center', gap: '.6rem', flex: 1, textDecoration: 'none' }}>
                {avatar
                  ? <img src={avatar} alt="" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                  : <div className="av">{initials}</div>
                }
                <div>
                  <div className="u-name">{user.full_name || user.email?.split('@')[0]}</div>
                  <div className="u-role">{PLAN_LABELS[user.plan]}</div>
                </div>
              </Link>
              <button
                onClick={handleLogout}
                title="Se déconnecter"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525C', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#F4F4F6')}
                onMouseLeave={e => (e.currentTarget.style.color = '#52525C')}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </>
          )}
        </div>
      </div>
    </aside>
  )
}
