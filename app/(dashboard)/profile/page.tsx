'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { PLATFORM_NAMES, PLATFORM_COLORS, FREE_PLATFORMS } from '@/types'
import type { Platform, SocialAccount } from '@/types'
import { User, Sparkles, Link2, Unlink, Save, Camera, CheckCircle2, RefreshCw, LogOut } from 'lucide-react'

const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin']

export default function ProfilePage() {
  const { toast } = useToast()
  const router = useRouter()
  const supabase = createClient()

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
    const accRes = await fetch('/api/social/accounts')
    if (accRes.ok) setAccounts(await accRes.json())
  }, [])

  // Gère les retours OAuth (?social=connected ou ?error=...)
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

      const meRes = await fetch('/api/auth/me')
      const me = await meRes.json()
      if (me?.full_name) setFullName(me.full_name)
      if (me?.plan) setUserPlan(me.plan)
      if (me?.avatar_url) setAvatarUrl(me.avatar_url)

      const brandRes = await fetch('/api/brand')
      if (brandRes.ok) {
        const b = await brandRes.json()
        setBrandName(b.brand_name || '')
        setBrandDesc(b.description || '')
        setSector(b.industry || '')
        setDefaultTone(b.tone || 'professionnel')
        setPostsPerWeek(b.posts_per_week || 5)
      }

      await loadAccounts()
    }
    load()
  }, [loadAccounts])

  // Écouter les postMessage des popups OAuth
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
    // Fallback localStorage (si postMessage bloqué)
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
    return () => {
      window.removeEventListener('message', handleMessage)
      window.removeEventListener('storage', handleStorage)
    }
  }, [loadAccounts, toast])

  async function saveUserInfo() {
    setSavingUser(true)
    const res = await fetch('/api/auth/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: fullName }),
    })
    setSavingUser(false)
    toast(res.ok ? 'Profil mis à jour' : 'Erreur', res.ok ? 'success' : 'error')
  }

  async function saveBrand() {
    setSavingBrand(true)
    const res = await fetch('/api/brand', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ brand_name: brandName, description: brandDesc, sector, default_tone: defaultTone, posts_per_week: postsPerWeek }),
    })
    setSavingBrand(false)
    toast(res.ok ? 'Marque sauvegardée' : 'Erreur', res.ok ? 'success' : 'error')
  }

  async function disconnect(id: string) {
    const res = await fetch(`/api/social/accounts?id=${id}`, { method: 'DELETE' })
    if (res.ok) { setAccounts(prev => prev.filter(a => a.id !== id)); toast('Compte déconnecté', 'success') }
  }

  async function uploadAvatar(file: File) {
    setUploadingAvatar(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload/avatar', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setAvatarUrl(data.url)
      toast('Photo de profil mise à jour', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur upload', 'error')
    } finally {
      setUploadingAvatar(false)
    }
  }

  const initials = (fullName || email || 'U').slice(0, 2).toUpperCase()

  return (
    <div style={{ padding: '2rem 2rem 3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: 'var(--t1)', letterSpacing: '-.02em' }}>
          Mon Profil
        </h1>
        <p style={{ color: 'var(--t3)', fontSize: '.83rem', marginTop: '.2rem' }}>Informations personnelles et profil de votre marque</p>
      </div>

      {/* Ligne 1 : Infos perso (gauche) + Réseaux sociaux (droite) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Infos personnelles */}
        <section className="card p-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <User size={16} style={{ color: '#4646FF' }} />
            <span style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--t1)' }}>Informations personnelles</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.65rem', background: 'var(--bg)', borderRadius: '8px', border: '1px solid var(--b1)', marginBottom: '1rem' }}>
            <label style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}>
              {avatarUrl
                ? <img src={avatarUrl} alt="" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', display: 'block' }} />
                : <div className="av" style={{ width: '44px', height: '44px', fontSize: '.9rem', borderRadius: '50%' }}>{initials}</div>
              }
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(0,0,0,.5)', opacity: 0, transition: '.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '0')}
              >
                <Camera size={14} color="#fff" />
              </div>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) uploadAvatar(f) }} />
            </label>
            <div>
              <div style={{ fontSize: '.85rem', fontWeight: 500, color: 'var(--t1)' }}>{fullName || 'Sans nom'}</div>
              <div style={{ fontSize: '.75rem', color: 'var(--t3)' }}>{uploadingAvatar ? 'Upload en cours...' : 'Cliquez sur la photo pour changer'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div>
              <label className="label">Nom complet</label>
              <input className="input" placeholder="Votre nom" value={fullName} onChange={e => setFullName(e.target.value)} />
            </div>
            <div>
              <label className="label">Email</label>
              <input className="input" value={email} disabled style={{ opacity: .45, cursor: 'not-allowed' }} />
            </div>
            <button onClick={saveUserInfo} disabled={savingUser} className="btn-primary flex items-center gap-2">
              <Save size={14} /> {savingUser ? 'Sauvegarde...' : 'Sauvegarder'}
            </button>
          </div>
        </section>

        {/* Réseaux sociaux */}
        <section className="card p-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
            <Link2 size={16} style={{ color: '#4646FF' }} />
            <span style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--t1)' }}>Réseaux sociaux</span>
          </div>

          {/* Facebook */}
          {(() => {
            const acc = accounts.find(a => a.platform === 'facebook')
            return (
              <div style={{ background: 'var(--bg)', border: `1px solid ${acc ? 'rgba(34,197,94,.2)' : 'var(--b1)'}`, borderRadius: '10px', padding: '.75rem', marginBottom: '.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: acc ? PLATFORM_COLORS['facebook'] : '#3f3f46' }} />
                    <span style={{ fontSize: '.82rem', fontWeight: 500, color: acc ? 'var(--t1)' : 'var(--t3)' }}>{PLATFORM_NAMES['facebook']}</span>
                    {acc && <span style={{ fontSize: '.75rem', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '.25rem' }}><CheckCircle2 size={11} /> @{acc.platform_username}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                    <button onClick={loadAccounts} title="Rafraîchir" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--t3)', padding: '2px', display: 'flex' }}><RefreshCw size={12} /></button>
                    {acc ? (
                      <button onClick={() => disconnect(acc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        <Unlink size={12} /> Déconnecter
                      </button>
                    ) : (
                      <button
                        onClick={() => window.open('/api/auth/meta/start', 'meta_oauth', 'width=600,height=700,left=' + (window.screen.width / 2 - 300) + ',top=' + (window.screen.height / 2 - 350))}
                        style={{ background: 'rgba(59,123,246,.1)', border: '1px solid rgba(59,123,246,.3)', cursor: 'pointer', color: '#4646FF', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.3rem .7rem', borderRadius: '6px', fontWeight: 500 }}
                      >
                        <Link2 size={12} /> Connecter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Instagram */}
          {(() => {
            const acc = accounts.find(a => a.platform === 'instagram')
            return (
              <div style={{ background: 'var(--bg)', border: `1px solid ${acc ? 'rgba(34,197,94,.2)' : 'var(--b1)'}`, borderRadius: '10px', padding: '.75rem', marginBottom: '.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: acc ? PLATFORM_COLORS['instagram'] : '#3f3f46' }} />
                    <span style={{ fontSize: '.82rem', fontWeight: 500, color: acc ? 'var(--t1)' : 'var(--t3)' }}>{PLATFORM_NAMES['instagram']}</span>
                    {acc && <span style={{ fontSize: '.75rem', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '.25rem' }}><CheckCircle2 size={11} /> @{acc.platform_username}</span>}
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem', alignItems: 'center' }}>
                    {acc ? (
                      <button onClick={() => disconnect(acc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                        <Unlink size={12} /> Déconnecter
                      </button>
                    ) : (
                      <button
                        onClick={() => window.open('/api/auth/instagram/start', 'instagram_oauth', 'width=600,height=700,left=' + (window.screen.width / 2 - 300) + ',top=' + (window.screen.height / 2 - 350))}
                        style={{ background: 'rgba(225,48,108,.1)', border: '1px solid rgba(225,48,108,.3)', cursor: 'pointer', color: '#E1306C', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.3rem .7rem', borderRadius: '6px', fontWeight: 500 }}
                      >
                        <Link2 size={12} /> Connecter
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })()}

          {/* Autres plateformes (Zernio) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {(['tiktok', 'twitter', 'linkedin'] as Platform[]).map(p => {
              const acc = accounts.find(a => a.platform === p)
              return (
                <div key={p} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '.5rem .75rem', background: 'var(--bg)', borderRadius: '8px',
                  border: `1px solid ${acc ? 'rgba(34,197,94,.2)' : 'var(--b1)'}`,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: acc ? PLATFORM_COLORS[p] : '#3f3f46' }} />
                    <span style={{ fontSize: '.82rem', fontWeight: 500, color: 'var(--t1)' }}>{PLATFORM_NAMES[p]}</span>
                    {acc && <span style={{ fontSize: '.75rem', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '.25rem' }}><CheckCircle2 size={11} /> Connecté</span>}
                  </div>
                  {acc ? (
                    <button onClick={() => disconnect(acc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                      <Unlink size={12} /> Déconnecter
                    </button>
                  ) : (
                    <button
                      onClick={() => { window.location.href = `/api/social/start?platform=${p}` }}
                      style={{ background: 'rgba(70,70,255,.1)', border: '1px solid rgba(70,70,255,.3)', cursor: 'pointer', color: '#4646FF', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.3rem .7rem', borderRadius: '6px', fontWeight: 500 }}
                    >
                      <Link2 size={12} /> Connecter
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Ligne 2 : Profil de marque — pleine largeur */}
      <section className="card p-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
          <Sparkles size={16} style={{ color: '#4646FF' }} />
          <span style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--t1)' }}>Profil de marque</span>
          <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: 'var(--t3)' }}>Utilisé par l'IA pour personnaliser vos posts</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Colonne gauche */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div>
              <label className="label">Nom de la marque</label>
              <input className="input" placeholder="Ex: Pixel Agency" value={brandName} onChange={e => setBrandName(e.target.value)} />
            </div>
            <div>
              <label className="label">Secteur d'activité</label>
              <input className="input" placeholder="Ex: Marketing digital, Mode, Restauration..." value={sector} onChange={e => setSector(e.target.value)} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.75rem' }}>
              <div>
                <label className="label">Ton par défaut</label>
                <select className="input" value={defaultTone} onChange={e => setDefaultTone(e.target.value)}>
                  <option value="professionnel">Professionnel</option>
                  <option value="decontracte">Décontracté</option>
                  <option value="inspirant">Inspirant</option>
                  <option value="humoristique">Humoristique</option>
                </select>
              </div>
              <div>
                <label className="label">Posts / semaine</label>
                <input className="input" type="number" min={1} max={21} value={postsPerWeek} onChange={e => setPostsPerWeek(Number(e.target.value))} />
              </div>
            </div>
          </div>

          {/* Colonne droite */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            <div style={{ flex: 1 }}>
              <label className="label">Description de la marque</label>
              <textarea
                className="input resize-none"
                rows={6}
                placeholder="Ce que vous faites, vos valeurs, votre audience cible..."
                value={brandDesc}
                onChange={e => setBrandDesc(e.target.value)}
                style={{ height: '100%', minHeight: '120px' }}
              />
            </div>
          </div>
        </div>

        <div style={{ marginTop: '1rem' }}>
          <button onClick={saveBrand} disabled={savingBrand} className="btn-primary flex items-center gap-2">
            <Save size={14} /> {savingBrand ? 'Sauvegarde...' : 'Sauvegarder le profil de marque'}
          </button>
        </div>
      </section>

      {/* Déconnexion */}
      <section className="card p-5">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '.9rem', fontWeight: 600, color: 'var(--t1)', marginBottom: '.2rem' }}>Session</div>
            <div style={{ fontSize: '.8rem', color: 'var(--t3)' }}>Déconnectez-vous de votre compte Social IA</div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              display: 'flex', alignItems: 'center', gap: '.5rem',
              padding: '.5rem 1rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,.3)',
              background: 'rgba(239,68,68,.06)', color: '#ef4444',
              cursor: 'pointer', fontSize: '.85rem', fontWeight: 600,
            }}
          >
            <LogOut size={15} /> Se déconnecter
          </button>
        </div>
      </section>
    </div>
  )
}
