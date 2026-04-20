'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import { ChevronRight, ChevronLeft, Check, Sparkles, User, Building2, Briefcase, Megaphone, DollarSign, Users, Globe, Target, Trophy } from 'lucide-react'

interface OnboardingData {
  account_type: string
  brand_name: string
  industry: string
  description: string
  website: string
  target_audience: string
  audience_age: string
  audience_interests: string
  audience_location: string
  content_pillars: string[]
  tone: string
  avoid_words: string
  objectives: string[]
  posts_per_week: number
}

const INITIAL: OnboardingData = {
  account_type: '',
  brand_name: '',
  industry: '',
  description: '',
  website: '',
  target_audience: '',
  audience_age: '',
  audience_interests: '',
  audience_location: 'nationale',
  content_pillars: [],
  tone: 'professionnel',
  avoid_words: '',
  objectives: [],
  posts_per_week: 5,
}

const ACCOUNT_TYPES = [
  { value: 'creator', label: 'Créateur / Freelance', desc: 'Marque personnelle, influenceur, consultant', icon: User },
  { value: 'business', label: 'Entreprise / PME', desc: 'Startup, commerce, marque', icon: Building2 },
  { value: 'agency', label: 'Agence', desc: 'Agence marketing, communication', icon: Briefcase },
]

const INDUSTRIES = [
  'Mode & Beauté', 'Tech & SaaS', 'E-commerce', 'Santé & Bien-être',
  'Finance & Crypto', 'Restauration & Food', 'Immobilier', 'Sport & Fitness',
  'Éducation', 'Art & Créativité', 'Voyage & Tourisme', 'Autre',
]

const TARGET_AUDIENCE_OPTIONS = [
  'Grand public', 'Entrepreneurs', 'Professionnels B2B', 'Créatifs & Artistes',
  'Étudiants', 'Parents & Familles', 'Sportifs', 'Investisseurs',
  'Geeks & Tech', 'Mode & Beauté', 'Foodies', 'Voyageurs',
]

const INTERESTS_OPTIONS = [
  'Business', 'Technologie', 'Mode', 'Sport & Fitness',
  'Food & Cuisine', 'Voyages', 'Bien-être', 'Finance',
  'Art & Design', 'Gaming', 'Musique', 'Développement perso',
]

const CONTENT_PILLARS_OPTIONS = [
  'Conseils & Astuces', 'Coulisses', 'Produits & Services', 'Témoignages',
  'Actualités secteur', 'Tutoriels', 'Promos & Offres', 'Inspiration',
  'Questions & Sondages', 'Humour', 'Collaborations', 'Événements',
]

const AGE_RANGES = ['13-17', '18-24', '25-34', '35-44', '45-54', '55+', 'Tous âges']

const LOCATIONS = [
  { value: 'locale', label: 'Locale' },
  { value: 'nationale', label: 'Nationale' },
  { value: 'internationale', label: 'Internationale' },
]

const TONES = [
  { value: 'professionnel', label: 'Professionnel', desc: 'Expert, crédible, soigné' },
  { value: 'decontracte', label: 'Décontracté', desc: 'Accessible, authentique' },
  { value: 'inspirant', label: 'Inspirant', desc: 'Motivant, émotionnel' },
  { value: 'humoristique', label: 'Humoristique', desc: 'Léger, wit, fun' },
]

const OBJECTIVES = [
  { value: 'notoriete', label: 'Notoriété', icon: Megaphone },
  { value: 'ventes', label: 'Générer des ventes', icon: DollarSign },
  { value: 'communaute', label: 'Construire une communauté', icon: Users },
  { value: 'trafic', label: 'Trafic vers le site', icon: Globe },
  { value: 'recrutement', label: 'Recrutement', icon: Target },
  { value: 'expertise', label: 'Montrer l\'expertise', icon: Trophy },
]

const STEPS = ['Compte & Marque', 'Audience & Contenu', 'Objectifs', 'Connecter vos réseaux']

