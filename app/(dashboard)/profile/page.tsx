'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { PLATFORM_NAMES, PLATFORM_COLORS } from '@/types'
import type { Platform, SocialAccount } from '@/types'
import { User, Link2, Unlink, Save, Camera, CheckCircle2, RefreshCw, LogOut, Sparkles, ChevronRight } from 'lucide-react'

const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin']

const PLATFORM_ICONS: Record<Platform, string> = {
  instagram: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z',
  facebook: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
  tiktok: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  twitter: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.736l7.737-8.848L1.254 2.25H8.08l4.259 5.632zm-1.161 17.52h1.833L7.084 4.126H5.117z',
  linkedin: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
}

const NAV_ITEMS = [
  { id: 'personal', label: 'Informations personnelles', icon: User },
  { id: 'social', label: 'Réseaux sociaux', icon: Link2 },
  { id: 'brand', label: 'Profil de marque', icon: Sparkles },
  { id: 'session', label: 'Session', icon: LogOut },
]

export default function ProfilePage() {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()
  const [active, setActive] = useState('personal')

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [savingUser, setSavingUser] = useState(false)

  const [brandName, setBrandName] = useState('')
  const [brandDesc, setBrandDesc] = useState('')
  const [sector, setSector] = useState('')
  const [defaultTone, setDefaultTone] = useState('professionnel')
  const [postsPerWeek, setPostsPerWeek] = useState(5)
  const [savingBrand, setSavingBrand] = useState(false)

  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [userPlan, setUserPlan] = useState<'free' | 'premium' | 'business'>('free')

  const loadAccounts = useCallback(async () => {
    const res = await fetch('/api/social/accounts')
    if (res.ok) setAccounts(await res.json())
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const err = params.get('error')
    const connected = params.get('social')
    const platform = params.get('platform')
    if (err) {
      toast(`Erreur connexion : ${decodeURIComponent(err)}`, 'error')
      window.history.replaceState({}, '', '/profile')
    } else if (connected === 'connected' && platform) {
      toast(`${platform.charAt(0).toUpperCase() + platform.slice(1)} connecté !`, 'success')
      loadAccounts()
      window.history.replaceState({}, '', '/profile')
    }
  }, [toast, loadAccounts])

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setEmail(user.email || '')
      const me = await fetch('/api/auth/me').then(r => r.json())
      if (me?.full_name) setFullName(me.full_name)
      if (me?.plan) setUserPlan(me.plan)
      if (me?.avatar_url) setAvatarUrl(me.avatar_url)
      const brand = await fetch('/api/brand').then(r => r.ok ? r.json() : null)
      if (brand) {
        setBrandName(brand.brand_name || '')
        setBrandDesc(brand.description || '')
        setSector(brand.industry || '')
        setDefaultTone(brand.tone || 'professionnel')
        setPostsPerWeek(brand.posts_per_week || 5)
      }
      await loadAccounts()
    }
    load()
  }, [loadAccounts])

  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data) return
      if (e.data.type === 'meta_oauth') {
        const { success, page, error } = e.data
        if (success) toast(`Facebook "${page}" connecté !`, 'success')
        else if (error) toast(`Erreur Facebook : ${error}`, 'error')
        loadAccounts()
      } else if (e.data.type === 'instagram_oauth') {
        const { success, username, error } = e.data
        if (success) toast(`Instagram @${username} connecté !`, 'success')
        else if (error) toast(`Erreur Instagram : ${error}`, 'error')
        loadAccounts()
      }
    }
    function handleStorage(e: StorageEvent) {
      if (e.key !== '_oauth_result' || !e.newValue) return
      try {
        const d = JSON.parse(e.newValue)
        if (d.type === 'meta_oauth') {
          if (d.success) toast(`Facebook "${d.page}" connecté !`, 'success')
          else if (d.error) toast(`Erreur Facebook : ${d.error}`, 'error')
          loadAccounts()
        } else if (d.type === 'instagram_oauth') {
          if (d.success) toast(`Instagram @${d.username} connecté !`, 'success')
          else if (d.error) toast(`Erreur Instagram : ${d.error}`, 'error')
          loadAccounts()
        }
      } catch {}
    }
    window.addEventListener('message', handleMessage)
    window.addEventListener('storage', handleStorage)
    return () => { window.removeEventListener('message', handleMessage); window.removeEventListener('storage', handleStorage) }
  }, [loadAccounts, toast])

  async function saveUserInfo() {
    setSavingUser(true)
    const res = await fetch('/api/auth/me', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ full_name: fullName }) })
    setSavingUser(false)
    toast(res.ok ? 'Profil mis à jour' : 'Erreur', res.ok ? 'success' : 'error')
  }

  async function saveBrand() {
    setSavingBrand(true)
    const res = await fetch('/api/brand', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brand_name: brandName, description: brandDesc, sector, default_tone: defaultTone, posts_per_week: postsPerWeek }) })
    setSavingBrand(false)
    toast(res.ok ? 'Profil de marque sauvegardé' : 'Erreur', res.ok ? 'success' : 'error')
  }

  async function disconnect(id: string) {
    const res = await fetch(`/api/social/accounts?id=${id}`, { method: 'DELETE' })
    if (res.ok) { setAccounts(prev => prev.filter(a => a.id !== id)); toast('Compte déconnecté', 'success') }
  }

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true)
    try {
      const fd = new FormData(); fd.append('file', file)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAvatarUrl(data.url)
      toast('Photo de profil mise à jour', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur upload', 'error')
    } finally { setUploadingAvatar(false) }
  }

  const initials = (fullName || email || 'U').slice(0, 2).toUpperCase()

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page, #0d0d0f)' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: '240px', flexShrink: 0,
        borderRight: '1px solid var(--b1)',
        padding: '2rem 0',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        {/* Avatar + nom */}
        <div style={{ padding: '0 1.25rem', marginBottom: '1.5rem' }}>
          <label style={{ position: 'relative', display: 'inline-block', cursor: 'pointer' }}>
            {avatarUrl
              ? <img src={avatarUrl} alt="" style={{ width: '52px', height: '52px', borderRadius: '50%', objectFit: 'cover', display: 'block', border: '2px solid var(--b1)' }} />
              : <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#4646FF22', border: '2px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 700, color: '#4646FF' }}>{initials}</div>
            }
            <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,.55)', opacity: 0, transition: '.15s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')} onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
              <Camera size={13} color="#fff" />
            </div>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
          </label>
          <div style={{ marginTop: '.6rem' }}>
            <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--t1)' }}>{fullName || 'Mon compte'}</div>
            <div style={{ fontSize: '.72rem', color: 'var(--t3)', marginTop: '.1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{email}</div>
          </div>
        </div>

        {/* Nav */}
        <nav>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = active === item.id
            return (
              <button key={item.id} onClick={() => setActive(item.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem',
                padding: '.55rem 1.25rem', background: 'none', border: 'none',
                borderLeft: isActive ? '2px solid #4646FF' : '2px solid transparent',
                color: isActive ? 'var(--t1)' : 'var(--t3)',
                cursor: 'pointer', fontSize: '.83rem', fontWeight: isActive ? 600 : 400,
                transition: '.15s', textAlign: 'left',
              }}>
                <Icon size={14} style={{ flexShrink: 0, color: isActive ? '#4646FF' : 'var(--t3)' }} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Contenu ──────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', maxWidth: '680px' }}>

        {/* ── Informations personnelles ─────────────────────────── */}
        {active === 'personal' && (
          <div>
            <div style={{ borderBottom: '1px solid var(--b1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.01em' }}>Informations personnelles</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--t3)', marginTop: '.3rem' }}>Votre nom et adresse email associés au compte.</p>
            </div>

            <Row label="Nom complet" desc="Affiché sur votre profil et dans les exports.">
              <input className="input" style={{ maxWidth: '320px' }} placeholder="Votre nom" value={fullName} onChange={e => setFullName(e.target.value)} />
            </Row>
            <Row label="Adresse email" desc="Votre email de connexion — non modifiable.">
              <input className="input" style={{ maxWidth: '320px', opacity: .45, cursor: 'not-allowed' }} value={email} disabled />
            </Row>

            <div style={{ borderTop: '1px solid var(--b1)', paddingTop: '1.25rem', marginTop: '.5rem' }}>
              <button onClick={saveUserInfo} disabled={savingUser} className="btn-primary flex items-center gap-2">
                <Save size={14} /> {savingUser ? 'Sauvegarde...' : 'Sauvegarder'}
              </button>
            </div>
          </div>
        )}

        {/* ── Réseaux sociaux ───────────────────────────────────── */}
        {active === 'social' && (
          <div>
            <div style={{ borderBottom: '1px solid var(--b1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.01em' }}>Réseaux sociaux</h2>
                  <p style={{ fontSize: '.8rem', color: 'var(--t3)', marginTop: '.3rem' }}>Connectez vos comptes pour publier directement depuis Social IA.</p>
                </div>
                <button onClick={loadAccounts} title="Rafraîchir" style={{ background: 'none', border: '1px solid var(--b1)', cursor: 'pointer', color: 'var(--t3)', padding: '6px', display: 'flex', borderRadius: '7px' }}>
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {([
                { platform: 'facebook' as Platform, onConnect: () => window.open('/api/auth/meta/start', 'meta_oauth', `width=600,height=700,left=${window.screen.width/2-300},top=${window.screen.height/2-350}`) },
                { platform: 'instagram' as Platform, onConnect: () => window.open('/api/auth/instagram/start', 'instagram_oauth', `width=600,height=700,left=${window.screen.width/2-300},top=${window.screen.height/2-350}`) },
                { platform: 'tiktok' as Platform, onConnect: () => { window.location.href = '/api/social/start?platform=tiktok' } },
                { platform: 'twitter' as Platform, onConnect: () => { window.location.href = '/api/social/start?platform=twitter' } },
                { platform: 'linkedin' as Platform, onConnect: () => { window.location.href = '/api/social/start?platform=linkedin' } },
              ]).map(({ platform, onConnect }, i, arr) => {
                const acc = accounts.find(a => a.platform === platform)
                return (
                  <AccountListItem
                    key={platform}
                    platform={platform}
                    acc={acc}
                    onConnect={onConnect}
                    onDisconnect={disconnect}
                    isLast={i === arr.length - 1}
                  />
                )
              })}
            </div>
          </div>
        )}

        {/* ── Profil de marque ─────────────────────────────────── */}
        {active === 'brand' && (
          <div>
            <div style={{ borderBottom: '1px solid var(--b1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.01em' }}>Profil de marque</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--t3)', marginTop: '.3rem' }}>Ces informations sont utilisées par l'IA pour personnaliser vos posts.</p>
            </div>

            <Row label="Nom de la marque">
              <input className="input" style={{ maxWidth: '320px' }} placeholder="Ex: Pixel Agency" value={brandName} onChange={e => setBrandName(e.target.value)} />
            </Row>
            <Row label="Secteur d'activité">
              <input className="input" style={{ maxWidth: '320px' }} placeholder="Ex: Marketing digital, Mode..." value={sector} onChange={e => setSector(e.target.value)} />
            </Row>
            <Row label="Ton par défaut">
              <select className="input" style={{ maxWidth: '200px' }} value={defaultTone} onChange={e => setDefaultTone(e.target.value)}>
                <option value="professionnel">Professionnel</option>
                <option value="decontracte">Décontracté</option>
                <option value="inspirant">Inspirant</option>
                <option value="humoristique">Humoristique</option>
              </select>
            </Row>
            <Row label="Posts / semaine">
              <input className="input" style={{ maxWidth: '100px' }} type="number" min={1} max={21} value={postsPerWeek} onChange={e => setPostsPerWeek(Number(e.target.value))} />
            </Row>
            <Row label="Description" desc="Ce que vous faites, vos valeurs, votre audience cible.">
              <textarea className="input resize-none" rows={5} style={{ maxWidth: '480px', width: '100%' }} placeholder="Décrivez votre marque..." value={brandDesc} onChange={e => setBrandDesc(e.target.value)} />
            </Row>

            <div style={{ borderTop: '1px solid var(--b1)', paddingTop: '1.25rem', marginTop: '.5rem' }}>
              <button onClick={saveBrand} disabled={savingBrand} className="btn-primary flex items-center gap-2">
                <Save size={14} /> {savingBrand ? 'Sauvegarde...' : 'Sauvegarder le profil de marque'}
              </button>
            </div>
          </div>
        )}

        {/* ── Session ──────────────────────────────────────────── */}
        {active === 'session' && (
          <div>
            <div style={{ borderBottom: '1px solid var(--b1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.01em' }}>Session</h2>
              <p style={{ fontSize: '.8rem', color: 'var(--t3)', marginTop: '.3rem' }}>Gérez votre connexion active.</p>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', background: 'var(--bg)', border: '1px solid var(--b1)', borderRadius: '10px' }}>
              <div>
                <div style={{ fontSize: '.88rem', fontWeight: 500, color: 'var(--t1)' }}>Session active</div>
                <div style={{ fontSize: '.77rem', color: 'var(--t3)', marginTop: '.2rem' }}>{email}</div>
              </div>
              <button onClick={handleLogout} style={{
                display: 'flex', alignItems: 'center', gap: '.45rem',
                padding: '.5rem 1rem', borderRadius: '7px',
                border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.06)',
                color: '#ef4444', cursor: 'pointer', fontSize: '.82rem', fontWeight: 600, transition: '.15s',
              }}>
                <LogOut size={14} /> Se déconnecter
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Composants locaux ──────────────────────────────────────────────────────────

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: '1rem', alignItems: 'start', padding: '1rem 0', borderBottom: '1px solid var(--b1)' }}>
      <div>
        <div style={{ fontSize: '.83rem', fontWeight: 500, color: 'var(--t1)' }}>{label}</div>
        {desc && <div style={{ fontSize: '.75rem', color: 'var(--t3)', marginTop: '.25rem', lineHeight: 1.5 }}>{desc}</div>}
      </div>
      <div>{children}</div>
    </div>
  )
}

