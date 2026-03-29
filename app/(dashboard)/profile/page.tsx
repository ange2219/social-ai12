'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { PLATFORM_NAMES, PLATFORM_COLORS, FREE_PLATFORMS } from '@/types'
import type { Platform, SocialAccount } from '@/types'
import { User, Sparkles, Link2, Unlink, Save, Camera, CheckCircle2, RefreshCw } from 'lucide-react'

const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin']

export default function ProfilePage() {
  const { toast } = useToast()
  const supabase = createClient()

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

  const searchParams = useSearchParams()

  const loadAccounts = useCallback(async () => {
    const accRes = await fetch('/api/social/accounts')
    if (accRes.ok) setAccounts(await accRes.json())
  }, [])

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

  // Écouter le postMessage du popup OAuth Meta
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data || e.data.type !== 'meta_oauth') return
      const { success, page, error } = e.data
      if (success === 'facebook_instagram') toast(`Facebook "${page}" + Instagram connectés !`, 'success')
      else if (success === 'facebook_only') toast(`Facebook "${page}" connecté (pas de compte Instagram lié)`, 'success')
      else if (error) toast(`Erreur : ${error}`, 'error')
      loadAccounts()
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [loadAccounts])

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
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#F4F4F6', letterSpacing: '-.02em' }}>
          Mon Profil
        </h1>
        <p style={{ color: '#52525C', fontSize: '.83rem', marginTop: '.2rem' }}>Informations personnelles et profil de votre marque</p>
      </div>

      {/* Ligne 1 : Infos perso (gauche) + Réseaux sociaux (droite) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Infos personnelles */}
        <section className="card p-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <User size={16} style={{ color: '#3B7BF6' }} />
            <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#F4F4F6' }}>Informations personnelles</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', padding: '.65rem', background: '#09090B', borderRadius: '8px', border: '1px solid #1E1E24', marginBottom: '1rem' }}>
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
              <div style={{ fontSize: '.85rem', fontWeight: 500, color: '#E4E4E7' }}>{fullName || 'Sans nom'}</div>
              <div style={{ fontSize: '.75rem', color: '#52525C' }}>{uploadingAvatar ? 'Upload en cours...' : 'Cliquez sur la photo pour changer'}</div>
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
            <Link2 size={16} style={{ color: '#3B7BF6' }} />
            <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#F4F4F6' }}>Réseaux sociaux</span>
          </div>

          {/* Bloc Meta — Facebook + Instagram groupés */}
          {(() => {
            const fbAccount = accounts.find(a => a.platform === 'facebook')
            const igAccount = accounts.find(a => a.platform === 'instagram')
            const anyConnected = !!(fbAccount || igAccount)
            return (
              <div style={{
                background: '#09090B',
                border: `1px solid ${anyConnected ? 'rgba(34,197,94,.2)' : '#1E1E24'}`,
                borderRadius: '10px', padding: '.75rem', marginBottom: '.75rem',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.6rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                    <span style={{ fontSize: '.75rem', color: '#52525C', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Meta</span>
                    {anyConnected && <CheckCircle2 size={13} style={{ color: '#22C55E' }} />}
                  </div>
                  <div style={{ display: 'flex', gap: '.4rem' }}>
                    <button
                      onClick={loadAccounts}
                      title="Rafraîchir"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525C', padding: '2px', display: 'flex' }}
                    >
                      <RefreshCw size={12} />
                    </button>
                    {anyConnected ? (
                      <button
                        onClick={() => { if (fbAccount) disconnect(fbAccount.id); if (igAccount) disconnect(igAccount.id) }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#EF4444', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.3rem' }}
                      >
                        <Unlink size={12} /> Déconnecter
                      </button>
                    ) : (
                      <button
                        onClick={() => window.location.href = '/api/auth/meta/start'}
                        style={{ background: 'rgba(59,123,246,.1)', border: '1px solid rgba(59,123,246,.3)', cursor: 'pointer', color: '#3B7BF6', fontSize: '.75rem', display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.3rem .7rem', borderRadius: '6px', fontWeight: 500 }}
                      >
                        <Link2 size={12} /> Connecter Facebook & Instagram
                      </button>
                    )}
                  </div>
                </div>
                {(['facebook', 'instagram'] as Platform[]).map(p => {
                  const acc = accounts.find(a => a.platform === p)
                  return (
                    <div key={p} style={{ display: 'flex', alignItems: 'center', gap: '.6rem', padding: '.35rem 0', borderTop: '1px solid #1E1E24' }}>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: acc ? PLATFORM_COLORS[p] : '#3f3f46', flexShrink: 0 }} />
                      <span style={{ fontSize: '.82rem', fontWeight: 500, color: acc ? '#E4E4E7' : '#52525C', minWidth: '80px' }}>{PLATFORM_NAMES[p]}</span>
                      {acc
                        ? <span style={{ fontSize: '.75rem', color: '#22C55E', display: 'flex', alignItems: 'center', gap: '.25rem' }}>
                            <CheckCircle2 size={11} /> @{acc.platform_username}
                          </span>
                        : <span style={{ fontSize: '.73rem', color: '#3f3f46' }}>Non connecté</span>
                      }
                    </div>
                  )
                })}
                {!anyConnected && (
                  <div style={{ fontSize: '.72rem', color: '#3f3f46', marginTop: '.5rem' }}>
                    Instagram se connecte automatiquement via votre Page Facebook
                  </div>
                )}
              </div>
            )
          })()}

          {/* Autres plateformes */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '.4rem' }}>
            {(['tiktok', 'twitter', 'linkedin'] as Platform[]).map(p => {
              const isPaid = userPlan !== 'free'
              return (
                <div key={p} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '.5rem .75rem', background: '#09090B', borderRadius: '8px', border: '1px solid #1E1E24',
                  opacity: isPaid ? 1 : .5,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
                    <div style={{ width: '7px', height: '7px', borderRadius: '50%', background: isPaid ? PLATFORM_COLORS[p] : '#3f3f46' }} />
                    <span style={{ fontSize: '.82rem', fontWeight: 500, color: isPaid ? '#E4E4E7' : '#52525C' }}>{PLATFORM_NAMES[p]}</span>
                    {!isPaid && <span style={{ fontSize: '.68rem', fontWeight: 600, background: 'rgba(251,191,36,.1)', color: '#FBBF24', border: '1px solid rgba(251,191,36,.2)', padding: '.1rem .4rem', borderRadius: '4px' }}>Pro</span>}
                  </div>
                  <span style={{ fontSize: '.73rem', color: '#3f3f46' }}>Non disponible</span>
                </div>
              )
            })}
          </div>
        </section>
      </div>

      {/* Ligne 2 : Profil de marque — pleine largeur */}
      <section className="card p-5">
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
          <Sparkles size={16} style={{ color: '#3B7BF6' }} />
          <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#F4F4F6' }}>Profil de marque</span>
          <span style={{ marginLeft: 'auto', fontSize: '.75rem', color: '#52525C' }}>Utilisé par l'IA pour personnaliser vos posts</span>
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
    </div>
  )
}
