'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { PLAN_LIMITS } from '@/types'
import { Moon, Sun, Globe, Bell, CreditCard, Trash2, Lock, ExternalLink } from 'lucide-react'

export default function SettingsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [userPlan, setUserPlan] = useState<'free' | 'premium' | 'business'>('free')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState('')

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => {
      if (u?.plan) setUserPlan(u.plan)
    })
    const saved = localStorage.getItem('theme')
    if (saved === 'light') setTheme('light')
  }, [])

  async function changePassword() {
    if (!newPassword || newPassword.length < 8) { toast('Mot de passe trop court (8 caractères min)', 'error'); return }
    if (newPassword !== confirmPassword) { toast('Les mots de passe ne correspondent pas', 'error'); return }
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPwd(false)
    if (error) toast(error.message, 'error')
    else { toast('Mot de passe modifié', 'success'); setNewPassword(''); setConfirmPassword('') }
  }

  async function handleUpgrade(plan: 'premium' | 'business') {
    const res = await fetch('/api/billing/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    })
    const data = await res.json()
    if (data.url) window.location.href = data.url
  }

  async function handlePortal() {
    const res = await fetch('/api/billing/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) window.location.href = data.url
    else toast(data.error, 'error')
  }

  const limits = PLAN_LIMITS[userPlan]

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="font-display text-2xl font-bold text-t1">Paramètres</h1>
        <p className="text-t3 text-sm mt-0.5">Préférences de l'application et gestion du compte</p>
      </div>

      {/* Apparence */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Moon size={18} className="text-accent" />
          <h2 className="font-medium text-t1">Apparence</h2>
        </div>
        <div className="flex gap-3">
          {(['dark', 'light'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTheme(t); localStorage.setItem('theme', t); toast('Bientôt disponible', 'success') }}
              style={{
                flex: 1, padding: '1rem', borderRadius: '10px', border: `1px solid ${theme === t ? '#3B7BF6' : '#27272D'}`,
                background: theme === t ? 'rgba(59,123,246,.08)' : '#111113',
                color: theme === t ? '#3B7BF6' : '#8E8E98', cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.5rem', transition: '.15s',
              }}
            >
              {t === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
              <span style={{ fontSize: '.83rem', fontWeight: 500 }}>{t === 'dark' ? 'Sombre' : 'Clair'}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Langue */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Globe size={18} className="text-accent" />
          <h2 className="font-medium text-t1">Langue</h2>
        </div>
        <div className="flex gap-3">
          {([['fr', 'Français'], ['en', 'English']] as const).map(([code, label]) => (
            <button
              key={code}
              onClick={() => { setLang(code); toast('Bientôt disponible', 'success') }}
              style={{
                padding: '.75rem 1.5rem', borderRadius: '8px', border: `1px solid ${lang === code ? '#3B7BF6' : '#27272D'}`,
                background: lang === code ? 'rgba(59,123,246,.08)' : 'transparent',
                color: lang === code ? '#3B7BF6' : '#8E8E98', cursor: 'pointer',
                fontSize: '.83rem', fontWeight: 500, transition: '.15s',
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </section>

      {/* Notifications */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Bell size={18} className="text-accent" />
          <h2 className="font-medium text-t1">Notifications</h2>
        </div>
        <div className="flex items-center justify-between p-3 bg-s2 rounded-lg">
          <div>
            <div className="text-t1 text-sm font-medium">Notifications email</div>
            <div className="text-t3 text-xs mt-0.5">Résumés hebdomadaires, rappels de publication</div>
          </div>
          <button
            onClick={() => setEmailNotifs(p => !p)}
            style={{
              width: '44px', height: '24px', borderRadius: '999px', border: 'none', cursor: 'pointer',
              background: emailNotifs ? '#3B7BF6' : '#27272D', transition: '.2s', position: 'relative',
            }}
          >
            <div style={{
              width: '18px', height: '18px', borderRadius: '50%', background: '#fff',
              position: 'absolute', top: '3px', transition: '.2s',
              left: emailNotifs ? '23px' : '3px',
            }} />
          </button>
        </div>
      </section>

      {/* Mot de passe */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Lock size={18} className="text-accent" />
          <h2 className="font-medium text-t1">Mot de passe</h2>
        </div>
        <div className="space-y-4">
          <div>
            <label className="label">Nouveau mot de passe</label>
            <input className="input" type="password" placeholder="8 caractères minimum" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
          </div>
          <div>
            <label className="label">Confirmer le mot de passe</label>
            <input className="input" type="password" placeholder="Répétez le mot de passe" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
          </div>
          <button onClick={changePassword} disabled={savingPwd} className="btn-primary flex items-center gap-2">
            <Lock size={15} /> {savingPwd ? 'Modification...' : 'Modifier le mot de passe'}
          </button>
        </div>
      </section>

      {/* Abonnement */}
      <section className="card p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <CreditCard size={18} className="text-accent" />
          <h2 className="font-medium text-t1">Abonnement</h2>
        </div>
        <div className="flex items-center gap-3 mb-5 p-3 bg-s2 rounded-lg">
          <div className={`badge ${userPlan === 'free' ? 'badge-gray' : userPlan === 'premium' ? 'badge-blue' : 'badge-yellow'}`}>
            {userPlan === 'free' ? 'Gratuit' : userPlan === 'premium' ? 'Premium' : 'Business'}
          </div>
          <div className="text-t2 text-sm">
            {userPlan === 'free' ? `3 générations/jour · 2 plateformes` :
             userPlan === 'premium' ? '10 générations/jour · 5 plateformes · Semaine complète' :
             'Illimité · Toutes plateformes'}
          </div>
        </div>
        {userPlan === 'free' ? (
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => handleUpgrade('premium')} className="btn-primary flex items-center justify-center gap-2">
              <ExternalLink size={15} /> Premium — 29€/mois
            </button>
            <button onClick={() => handleUpgrade('business')} className="btn-outline flex items-center justify-center gap-2">
              <ExternalLink size={15} /> Business — 79€/mois
            </button>
          </div>
        ) : (
          <button onClick={handlePortal} className="btn-outline flex items-center gap-2">
            <CreditCard size={15} /> Gérer mon abonnement
          </button>
        )}
      </section>

      {/* Danger zone */}
      <section className="card p-6" style={{ borderColor: 'rgba(239,68,68,.2)' }}>
        <div className="flex items-center gap-2 mb-5">
          <Trash2 size={18} style={{ color: '#EF4444' }} />
          <h2 className="font-medium" style={{ color: '#EF4444' }}>Zone dangereuse</h2>
        </div>
        <p className="text-t3 text-sm mb-4">La suppression de votre compte est irréversible. Toutes vos données seront effacées.</p>
        <div className="space-y-3">
          <div>
            <label className="label">Tapez <span style={{ color: '#EF4444', fontFamily: 'monospace' }}>supprimer</span> pour confirmer</label>
            <input className="input" placeholder="supprimer" value={confirmDelete} onChange={e => setConfirmDelete(e.target.value)} />
          </div>
          <button
            disabled={confirmDelete !== 'supprimer' || deleting}
            style={{
              background: confirmDelete === 'supprimer' ? 'rgba(239,68,68,.1)' : 'transparent',
              border: '1px solid rgba(239,68,68,.3)', color: '#EF4444',
              padding: '.65rem 1.25rem', borderRadius: '8px', cursor: confirmDelete === 'supprimer' ? 'pointer' : 'not-allowed',
              fontSize: '.83rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '.5rem',
              opacity: confirmDelete === 'supprimer' ? 1 : .4,
            }}
          >
            <Trash2 size={14} /> Supprimer mon compte
          </button>
        </div>
      </section>
    </div>
  )
}
