'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid3X3, List, Send, Trash2, Eye, EyeOff, X, Save, Pencil } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const DELETE_COOLDOWN_MS = 5 * 60 * 1000

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C', facebook: '#1877F2', tiktok: '#000',
  twitter: '#1DA1F2', linkedin: '#0077B5', youtube: '#FF0000', pinterest: '#E60023',
}
const PLATFORM_SHORT: Record<string, string> = {
  instagram: 'IG', facebook: 'FB', tiktok: 'TK', twitter: 'X', linkedin: 'LI', youtube: 'YT', pinterest: 'PT',
}
const ALL_PLATFORMS = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin', 'youtube', 'pinterest']

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
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const lastDeletedAt = useRef<number | null>(null)

  // Modal visualisation/édition
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editPlatforms, setEditPlatforms] = useState<string[]>([])
  const [saving, setSaving] = useState(false)

  function loadPosts() {
    setLoading(true)
    fetch('/api/posts?limit=100')
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }

  useEffect(() => { loadPosts() }, [])

  function openPost(post: Post) {
    setSelectedPost(post)
    setEditContent(post.content)
    setEditPlatforms([...post.platforms])
  }

  function closePost() {
    setSelectedPost(null)
    setEditContent('')
    setEditPlatforms([])
  }

  async function saveEdit() {
    if (!selectedPost) return
    setSaving(true)
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, platforms: editPlatforms }),
      })
      if (!res.ok) throw new Error('Erreur de sauvegarde')
      toast('Brouillon mis à jour', 'success')
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, content: editContent, platforms: editPlatforms } : p))
      setSelectedPost(prev => prev ? { ...prev, content: editContent, platforms: editPlatforms } : null)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function publishPost(post: Post, closeModal = false) {
    if (post.platforms.includes('instagram') && (!post.media_urls || post.media_urls.length === 0)) {
      toast('Instagram nécessite une image. Modifiez ce post pour ajouter une photo avant de publier sur Instagram.', 'error')
      return
    }
    setPublishing(post.id)
    try {
      const res = await fetch(`/api/posts/${post.id}/publish`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast('Post publié !', 'success')
      if (closeModal) closePost()
      loadPosts()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur de publication', 'error')
    } finally {
      setPublishing(null)
    }
  }

  function askDelete(id: string) {
    if (lastDeletedAt.current && Date.now() - lastDeletedAt.current < DELETE_COOLDOWN_MS) {
      doDelete(id)
    } else {
      setConfirmId(id)
      setPassword('')
    }
  }

  async function confirmDelete() {
    if (!confirmId) return
    setPwLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('Non connecté')
      const { error } = await supabase.auth.signInWithPassword({ email: user.email, password })
      if (error) throw new Error('Mot de passe incorrect')
      await doDelete(confirmId)
      setConfirmId(null)
      setPassword('')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setPwLoading(false)
    }
  }

  async function doDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Erreur suppression')
      toast('Post supprimé', 'success')
      lastDeletedAt.current = Date.now()
      setPosts(prev => prev.filter(p => p.id !== id))
      setTotal(prev => prev - 1)
      if (selectedPost?.id === id) closePost()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = filter === 'all' ? posts : posts.filter(p => p.status === filter)
  const isDraft = selectedPost?.status === 'draft' || selectedPost?.status === 'failed'

  return (
    <div style={{ padding: '1.5rem 2rem 3rem' }}>

      {/* ── Modal visualisation / édition ── */}
      {selectedPost && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}
          onClick={e => { if (e.target === e.currentTarget) closePost() }}
        >
          <div style={{ background: '#111113', border: '1px solid #27272D', borderRadius: '16px', width: '100%', maxWidth: '560px', maxHeight: '90vh', overflow: 'auto' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1.25rem 1.5rem', borderBottom: '1px solid #1C1C21' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem' }}>
                <span className={stClass(selectedPost.status)} style={{ fontSize: '.72rem' }}>{stLabel(selectedPost.status)}</span>
                {isDraft && (
                  <span style={{ fontSize: '.72rem', color: '#52525C', display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <Pencil size={11} /> Modifiable
                  </span>
                )}
              </div>
              <button onClick={closePost} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525C', display: 'flex', padding: '4px' }}>
                <X size={18} />
              </button>
            </div>

            {/* Image */}
            {selectedPost.media_urls?.[0] && (
              <div style={{ background: '#0A0A0C' }}>
                <img src={selectedPost.media_urls[0]} alt="" style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' }} />
              </div>
            )}

            <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Contenu */}
              <div>
                <label className="label" style={{ marginBottom: '.4rem', display: 'block' }}>Contenu</label>
                {isDraft ? (
                  <textarea
                    className="input resize-none"
                    rows={5}
                    value={editContent}
                    onChange={e => setEditContent(e.target.value)}
                    style={{ width: '100%', lineHeight: 1.6 }}
                  />
                ) : (
                  <div style={{ fontSize: '.85rem', color: '#E4E4E7', lineHeight: 1.7, background: '#0D0D0F', border: '1px solid #1C1C21', borderRadius: '8px', padding: '.75rem 1rem', whiteSpace: 'pre-wrap' }}>
                    {selectedPost.content}
                  </div>
                )}
              </div>

              {/* Plateformes */}
              <div>
                <label className="label" style={{ marginBottom: '.5rem', display: 'block' }}>Plateformes</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
                  {(isDraft ? ALL_PLATFORMS : selectedPost.platforms).map(p => {
                    const active = isDraft ? editPlatforms.includes(p) : true
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          if (!isDraft) return
                          setEditPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
                        }}
                        style={{
                          padding: '.25rem .65rem', borderRadius: '6px', fontSize: '.73rem', fontWeight: 600,
                          border: `1px solid ${active ? PLATFORM_COLORS[p] + '60' : '#27272D'}`,
                          background: active ? PLATFORM_COLORS[p] + '18' : 'transparent',
                          color: active ? PLATFORM_COLORS[p] : '#3f3f46',
                          cursor: isDraft ? 'pointer' : 'default',
                          transition: '.12s',
                        }}
                      >
                        {PLATFORM_SHORT[p]}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Date */}
              <div style={{ fontSize: '.75rem', color: '#3f3f46' }}>
                Créé le {new Date(selectedPost.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: '.6rem', paddingTop: '.25rem' }}>
                {isDraft && (
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="btn-primary flex items-center gap-2"
                    style={{ flex: 1, justifyContent: 'center', padding: '.6rem' }}
                  >
                    <Save size={14} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                  </button>
                )}
                {(isDraft) && (
                  <button
                    onClick={() => publishPost(selectedPost, true)}
                    disabled={publishing === selectedPost.id}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', padding: '.6rem', borderRadius: '8px', border: 'none', background: '#22C55E', color: '#fff', cursor: 'pointer', fontSize: '.83rem', fontWeight: 600 }}
                  >
                    {publishing === selectedPost.id
                      ? <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                      : <Send size={14} />
                    }
                    Publier
                  </button>
                )}
                <button
                  onClick={() => askDelete(selectedPost.id)}
                  disabled={deleting === selectedPost.id}
                  style={{ padding: '.6rem .8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmation suppression ── */}
      {confirmId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) { setConfirmId(null); setPassword('') } }}
        >
          <div style={{ background: '#111113', border: '1px solid #27272D', borderRadius: '14px', padding: '1.75rem', width: '100%', maxWidth: '360px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F4F4F6', fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: '.4rem' }}>Confirmer la suppression</div>
            <div style={{ fontSize: '.82rem', color: '#8E8E98', marginBottom: '1.25rem', lineHeight: 1.5 }}>Cette action est irréversible. Entrez votre mot de passe pour confirmer.</div>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input type={showPw ? 'text' : 'password'} placeholder="Mot de passe" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') confirmDelete() }}
                autoFocus className="input" style={{ width: '100%', paddingRight: '2.5rem' }} />
              <button onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#52525C', display: 'flex' }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '.6rem' }}>
              <button onClick={() => { setConfirmId(null); setPassword('') }} style={{ flex: 1, padding: '.6rem', borderRadius: '8px', border: '1px solid #27272D', background: 'transparent', color: '#8E8E98', cursor: 'pointer', fontSize: '.83rem' }}>Annuler</button>
              <button onClick={confirmDelete} disabled={!password || pwLoading} style={{ flex: 1, padding: '.6rem', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', fontSize: '.83rem', fontWeight: 600, opacity: !password || pwLoading ? .5 : 1 }}>
                {pwLoading ? 'Vérification...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

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
            <div key={post.id} onClick={() => openPost(post)}
              style={{ background: '#111113', border: '1px solid #27272D', borderRadius: '10px', overflow: 'hidden', transition: '.15s', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B7BF6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272D')}
            >
              <div style={{ aspectRatio: '1', background: '#18181C', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {post.media_urls?.[0]
                  ? <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  : <span style={{ fontSize: '1.8rem', opacity: .4 }}>📝</span>
                }
                <div style={{ position: 'absolute', top: '5px', right: '5px', display: 'flex', gap: '3px' }}>
                  {post.platforms.slice(0, 3).map(p => (
                    <span key={p} style={{ width: '18px', height: '18px', borderRadius: '4px', background: PLATFORM_COLORS[p] || '#333', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.5rem', fontWeight: 700, color: '#fff' }}>
                      {PLATFORM_SHORT[p] || '?'}
                    </span>
                  ))}
                </div>
              </div>
              <div style={{ padding: '.55rem .6rem' }}>
                <div style={{ fontSize: '.72rem', color: '#8E8E98', lineHeight: 1.45, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '.45rem' }}>
                  {post.content}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className={stClass(post.status)} style={{ fontSize: '.62rem' }}>{stLabel(post.status)}</span>
                  {(post.status === 'draft' || post.status === 'failed') && (
                    <div style={{ display: 'flex', gap: '.25rem' }} onClick={e => e.stopPropagation()}>
                      <button onClick={() => publishPost(post)} disabled={publishing === post.id} title="Publier"
                        style={{ background: 'rgba(59,123,246,.15)', border: '1px solid rgba(59,123,246,.3)', borderRadius: '5px', padding: '.2rem .35rem', cursor: 'pointer', color: '#3B7BF6', display: 'flex', alignItems: 'center' }}>
                        {publishing === post.id
                          ? <div style={{ width: '10px', height: '10px', border: '1.5px solid rgba(59,123,246,.3)', borderTopColor: '#3B7BF6', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                          : <Send size={10} />}
                      </button>
                      <button onClick={() => askDelete(post.id)} disabled={deleting === post.id} title="Supprimer"
                        style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '5px', padding: '.2rem .35rem', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
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
            <div key={post.id} onClick={() => openPost(post)}
              style={{ background: '#111113', border: '1px solid #27272D', borderRadius: '8px', padding: '.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: '.15s', cursor: 'pointer' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B7BF6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272D')}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '6px', background: '#18181C', flexShrink: 0, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {post.media_urls?.[0]
                  ? <img src={post.media_urls[0]} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ fontSize: '1.2rem', opacity: .4 }}>📝</span>
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '.8rem', color: '#E4E4E7', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.content}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginTop: '.3rem' }}>
                  {post.platforms.map(p => (
                    <span key={p} style={{ width: '16px', height: '16px', borderRadius: '3px', background: PLATFORM_COLORS[p] || '#333', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '.45rem', fontWeight: 700, color: '#fff' }}>
                      {PLATFORM_SHORT[p] || '?'}
                    </span>
                  ))}
                  <span style={{ fontSize: '.7rem', color: '#3f3f46' }}>
                    {new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                <span className={stClass(post.status)} style={{ fontSize: '.68rem' }}>{stLabel(post.status)}</span>
                {(post.status === 'draft' || post.status === 'failed') && (
                  <>
                    <button onClick={() => publishPost(post)} disabled={publishing === post.id}
                      style={{ background: 'rgba(59,123,246,.15)', border: '1px solid rgba(59,123,246,.3)', borderRadius: '6px', padding: '.3rem .6rem', cursor: 'pointer', color: '#3B7BF6', display: 'flex', alignItems: 'center', gap: '.3rem', fontSize: '.72rem', fontWeight: 500 }}>
                      {publishing === post.id
                        ? <div style={{ width: '11px', height: '11px', border: '1.5px solid rgba(59,123,246,.3)', borderTopColor: '#3B7BF6', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                        : <Send size={11} />} Publier
                    </button>
                    <button onClick={() => askDelete(post.id)} disabled={deleting === post.id}
                      style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.2)', borderRadius: '6px', padding: '.3rem .5rem', cursor: 'pointer', color: '#EF4444', display: 'flex', alignItems: 'center' }}>
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
