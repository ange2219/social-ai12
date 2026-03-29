'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { PLATFORM_NAMES, PLATFORM_COLORS, FREE_PLATFORMS } from '@/types'
import type { Platform, SocialAccount } from '@/types'
import { User, Sparkles, Link2, Unlink, Save } from 'lucide-react'

const ALL_PLATFORMS: Platform[] = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin']

export default function ProfilePage() {
  const { toast } = useToast()
  const supabase = createClient()

  // User info
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [savingUser, setSavingUser] = useState(false)

  // Brand profile
  const [brandName, setBrandName] = useState('')
  const [brandDesc, setBrandDesc] = useState('')
  const [sector, setSector] = useState('')
  const [defaultTone, setDefaultTone] = useState('professionnel')
  const [postsPerWeek, setPostsPerWeek] = useState(5)
  const [savingBrand, setSavingBrand] = useState(false)

  // Social accounts
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [userPlan, setUserPlan] = useState<'free' | 'premium' | 'business'>('free')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setEmail(user.email || '')

      const meRes = await fetch('/api/auth/me')
      const me = await meRes.json()
      if (me?.full_name) setFullName(me.full_name)
      if (me?.plan) setUserPlan(me.plan)

      const brandRes = await fetch('/api/brand')
      if (brandRes.ok) {
        const b = await brandRes.json()
        setBrandName(b.brand_name || '')
        setBrandDesc(b.description || '')
        setSector(b.industry || '')
        setDefaultTone(b.tone || 'professionnel')
        setPostsPerWeek(b.posts_per_week || 5)
      }

      const accRes = await fetch('/api/social/accounts')
      if (accRes.ok) setAccounts(await accRes.json())
    }
    load()
  }, [])

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

  const initials = (fullName || email || 'U').slice(0, 2).toUpperCase()

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-t1">Mon Profil</h1>
        <p className="text-t3 text-sm mt-0.5">Vos informations personnelles et le profil de votre marque</p>
      </div>

      {/* Avatar + nom */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <User size={18} className="text-accent" />
          <h2 className="font-medium text-t1">Informations personnelles</h2>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="av" style={{ width: '52px', height: '52px', fontSize: '1.1rem', borderRadius: '50%', flexShrink: 0 }}>{initials}</div>
          <div>
            <div className="text-t1 font-medium">{fullName || email}</div>
            <div className="text-t3 text-sm">{email}</div>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Nom complet</label>
            <input className="input" placeholder="Votre nom" value={fullName} onChange={e => setFullName(e.target.value)} />
          </div>
          <div>
            <label className="label">Email</label>
            <input className="input" value={email} disabled style={{ opacity: .5, cursor: 'not-allowed' }} />
          </div>
          <button onClick={saveUserInfo} disabled={savingUser} className="btn-primary flex items-center gap-2">
            <Save size={15} /> {savingUser ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </section>

      {/* Brand profile */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Sparkles size={18} className="text-accent" />
          <h2 className="font-medium text-t1">Profil de marque</h2>
        </div>
        <p className="text-t3 text-sm mb-4">Ces informations sont utilisées par l'IA pour générer des posts parfaitement adaptés à votre marque.</p>
        <div className="space-y-4">
          <div>
            <label className="label">Nom de la marque</label>
            <input className="input" placeholder="Ex: Pixel Agency" value={brandName} onChange={e => setBrandName(e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input resize-none" rows={3} placeholder="Ce que vous faites, vos valeurs, votre audience cible..." value={brandDesc} onChange={e => setBrandDesc(e.target.value)} />
          </div>
          <div>
            <label className="label">Secteur d'activité</label>
            <input className="input" placeholder="Ex: Marketing digital, Mode, Restauration..." value={sector} onChange={e => setSector(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
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
              <label className="label">Posts par semaine</label>
              <input className="input" type="number" min={1} max={21} value={postsPerWeek} onChange={e => setPostsPerWeek(Number(e.target.value))} />
            </div>
          </div>
          <button onClick={saveBrand} disabled={savingBrand} className="btn-primary flex items-center gap-2">
            <Save size={15} /> {savingBrand ? 'Sauvegarde...' : 'Sauvegarder la marque'}
          </button>
        </div>
      </section>

      {/* Social accounts */}
      <section className="card p-6">
        <div className="flex items-center gap-2 mb-5">
          <Link2 size={18} className="text-accent" />
          <h2 className="font-medium text-t1">Réseaux sociaux connectés</h2>
        </div>
        <div className="space-y-3">
          {ALL_PLATFORMS.map(p => {
            const connected = accounts.find(a => a.platform === p)
            const isFreePlatform = FREE_PLATFORMS.includes(p)
            const isPaid = userPlan !== 'free'
            const available = isFreePlatform || isPaid
            return (
              <div key={p} className="flex items-center justify-between p-3 bg-s2 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: available ? PLATFORM_COLORS[p] : '#3f3f46' }} />
                  <div>
                    <div className={`text-sm font-medium ${available ? 'text-t1' : 'text-t3'}`}>{PLATFORM_NAMES[p]}</div>
                    {connected && <div className="text-t3 text-xs">@{connected.platform_username}</div>}
                  </div>
                  {!available && <span className="badge badge-gray text-xs ml-2">Premium</span>}
                </div>
                {available ? (
                  connected ? (
                    <button onClick={() => disconnect(connected.id)} className="btn-ghost text-xs flex items-center gap-1.5" style={{ color: '#EF4444' }}>
                      <Unlink size={13} /> Déconnecter
                    </button>
                  ) : (
                    <button onClick={() => window.location.href = '/api/auth/meta/start'} className="btn-outline text-xs flex items-center gap-1.5">
                      <Link2 size={13} /> Connecter
                    </button>
                  )
                ) : (
                  <span className="text-t3 text-xs">Non disponible</span>
                )}
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