function AccountListItem({ platform, acc, onConnect, onDisconnect, isLast }: {
  platform: Platform
  acc: SocialAccount | undefined
  onConnect: () => void
  onDisconnect: (id: string) => void
  isLast?: boolean
}) {
  const path = PLATFORM_ICONS[platform]
  const color = PLATFORM_COLORS[platform]
  const username = acc?.platform_username && acc.platform_username !== platform ? acc.platform_username : null
  const accountType = platform === 'facebook' ? 'Page' : platform === 'instagram' ? 'Compte' : platform === 'tiktok' ? 'Compte' : platform === 'twitter' ? 'Compte' : 'Compte'

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 0',
      borderBottom: isLast ? 'none' : '1px solid var(--b1)',
    }}>
      {/* Avatar + badge plateforme */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {acc ? (
            /* Avatar connecté — cercle plein avec initiale */
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              background: `${color}22`, border: `2px solid ${color}40`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '1rem', fontWeight: 700, color,
            }}>
              {(username || platform).slice(0, 1).toUpperCase()}
            </div>
          ) : (
            /* Cercle pointillé — non connecté */
            <div style={{
              width: '48px', height: '48px', borderRadius: '50%',
              border: '2px dashed var(--b1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="var(--t3)">
                <path d={path} />
              </svg>
            </div>
          )}
          {/* Badge plateforme en bas à droite */}
          {acc && (
            <div style={{
              position: 'absolute', bottom: '-2px', right: '-2px',
              width: '20px', height: '20px', borderRadius: '50%',
              background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
              border: '2px solid var(--s1)',
            }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="#fff">
                <path d={path} />
              </svg>
            </div>
          )}
        </div>

        {/* Infos */}
        <div>
          {acc ? (
            <>
              <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--t1)' }}>
                {username ? `@${username}` : PLATFORM_NAMES[platform]}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--t3)', marginTop: '.1rem' }}>{accountType}</div>
            </>
          ) : (
            <>
              <div style={{ fontSize: '.88rem', fontWeight: 500, color: 'var(--t3)' }}>
                Connecter {PLATFORM_NAMES[platform]}
              </div>
              <div style={{ fontSize: '.75rem', color: 'var(--t3)', marginTop: '.1rem', opacity: .6 }}>Non connecté</div>
            </>
          )}
        </div>
      </div>

      {/* Action */}
      {acc ? (
        <button onClick={() => onDisconnect(acc.id)} style={{
          display: 'flex', alignItems: 'center', gap: '.3rem',
          padding: '.4rem .85rem', borderRadius: '7px',
          border: '1px solid rgba(239,68,68,.22)', background: 'transparent',
          color: '#ef4444', cursor: 'pointer', fontSize: '.78rem', fontWeight: 500,
          transition: '.15s',
        }}>
          <Unlink size={12} /> Déconnecter
        </button>
      ) : (
        <button onClick={onConnect} style={{
          display: 'flex', alignItems: 'center', gap: '.3rem',
          padding: '.4rem .85rem', borderRadius: '7px',
          border: '1px solid var(--b1)', background: 'transparent',
          color: 'var(--t1)', cursor: 'pointer', fontSize: '.78rem', fontWeight: 500,
          transition: '.15s',
        }}>
          <Link2 size={12} /> Connecter
        </button>
      )}
    </div>
  )
}
