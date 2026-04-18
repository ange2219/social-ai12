'use client'

import { useState, useEffect } from 'react'
import { useToast } from '@/components/ui/Toast'
import { createClient } from '@/lib/supabase/client'
import { Moon, Sun, Globe, Bell, CreditCard, Trash2, Lock, ExternalLink, CheckCircle } from 'lucide-react'

const NAV_ITEMS = [
  { id: 'appearance', label: 'Apparence', icon: Moon },
  { id: 'language', label: 'Langue & Notifications', icon: Globe },
  { id: 'password', label: 'Mot de passe', icon: Lock },
  { id: 'billing', label: 'Abonnement', icon: CreditCard },
  { id: 'danger', label: 'Zone dangereuse', icon: Trash2, danger: true },
]

export default function SettingsPage() {
  const { toast } = useToast()
  const supabase = createClient()
  const [active, setActive] = useState('appearance')

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [lang, setLang] = useState<'fr' | 'en'>('fr')
  const [emailNotifs, setEmailNotifs] = useState(true)
  const [userPlan, setUserPlan] = useState<'free' | 'premium' | 'business'>('free')
  const [userEmail, setUserEmail] = useState('')

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
    const saved = localStorage.getItem('theme') || document.documentElement.getAttribute('data-theme') || 'dark'
    setTheme(saved as 'dark' | 'light')
  }, [])

  async function verifyCurrentPassword() {
    if (!currentPassword) { toast('Entrez votre mot de passe actuel', 'error'); return }
    setSavingPwd(true)
    const { error } = await supabase.auth.signInWithPassword({ email: userEmail, password: currentPassword })
    setSavingPwd(false)
    if (error) { toast('Mot de passe actuel incorrect', 'error'); return }
    setPwdStep('verified')
    toast('Identité vérifiée', 'success')
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
    const res = await fetch('/api/billing/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan }) })
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
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-page, #0d0d0f)' }}>
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside style={{
        width: '240px', flexShrink: 0,
        borderRight: '1px solid var(--b1)',
        padding: '2rem 0',
        position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{ padding: '0 1.25rem', marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '.78rem', fontWeight: 600, color: 'var(--t3)', textTransform: 'uppercase', letterSpacing: '.07em' }}>Paramètres</h2>
        </div>

        <nav>
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const isActive = active === item.id
            const dangerColor = '#ef4444'
            return (
              <button key={item.id} onClick={() => setActive(item.id)} style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: '.6rem',
                padding: '.55rem 1.25rem', background: 'none', border: 'none',
                borderLeft: isActive ? `2px solid ${item.danger ? dangerColor : '#4646FF'}` : '2px solid transparent',
                color: isActive ? (item.danger ? dangerColor : 'var(--t1)') : (item.danger ? dangerColor : 'var(--t3)'),
                cursor: 'pointer', fontSize: '.83rem', fontWeight: isActive ? 600 : 400,
                transition: '.15s', textAlign: 'left', opacity: item.danger && !isActive ? .7 : 1,
              }}>
                <Icon size={14} style={{ flexShrink: 0, color: isActive ? (item.danger ? dangerColor : '#4646FF') : (item.danger ? dangerColor : 'var(--t3)') }} />
                {item.label}
              </button>
            )
          })}
        </nav>
      </aside>

      {/* ── Contenu ──────────────────────────────────────────────────────────── */}
      <main style={{ flex: 1, padding: '2rem 2.5rem', maxWidth: '680px' }}>

        {/* ── Apparence ─────────────────────────────────────────── */}
        {active === 'appearance' && (
          <div>
            <SectionHeader title="Apparence" desc="Personnalisez l'affichage de l'application." />
            <SettingRow label="Thème" desc="Choisissez entre le mode sombre et clair.">
              <div style={{ display: 'flex', gap: '.6rem' }}>
                {(['dark', 'light'] as const).map(t => (
                  <button key={t} onClick={() => { setTheme(t); localStorage.setItem('theme', t); document.documentElement.setAttribute('data-theme', t) }} style={{
                    display: 'flex', alignItems: 'center', gap: '.5rem',
                    padding: '.5rem .9rem', borderRadius: '8px', cursor: 'pointer',
                    border: `1px solid ${theme === t ? '#4646FF' : 'var(--b1)'}`,
                    background: theme === t ? 'rgba(70,70,255,.08)' : 'transparent',
                    color: theme === t ? '#4646FF' : 'var(--t3)',
                    fontSize: '.8rem', fontWeight: 500, transition: '.15s',
                  }}>
                    {t === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
                    {t === 'dark' ? 'Sombre' : 'Clair'}
                  </button>
                ))}
              </div>
            </SettingRow>
          </div>
        )}

        {/* ── Langue & Notifications ────────────────────────────── */}
        {active === 'language' && (
          <div>
            <SectionHeader title="Langue & Notifications" desc="Préférences linguistiques et alertes email." />
            <SettingRow label="Langue" desc="Langue de l'interface.">
              <div style={{ display: 'flex', gap: '.5rem' }}>
                {([['fr', '🇫🇷 Français'], ['en', '🇬🇧 English']] as const).map(([code, label]) => (
                  <button key={code} onClick={() => { setLang(code); toast('Bientôt disponible', 'success') }} style={{
                    padding: '.45rem .85rem', borderRadius: '7px', cursor: 'pointer',
                    border: `1px solid ${lang === code ? '#4646FF' : 'var(--b1)'}`,
                    background: lang === code ? 'rgba(70,70,255,.08)' : 'transparent',
                    color: lang === code ? '#4646FF' : 'var(--t3)',
                    fontSize: '.8rem', fontWeight: 500, transition: '.15s',
                  }}>{label}</button>
                ))}
              </div>
            </SettingRow>
            <SettingRow label="Notifications email" desc="Résumés hebdomadaires, rappels de publication.">
              <Toggle value={emailNotifs} onChange={setEmailNotifs} />
            </SettingRow>
          </div>
        )}

        {/* ── Mot de passe ─────────────────────────────────────── */}
        {active === 'password' && (
          <div>
            <SectionHeader
              title="Mot de passe"
              desc="Modifiez votre mot de passe de connexion."
              badge={pwdStep === 'verified' ? <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.73rem', color: '#22C55E', background: 'rgba(34,197,94,.08)', border: '1px solid rgba(34,197,94,.2)', padding: '.2rem .55rem', borderRadius: '999px' }}><CheckCircle size={11} /> Identité vérifiée</span> : undefined}
            />

            {pwdStep === 'idle' ? (
              <>
                <SettingRow label="Mot de passe actuel" desc="Confirmez votre identité avant de changer de mot de passe.">
                  <input className="input" type="password" style={{ maxWidth: '280px' }} placeholder="Mot de passe actuel" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyCurrentPassword()} />
                </SettingRow>
                <div style={{ borderTop: '1px solid var(--b1)', paddingTop: '1.25rem' }}>
                  <button onClick={verifyCurrentPassword} disabled={savingPwd || !currentPassword} className="btn-primary flex items-center gap-2" style={{ opacity: !currentPassword ? .45 : 1 }}>
                    <Lock size={14} /> {savingPwd ? 'Vérification...' : 'Vérifier mon identité'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <SettingRow label="Nouveau mot de passe" desc="8 caractères minimum.">
                  <div style={{ maxWidth: '280px' }}>
                    <input className="input" type="password" placeholder="Nouveau mot de passe" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    {newPassword.length > 0 && (
                      <div style={{ marginTop: '.4rem', display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                        <div style={{ flex: 1, height: '3px', borderRadius: '999px', background: 'var(--b1)', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(strength / 3) * 100}%`, background: strengthColor[strength], transition: '.3s', borderRadius: '999px' }} />
                        </div>
                        <span style={{ fontSize: '.7rem', color: strengthColor[strength], fontWeight: 600, flexShrink: 0 }}>{strengthLabel[strength]}</span>
                      </div>
                    )}
                  </div>
                </SettingRow>
                <SettingRow label="Confirmer">
                  <div style={{ maxWidth: '280px' }}>
                    <input className="input" type="password" placeholder="Répétez le mot de passe" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} style={{ borderColor: confirmPassword && confirmPassword !== newPassword ? 'rgba(239,68,68,.4)' : undefined }} />
                    {confirmPassword && confirmPassword !== newPassword && <div style={{ fontSize: '.72rem', color: '#EF4444', marginTop: '.3rem' }}>Ne correspondent pas</div>}
                  </div>
                </SettingRow>
                <div style={{ borderTop: '1px solid var(--b1)', paddingTop: '1.25rem', display: 'flex', gap: '.5rem' }}>
                  <button onClick={changePassword} disabled={savingPwd} className="btn-primary flex items-center gap-2">
                    <Lock size={14} /> {savingPwd ? 'Modification...' : 'Modifier le mot de passe'}
                  </button>
                  <button onClick={() => { setPwdStep('idle'); setCurrentPassword(''); setNewPassword(''); setConfirmPassword('') }}
                    style={{ padding: '.55rem .9rem', borderRadius: '7px', border: '1px solid var(--b1)', background: 'transparent', color: 'var(--t3)', cursor: 'pointer', fontSize: '.82rem' }}>
                    Annuler
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* ── Abonnement ───────────────────────────────────────── */}
        {active === 'billing' && (
          <div>
            <SectionHeader title="Abonnement" desc="Gérez votre plan et vos informations de paiement." />

            {/* Plan actuel */}
            <div style={{ padding: '1rem', background: 'var(--bg)', border: '1px solid var(--b1)', borderRadius: '10px', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                <div style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--t1)' }}>Plan actuel</div>
                <span style={{
                  padding: '.2rem .65rem', borderRadius: '999px', fontSize: '.72rem', fontWeight: 600,
                  background: userPlan === 'free' ? 'var(--b1)' : userPlan === 'premium' ? 'rgba(70,70,255,.15)' : 'rgba(251,191,36,.12)',
                  color: userPlan === 'free' ? 'var(--t3)' : userPlan === 'premium' ? '#4646FF' : '#FBBF24',
                }}>
                  {userPlan === 'free' ? 'Gratuit' : userPlan === 'premium' ? 'Premium' : 'Business'}
                </span>
              </div>
              <div style={{ fontSize: '.78rem', color: 'var(--t3)' }}>
                {userPlan === 'free' ? '5 générations/jour · Instagram & Facebook uniquement'
                  : userPlan === 'premium' ? '20 générations/jour · 5 plateformes · Planification'
                  : 'Générations illimitées · Toutes plateformes · Workspaces'}
              </div>
            </div>

            {userPlan === 'free' ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
                <PlanCard
                  name="Premium" price="29€/mois"
                  features={['20 générations / jour', '5 plateformes sociales', 'Planification avancée', 'Analytiques']}
                  color="#4646FF"
                  onUpgrade={() => handleUpgrade('premium')}
                />
                <PlanCard
                  name="Business" price="79€/mois"
                  features={['Générations illimitées', 'Toutes les plateformes', 'Workspaces & équipe', 'Support prioritaire']}
                  color="#FBBF24"
                  onUpgrade={() => handleUpgrade('business')}
                />
              </div>
            ) : (
              <button onClick={handlePortal} className="btn-outline flex items-center gap-2">
                <CreditCard size={14} /> Gérer mon abonnement
              </button>
            )}
          </div>
        )}

        {/* ── Zone dangereuse ──────────────────────────────────── */}
        {active === 'danger' && (
          <div>
            <SectionHeader title="Zone dangereuse" desc="Actions irréversibles sur votre compte." danger />

            <div style={{ border: '1px solid rgba(239,68,68,.2)', borderRadius: '10px', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid rgba(239,68,68,.12)' }}>
                <div style={{ fontSize: '.85rem', fontWeight: 600, color: 'var(--t1)', marginBottom: '.3rem' }}>Supprimer mon compte</div>
                <p style={{ fontSize: '.78rem', color: 'var(--t3)', lineHeight: 1.6 }}>
                  La suppression est <strong style={{ color: '#ef4444' }}>définitive et irréversible</strong>. Tous vos posts, données et connexions seront effacés immédiatement.
                </p>
              </div>
              <div style={{ padding: '1rem 1.25rem', background: 'rgba(239,68,68,.03)' }}>
                <label style={{ fontSize: '.78rem', color: 'var(--t3)', display: 'block', marginBottom: '.5rem' }}>
                  Tapez <code style={{ color: '#ef4444', background: 'rgba(239,68,68,.1)', padding: '.1rem .35rem', borderRadius: '4px', fontSize: '.78rem' }}>supprimer</code> pour confirmer
                </label>
                <div style={{ display: 'flex', gap: '.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input
                    className="input" placeholder="supprimer" value={confirmDelete}
                    onChange={e => setConfirmDelete(e.target.value)}
                    style={{ maxWidth: '200px', borderColor: confirmDelete === 'supprimer' ? 'rgba(239,68,68,.4)' : undefined }}
                  />
                  <button
                    disabled={confirmDelete !== 'supprimer' || deleting}
                    onClick={async () => {
                      setDeleting(true)
                      const res = await fetch('/api/auth/delete-account', { method: 'DELETE' })
                      if (res.ok) { await supabase.auth.signOut(); window.location.href = '/login' }
                      else { const d = await res.json(); toast(d.error || 'Erreur', 'error'); setDeleting(false) }
                    }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '.4rem',
                      padding: '.55rem 1.1rem', borderRadius: '7px',
                      border: '1px solid rgba(239,68,68,.3)',
                      background: confirmDelete === 'supprimer' ? 'rgba(239,68,68,.12)' : 'transparent',
                      color: '#ef4444', cursor: confirmDelete === 'supprimer' ? 'pointer' : 'not-allowed',
                      fontSize: '.82rem', fontWeight: 500,
                      opacity: confirmDelete === 'supprimer' ? 1 : .35, transition: '.2s',
                    }}
                  >
                    <Trash2 size={13} /> {deleting ? 'Suppression...' : 'Supprimer mon compte'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

// ── Composants locaux ──────────────────────────────────────────────────────────

function SectionHeader({ title, desc, danger, badge }: { title: string; desc: string; danger?: boolean; badge?: React.ReactNode }) {
  return (
    <div style={{ borderBottom: '1px solid var(--b1)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 700, color: danger ? '#ef4444' : 'var(--t1)', letterSpacing: '-.01em' }}>{title}</h2>
        {badge}
      </div>
      <p style={{ fontSize: '.8rem', color: 'var(--t3)', marginTop: '.3rem' }}>{desc}</p>
    </div>
  )
}

function SettingRow({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
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

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: '42px', height: '22px', borderRadius: '999px', border: 'none', cursor: 'pointer',
      background: value ? '#4646FF' : 'var(--b1)', transition: '.2s', position: 'relative', flexShrink: 0,
    }}>
      <div style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fff', position: 'absolute', top: '3px', transition: '.2s', left: value ? '23px' : '3px' }} />
    </button>
  )
}

function PlanCard({ name, price, features, color, onUpgrade }: { name: string; price: string; features: string[]; color: string; onUpgrade: () => void }) {
  return (
    <div style={{ padding: '1rem', border: `1px solid ${color}25`, borderRadius: '10px', background: `${color}05` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.75rem' }}>
        <div>
          <div style={{ fontSize: '.88rem', fontWeight: 700, color: 'var(--t1)' }}>{name}</div>
          <div style={{ fontSize: '.78rem', color: 'var(--t3)', marginTop: '.1rem' }}>{price}</div>
        </div>
        <button onClick={onUpgrade} style={{
          display: 'flex', alignItems: 'center', gap: '.4rem',
          padding: '.45rem .9rem', borderRadius: '7px',
          border: `1px solid ${color}50`, background: `${color}12`,
          color, cursor: 'pointer', fontSize: '.78rem', fontWeight: 600,
        }}>
          <ExternalLink size={13} /> Passer à {name}
        </button>
      </div>
      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '.35rem' }}>
        {features.map(f => (
          <li key={f} style={{ fontSize: '.72rem', color: 'var(--t3)', background: 'var(--bg)', border: '1px solid var(--b1)', padding: '.2rem .55rem', borderRadius: '5px' }}>{f}</li>
        ))}
      </ul>
    </div>
  )
}
