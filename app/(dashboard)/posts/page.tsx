'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Grid3X3, List, Send, Trash2, Eye, EyeOff, X, Save, Pencil, RotateCcw, RefreshCw, Upload, CheckSquare, Square } from 'lucide-react'
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
const FREE_PLATFORMS = ['instagram', 'facebook']

function stClass(s: string) {
  if (s === 'draft') return 'st st-p'
  if (s === 'scheduled') return 'st st-pub'
  if (s === 'published') return 'st st-a'
  if (s === 'deleted') return 'st'
  return 'st st-r'
}
function stLabel(s: string) {
  if (s === 'draft') return 'Brouillon'
  if (s === 'scheduled') return 'Programmé'
  if (s === 'published') return 'Publié'
  if (s === 'deleted') return 'Corbeille'
  return 'Rejeté'
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
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'scheduled' | 'failed' | 'deleted'>('all')
  const [view, setView] = useState<'grid' | 'list'>('grid')
  const [publishing, setPublishing] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [restoring, setRestoring] = useState<string | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [userPlan, setUserPlan] = useState<'free' | 'premium' | 'business'>('free')
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const lastDeletedAt = useRef<number | null>(null)

  // Modal visualisation/édition
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editPlatforms, setEditPlatforms] = useState<string[]>([])
  const [editMediaUrl, setEditMediaUrl] = useState<string | null>(null)
  const [uploadingMedia, setUploadingMedia] = useState(false)
  const [saving, setSaving] = useState(false)

  // Multi-sélection
  const [selectMode, setSelectMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkDeleting, setBulkDeleting] = useState(false)

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleSelectAll() {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(filtered.map(p => p.id)))
    }
  }

  function exitSelectMode() {
    setSelectMode(false)
    setSelectedIds(new Set())
  }

  async function bulkDelete() {
    if (selectedIds.size === 0) return
    const needsPassword = !lastDeletedAt.current || Date.now() - lastDeletedAt.current >= DELETE_COOLDOWN_MS
    if (needsPassword) {
      setBulkConfirm(true)
      setPassword('')
      return
    }
    await doBulkDelete()
  }

  const [bulkConfirm, setBulkConfirm] = useState(false)

  async function confirmBulkDelete() {
    setPwLoading(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) throw new Error('Non connecté')
      const { error } = await supabase.auth.signInWithPassword({ email: user.email, password })
      if (error) throw new Error('Mot de passe incorrect')
      setBulkConfirm(false)
      setPassword('')
      await doBulkDelete()
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setPwLoading(false)
    }
  }

  async function doBulkDelete() {
    setBulkDeleting(true)
    const ids = Array.from(selectedIds)
    try {
      await Promise.all(ids.map(id => fetch(`/api/posts/${id}`, { method: 'DELETE' })))
      toast(`${ids.length} post${ids.length > 1 ? 's' : ''} supprimé${ids.length > 1 ? 's' : ''}`, 'success')
      lastDeletedAt.current = Date.now()
      setPosts(prev => prev.filter(p => !ids.includes(p.id)))
      setTotal(prev => prev - ids.length)
      exitSelectMode()
    } catch {
      toast('Erreur lors de la suppression', 'error')
    } finally {
      setBulkDeleting(false)
    }
  }

  function loadPosts() {
    setLoading(true)
    fetch('/api/posts?limit=100&includeDeleted=true')
      .then(r => r.json())
      .then(d => { setPosts(d.posts || []); setTotal(d.total || 0); setLoading(false) })
      .catch(() => setLoading(false))
  }

  async function restorePost(id: string) {
    setRestoring(id)
    try {
      const res = await fetch(`/api/posts/${id}`, { method: 'PATCH' })
      if (!res.ok) throw new Error('Erreur restauration')
      toast('Post restauré en brouillon', 'success')
      setPosts(prev => prev.map(p => p.id === id ? { ...p, status: 'draft' } : p))
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setRestoring(null)
    }
  }

  async function hardDelete(id: string) {
    try {
      await fetch(`/api/posts/${id}/destroy`, { method: 'DELETE' })
      setPosts(prev => prev.filter(p => p.id !== id))
      setTotal(prev => prev - 1)
      if (selectedPost?.id === id) closePost()
      toast('Post supprimé définitivement', 'success')
    } catch { /* ignore */ }
  }

  async function syncPlatforms() {
    setSyncing(true)
    try {
      const res = await fetch('/api/posts/sync', { method: 'POST' })
      const d = await res.json()
      if (d.updated > 0) toast(`${d.updated} post(s) mis à jour depuis les plateformes`, 'success')
      else toast('Tout est à jour', 'success')
      loadPosts()
    } catch {
      toast('Erreur de synchronisation', 'error')
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    loadPosts()
    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d?.plan) setUserPlan(d.plan) }).catch(() => {})
  }, [])

  function openPost(post: Post) {
    if (post.status === 'draft' || post.status === 'failed') {
      router.push(`/posts/${post.id}/edit`)
      return
    }
    setSelectedPost(post)
    setEditContent(post.content)
    setEditPlatforms([...post.platforms])
    setEditMediaUrl(post.media_urls?.[0] || null)
  }

  function closePost() {
    setSelectedPost(null)
    setEditContent('')
    setEditPlatforms([])
    setEditMediaUrl(null)
  }

  async function handleMediaUpload(file: File) {
    setUploadingMedia(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setEditMediaUrl(d.url)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur upload', 'error')
    } finally {
      setUploadingMedia(false)
    }
  }

  async function saveEdit() {
    if (!selectedPost) return
    setSaving(true)
    try {
      const res = await fetch(`/api/posts/${selectedPost.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: editContent, platforms: editPlatforms, media_urls: editMediaUrl ? [editMediaUrl] : [] }),
      })
      if (!res.ok) throw new Error('Erreur de sauvegarde')
      toast('Brouillon mis à jour', 'success')
      const updatedMediaUrls = editMediaUrl ? [editMediaUrl] : []
      setPosts(prev => prev.map(p => p.id === selectedPost.id ? { ...p, content: editContent, platforms: editPlatforms, media_urls: updatedMediaUrls } : p))
      setSelectedPost(prev => prev ? { ...prev, content: editContent, platforms: editPlatforms, media_urls: updatedMediaUrls } : null)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function publishPost(post: Post, closeModal = false) {
    const effectiveMediaUrls = editMediaUrl ? [editMediaUrl] : post.media_urls
    if (post.platforms.includes('instagram') && (!effectiveMediaUrls || effectiveMediaUrls.length === 0)) {
      toast('Veuillez ajouter une image pour Instagram.', 'warning')
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

  const filtered = filter === 'all'
    ? posts.filter(p => p.status !== 'deleted')
    : posts.filter(p => p.status === filter)
  const isDraft = selectedPost?.status === 'draft' || selectedPost?.status === 'failed'
  const isDeleted = selectedPost?.status === 'deleted'
  const trashCount = posts.filter(p => p.status === 'deleted').length

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
            {editMediaUrl ? (
              <div style={{ background: '#0A0A0C', position: 'relative' }}>
                <img src={editMediaUrl} alt="" style={{ width: '100%', maxHeight: '280px', objectFit: 'contain', display: 'block' }} />
                {isDraft && (
                  <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '.4rem' }}>
                    <label style={{ cursor: 'pointer', background: 'rgba(0,0,0,.7)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '6px', padding: '.35rem .6rem', display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.72rem', color: '#E4E4E7' }}>
                      <Upload size={12} /> {uploadingMedia ? 'Upload...' : 'Changer'}
                      <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f) }} />
                    </label>
                    <button onClick={() => setEditMediaUrl(null)} style={{ background: 'rgba(239,68,68,.7)', border: 'none', borderRadius: '6px', padding: '.35rem .5rem', cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center' }}>
                      <X size={12} />
                    </button>
                  </div>
                )}
              </div>
            ) : isDraft ? (
              <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '1.5rem', background: '#0D0D0F', border: '1px dashed #27272D', cursor: 'pointer', transition: '.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B7BF6')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272D')}
              >
                {uploadingMedia
                  ? <div style={{ width: '20px', height: '20px', border: '2px solid rgba(59,123,246,.3)', borderTopColor: '#3B7BF6', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                  : <Upload size={20} color="#3f3f46" />
                }
                <span style={{ fontSize: '.78rem', color: '#52525C' }}>{uploadingMedia ? 'Upload en cours...' : 'Ajouter une image ou vidéo'}</span>
                <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f) }} />
              </label>
            ) : null}

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
                    const isPlanLocked = isDraft && userPlan === 'free' && !FREE_PLATFORMS.includes(p)
                    const active = isDraft ? editPlatforms.includes(p) : true
                    return (
                      <button
                        key={p}
                        onClick={() => {
                          if (!isDraft || isPlanLocked) return
                          setEditPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
                        }}
                        title={isPlanLocked ? 'Plan Pro requis' : undefined}
                        style={{
                          padding: '.25rem .65rem', borderRadius: '6px', fontSize: '.73rem', fontWeight: 600,
                          border: `1px solid ${isPlanLocked ? '#1E1E24' : active ? PLATFORM_COLORS[p] + '60' : '#27272D'}`,
                          background: isPlanLocked ? 'transparent' : active ? PLATFORM_COLORS[p] + '18' : 'transparent',
                          color: isPlanLocked ? '#2a2a30' : active ? PLATFORM_COLORS[p] : '#3f3f46',
                          cursor: isPlanLocked ? 'not-allowed' : isDraft ? 'pointer' : 'default',
                          transition: '.12s', position: 'relative',
                        }}
                      >
                        {PLATFORM_SHORT[p]}
                        {isPlanLocked && <span style={{ fontSize: '.5rem', marginLeft: '.2rem', opacity: .6 }}>Pro</span>}
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
                {isDeleted ? (
                  <>
                    <button
                      onClick={() => restorePost(selectedPost.id)}
                      disabled={restoring === selectedPost.id}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', padding: '.6rem', borderRadius: '8px', border: '1px solid rgba(59,123,246,.4)', background: 'rgba(59,123,246,.1)', color: '#3B7BF6', cursor: 'pointer', fontSize: '.83rem', fontWeight: 600 }}
                    >
                      <RotateCcw size={14} /> {restoring === selectedPost.id ? 'Restauration...' : 'Restaurer en brouillon'}
                    </button>
                    <button
                      onClick={() => hardDelete(selectedPost.id)}
                      style={{ padding: '.6rem .8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.8rem' }}
                    >
                      <Trash2 size={14} /> Supprimer définitivement
                    </button>
                  </>
                ) : (
                  <>
                    {isDraft && (
                      <button onClick={saveEdit} disabled={saving} className="btn-primary flex items-center gap-2" style={{ flex: 1, justifyContent: 'center', padding: '.6rem' }}>
                        <Save size={14} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
                      </button>
                    )}
                    {isDraft && (
                      <button onClick={() => publishPost(selectedPost, true)} disabled={publishing === selectedPost.id}
                        style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', padding: '.6rem', borderRadius: '8px', border: 'none', background: '#22C55E', color: '#fff', cursor: 'pointer', fontSize: '.83rem', fontWeight: 600 }}>
                        {publishing === selectedPost.id
                          ? <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                          : <Send size={14} />} Publier
                      </button>
                    )}
                    <button onClick={() => askDelete(selectedPost.id)} disabled={deleting === selectedPost.id}
                      style={{ padding: '.6rem .8rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={15} />
                    </button>
                  </>
                )}
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

      {/* ── Modal confirmation suppression bulk ── */}
      {bulkConfirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(6px)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={e => { if (e.target === e.currentTarget) { setBulkConfirm(false); setPassword('') } }}
        >
          <div style={{ background: '#111113', border: '1px solid #27272D', borderRadius: '14px', padding: '1.75rem', width: '100%', maxWidth: '360px' }}>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#F4F4F6', fontFamily: "'Bricolage Grotesque', sans-serif", marginBottom: '.4rem' }}>Supprimer {selectedIds.size} post{selectedIds.size > 1 ? 's' : ''}</div>
            <div style={{ fontSize: '.82rem', color: '#8E8E98', marginBottom: '1.25rem', lineHeight: 1.5 }}>Entrez votre mot de passe pour confirmer la suppression.</div>
            <div style={{ position: 'relative', marginBottom: '1rem' }}>
              <input type={showPw ? 'text' : 'password'} placeholder="Mot de passe" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') confirmBulkDelete() }}
                autoFocus className="input" style={{ width: '100%', paddingRight: '2.5rem' }} />
              <button onClick={() => setShowPw(p => !p)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#52525C', display: 'flex' }}>
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <div style={{ display: 'flex', gap: '.6rem' }}>
              <button onClick={() => { setBulkConfirm(false); setPassword('') }} style={{ flex: 1, padding: '.6rem', borderRadius: '8px', border: '1px solid #27272D', background: 'transparent', color: '#8E8E98', cursor: 'pointer', fontSize: '.83rem' }}>Annuler</button>
              <button onClick={confirmBulkDelete} disabled={!password || pwLoading} style={{ flex: 1, padding: '.6rem', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', fontSize: '.83rem', fontWeight: 600, opacity: !password || pwLoading ? .5 : 1 }}>
                {pwLoading ? 'Vérification...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Barre de sélection flottante ── */}
      {selectMode && selectedIds.size > 0 && (
        <div style={{ position: 'fixed', bottom: '1.5rem', left: '50%', transform: 'translateX(-50%)', zIndex: 100, background: '#18181C', border: '1px solid #27272D', borderRadius: '12px', padding: '.75rem 1.25rem', display: 'flex', alignItems: 'center', gap: '1rem', boxShadow: '0 8px 32px rgba(0,0,0,.6)', backdropFilter: 'blur(8px)' }}>
          <span style={{ fontSize: '.82rem', color: '#8E8E98' }}>{selectedIds.size} sélectionné{selectedIds.size > 1 ? 's' : ''}</span>
          <button onClick={bulkDelete} disabled={bulkDeleting}
            style={{ display: 'flex', alignItems: 'center', gap: '.4rem', padding: '.45rem .9rem', borderRadius: '8px', border: 'none', background: '#EF4444', color: '#fff', cursor: 'pointer', fontSize: '.8rem', fontWeight: 600, opacity: bulkDeleting ? .6 : 1 }}>
            <Trash2 size={13} /> {bulkDeleting ? 'Suppression...' : 'Supprimer'}
          </button>
          <button onClick={exitSelectMode} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525C', display: 'flex', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.3rem', fontWeight: 700, color: '#F4F4F6', letterSpacing: '-.02em' }}>Mes Posts</h1>
          <p style={{ color: '#52525C', fontSize: '.8rem', marginTop: '.15rem' }}>{total} post{total !== 1 ? 's' : ''} au total</p>
        </div>
        <div style={{ display: 'flex', gap: '.5rem' }}>
          {selectMode ? (
            <button onClick={exitSelectMode}
              style={{ padding: '.5rem .75rem', borderRadius: '8px', border: '1px solid #27272D', background: '#111113', color: '#8E8E98', cursor: 'pointer', fontSize: '.78rem' }}>
              Annuler
            </button>
          ) : (
            <button onClick={() => setSelectMode(true)}
              style={{ padding: '.5rem .75rem', borderRadius: '8px', border: '1px solid #27272D', background: '#111113', color: '#52525C', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem' }}>
              <CheckSquare size={13} /> Sélectionner
            </button>
          )}
          <button onClick={syncPlatforms} disabled={syncing} title="Vérifier si des posts ont été supprimés sur les plateformes"
            style={{ padding: '.5rem .75rem', borderRadius: '8px', border: '1px solid #27272D', background: '#111113', color: '#52525C', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.78rem' }}>
            <RefreshCw size={13} style={{ animation: syncing ? 'rot .7s linear infinite' : 'none' }} />
            {syncing ? 'Sync...' : 'Synchroniser'}
          </button>
          <button onClick={() => router.push('/posts/create')} className="btn-primary flex items-center gap-2" style={{ padding: '.55rem 1.1rem', fontSize: '.82rem' }}>
            <Plus size={15} /> Créer un post
          </button>
        </div>
      </div>

      {/* Filters + view toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <div style={{ display: 'flex', gap: '.4rem', flexWrap: 'wrap' }}>
          {(['all', 'published', 'draft', 'scheduled', 'failed', 'deleted'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} style={{
              padding: '.3rem .75rem', borderRadius: '6px', fontSize: '.75rem', fontWeight: 500, cursor: 'pointer',
              border: filter === f ? (f === 'deleted' ? '1px solid rgba(239,68,68,.5)' : '1px solid #3B7BF6') : '1px solid #27272D',
              background: filter === f ? (f === 'deleted' ? 'rgba(239,68,68,.1)' : 'rgba(59,123,246,.12)') : '#111113',
              color: filter === f ? (f === 'deleted' ? '#EF4444' : '#3B7BF6') : '#8E8E98', transition: '.15s',
              display: 'flex', alignItems: 'center', gap: '.3rem',
            }}>
              {f === 'deleted' && <Trash2 size={11} />}
              {f === 'all' ? 'Tous' : f === 'published' ? 'Publiés' : f === 'draft' ? 'Brouillons' : f === 'scheduled' ? 'Programmés' : f === 'failed' ? 'Rejetés' : `Corbeille${trashCount > 0 ? ` (${trashCount})` : ''}`}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '.3rem', alignItems: 'center' }}>
          {selectMode && filtered.length > 0 && (
            <button onClick={toggleSelectAll}
              style={{ padding: '.3rem .65rem', borderRadius: '6px', border: '1px solid #27272D', background: '#111113', color: '#8E8E98', cursor: 'pointer', fontSize: '.73rem', display: 'flex', alignItems: 'center', gap: '.3rem', marginRight: '.25rem' }}>
              {selectedIds.size === filtered.length ? <CheckSquare size={12} color="#3B7BF6" /> : <Square size={12} />}
              {selectedIds.size === filtered.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </button>
          )}
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
          <button onClick={() => router.push('/posts/create')} className="btn-primary flex items-center gap-2" style={{ margin: '0 auto', padding: '.5rem 1rem', fontSize: '.8rem' }}>
            <Plus size={14} /> Créer un post
          </button>
        </div>
      ) : view === 'grid' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '.6rem' }}>
          {filtered.map(post => {
            const isSelected = selectedIds.has(post.id)
            return (
            <div key={post.id}
              onClick={() => selectMode ? toggleSelect(post.id) : openPost(post)}
              style={{ background: '#111113', border: `1px solid ${isSelected ? '#3B7BF6' : '#27272D'}`, borderRadius: '10px', overflow: 'hidden', transition: '.15s', cursor: 'pointer', position: 'relative' }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#3B7BF6' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#27272D' }}
            >
              {selectMode && (
                <div style={{ position: 'absolute', top: '6px', left: '6px', zIndex: 10 }}>
                  {isSelected
                    ? <CheckSquare size={18} color="#3B7BF6" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.8))' }} />
                    : <Square size={18} color="rgba(255,255,255,.6)" style={{ filter: 'drop-shadow(0 1px 3px rgba(0,0,0,.8))' }} />
                  }
                </div>
              )}
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
          )})}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '.5rem' }}>
          {filtered.map(post => {
            const isSelected = selectedIds.has(post.id)
            return (
            <div key={post.id}
              onClick={() => selectMode ? toggleSelect(post.id) : openPost(post)}
              style={{ background: '#111113', border: `1px solid ${isSelected ? '#3B7BF6' : '#27272D'}`, borderRadius: '8px', padding: '.75rem 1rem', display: 'flex', alignItems: 'center', gap: '1rem', transition: '.15s', cursor: 'pointer' }}
              onMouseEnter={e => { if (!isSelected) e.currentTarget.style.borderColor = '#3B7BF6' }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.borderColor = '#27272D' }}
            >
              {selectMode && (
                <div style={{ flexShrink: 0 }}>
                  {isSelected ? <CheckSquare size={17} color="#3B7BF6" /> : <Square size={17} color="#52525C" />}
                </div>
              )}
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
          )})}
        </div>
      )}
    </div>
  )
}
