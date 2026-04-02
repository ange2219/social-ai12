'use client'

import { useState } from 'react'
import { IconInstagram, IconFacebook } from '@/components/icons/BrandIcons'
import { RefreshCw } from 'lucide-react'

interface Baseline {
  platform: string
  baseline_followers: number
  current_followers: number
  posts_count: number
  baseline_at: string
  refreshed_at: string
}

function PlatformIcon({ platform }: { platform: string }) {
  if (platform === 'instagram') return <IconInstagram size={16} />
  if (platform === 'facebook') return <IconFacebook size={16} />
  return null
}

function Delta({ base, current }: { base: number; current: number }) {
  const diff = current - base
  if (diff === 0) return <span style={{ fontSize: '.68rem', color: '#52525C' }}>±0</span>
  const sign = diff > 0 ? '+' : ''
  const color = diff > 0 ? '#22C55E' : '#EF4444'
  return <span style={{ fontSize: '.68rem', color, fontWeight: 600 }}>{sign}{diff.toLocaleString('fr-FR')}</span>
}

export function ProgressionWidget({ initialBaselines }: { initialBaselines: Baseline[] }) {
  const [baselines, setBaselines] = useState<Baseline[]>(initialBaselines)
  const [refreshing, setRefreshing] = useState<string | null>(null)

  async function refresh(platform: string) {
    setRefreshing(platform)
    try {
      const res = await fetch('/api/social/baseline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, mode: 'refresh' }),
      })
      if (!res.ok) return
      const d = await res.json()
      setBaselines(prev => prev.map(b =>
        b.platform === platform
          ? { ...b, current_followers: d.followers, refreshed_at: new Date().toISOString() }
          : b
      ))
    } finally {
      setRefreshing(null)
    }
  }

  if (baselines.length === 0) {
    return (
      <div style={{ background: '#111113', border: '1px solid #27272D', borderRadius: '12px', padding: '1.1rem 1.25rem' }}>
        <div style={{ fontSize: '.8rem', fontWeight: 600, color: '#F4F4F6', marginBottom: '.3rem' }}>Progression abonnés</div>
        <div style={{ fontSize: '.75rem', color: '#3f3f46' }}>Connectez vos réseaux pour suivre votre croissance.</div>
      </div>
    )
  }

  return (
    <div style={{ background: '#111113', border: '1px solid #27272D', borderRadius: '12px', padding: '1.1rem 1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.85rem' }}>
        <span style={{ fontSize: '.8rem', fontWeight: 600, color: '#F4F4F6' }}>Progression abonnés</span>
        <span style={{ fontSize: '.65rem', color: '#3f3f46' }}>depuis la connexion</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.6rem' }}>
        {baselines.map(b => (
          <div key={b.platform} style={{ display: 'flex', alignItems: 'center', gap: '.6rem' }}>
            <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#18181C', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <PlatformIcon platform={b.platform} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '.35rem' }}>
                <span style={{ fontSize: '.9rem', fontWeight: 700, color: '#F4F4F6', lineHeight: 1 }}>
                  {b.current_followers.toLocaleString('fr-FR')}
                </span>
                <Delta base={b.baseline_followers} current={b.current_followers} />
              </div>
              <div style={{ fontSize: '.62rem', color: '#3f3f46', marginTop: '.1rem' }}>abonnés</div>
            </div>
            <button
              onClick={() => refresh(b.platform)}
              disabled={refreshing === b.platform}
              title="Rafraîchir"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3f3f46', padding: '4px', display: 'flex', alignItems: 'center', transition: 'color .15s' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#8E8E98')}
              onMouseLeave={e => (e.currentTarget.style.color = '#3f3f46')}
            >
              <RefreshCw size={12} style={{ animation: refreshing === b.platform ? 'rot .7s linear infinite' : 'none' }} />
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
