'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid3X3, List, Instagram, Facebook } from 'lucide-react'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C',
  facebook: '#1877F2',
  tiktok: '#000',
  twitter: '#1DA1F2',
  linkedin: '#0077B5',
  youtube: '#FF0000',
  pinterest: '#E60023',
}

const PLATFORM_SHORT: Record<string, string> = {
  instagram: 'IG', facebook: 'FB', tiktok: 'TK', twitter: 'X', linkedin: 'LI', youtube: 'YT', pinterest: 'PT',
}

function stClass(status: string) {
  return status === 'draft' ? 'st st-p'
    : status === 'scheduled' ? 'st st-pub'
    : status === 'published' ? 'st st-a'
    : 'st st-r'
}
function stLabel(status: string) {
  return status === 'draft' ? 'Brouillon'
    : status === 'scheduled' ? 'Programmé'
    : status === 'published' ? 'Publié'
    : 'Rejeté'
}

interface Post {
  id: string
  content: string
  platforms: string[]
  status: string
  media_urls: string[]
  created_at: string
  scheduled_at: string | null
}

export default function PostsPage() {
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'scheduled' | 'failed'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    fetch('/api/posts?limit=100')
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter)

  return (
    <div style={{ padding: '1.5rem 2rem 3rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#F4F4F6', letterSpacing: '-.02em' }}>
            Mes Posts
          </h1>
          <p style={{ color: '#52525C', fontSize: '.8rem', marginTop: '.15rem' }}>{total} post{total !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => router.push('/create')}
          className="btn-primary flex items-center gap-2"
          style={{ padding: '.55rem 1.1rem', fontSize: '.82rem' }}
        >
          <Plus size={15} /> Créer un post
        </button>
      </div>

      {/* Filters + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '.4rem' }}>
          {(['all', 'published', 'draft', 'scheduled', 'failed'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '.3rem .75rem',
                borderRadius: '6px',
                fontSize: '.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                border: filter === f ? '1px solid #3B7BF6' : '1px solid #27272D',
                background: filter === f ? 'rgba(59,123,246,.12)' : '#111113',
                color: filter === f ? '#3B7BF6' : '#8E8E98',
                transition: '.15s',
              }}
            >
              {f === 'all' ? 'Tous' : f === 'published' ? 'Publiés' : f === 'draft' ? 'Brouillons' : f === 'scheduled' ? 'Programmés' : 'Rejetés'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.3rem' }}>
          {(['grid', 'list'] as const).map(v => (
            <button
              key={v}
              onClick={() => setView(v)}
              style={{
                padding: '.3rem .5rem',
                borderRadius: '6px',
                border: view === v ? '1px solid #3B7BF6' : '1px solid #27272D',
                background: view === v ? 'rgba(59,123,246,.12)' : '#111113',
                color: view === v ? '#3B7BF6' : '#52525C',
                cursor: 'pointer',
                display: 'flex', alignItems: 'center',
              }}
            >
              {v === 'grid' ? <Grid3X3 size={14} /> : <List size={14} />}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#52525C', fontSize: '.85rem' }}>Chargement...</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '4rem', background: '#111113', border: '1px solid #27272D', borderRadius: '10px' }}>
          <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>✨</div>
          <div style={{ color: '#F4F4F6', fontWeight: 600, marginBottom: '.4rem', fontSize: '.9rem' }}>Aucun post</div>
          <div style={{ color: '#52525C', fontSize: '.8rem', marginBottom: '1.25rem' }}>Créez votre premier post en quelques secondes</div>
          <button onClick={() => router.push('/create')} className="btn-primary flex items-center gap-2" style={{ margin: '0 auto', padding: '.5rem 1rem', fontSize: '.8rem' }}>
            <Plus size={14} /> Créer un post
          </button>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '.6rem' }}>
          {filtered.map(post => (
            <div key={post.id} style={{
              background: '#111113',
              border: '1px solid #27272D',
              borderRadius: '10px',
              overflow: 'hidden',
              cursor: 'pointer',
              transition: '.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B7BF6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272D')}
            >
              {/* Thumbnail */}
              <div style={{ aspectRatio: '1', background: '#18181C', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {post.media_urls?.[0] ? (
                  <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <span style={{ fontSize: '1.8rem', opacity: .4 }}>📝</span>
                )}
                {/* Platform badges */}
                <div style={{ position: 'absolute', top: '5px', right: '5px', display: 'flex', gap: '3px' }}>
                  {post.platforms.slice(0, 3).map(p => (
                    <span key={p} style={{
                      width: '18px', height: '18px', borderRadius: '4px',
                      background: PLATFORM_COLORS[p] || '#333',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.5rem', fontWeight: 700, color: '#fff',
                    }}>{PLATFORM_SHORT[p] || 'X'}</span>
                  ))}
                </div>
              </div>
              {/* Caption + status */}
              <div style={{ padding: '.55rem .6rem' }}>
                <div style={{ fontSize: '.72rem', color: '#8E8E98', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '.45rem' }}>
                  {post.content}
                </div>
                <span className={stClass(post.status)} style={{ fontSize: '.62rem' }}>{stLabel(post.status)}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List view */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {filtered.map(post => (
            <div key={post.id} style={{
              background: '#111113',
              border: '1px solid #27272D',
              borderRadius: '8px',
              padding: '.75rem 1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              cursor: 'pointer',
              transition: '.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B7BF6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272D')}
            >
              {/* Thumb */}
              <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: '#18181C', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {post.media_urls?.[0]
                  ? <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '1.2rem', opacity: .4 }}>📝</span>
                }
              </div>
              {/* Content */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.8rem', color: '#E4E4E7', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.content}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.3rem' }}>
                  {post.platforms.map(p => (
                    <span key={p} style={{
                      width: '16px', height: '16px', borderRadius: '3px',
                      background: PLATFORM_COLORS[p] || '#333',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '.45rem', fontWeight: 700, color: '#fff',
                    }}>{PLATFORM_SHORT[p] || 'X'}</span>
                  ))}
                  <span style={{ fontSize: '.7rem', color: '#3f3f46' }}>
                    {new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
              <span className={stClass(post.status)} style={{ fontSize: '.68rem', flexShrink: 0 }}>{stLabel(post.status)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
