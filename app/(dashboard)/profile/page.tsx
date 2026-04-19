'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { PLATFORM_NAMES, PLATFORM_COLORS } from '@/types'
import type { Platform, SocialAccount } from '@/types'
import { User, Link2, Unlink, Save, Camera, CheckCircle2, RefreshCw, LogOut, Sparkles } from 'lucide-react'
import { PlatformIcon } from '@/components/ui/PlatformIcon'

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
      } else if (e.data.type === 'zernio_oauth') {
        const { success, platform } = e.data
        if (success) toast(`${platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Compte'} connecté !`, 'success')
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
        } else if (d.type === 'zernio_oauth') {
          if (d.success) toast(`${d.platform ? d.platform.charAt(0).toUpperCase() + d.platform.slice(1) : 'Compte'} connecté !`, 'success')
          loadAccounts()
        }
      } catch {}
    }
    window.addEventListener('message', handleMessage)
    window.addEventListener('storage', handleStorage)
    return () => { window.removeEventListener('message', handleMessage); window.removeEventListener('storage', handleStorage) }
  }, [loadAccounts, toast])

  function openOAuthPopup(platform: string) {
    const w = 600, h = 700
    const left = Math.round(window.screen.width / 2 - w / 2)
    const top = Math.round(window.screen.height / 2 - h / 2)
    window.open(`/api/social/start?platform=${platform}`, `${platform}_oauth`, `width=${w},height=${h},left=${left},top=${top}`)
  }

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

  async function renameAccount(id: string, name: string) {
    const res = await fetch('/api/social/accounts', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, platform_username: name }) })
    if (res.ok) {
      setAccounts(prev => prev.map(a => a.id === id ? { ...a, platform_username: name } : a))
      toast('Nom mis à jour', 'success')
    } else {
      toast('Erreur lors de la mise à jour', 'error')
    }
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
    <div style={{ display: 'flex', minHeight: '100%', margin: '-20px' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: '220px', flexShrink: 0,
        borderRight: '1px solid var(--b1)',
        padding: '1.5rem 0',
        position: 'sticky', top: 0, alignSelf: 'flex-start', maxHeight: '100vh', overflowY: 'auto',
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
                // Facebook & Instagram → API officielle Meta (pas de branding Zernio)
                { platform: 'facebook'  as Platform, onConnect: () => window.open('/api/auth/meta/start', 'meta_oauth', `width=600,height=700,left=${window.screen.width/2-300},top=${window.screen.height/2-350}`) },
                { platform: 'instagram' as Platform, onConnect: () => window.open('/api/auth/instagram/start', 'instagram_oauth', `width=600,height=700,left=${window.screen.width/2-300},top=${window.screen.height/2-350}`) },
                // TikTok, Twitter, LinkedIn → Zernio (OAuth natif de chaque plateforme)
                { platform: 'tiktok'    as Platform, onConnect: () => openOAuthPopup('tiktok') },
                { platform: 'twitter'   as Platform, onConnect: () => openOAuthPopup('twitter') },
                { platform: 'linkedin'  as Platform, onConnect: () => openOAuthPopup('linkedin') },
              ] as { platform: Platform; onConnect: () => void }[]).map(({ platform, onConnect }, i, arr) => {
                const acc = accounts.find(a => a.platform === platform)
                return (
                  <AccountListItem
                    key={platform}
                    platform={platform}
                    acc={acc}
                    userPlan={userPlan}
                    onConnect={onConnect}
                    onAddZernio={() => openOAuthPopup(platform)}
                    onDisconnect={disconnect}
                    onRename={renameAccount}
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

function AccountListItem({ platform, acc, userPlan, onConnect, onAddZernio, onDisconnect, onRename, isLast }: {
  platform: Platform
  acc: SocialAccount | undefined
  userPlan: 'free' | 'premium' | 'business'
  onConnect: () => void
  onAddZernio: () => void
  onDisconnect: (id: string) => void
  onRename: (id: string, name: string) => void
  isLast?: boolean
}) {
  const color = PLATFORM_COLORS[platform]
  const displayName = acc?.platform_username && acc.platform_username !== platform ? acc.platform_username : null
  const accountType = platform === 'facebook' ? 'Page' : 'Compte'
  const connectedVia = (acc as any)?.connected_via as string | undefined
  const [editing, setEditing] = useState(false)
  const [editVal, setEditVal] = useState(displayName || '')

  function startEdit() { setEditVal(displayName || ''); setEditing(true) }
  function cancelEdit() { setEditing(false) }
  async function saveEdit() {
    if (acc && editVal.trim()) { await onRename(acc.id, editVal.trim()); setEditing(false) }
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '1rem 0',
      borderBottom: isLast ? 'none' : '1px solid var(--b1)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
        {/* Avatar + badge */}
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {acc ? (
            <AvatarWithFallback avatarUrl={(acc as any).platform_avatar_url} label={displayName || platform} color={color} />
          ) : (
            <div style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px dashed var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: .5 }}>
              <PlatformIcon platform={platform} size={22} />
            </div>
          )}
          {acc && (
            <div style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '20px', height: '20px', borderRadius: '50%', overflow: 'hidden', border: '2px solid var(--s1)' }}>
              <PlatformIcon platform={platform} size={20} />
            </div>
          )}
        </div>

        {/* Infos / édition inline */}
        {acc ? (
          <div style={{ flex: 1, minWidth: 0 }}>
            {editing ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <input
                  autoFocus
                  value={editVal}
                  onChange={e => setEditVal(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit() }}
                  style={{ fontSize: '.85rem', fontWeight: 600, background: 'var(--bg)', border: '1px solid #4646FF', borderRadius: '6px', color: 'var(--t1)', padding: '.2rem .5rem', outline: 'none', width: '160px' }}
                />
                <button onClick={saveEdit} style={{ fontSize: '.72rem', color: '#22C55E', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600, padding: '2px 4px' }}>OK</button>
                <button onClick={cancelEdit} style={{ fontSize: '.72rem', color: 'var(--t3)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px' }}>✕</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                <span style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--t1)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName || PLATFORM_NAMES[platform]}
                </span>
                <button onClick={startEdit} title="Modifier le nom" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: '2px', display: 'flex', flexShrink: 0, opacity: .6 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
              </div>
            )}
            <div style={{ fontSize: '.75rem', color: 'var(--t3)', marginTop: '.1rem' }}>{accountType}</div>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '.88rem', fontWeight: 500, color: 'var(--t3)' }}>Connecter {PLATFORM_NAMES[platform]}</div>
            <div style={{ fontSize: '.75rem', color: 'var(--t3)', marginTop: '.1rem', opacity: .6 }}>Non connecté</div>
          </div>
        )}
      </div>

      {/* Action */}
      <div style={{ flexShrink: 0, marginLeft: '1rem', display: 'flex', flexDirection: 'column', gap: '.35rem', alignItems: 'flex-end' }}>
        {acc ? (
          <>
            <button onClick={() => onDisconnect(acc.id)} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.4rem .85rem', borderRadius: '7px', border: '1px solid rgba(239,68,68,.22)', background: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '.78rem', fontWeight: 500 }}>
              <Unlink size={12} /> Déconnecter
            </button>
          </>
        ) : (
          <button onClick={onConnect} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.4rem .85rem', borderRadius: '7px', border: '1px solid var(--b1)', background: 'transparent', color: 'var(--t1)', cursor: 'pointer', fontSize: '.78rem', fontWeight: 500 }}>
            <Link2 size={12} /> Connecter
          </button>
        )}
      </div>
    </div>
  )
}

function AvatarWithFallback({ avatarUrl, label, color }: { avatarUrl?: string | null; label: string; color: string }) {
  const [imgFailed, setImgFailed] = useState(false)
  if (avatarUrl && !imgFailed) {
    return (
      <img
        src={avatarUrl}
        alt={label}
        style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: `2px solid ${color}40`, display: 'block' }}
        onError={() => setImgFailed(true)}
      />
    )
  }
  return (
    <div style={{
      width: '48px', height: '48px', borderRadius: '50%',
      background: `${color}22`, border: `2px solid ${color}40`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '1rem', fontWeight: 700, color,
    }}>
      {label.slice(0, 1).toUpperCase()}
    </div>
  )
}
