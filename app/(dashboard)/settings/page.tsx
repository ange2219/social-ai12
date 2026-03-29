'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { Moon, Sun, Globe, Bell, CreditCard, Trash2, Lock, ExternalLink, CheckCircle } from 'lucide-react'

export default function SettingsPage() {
  const { toast } = useToast()
  const supabase = createClient()

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [userPlan, setUserPlan] = useState<'free' | 'premium' | 'business'>('free')
  const [userEmail, setUserEmail] = useState('')

  // Mot de passe — 3 champs
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdStep, setPwdStep] = useState<'idle' | 'verified'>('idle')

  const [confirmDelete, setConfirmDelete] = useState('')
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    fetch('/api/auth/me').then(r => r.json()).then(u => {
      if (u?.plan) setUserPlan(u.plan)
      if (u?.email) setUserEmail(u.email)
    })
    const saved = localStorage.getItem('theme')
    if (saved === 'light') setTheme('light')
  }, [])

  async function verifyCurrentPassword() {
    if (!currentPassword) { toast('Entrez votre mot de passe actuel', 'error'); return }
    setSavingPwd(true)
    const { error } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPassword })
    setSavingPwd(false)
    if (error) { toast('Mot de passe actuel incorrect', 'error'); return }
    setPwdStep('verified')
    toast('Mot de passe vérifié', 'success')
  }

  async function changePassword() {
    if (newPassword.length < 8) { toast('8 caractères minimum', 'error'); return }
    if (newPassword !== confirmPassword) { toast('Les mots de passe ne correspondent pas', 'error'); return }
    setSavingPwd(true)
    const { error } = await supabase.auth.updateUser({ password: newPassword })
    setSavingPwd(false)
    if (error) { toast(error.message, 'error'); return }
    toast('Mot de passe modifié avec succès', 'success')
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword(''); setPwdStep('idle')
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

  const strength = newPassword.length === 0 ? 0 : newPassword.length < 8 ? 1 : newPassword.length < 12 ? 2 : 3
  const strengthLabel = ['', 'Faible', 'Moyen', 'Fort']
  const strengthColor = ['', '#EF4444', '#F59E0B', '#22C55E']

  return (
    <div style={{ padding: '2rem 2rem 3rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.4rem', fontWeight: 700, color: '#F4F4F6', letterSpacing: '-.02em' }}>
          Paramètres
        </h1>
        <p style={{ color: '#52525C', fontSize: '.83rem', marginTop: '.2rem' }}>Préférences de l'application et gestion du compte</p>
      </div>

      {/* Grille principale 2 colonnes */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Apparence */}
        <section className="card p-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <Moon size={16} style={{ color: '#3B7BF6' }} />
            <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#F4F4F6' }}>Apparence</span>
          </div>
          <div style={{ display: 'flex', gap: '.75rem' }}>
            {(['dark', 'light'] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTheme(t); localStorage.setItem('theme', t); toast('Bientôt disponible', 'success') }}
                style={{
                  flex: 1, padding: '.85rem', borderRadius: '10px',
                  border: `1px solid ${theme === t ? '#3B7BF6' : '#27272D'}`,
                  background: theme === t ? 'rgba(59,123,246,.08)' : '#111113',
                  color: theme === t ? '#3B7BF6' : '#52525C', cursor: 'pointer',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '.4rem', transition: '.15s',
                }}
              >
                {t === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
                <span style={{ fontSize: '.8rem', fontWeight: 500 }}>{t === 'dark' ? 'Sombre' : 'Clair'}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Langue + Notifications empilés */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

          {/* Langue */}
          <section className="card p-5">
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <Globe size={16} style={{ color: '#3B7BF6' }} />
              <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#F4F4F6' }}>Langue</span>
            </div>
            <div style={{ display: 'flex', gap: '.5rem' }}>
              {([['fr', '🇫🇷 Français'], ['en', '🇬🇧 English']] as const).map(([code, label]) => (
                <button
                  key={code}
                  onClick={() => { setLang(code); toast('Bientôt disponible', 'success') }}
                  style={{
                    flex: 1, padding: '.6rem', borderRadius: '8px',
                    border: `1px solid ${lang === code ? '#3B7BF6' : '#27272D'}`,
                    background: lang === code ? 'rgba(59,123,246,.08)' : 'transparent',
                    color: lang === code ? '#3B7BF6' : '#8E8E98', cursor: 'pointer',
                    fontSize: '.8rem', fontWeight: 500, transition: '.15s',
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </section>

          {/* Notifications */}
          <section className="card p-5" style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
              <Bell size={16} style={{ color: '#3B7BF6' }} />
              <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#F4F4F6' }}>Notifications</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.65rem .75rem', background: '#09090B', borderRadius: '8px', border: '1px solid #1E1E24' }}>
              <div>
                <div style={{ fontSize: '.83rem', fontWeight: 500, color: '#E4E4E7' }}>Notifications email</div>
                <div style={{ fontSize: '.75rem', color: '#52525C', marginTop: '.15rem' }}>Résumés hebdomadaires, rappels</div>
              </div>
              <button
                onClick={() => setEmailNotifs(p => !p)}
                style={{
                  width: '42px', height: '22px', borderRadius: '999px', border: 'none', cursor: 'pointer',
                  background: emailNotifs ? '#3B7BF6' : '#27272D', transition: '.2s', position: 'relative', flexShrink: 0,
                }}
              >
                <div style={{
                  width: '16px', height: '16px', borderRadius: '50%', background: '#fff',
                  position: 'absolute', top: '3px', transition: '.2s',
                  left: emailNotifs ? '23px' : '3px',
                }} />
              </button>
            </div>
          </section>
        </div>
      </div>

      {/* Grille 2 colonnes — Mot de passe + Abonnement */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>

        {/* Mot de passe */}
        <section className="card p-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <Lock size={16} style={{ color: '#3B7BF6' }} />
            <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#F4F4F6' }}>Mot de passe</span>
            {pwdStep === 'verified' && (
              <span style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.75rem', color: '#22C55E' }}>
                <CheckCircle size={13} /> Identité vérifiée
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '.75rem' }}>
            {pwdStep === 'idle' ? (
              <>
                <div>
                  <label className="label">Mot de passe actuel</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Votre mot de passe actuel"
                    value={currentPassword}
                    onChange={e => setCurrentPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && verifyCurrentPassword()}
                  />
                </div>
                <button
                  onClick={verifyCurrentPassword}
                  disabled={savingPwd || !currentPassword}
                  className="btn-primary flex items-center gap-2"
                  style={{ opacity: !currentPassword ? .5 : 1 }}
                >
                  <Lock size={14} /> {savingPwd ? 'Vérification...' : 'Vérifier mon identité'}
                </button>
                <p style={{ fontSize: '.75rem', color: '#52525C' }}>
                  Vous devez d'abord confirmer votre identité avant de changer le mot de passe.
                </p>
              </>
            ) : (
              <>
                <div>
                  <label className="label">Nouveau mot de passe</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="8 caractères minimum"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                  />
                  {newPassword.length > 0 && (
                    <div style={{ marginTop: '.4rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                      <div style={{ flex: 1, height: '3px', borderRadius: '999px', background: '#27272D', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${(strength / 3) * 100}%`, background: strengthColor[strength], transition: '.3s', borderRadius: '999px' }} />
                      </div>
                      <span style={{ fontSize: '.72rem', color: strengthColor[strength], fontWeight: 500, flexShrink: 0 }}>{strengthLabel[strength]}</span>
                    </div>
                  )}
                </div>
                <div>
                  <label className="label">Confirmer le mot de passe</label>
                  <input
                    className="input"
                    type="password"
                    placeholder="Répétez le nouveau mot de passe"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    style={{ borderColor: confirmPassword && confirmPassword !== newPassword ? 'rgba(239,68,68,.4)' : undefined }}
                  />
                  {confirmPassword && confirmPassword !== newPassword && (
                    <div style={{ fontSize: '.73rem', color: '#EF4444', marginTop: '.3rem' }}>Les mots de passe ne correspondent pas</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: '.5rem' }}>
                  <button onClick={changePassword} disabled={savingPwd} className="btn-primary flex items-center gap-2" style={{ flex: 1 }}>
                    <Lock size={14} /> {savingPwd ? 'Modification...' : 'Modifier'}
                  </button>
                  <button onClick={() => { setPwdStep('idle'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}
                    style={{ padding: '.6rem .9rem', borderRadius: '8px', border: '1px solid #27272D', background: 'transparent', color: '#52525C', cursor: 'pointer', fontSize: '.82rem' }}>
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        </section>

        {/* Abonnement */}
        <section className="card p-5">
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '1rem' }}>
            <CreditCard size={16} style={{ color: '#3B7BF6' }} />
            <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#F4F4F6' }}>Abonnement</span>
          </div>

          <div style={{ padding: '.75rem', background: '#09090B', borderRadius: '8px', border: '1px solid #1E1E24', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '.6rem', marginBottom: '.4rem' }}>
              <div style={{
                padding: '.2rem .6rem', borderRadius: '999px', fontSize: '.72rem', fontWeight: 600,
                background: userPlan === 'free' ? '#27272D' : userPlan === 'premium' ? 'rgba(59,123,246,.15)' : 'rgba(251,191,36,.12)',
                color: userPlan === 'free' ? '#8E8E98' : userPlan === 'premium' ? '#3B7BF6' : '#FBBF24',
              }}>
                {userPlan === 'free' ? 'Gratuit' : userPlan === 'premium' ? 'Premium' : 'Business'}
              </div>
            </div>
            <div style={{ fontSize: '.8rem', color: '#8E8E98' }}>
              {userPlan === 'free' ? '3 générations/jour · Instagram & Facebook' :
               userPlan === 'premium' ? '10 générations/jour · 5 plateformes · Posts de la semaine' :
               'Illimité · Toutes plateformes · Workspaces'}
            </div>
          </div>

          {userPlan === 'free' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
              <button onClick={() => handleUpgrade('premium')} className="btn-primary flex items-center justify-center gap-2" style={{ width: '100%' }}>
                <ExternalLink size={14} /> Passer à Premium — 29€/mois
              </button>
              <button onClick={() => handleUpgrade('business')} className="btn-outline flex items-center justify-center gap-2" style={{ width: '100%' }}>
                <ExternalLink size={14} /> Passer à Business — 79€/mois
              </button>
            </div>
          ) : (
            <button onClick={handlePortal} className="btn-outline flex items-center gap-2">
              <CreditCard size={14} /> Gérer mon abonnement
            </button>
          )}
        </section>
      </div>

      {/* Zone dangereuse — pleine largeur */}
      <section className="card p-5" style={{ borderColor: 'rgba(239,68,68,.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.75rem' }}>
          <Trash2 size={16} style={{ color: '#EF4444' }} />
          <span style={{ fontSize: '.9rem', fontWeight: 600, color: '#EF4444' }}>Zone dangereuse</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end' }}>
          <div>
            <p style={{ fontSize: '.82rem', color: '#52525C', marginBottom: '.75rem' }}>
              La suppression est <strong style={{ color: '#8E8E98' }}>définitive et irréversible</strong>. Tous vos posts, données et connexions seront effacés.
            </p>
            <label className="label">
              Tapez <span style={{ color: '#EF4444', fontFamily: 'monospace' }}>supprimer</span> pour activer le bouton
            </label>
            <input
              className="input"
              placeholder="supprimer"
              value={confirmDelete}
              onChange={e => setConfirmDelete(e.target.value)}
              style={{ maxWidth: '280px', borderColor: confirmDelete === 'supprimer' ? 'rgba(239,68,68,.4)' : undefined }}
            />
          </div>
          <button
            disabled={confirmDelete !== 'supprimer' || deleting}
            style={{
              background: confirmDelete === 'supprimer' ? 'rgba(239,68,68,.1)' : 'transparent',
              border: '1px solid rgba(239,68,68,.3)', color: '#EF4444',
              padding: '.65rem 1.25rem', borderRadius: '8px',
              cursor: confirmDelete === 'supprimer' ? 'pointer' : 'not-allowed',
              fontSize: '.83rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: '.5rem',
              opacity: confirmDelete === 'supprimer' ? 1 : .35, whiteSpace: 'nowrap', transition: '.2s',
            }}
          >
            <Trash2 size={14} /> Supprimer mon compte
          </button>
        </div>
      </section>
    </div>
  )
}
