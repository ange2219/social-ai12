'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import {
  MessageSquare, ChevronRight, ChevronLeft, Check, Sparkles,
  User, Building2, Briefcase,
  Megaphone, DollarSign, Users, Globe, Target, Trophy
} from 'lucide-react'
import { cn } from '@/lib/utils'

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
  content_pillars: ['', '', ''],
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

export default function OnboardingPage() {
  const [step, setStep] = useState(0)
  const [data, setData] = useState<OnboardingData>(INITIAL)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

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

  function updatePillar(index: number, value: string) {
    const pillars = [...data.content_pillars]
    pillars[index] = value
    update('content_pillars', pillars)
  }

  const [connectedAccounts, setConnectedAccounts] = useState<string[]>([])

  function canNext(): boolean {
    if (step === 0) return !!data.account_type && !!data.brand_name && !!data.industry && !!data.description
    if (step === 1) return !!data.target_audience && !!data.audience_age && data.content_pillars.filter(Boolean).length >= 1 && !!data.tone
    if (step === 2) return data.objectives.length >= 1
    return true // étape réseaux : optionnelle, toujours "Terminer"
  }

  // Écouter les callbacks OAuth depuis les popups
  useEffect(() => {
    function handleMessage(e: MessageEvent) {
      if (!e.data) return
      if (e.data.type === 'meta_oauth' && e.data.success) {
        setConnectedAccounts(prev => [...new Set([...prev, 'facebook'])])
        toast(`Facebook connecté !`, 'success')
      }
      if (e.data.type === 'instagram_oauth' && e.data.success) {
        setConnectedAccounts(prev => [...new Set([...prev, 'instagram'])])
        toast(`Instagram connecté !`, 'success')
      }
    }
    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [toast])

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

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-2.5 mb-10">
        <div className="w-9 h-9 rounded-xl bg-accent flex items-center justify-center">
          <MessageSquare size={18} className="text-white" />
        </div>
        <span className="font-display font-bold text-xl text-t1">
          Social <span className="text-accent">IA</span>
        </span>
      </div>

      {/* Progress */}
      <div className="w-full max-w-lg mb-8">
        <div className="flex items-center justify-between mb-3">
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={cn(
                'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all',
                i < step ? 'bg-accent text-white' :
                i === step ? 'bg-accent text-white ring-4 ring-accent/20' :
                'bg-s2 text-t3'
              )}>
                {i < step ? <Check size={13} /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className={cn('h-px w-24 transition-all', i < step ? 'bg-accent' : 'bg-s3')} />
              )}
            </div>
          ))}
        </div>
        <p className="text-t3 text-xs text-center">Étape {step + 1} sur {STEPS.length} — {STEPS[step]}</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-lg card p-8">

        {/* ── Étape 1 : Compte + Profil de marque ── */}
        {step === 0 && (
          <div className="animate-fadeUp space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-t1 mb-1">Bienvenue sur Social IA</h2>
              <p className="text-t3 text-sm mb-2">Quelques infos pour personnaliser votre expérience</p>
            </div>

            {/* Type de compte */}
            <div>
              <label className="label">Type de compte *</label>
              <div className="space-y-2">
                {ACCOUNT_TYPES.map(type => (
                  <button
                    key={type.value}
                    onClick={() => update('account_type', type.value)}
                    className={cn(
                      'w-full flex items-center gap-4 p-3.5 rounded-xl border transition-all text-left',
                      data.account_type === type.value
                        ? 'border-accent bg-accent/10'
                        : 'border-b1 hover:border-b2 bg-s2'
                    )}
                  >
                    <type.icon size={18} className={data.account_type === type.value ? 'text-accent' : 'text-t3'} />
                    <div>
                      <div className={cn('font-medium text-sm', data.account_type === type.value ? 'text-accent' : 'text-t1')}>
                        {type.label}
                      </div>
                      <div className="text-t3 text-xs mt-0.5">{type.desc}</div>
                    </div>
                    {data.account_type === type.value && (
                      <div className="ml-auto w-5 h-5 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <Check size={11} className="text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Profil de marque */}
            <div>
              <label className="label">Nom de la marque / votre nom *</label>
              <input className="input" placeholder="Ex: Pixel Agency" value={data.brand_name} onChange={e => update('brand_name', e.target.value)} />
            </div>
            <div>
              <label className="label">Secteur d'activité *</label>
              <select className="input" value={data.industry} onChange={e => update('industry', e.target.value)}>
                <option value="">Choisir un secteur</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Description *</label>
              <textarea
                className="input resize-none"
                rows={3}
                placeholder="Ce que vous faites, ce qui vous différencie, votre mission..."
                value={data.description}
                onChange={e => update('description', e.target.value)}
              />
              <p className="text-t3 text-xs mt-1">L'IA utilisera cette description pour contextualiser chaque post</p>
            </div>
            <div>
              <label className="label">Site web <span className="text-t3">(optionnel)</span></label>
              <input className="input" placeholder="https://votre-site.com" value={data.website} onChange={e => update('website', e.target.value)} />
            </div>
          </div>
        )}

        {/* ── Étape 2 : Audience + Ligne éditoriale ── */}
        {step === 1 && (
          <div className="animate-fadeUp space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-t1 mb-1">Audience & Contenu</h2>
              <p className="text-t3 text-sm">L'IA adaptera le ton et les sujets à votre audience</p>
            </div>

            {/* Audience */}
            <div>
              <label className="label">Qui sont vos clients / abonnés ? *</label>
              <input
                className="input"
                placeholder="Ex: Entrepreneurs de 25-40 ans cherchant à développer leur business"
                value={data.target_audience}
                onChange={e => update('target_audience', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Tranche d'âge principale *</label>
              <div className="flex flex-wrap gap-2">
                {AGE_RANGES.map(age => (
                  <button
                    key={age}
                    onClick={() => update('audience_age', age)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-sm border transition-colors',
                      data.audience_age === age ? 'border-accent bg-accent/10 text-accent' : 'border-b1 text-t2 hover:border-b2'
                    )}
                  >
                    {age}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Centres d'intérêt <span className="text-t3">(optionnel)</span></label>
              <input
                className="input"
                placeholder="Ex: business, productivité, tech, développement personnel"
                value={data.audience_interests}
                onChange={e => update('audience_interests', e.target.value)}
              />
            </div>
            <div>
              <label className="label">Portée géographique</label>
              <div className="flex gap-2">
                {LOCATIONS.map(loc => (
                  <button
                    key={loc.value}
                    onClick={() => update('audience_location', loc.value)}
                    className={cn(
                      'flex-1 py-2 rounded-lg text-sm border transition-colors',
                      data.audience_location === loc.value ? 'border-accent bg-accent/10 text-accent' : 'border-b1 text-t2 hover:border-b2'
                    )}
                  >
                    {loc.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ligne éditoriale */}
            <div className="pt-1 border-t border-b1">
              <label className="label mt-1">Vos piliers de contenu * <span className="text-t3 font-normal">(au moins 1)</span></label>
              <p className="text-t3 text-xs mb-2">Les grands thèmes sur lesquels vous communiquez</p>
              <div className="space-y-2">
                {[0, 1, 2].map(i => (
                  <input
                    key={i}
                    className="input"
                    placeholder={['Ex: Conseils et tutoriels', 'Ex: Coulisses de l\'entreprise', 'Ex: Promotions et offres'][i]}
                    value={data.content_pillars[i]}
                    onChange={e => updatePillar(i, e.target.value)}
                  />
                ))}
              </div>
            </div>
            <div>
              <label className="label">Ton de communication *</label>
              <div className="grid grid-cols-2 gap-2">
                {TONES.map(t => (
                  <button
                    key={t.value}
                    onClick={() => update('tone', t.value)}
                    className={cn(
                      'p-3 rounded-xl border text-left transition-all',
                      data.tone === t.value ? 'border-accent bg-accent/10' : 'border-b1 bg-s2 hover:border-b2'
                    )}
                  >
                    <div className={cn('text-sm font-medium', data.tone === t.value ? 'text-accent' : 'text-t1')}>{t.label}</div>
                    <div className="text-t3 text-xs mt-0.5">{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Mots / sujets à éviter <span className="text-t3">(optionnel)</span></label>
              <input
                className="input"
                placeholder="Ex: politique, prix des concurrents, promotions agressives"
                value={data.avoid_words}
                onChange={e => update('avoid_words', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* ── Étape 3 : Objectifs ── */}
        {step === 2 && (
          <div className="animate-fadeUp space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-t1 mb-1">Vos objectifs</h2>
              <p className="text-t3 text-sm mb-2">Pourquoi publiez-vous sur les réseaux ? <span className="text-t3">(plusieurs choix)</span></p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {OBJECTIVES.map(obj => {
                const selected = data.objectives.includes(obj.value)
                return (
                  <button
                    key={obj.value}
                    onClick={() => toggleObjective(obj.value)}
                    className={cn(
                      'p-3 rounded-xl border text-left flex items-center gap-3 transition-all',
                      selected ? 'border-accent bg-accent/10' : 'border-b1 bg-s2 hover:border-b2'
                    )}
                  >
                    <obj.icon size={17} className={selected ? 'text-accent' : 'text-t3'} />
                    <span className={cn('text-sm font-medium', selected ? 'text-accent' : 'text-t1')}>{obj.label}</span>
                    {selected && (
                      <div className="ml-auto w-4 h-4 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <Check size={10} className="text-white" />
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
            <div>
              <label className="label">Fréquence de publication souhaitée</label>
              <div className="flex items-center gap-4">
                <input
                  type="range" min={1} max={21}
                  value={data.posts_per_week}
                  onChange={e => update('posts_per_week', parseInt(e.target.value))}
                  className="flex-1 accent-accent"
                />
                <span className="text-t1 font-bold w-24 text-sm">
                  {data.posts_per_week} post{data.posts_per_week > 1 ? 's' : ''}/semaine
                </span>
              </div>
            </div>

            <div className="bg-accent/5 border border-accent/20 rounded-xl p-4">
              <div className="flex items-center gap-2 text-accent text-sm font-medium mb-2">
                <Sparkles size={14} /> Votre profil IA est prêt
              </div>
              <p className="text-t3 text-xs leading-relaxed">
                L'IA connaîtra votre marque, votre audience et vos objectifs. Chaque post généré sera personnalisé pour <strong className="text-t2">{data.brand_name}</strong>.
              </p>
            </div>
          </div>
        )}

        {/* ── Étape 4 : Connecter les réseaux sociaux ── */}
        {step === 3 && (
          <div className="animate-fadeUp space-y-5">
            <div>
              <h2 className="font-display text-2xl font-bold text-t1 mb-1">Connectez vos réseaux</h2>
              <p className="text-t3 text-sm">Social IA publiera directement sur vos comptes. Vous pouvez aussi le faire plus tard.</p>
            </div>

            {/* Facebook */}
            <div className={cn(
              'flex items-center justify-between p-4 rounded-xl border transition-all',
              connectedAccounts.includes('facebook') ? 'border-green-500/40 bg-green-500/5' : 'border-b1 bg-s2'
            )}>
              <div className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <rect width="24" height="24" rx="5" fill="#1877F2"/>
                    <path d="M16 8h-2a1 1 0 0 0-1 1v2h3l-.5 3H13v7h-3v-7H8v-3h2V9a4 4 0 0 1 4-4h2v3z" fill="white"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-t1">Facebook</div>
                  <div className="text-xs text-t3">{connectedAccounts.includes('facebook') ? 'Connecté ✓' : 'Page professionnelle'}</div>
                </div>
              </div>
              {!connectedAccounts.includes('facebook') && (
                <button
                  onClick={() => window.open('/api/auth/meta/start', 'meta_oauth', 'width=600,height=700')}
                  className="text-xs font-medium text-accent border border-accent/30 bg-accent/10 px-3 py-1.5 rounded-lg hover:bg-accent/20 transition-colors"
                >
                  Connecter
                </button>
              )}
            </div>

            {/* Instagram */}
            <div className={cn(
              'flex items-center justify-between p-4 rounded-xl border transition-all',
              connectedAccounts.includes('instagram') ? 'border-green-500/40 bg-green-500/5' : 'border-b1 bg-s2'
            )}>
              <div className="flex items-center gap-3">
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <svg width="36" height="36" viewBox="0 0 24 24" fill="none">
                    <defs>
                      <radialGradient id="ig-ob" cx="30%" cy="107%" r="150%">
                        <stop offset="0%" stopColor="#fdf497"/>
                        <stop offset="45%" stopColor="#fd5949"/>
                        <stop offset="60%" stopColor="#d6249f"/>
                        <stop offset="90%" stopColor="#285AEB"/>
                      </radialGradient>
                    </defs>
                    <rect x="0" y="0" width="24" height="24" rx="5.5" fill="url(#ig-ob)"/>
                    <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.8" fill="none"/>
                    <circle cx="17.2" cy="6.8" r="1.2" fill="white"/>
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-medium text-t1">Instagram</div>
                  <div className="text-xs text-t3">{connectedAccounts.includes('instagram') ? 'Connecté ✓' : 'Compte professionnel requis'}</div>
                </div>
              </div>
              {!connectedAccounts.includes('instagram') && (
                <button
                  onClick={() => window.open('/api/auth/instagram/start', 'instagram_oauth', 'width=600,height=700')}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors"
                  style={{ color: '#E1306C', borderColor: 'rgba(225,48,108,.3)', background: 'rgba(225,48,108,.08)' }}
                >
                  Connecter
                </button>
              )}
            </div>

            <p className="text-t3 text-xs text-center">
              Vous pouvez connecter d'autres réseaux depuis votre profil à tout moment.
            </p>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-b1">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className={cn('flex items-center gap-2 text-sm transition-colors',
              step === 0 ? 'text-t3 cursor-not-allowed' : 'text-t2 hover:text-t1'
            )}
          >
            <ChevronLeft size={16} /> Précédent
          </button>

          {step < STEPS.length - 1 ? (
            <button
              onClick={() => setStep(s => s + 1)}
              disabled={!canNext()}
              className={cn('btn-primary flex items-center gap-2', !canNext() && 'opacity-40 cursor-not-allowed')}
            >
              Continuer <ChevronRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              disabled={saving}
              className={cn('btn-primary flex items-center gap-2', saving && 'opacity-40 cursor-not-allowed')}
            >
              {saving ? 'Finalisation...' : <><Check size={15} /> Accéder au dashboard</>}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
