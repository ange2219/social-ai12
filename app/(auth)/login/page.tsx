'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  const [showPassword, setShowPassword] = useState(false)
  const [forgotMsg, setForgotMsg] = useState('')
  const router = useRouter()
  const supabase = createClient()

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { setError('Email ou mot de passe incorrect'); setLoading(false) }
    else router.push('/dashboard')
  }

  async function handleForgotPassword() {
    if (!email) { setError('Entrez votre email d\'abord'); return }
    setLoading(true); setError(''); setForgotMsg('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) setError(error.message)
    else setForgotMsg('Un lien de réinitialisation a été envoyé à votre email.')
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError('')
    const { error } = await supabase.auth.signUp({
      email, password,
      options: { data: { full_name: fullName } },
    })
    if (error) { setError(error.message); setLoading(false) }
    else router.push('/onboarding')
  }

  async function handleGoogleLogin() {
    setLoading(true); setError('')

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) { 
      setError(error.message); 
      setLoading(false);
    }
  }

  return (
    <>
      <style>{`
        .login-page-wrap {
          --bg:#0D0D1A;--bg2:#13132A;--bg3:#1A1A35;
          --card:#1E1E3A;--card2:#252548;--border:#2E2E5A;
          --blue:#3B82F6;--blue2:#2563EB;
          --blue-light:rgba(59,130,246,0.15);
          --text:#FFFFFF;--text2:#9CA3AF;--text3:#6B7280;
          --input-bg:#1A1A35;--input-border:#2E2E5A;
          --shadow:rgba(59,130,246,0.2);
          font-family:'DM Sans',sans-serif;
          background:var(--bg);color:var(--text);
          min-height:100vh;display:flex;align-items:stretch;
          overflow-x:hidden;
        }
        [data-theme="light"] .login-page-wrap {
          --bg:#F8F9FA;--bg2:#F1F5F9;--bg3:#E2E8F0;
          --card:#FFFFFF;--card2:#FFFFFF;--border:#E2E8F0;
          --text:#0D0D1A;--text2:#6B7280;--text3:#9CA3AF;
          --input-bg:#FFFFFF;--input-border:#E2E8F0;
          --shadow:rgba(59,130,246,0.1);
        }

        /* ── Layout ── */
        .login-left{
          flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:60px 80px;position:relative;z-index:1;
        }
        .login-right{
          width:480px;flex-shrink:0;
          background:var(--card);
          border-left:1px solid var(--border);
          display:flex;flex-direction:column;align-items:center;justify-content:center;
          padding:60px 48px;position:relative;z-index:1;
        }

        /* ── Illustration ── */
        .phone-illustration{
          position:relative;width:420px;max-width:100%;margin:0 auto 32px;
        }
        .phone-illustration img{
          width:100%;height:auto;object-fit:contain;display:block;
          filter:drop-shadow(0 24px 48px rgba(59,130,246,0.3));
        }

        /* ── Tagline ── */
        .login-tagline{text-align:center;}
        .login-tagline h1{font-family:'Syne',sans-serif;font-size:32px;font-weight:800;line-height:1.2;margin-bottom:12px;}
        .login-tagline h1 span{background:linear-gradient(135deg,var(--blue),var(--blue2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}
        .login-tagline p{font-size:15px;color:var(--text2);line-height:1.6;max-width:360px;margin:0 auto;}

        /* ── Logo ── */
        .login-logo{display:flex;align-items:center;gap:8px;margin-bottom:32px;}
        .logo-mark{width:38px;height:38px;background:linear-gradient(135deg,var(--blue),var(--blue2));border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Syne',sans-serif;font-size:14px;font-weight:800;color:#fff;}
        .logo-text{font-family:'Syne',sans-serif;font-size:20px;font-weight:800;color:var(--text);}
        .logo-text span{background:linear-gradient(135deg,var(--blue),var(--blue2));-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;}

        /* ── Form ── */
        .login-form{width:100%;}
        .login-form h2{font-family:'Syne',sans-serif;font-size:24px;font-weight:700;margin-bottom:6px;}
        .login-form p{font-size:13px;color:var(--text2);margin-bottom:28px;}
        .form-group{margin-bottom:16px;}
        .form-label{font-size:12px;font-weight:600;color:var(--text2);display:block;margin-bottom:6px;letter-spacing:.04em;text-transform:uppercase;}
        .form-input{
          width:100%;background:var(--input-bg);border:1px solid var(--input-border);
          border-radius:12px;padding:12px 16px;color:var(--text);
          font-family:'DM Sans',sans-serif;font-size:14px;outline:none;
          transition:border-color .2s,box-shadow .2s;box-sizing:border-box;
        }
        .form-input:focus{border-color:var(--blue);box-shadow:0 0 0 2px rgba(59,130,246,0.2);}
        .form-input::placeholder{color:var(--text3);}
        .btn-primary{
          width:100%;background:linear-gradient(135deg,var(--blue),var(--blue2));
          color:#fff;border:none;border-radius:12px;padding:14px;
          font-family:'Syne',sans-serif;font-size:15px;font-weight:700;
          cursor:pointer;transition:all .2s;letter-spacing:.02em;margin-top:4px;
        }
        .btn-primary:hover{transform:translateY(-1px);}
        .btn-primary:active{transform:translateY(0);}
        .btn-primary:disabled{opacity:.6;cursor:not-allowed;transform:none;}
        .divider{display:flex;align-items:center;gap:12px;margin:20px 0;color:var(--text3);font-size:12px;}
        .divider::before,.divider::after{content:'';flex:1;height:1px;background:var(--border);}
        .btn-social{
          width:100%;background:var(--card2);border:1px solid var(--border);
          border-radius:12px;padding:12px;color:var(--text);
          font-family:'DM Sans',sans-serif;font-size:14px;font-weight:500;
          cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;
          transition:all .2s;margin-bottom:10px;
        }
        .btn-social:hover{border-color:var(--blue);background:var(--blue-light);}
        .btn-social:disabled{opacity:.6;cursor:not-allowed;}
        .login-switch{text-align:center;margin-top:20px;font-size:13px;color:var(--text2);}
        .login-switch a{color:var(--blue);text-decoration:none;font-weight:600;cursor:pointer;}
        .error-box{
          background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);
          color:#EF4444;font-size:12px;border-radius:8px;padding:10px 14px;margin-bottom:12px;
        }
        .theme-toggle{
          position:fixed;top:20px;right:20px;z-index:100;
          width:40px;height:40px;border-radius:50%;
          background:var(--card);border:1px solid var(--border);
          display:flex;align-items:center;justify-content:center;
          cursor:pointer;transition:all .3s;box-shadow:0 4px 12px var(--shadow);
        }
        .theme-toggle:hover{background:var(--blue);border-color:var(--blue);}
        .theme-toggle svg{width:18px;height:18px;stroke:var(--text);fill:none;stroke-width:1.8;stroke-linecap:round;}
        .password-wrap{position:relative;}
        .password-wrap .form-input{padding-right:44px;}
        .eye-btn{
          position:absolute;right:14px;top:50%;transform:translateY(-50%);
          background:none;border:none;cursor:pointer;padding:0;
          color:var(--text3);display:flex;align-items:center;transition:color .2s;
        }
        .eye-btn:hover{color:var(--blue);}
        .password-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px;}
        .forgot-link{font-size:12px;color:var(--blue);text-decoration:none;cursor:pointer;font-weight:500;}
        .forgot-link:hover{text-decoration:underline;}
        .forgot-msg{font-size:12px;color:#22c55e;margin-top:6px;}

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .login-page-wrap { flex-direction: column; }
          .login-left {
            padding: 48px 24px 32px;
            order: 1;
          }
          .login-right {
            width: 100%;
            border-left: none;
            border-top: 1px solid var(--border);
            padding: 40px 24px 48px;
            order: 2;
          }
          .phone-illustration { width: 280px; margin-bottom: 24px; }
          .login-tagline h1 { font-size: 24px; }
        }
        @media (max-width: 480px) {
          .login-left { padding: 32px 16px 24px; }
          .login-right { padding: 32px 20px 40px; }
          .phone-illustration { width: 220px; }
          .login-tagline h1 { font-size: 20px; }
          .login-form h2 { font-size: 20px; }
          .theme-toggle { top: 12px; right: 12px; }
        }
      `}</style>

      <div className="login-page-wrap">

        {/* Theme toggle */}
        <button className="theme-toggle" onClick={toggleTheme} type="button">
          {theme === 'dark' ? (
            <svg viewBox="0 0 24 24"><path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75 9.75 9.75 0 0 1 8.25 6c0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 12c0 5.385 4.365 9.75 9.75 9.75 4.282 0 7.937-2.764 9.002-6.998Z"/></svg>
          ) : (
            <svg viewBox="0 0 24 24"><path d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>
          )}
        </button>

        {/* Left — Illustration */}
        <div className="login-left">
          <div className="phone-illustration">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/social-ai-phone.png"
              alt="Social AI illustration"
            />
          </div>

          <div className="login-tagline">
            <h1>
              Gérez vos réseaux<br />
              avec l&apos;<span>Intelligence</span><br />
              Artificielle
            </h1>
            <p>Créez, planifiez et analysez vos contenus sur toutes vos plateformes depuis un seul endroit.</p>
          </div>
        </div>

        {/* Right — Form */}
        <div className="login-right">
          <div className="login-logo">
            <div className="logo-mark">SI</div>
            <div className="logo-text">Social <span>AI</span></div>
          </div>

          <div className="login-form">
            {mode === 'login' ? (
              <>
                <h2>Bon retour</h2>
                <p>Connectez-vous à votre espace Social AI</p>

                <form onSubmit={handleLogin}>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="votre@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <div className="password-row">
                      <label className="form-label" style={{margin:0}}>Mot de passe</label>
                      <span className="forgot-link" onClick={handleForgotPassword}>Mot de passe oublié ?</span>
                    </div>
                    <div className="password-wrap">
                      <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                        value={password} onChange={e => setPassword(e.target.value)} required />
                      <button type="button" className="eye-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                    {forgotMsg && <div className="forgot-msg">{forgotMsg}</div>}
                  </div>

                  {error && <div className="error-box">{error}</div>}

                  <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Connexion...' : 'Se connecter'}
                  </button>
                </form>

                <div className="divider">ou continuer avec</div>

                <button className="btn-social" type="button" onClick={handleGoogleLogin} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </button>

                <div className="login-switch" style={{marginTop:16}}>
                  Vous n&apos;avez pas de compte ?{' '}
                  <a onClick={() => { setMode('register'); setError('') }}>Inscrivez vous !</a>
                </div>
              </>
            ) : (
              <>
                <h2>Créer un compte</h2>
                <p>Commencez gratuitement dès maintenant</p>

                <form onSubmit={handleRegister}>
                  <div className="form-group">
                    <label className="form-label">Prénom</label>
                    <input className="form-input" type="text" placeholder="Ex : Alex"
                      value={fullName} onChange={e => setFullName(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input className="form-input" type="email" placeholder="votre@email.com"
                      value={email} onChange={e => setEmail(e.target.value)} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Mot de passe</label>
                    <div className="password-wrap">
                      <input className="form-input" type={showPassword ? 'text' : 'password'} placeholder="••••••••"
                        value={password} onChange={e => setPassword(e.target.value)} minLength={8} required />
                      <button type="button" className="eye-btn" onClick={() => setShowPassword(v => !v)} tabIndex={-1}>
                        {showPassword ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                            <line x1="1" y1="1" x2="23" y2="23"/>
                          </svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                            <circle cx="12" cy="12" r="3"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </div>

                  {error && <div className="error-box">{error}</div>}

                  <button className="btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Création...' : 'Créer mon compte →'}
                  </button>
                </form>

                <div className="divider">ou continuer avec</div>

                <button className="btn-social" type="button" onClick={handleGoogleLogin} disabled={loading}>
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuer avec Google
                </button>

                <div className="login-switch" style={{ marginTop: 20 }}>
                  Déjà un compte ?{' '}
                  <a onClick={() => { setMode('login'); setError('') }}>Se connecter</a>
                </div>
              </>
            )}
          </div>
        </div>

      </div>
    </>
  )
}
