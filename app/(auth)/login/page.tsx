'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { LogoAnimation } from '@/components/LogoAnimation'

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function switchTab(t: 'login' | 'register') {
    setTab(t)
    setError('')
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect'); setLoading(false) }
    else router.push('/dashboard')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/dashboard')
  }

  return (
    <div style={{ minHeight: '100vh', background: '#09090B', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1.5rem' }}>
      <div className="auth-box">

        {/* Logo animé */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
          <LogoAnimation size={120} />
          <span className="logo-name" style={{ fontSize: '1.25rem' }}>Social <span>IA</span></span>
        </div>

        {/* Header */}
        <div className="auth-head">
          <h2>{tab === 'login' ? 'Bon retour' : 'Créer un compte'}</h2>
          <p>{tab === 'login' ? 'Connectez-vous à votre espace' : 'Commencez gratuitement'}</p>
        </div>

        {/* Tabs — identique mockup */}
        <div className="tabs">
          <button className={`tab${tab === 'login' ? ' on' : ''}`} onClick={() => switchTab('login')}>
            Connexion
          </button>
          <button className={`tab${tab === 'register' ? ' on' : ''}`} onClick={() => switchTab('register')}>
            Inscription
          </button>
        </div>

        {/* Login form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div className="fg">
              <label className="fl">Email</label>
              <input className="fi" type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="fg">
              <label className="fl" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                Mot de passe
                <Link href="/reset-password" style={{ fontSize: '.74rem', color: '#3B7BF6', textDecoration: 'none' }}>Oublié ?</Link>
              </label>
              <input className="fi" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            {error && <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#EF4444', fontSize: '.82rem', borderRadius: '8px', padding: '.6rem .9rem', marginBottom: '1rem' }}>{error}</div>}
            <button className="btn-full" type="submit" disabled={loading}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
            <div className="divider">ou</div>
            <div className="soc-row">
              <button type="button" className="soc-btn">🔵 Google</button>
              <button type="button" className="soc-btn">⬛ Apple</button>
            </div>
          </form>
        )}

        {/* Register form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div className="fg">
              <label className="fl">Prénom</label>
              <input className="fi" type="text" placeholder="Alex" value={fullName} onChange={e => setFullName(e.target.value)} required />
            </div>
            <div className="fg">
              <label className="fl">Email</label>
              <input className="fi" type="email" placeholder="vous@exemple.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div className="fg">
              <label className="fl">Mot de passe</label>
              <input className="fi" type="password" placeholder="Min. 8 caractères" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
            </div>
            {error && <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: '#EF4444', fontSize: '.82rem', borderRadius: '8px', padding: '.6rem .9rem', marginBottom: '1rem' }}>{error}</div>}
            <button className="btn-full" type="submit" disabled={loading}>
              {loading ? 'Création...' : 'Créer mon compte →'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