const STEP_META = [
  { motivation: 'Cette étape permet à l\'IA de vous représenter fidèlement', title: 'Votre marque', subtitle: 'Quelques infos pour personnaliser chaque post' },
  { motivation: 'Cette étape aide l\'IA à cibler parfaitement vos abonnés', title: 'Votre audience', subtitle: 'Définissez à qui vous parlez et quel ton adopter' },
  { motivation: 'Cette étape oriente chaque contenu vers vos vrais objectifs', title: 'Vos objectifs', subtitle: 'Choisissez ce que vous voulez accomplir sur les réseaux' },
  { motivation: 'Cette étape connecte Social IA à vos comptes', title: 'Vos réseaux', subtitle: 'Publiez directement — vous pouvez aussi le faire plus tard' },
]

const fieldStyle: React.CSSProperties = {
  display: 'block', width: '100%', background: 'var(--s2)',
  border: '1px solid var(--b1)', borderRadius: '8px',
  color: 'var(--t1)', fontSize: '.875rem', padding: '.6rem .85rem',
  outline: 'none', boxSizing: 'border-box',
}
const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: '.78rem', color: 'var(--t2)',
  fontWeight: 600, marginBottom: '.4rem',
}

function ChipGrid({ options, selected, onToggle, max }: {
  options: string[], selected: string[], onToggle: (v: string) => void, max?: number
}) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.45rem' }}>
      {options.map(opt => {
        const sel = selected.includes(opt)
        const disabled = !sel && max !== undefined && selected.length >= max
        return (
          <button
            key={opt}
            type="button"
            onClick={() => !disabled && onToggle(opt)}
            style={{
              padding: '.38rem .85rem', borderRadius: '20px', fontSize: '.82rem', fontWeight: 500,
              border: sel ? '1.5px solid #7B5CF5' : '1px solid var(--b1)',
              background: sel ? 'rgba(123,92,245,0.12)' : 'var(--s2)',
              color: sel ? '#7B5CF5' : disabled ? 'var(--t3)' : 'var(--t2)',
              cursor: disabled ? 'not-allowed' : 'pointer',
              transition: 'all 0.15s', opacity: disabled ? 0.45 : 1,
            }}
          >
            {sel && <Check size={11} style={{ marginRight: 4, verticalAlign: 'middle' }} />}
            {opt}
          </button>
        )
      })}
    </div>
  )
}

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(INITIAL)
  const [selectedPillars, setSelectedPillars] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [connectedAccounts, setConnectedAccounts] = useState<Record<string, string>>({})
  const [connecting, setConnecting] = useState<string | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Charger les comptes déjà connectés au montage
  useEffect(() => {
    fetch('/api/social/accounts')
      .then(r => r.json())
      .then((accounts: { platform: string; platform_username?: string }[]) => {
        if (!Array.isArray(accounts)) return
        const map: Record<string, string> = {}
        for (const a of accounts) map[a.platform] = a.platform_username || a.platform
        setConnectedAccounts(map)
      })
      .catch(() => {})
  }, [])

  // Écoute localStorage (fallback si postMessage bloqué)
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (e.key !== '_oauth_result' || !e.newValue) return
      try {
        const d = JSON.parse(e.newValue)
        if (d.type === 'meta_oauth') {
          if (d.success) {
            setConnectedAccounts(prev => ({ ...prev, facebook: d.page || 'facebook' }))
            toast(`Facebook connecté${d.page ? ` — ${d.page}` : ''} !`, 'success')
          } else if (d.error) {
            toast(`Erreur Facebook : ${d.error}`, 'error')
          }
          setConnecting(null)
        } else if (d.type === 'instagram_oauth') {
          if (d.success) {
            setConnectedAccounts(prev => ({ ...prev, instagram: d.username || 'instagram' }))
            toast(`Instagram${d.username ? ` @${d.username}` : ''} connecté !`, 'success')
          } else if (d.error) {
            toast(`Erreur Instagram : ${d.error}`, 'error')
          }
          setConnecting(null)
        }
      } catch {}
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [toast])

  function update(key: keyof OnboardingData, value: unknown) {
    setData(prev => ({ ...prev, [key]: value }))
  }

  function toggleObjective(val: string) {
    setData(prev => ({
      ...prev,
      objectives: prev.objectives.includes(val)
        ? prev.objectives.filter(o => o !== val)
        : [...prev.objectives, val],
    }))
  }

  function addPillar(val: string) {
    if (!val || selectedPillars.includes(val) || selectedPillars.length >= 5) return
    const next = [...selectedPillars, val]
    setSelectedPillars(next)
    update('content_pillars', next)
  }

  function removePillar(val: string) {
    const next = selectedPillars.filter(v => v !== val)
    setSelectedPillars(next)
    update('content_pillars', next)
  }

  async function connectSocial(platform: 'facebook' | 'instagram', oauthUrl: string) {
    const popup = window.open(oauthUrl, `${platform}_oauth`, 'width=600,height=700')
    if (!popup) {
      toast('Popup bloquée — autorisez les popups dans votre navigateur', 'error')
      return
    }
    setConnecting(platform)

    let done = false

    function handleSuccess(username: string) {
      if (done) return
      done = true
      setConnectedAccounts(prev => ({ ...prev, [platform]: username }))
      toast(`${platform === 'facebook' ? 'Facebook' : 'Instagram'} connecté${username !== platform ? ` — @${username}` : ''} !`, 'success')
      setConnecting(null)
    }

    // Écoute postMessage (chemin rapide)
    const onMessage = (e: MessageEvent) => {
      if (!e.data) return
      const type = platform === 'facebook' ? 'meta_oauth' : 'instagram_oauth'
      if (e.data.type !== type) return
      window.removeEventListener('message', onMessage)
      if (e.data.success) {
        handleSuccess(e.data.page || e.data.username || platform)
      } else if (e.data.error) {
        toast(`Erreur : ${e.data.error}`, 'error')
        setConnecting(null)
      }
    }
    window.addEventListener('message', onMessage)

    // Poll popup closure + vérifie dans l'API (chemin fiable)
    const timer = setInterval(async () => {
      if (!popup.closed) return
      clearInterval(timer)
      window.removeEventListener('message', onMessage)
      if (done) return
      try {
        const res = await fetch('/api/social/accounts')
        const accounts = await res.json()
        const found = Array.isArray(accounts) && accounts.find((a: { platform: string; platform_username?: string }) => a.platform === platform)
        if (found) {
          handleSuccess(found.platform_username || platform)
        }
      } catch {}
      if (!done) setConnecting(null)
    }, 600)
  }

  function canNext(): boolean {
    if (step === 0) return !!data.account_type && !!data.brand_name && !!data.industry && !!data.description
    if (step === 1) return !!data.target_audience && !!data.audience_age && selectedPillars.length >= 1 && !!data.tone
    if (step === 2) return data.objectives.length >= 1
    return true
  }

  async function handleFinish() {
    setSaving(true)
    try {
      const res = await fetch('/api/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) throw new Error()
      router.push('/dashboard')
    } catch {
      toast('Erreur lors de la sauvegarde', 'error')
      setSaving(false)
    }
  }

  const [theme, setTheme] = useState<'dark' | 'light'>('dark')
  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.setAttribute('data-theme', next)
  }

  const meta = STEP_META[step]
  const progress = ((step + 1) / STEPS.length) * 100

  return (
    <>
      <button onClick={toggleTheme} type="button" style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, width: 40, height: 40, borderRadius: '50%', background: 'var(--card)', border: '1px solid var(--b1)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 4px 12px rgba(123,92,245,0.2)' }}>
        {theme === 'dark'
          ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t1)" strokeWidth="1.8" strokeLinecap="round"><path d="M21.752 15.002A9.72 9.72 0 0 1 18 15.75 9.75 9.75 0 0 1 8.25 6c0-1.33.266-2.597.748-3.752A9.753 9.753 0 0 0 3 12c0 5.385 4.365 9.75 9.75 9.75 4.282 0 7.937-2.764 9.002-6.998Z"/></svg>
          : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--t1)" strokeWidth="1.8" strokeLinecap="round"><path d="M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z"/></svg>
        }
      </button>
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: 'rgba(255,255,255,0.06)', zIndex: 100 }}>
        <div style={{ height: '100%', background: 'linear-gradient(90deg,#7B5CF5,#A855F7)', width: `${progress}%`, transition: 'width 0.6s cubic-bezier(0.4,0,0.2,1)', boxShadow: '0 0 8px rgba(123,92,245,0.6)' }} />
      </div>

      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-start', padding: '3rem 1.5rem 2rem', position: 'relative', overflow: 'hidden' }}>

        <div style={{ position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)', width: '500px', height: '300px', background: 'radial-gradient(ellipse at center,rgba(123,92,245,0.09) 0%,transparent 65%)', pointerEvents: 'none' }} />

        <div style={{ marginBottom: '2.5rem', position: 'relative', zIndex: 1 }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.5rem', fontWeight: 800, background: 'linear-gradient(135deg,#7B5CF5,#A855F7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Social IA</span>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '1.25rem', maxWidth: '460px', position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '.72rem', color: '#7B5CF5', fontWeight: 700, letterSpacing: '.07em', textTransform: 'uppercase', marginBottom: '.6rem' }}>{meta.motivation}</p>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontSize: '1.9rem', fontWeight: 800, color: 'var(--t1)', lineHeight: 1.15, marginBottom: '.5rem' }}>{meta.title}</h1>
          <p style={{ fontSize: '.875rem', color: 'var(--t3)', lineHeight: 1.5 }}>{meta.subtitle}</p>
        </div>

        <div style={{ display: 'flex', gap: '.4rem', marginBottom: '1.75rem', position: 'relative', zIndex: 1 }}>
          {STEPS.map((_, i) => (
            <div key={i} style={{ height: '6px', width: i === step ? '22px' : '6px', borderRadius: '3px', background: i <= step ? '#7B5CF5' : 'rgba(255,255,255,0.12)', transition: 'all 0.35s cubic-bezier(0.4,0,0.2,1)' }} />
          ))}
        </div>

        <div style={{ width: '100%', maxWidth: '500px', background: 'var(--card)', border: '1px solid var(--b1)', borderRadius: '16px', padding: '1.75rem', position: 'relative', zIndex: 1, maxHeight: 'calc(100vh - 300px)', overflowY: 'auto' }}>

          {/* ── Step 0: Compte & Marque ── */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div>
                <p style={labelStyle}>Type de compte *</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
                  {ACCOUNT_TYPES.map(type => {
                    const selected = data.account_type === type.value
                    return (
                      <button key={type.value} type="button" onClick={() => update('account_type', type.value)} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '.9rem 1rem', borderRadius: '10px', textAlign: 'left', border: selected ? '1.5px solid #7B5CF5' : '1px solid var(--b1)', background: selected ? 'rgba(123,92,245,0.08)' : 'var(--s2)', cursor: 'pointer', transition: 'all 0.2s', width: '100%' }}>
                        <div style={{ width: 36, height: 36, borderRadius: 8, flexShrink: 0, background: selected ? 'rgba(123,92,245,0.15)' : 'rgba(255,255,255,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <type.icon size={17} style={{ color: selected ? '#7B5CF5' : 'var(--t3)' }} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '.875rem', fontWeight: 600, color: selected ? '#7B5CF5' : 'var(--t1)', marginBottom: '.15rem' }}>{type.label}</div>
                          <div style={{ fontSize: '.75rem', color: 'var(--t3)' }}>{type.desc}</div>
                        </div>
                        {selected && <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#7B5CF5', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Check size={11} color="#fff" /></div>}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Nom de la marque / votre nom *</label>
                <input style={fieldStyle} placeholder="Ex: Pixel Agency" value={data.brand_name} onChange={e => update('brand_name', e.target.value)} />
              </div>

              <div>
                <label style={labelStyle}>Secteur d&apos;activité *</label>
                <select style={{ ...fieldStyle, cursor: 'pointer' }} value={data.industry} onChange={e => update('industry', e.target.value)}>
                  <option value="">Choisir un secteur...</option>
                  {INDUSTRIES.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Description *</label>
                <textarea style={{ ...fieldStyle, resize: 'none' }} rows={3} placeholder="Ce que vous faites, ce qui vous différencie, votre mission..." value={data.description} onChange={e => update('description', e.target.value)} />
                <p style={{ fontSize: '.72rem', color: 'var(--t3)', marginTop: '.3rem' }}>L&apos;IA utilisera cette description pour contextualiser chaque post</p>
              </div>

              <div>
                <label style={labelStyle}>Site web <span style={{ fontWeight: 400, color: 'var(--t3)' }}>(optionnel)</span></label>
                <input style={fieldStyle} placeholder="https://votre-site.com" value={data.website} onChange={e => update('website', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 1: Audience & Contenu ── */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>

              <div>
                <label style={labelStyle}>Qui sont vos clients / abonnés ? *</label>
                <select style={{ ...fieldStyle, cursor: 'pointer' }} value={data.target_audience} onChange={e => update('target_audience', e.target.value)}>
                  <option value="">Choisir un profil...</option>
                  {TARGET_AUDIENCE_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Tranche d&apos;âge principale *</label>
                <select style={{ ...fieldStyle, cursor: 'pointer' }} value={data.audience_age} onChange={e => update('audience_age', e.target.value)}>
                  <option value="">Choisir une tranche d&apos;âge...</option>
                  {AGE_RANGES.map(age => <option key={age} value={age}>{age}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Centres d&apos;intérêt <span style={{ fontWeight: 400, color: 'var(--t3)' }}>(optionnel)</span></label>
                <select style={{ ...fieldStyle, cursor: 'pointer' }} value={data.audience_interests} onChange={e => update('audience_interests', e.target.value)}>
                  <option value="">Choisir un centre d&apos;intérêt...</option>
                  {INTERESTS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>Portée géographique</label>
                <select style={{ ...fieldStyle, cursor: 'pointer' }} value={data.audience_location} onChange={e => update('audience_location', e.target.value)}>
                  {LOCATIONS.map(loc => <option key={loc.value} value={loc.value}>{loc.label}</option>)}
                </select>
              </div>

              <div>
                <label style={labelStyle}>
                  Vos piliers de contenu * <span style={{ fontWeight: 400, color: 'var(--t3)' }}>({selectedPillars.length}/5 max)</span>
                </label>
                <select style={{ ...fieldStyle, cursor: 'pointer' }} value="" onChange={e => addPillar(e.target.value)}>
                  <option value="">Ajouter un pilier...</option>
                  {CONTENT_PILLARS_OPTIONS.filter(o => !selectedPillars.includes(o)).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {selectedPillars.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem', marginTop: '.5rem' }}>
                    {selectedPillars.map(p => (
                      <span key={p} style={{ display: 'flex', alignItems: 'center', gap: '.3rem', padding: '.3rem .7rem', borderRadius: '20px', background: 'rgba(123,92,245,0.12)', border: '1px solid rgba(123,92,245,0.3)', fontSize: '.8rem', color: '#7B5CF5' }}>
                        {p}
                        <button type="button" onClick={() => removePillar(p)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7B5CF5', padding: 0, lineHeight: 1, fontSize: '.9rem' }}>×</button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label style={labelStyle}>Ton de communication *</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                  {TONES.map(t => {
                    const sel = data.tone === t.value
                    return (
                      <button key={t.value} type="button" onClick={() => update('tone', t.value)} style={{ padding: '.75rem', borderRadius: '10px', textAlign: 'left', border: sel ? '1.5px solid #7B5CF5' : '1px solid var(--b1)', background: sel ? 'rgba(123,92,245,0.08)' : 'var(--s2)', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <div style={{ fontSize: '.825rem', fontWeight: 600, color: sel ? '#7B5CF5' : 'var(--t1)', marginBottom: '.15rem' }}>{t.label}</div>
                        <div style={{ fontSize: '.72rem', color: 'var(--t3)' }}>{t.desc}</div>
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <label style={labelStyle}>Mots / sujets à éviter <span style={{ fontWeight: 400, color: 'var(--t3)' }}>(optionnel)</span></label>
                <input style={fieldStyle} placeholder="Ex: politique, prix des concurrents..." value={data.avoid_words} onChange={e => update('avoid_words', e.target.value)} />
              </div>
            </div>
          )}

          {/* ── Step 2: Objectifs ── */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '.5rem' }}>
                {OBJECTIVES.map(obj => {
                  const selected = data.objectives.includes(obj.value)
                  return (
                    <button key={obj.value} type="button" onClick={() => toggleObjective(obj.value)} style={{ padding: '.9rem', borderRadius: '10px', textAlign: 'left', display: 'flex', alignItems: 'center', gap: '.6rem', border: selected ? '1.5px solid #7B5CF5' : '1px solid var(--b1)', background: selected ? 'rgba(123,92,245,0.08)' : 'var(--s2)', cursor: 'pointer', transition: 'all 0.2s', position: 'relative' }}>
                      <obj.icon size={16} style={{ color: selected ? '#7B5CF5' : 'var(--t3)', flexShrink: 0 }} />
                      <span style={{ fontSize: '.825rem', fontWeight: 600, color: selected ? '#7B5CF5' : 'var(--t1)' }}>{obj.label}</span>
                      {selected && <div style={{ position: 'absolute', top: 6, right: 6, width: 16, height: 16, borderRadius: '50%', background: '#7B5CF5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Check size={9} color="#fff" /></div>}
                    </button>
                  )
                })}
              </div>

              <div>
                <label style={labelStyle}>Fréquence de publication souhaitée</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <input type="range" min={1} max={21} value={data.posts_per_week} onChange={e => update('posts_per_week', parseInt(e.target.value))} style={{ flex: 1, accentColor: '#7B5CF5' }} />
                  <span style={{ fontSize: '.825rem', fontWeight: 700, color: 'var(--t1)', width: '8rem', flexShrink: 0 }}>
                    {data.posts_per_week} post{data.posts_per_week > 1 ? 's' : ''}/semaine
                  </span>
                </div>
              </div>

              <div style={{ background: 'rgba(123,92,245,0.05)', border: '1px solid rgba(123,92,245,0.18)', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', color: '#7B5CF5', fontSize: '.825rem', fontWeight: 600, marginBottom: '.5rem' }}>
                  <Sparkles size={14} /> Votre profil IA est prêt
                </div>
                <p style={{ fontSize: '.78rem', color: 'var(--t3)', lineHeight: 1.6 }}>
                  L&apos;IA connaîtra votre marque, votre audience et vos objectifs. Chaque post généré sera personnalisé pour <strong style={{ color: 'var(--t2)' }}>{data.brand_name || 'votre marque'}</strong>.
                </p>
              </div>
            </div>
          )}

          {/* ── Step 3: Réseaux sociaux ── */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Facebook */}
              {(['facebook', 'instagram'] as const).map(platform => {
                const isFb = platform === 'facebook'
                const connected = !!connectedAccounts[platform]
                const isConnecting = connecting === platform
                const username = connectedAccounts[platform]

                return (
                  <div key={platform} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', borderRadius: '10px', border: connected ? '1px solid rgba(34,197,94,0.3)' : '1px solid var(--b1)', background: connected ? 'rgba(34,197,94,0.04)' : 'var(--s2)', transition: 'all 0.3s' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                        {isFb ? (
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="5" fill="#1877F2"/><path d="M16 8h-2a1 1 0 0 0-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 0 1 4-4h2v3z" fill="white"/></svg>
                        ) : (
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                            <defs><radialGradient id="ig2" cx="30%" cy="107%" r="150%"><stop offset="0%" stopColor="#fdf497"/><stop offset="45%" stopColor="#fd5949"/><stop offset="60%" stopColor="#d6249f"/><stop offset="90%" stopColor="#285AEB"/></radialGradient></defs>
                            <rect x="0" y="0" width="24" height="24" rx="5.5" fill="url(#ig2)"/>
                            <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
                            <circle cx="17.2" cy="6.8" r="1.2" fill="white"/>
                          </svg>
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: '.875rem', fontWeight: 600, color: 'var(--t1)' }}>{isFb ? 'Facebook' : 'Instagram'}</div>
                        <div style={{ fontSize: '.75rem', color: connected ? '#22c55e' : 'var(--t3)' }}>
                          {connected ? `Connecté${username !== platform ? ` — @${username}` : ''} ✓` : isFb ? 'Page professionnelle' : 'Compte professionnel requis'}
                        </div>
                      </div>
                    </div>

                    {!connected && (
                      <button
                        type="button"
                        disabled={isConnecting}
                        onClick={() => connectSocial(platform, isFb ? '/api/auth/meta/start' : '/api/auth/instagram/start')}
                        style={{ fontSize: '.78rem', fontWeight: 600, color: isFb ? '#7B5CF5' : '#E1306C', border: `1px solid ${isFb ? 'rgba(123,92,245,0.3)' : 'rgba(225,48,108,0.3)'}`, background: isFb ? 'rgba(123,92,245,0.08)' : 'rgba(225,48,108,0.08)', padding: '.4rem .8rem', borderRadius: '7px', cursor: isConnecting ? 'not-allowed' : 'pointer', opacity: isConnecting ? 0.6 : 1, minWidth: 90, textAlign: 'center' }}
                      >
                        {isConnecting ? '...' : 'Connecter'}
                      </button>
                    )}
                  </div>
                )
              })}

              <p style={{ fontSize: '.75rem', color: 'var(--t3)', textAlign: 'center', marginTop: '.25rem' }}>
                Vous pouvez connecter d&apos;autres réseaux depuis votre profil à tout moment.
              </p>
            </div>
          )}

          {/* ── Navigation ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--b1)' }}>
            <button type="button" onClick={() => setStep(s => s - 1)} disabled={step === 0} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.85rem', color: step === 0 ? 'var(--t3)' : 'var(--t2)', background: 'none', border: 'none', cursor: step === 0 ? 'not-allowed' : 'pointer', padding: 0 }}>
              <ChevronLeft size={16} /> Précédent
            </button>

            {step < STEPS.length - 1 ? (
              <button type="button" onClick={() => setStep(s => s + 1)} disabled={!canNext()} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: canNext() ? 'var(--blue)' : 'rgba(255,255,255,0.06)', color: canNext() ? '#fff' : 'var(--t3)', border: 'none', borderRadius: '8px', padding: '.55rem 1.2rem', fontSize: '.875rem', fontWeight: 600, cursor: canNext() ? 'pointer' : 'not-allowed', transition: 'all 0.2s' }}>
                Continuer <ChevronRight size={16} />
              </button>
            ) : (
              <button type="button" onClick={handleFinish} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: '.4rem', background: saving ? 'rgba(255,255,255,0.06)' : 'var(--blue)', color: saving ? 'var(--t3)' : '#fff', border: 'none', borderRadius: '8px', padding: '.55rem 1.2rem', fontSize: '.875rem', fontWeight: 600, cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s' }}>
                {saving ? 'Finalisation...' : <><Check size={15} style={{ marginRight: '.2rem' }} /> Accéder au dashboard</>}
              </button>
            )}
          </div>
        </div>

        <p style={{ marginTop: '1rem', fontSize: '.72rem', color: 'var(--t3)', position: 'relative', zIndex: 1 }}>
          Étape {step + 1} sur {STEPS.length} — {STEPS[step]}
        </p>
      </div>
    </>
  )
}
