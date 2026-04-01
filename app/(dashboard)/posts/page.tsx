'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid3X3, List, Send, Trash2, RotateCcw } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C', facebook: '#1877F2', tiktok: '#000',
  twitter: '#1DA1F2', linkedin: '#0077B5', youtube: '#FF0000', pinterest: '#E60023',
}
const PLATFORM_SHORT: Record<string, string> = {
  instagram: 'IG', facebook: 'FB', tiktok: 'TK', twitter: 'X', linkedin: 'LI', youtube: 'YT', pinterest: 'PT',
}

function stClass(s: string) {
  return s === 'draft' ? 'st st-p' : s === 'scheduled' ? 'st st-pub' : s === 'published' ? 'st st-a' : 'st st-r'
}
function stLabel(s: string) {
  return s === 'draft' ? 'Brouillon' : s === 'scheduled' ? 'Programmé' : s === 'published' ? 'Publié' : 'Rejeté'
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
  const { toast } = useToast()
  const [posts, setPosts] = useState<Post[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'scheduled' | 'failed'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [publishing, setPublishing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  function loadPosts() {
    setLoading(true)
    fetch('/api/posts?limit=100')
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadPosts() }, [])

  async function publishPost(post: Post) {
    setPublishing(post.id)
    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast('Post publié !', 'success')
      loadPosts()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur de publication', 'error')
    } finally {
      setPublishing(null)
    }
  }

  async function deletePost(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      toast('Post supprimé', 'success')
      setPosts(prev => prev.filter(p => p.id !== id))
      setTotal(prev => prev - 1)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter)

  return (
    <div style={{ padding: '1.5rem 2rem 3rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#F4F4F6', letterSpacing: '-.02em' }}>Mes Posts</h1>
          <p style={{ color: '#52525C', fontSize: '.8rem', marginTop: '.15rem' }}>{total} post{total !== 1 ? 's' : ''} au total</p>
        </div>
        <button onClick={() => router.push('/create')} className="btn-primary flex items-center gap-2" style={{ padding: '.55rem 1.1rem', fontSize: '.82rem' }}>
          <Plus size={15} /> Créer un post
        </button>
      </div>

      {/* Filters + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {(['all', 'published', 'draft', 'scheduled', 'failed'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '.3rem .75rem', borderRadius: '6px', fontSize: '.75rem', fontWeight: 500, cursor: 'pointer',
              border: filter === f ? '1px solid #3B7BF6' : '1px solid #27272D',
              background: filter === f ? 'rgba(59,123,246,.12)' : '#111113',
              color: filter === f ? '#3B7BF6' : '#8E8E98', transition: '.15s',
            }}>
              {f === 'all' ? 'Tous' : f === 'published' ? 'Publiés' : f === 'draft' ? 'Brouillons' : f === 'scheduled' ? 'Programmés' : 'Rejetés'}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.3rem' }}>
          {(['grid', 'list'] as const).map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              padding: '.3rem .5rem', borderRadius: '6px',
              border: view === v ? '1px solid #3B7BF6' : '1px solid #27272D',
              background: view === v ? 'rgba(59,123,246,.12)' : '#111113',
              color: view === v ? '#3B7BF6' : '#52525C', cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}>
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
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '.6rem' }}>
          {filtered.map(post => (
            <div key={post.id} style={{ background: '#111113', border: '1px solid #27272D', borderRadius: '10px', overflow: 'hidden', transition: '.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#303038')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272D')}
            >
              {/* Thumbnail */}
              <div style={{ aspectRatio: '1', background: '#18181C', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {post.media_urls?.[0]
                  ? <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <span style={{ fontSize: '1.8rem', opacity: .4 }}>📝</span>
                }
                <div style={{ position: 'absolute', top: '5px', right: '5px', display: 'flex', gap: '3px' }}>
                  {post.platforms.slice(0, 3).map(p => (
                    <span key={p} style={{
                      width: '18px', height: '18px', borderRadius: '4px', background: PLATFORM_COLORS[p] || '#333',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.5rem', fontWeight: 700, color: '#fff',
                    }}>{PLATFORM_SHORT[p] || '?'}</span>
                  ))}
                </div>
              </div>
              {/* Caption */}
              <div style={{ padding: '.55rem .6rem' }}>
                <div style={{ fontSize: '.72rem', color: '#8E8E98', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '.45rem' }}>
                  {post.content}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={stClass(post.status)} style={{ fontSize: '.62rem' }}>{stLabel(post.status)}</span>
                  {(post.status === 'draft' || post.status === 'failed') && (
                    <div style={{ display: 'flex', gap: '.25rem' }}>
                      <button
                        onClick={() => publishPost(post)}
                        disabled={publishing === post.id}
                        title="Publier"
                        style={{ background: 'rgba(59,123,246,.15)', border: '1px solid rgba(59,123,246,.3)', borderRadius: '5px', padding: '.2rem .35rem', cursor: 'pointer', color: '#3B7BF6', display: 'flex', alignItems: 'center' }}
                      >
                        {publishing === post.id
                          ? <div style={{ width: '10px', height: '10px', border: '1.5px solid rgba(59,123,246,.3)', borderTopColor: '#3B7BF6', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                          : <Send size={10} />
                        }
                      </button>
                      <button
                        onClick={() => deletePost(post.id)}
                        disabled={deleting === post.id}
                        title="Supprimer"
                        style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '5px', padding: '.2rem .35rem', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {filtered.map(post => (
            <div key={post.id} style={{
              background: '#111113', border: '1px solid #27272D', borderRadius: '8px',
              padding: '.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: '.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#303038')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272D')}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: '#18181C', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {post.media_urls?.[0]
                  ? <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '1.2rem', opacity: .4 }}>📝</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.8rem', color: '#E4E4E7', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {post.content}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.3rem' }}>
                  {post.platforms.map(p => (
                    <span key={p} style={{
                      width: '16px', height: '16px', borderRadius: '3px', background: PLATFORM_COLORS[p] || '#333',
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.45rem', fontWeight: 700, color: '#fff',
                    }}>{PLATFORM_SHORT[p] || '?'}</span>
                  ))}
                  <span style={{ fontSize: '.7rem', color: '#3f3f46' }}>
                    {new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }}>
                <span className={stClass(post.status)} style={{ fontSize: '.68rem' }}>{stLabel(post.status)}</span>
                {(post.status === 'draft' || post.status === 'failed') && (
                  <>
                    <button
                      onClick={() => publishPost(post)}
                      disabled={publishing === post.id}
                      style={{ background: 'rgba(59,123,246,.15)', border: '1px solid rgba(59,123,246,.3)', borderRadius: '6px', padding: '.3rem .6rem', cursor: 'pointer', color: '#3B7BF6', display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem', fontWeight: 500 }}
                    >
                      {publishing === post.id
                        ? <div style={{ width: '11px', height: '11px', border: '1.5px solid rgba(59,123,246,.3)', borderTopColor: '#3B7BF6', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                        : <Send size={11} />
                      }
                      Publier
                    </button>
                    <button
                      onClick={() => deletePost(post.id)}
                      disabled={deleting === post.id}
                      style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '6px', padding: '.3rem .5rem', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
