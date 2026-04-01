'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Save, Send, Trash2, ArrowLeft, Upload, X } from 'lucide-react'
import { useToast } from '@/components/ui/Toast'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C', facebook: '#1877F2', tiktok: '#000',
  twitter: '#1DA1F2', linkedin: '#0077B5', youtube: '#FF0000', pinterest: '#E60023',
}
const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
  twitter: 'Twitter / X', linkedin: 'LinkedIn', youtube: 'YouTube', pinterest: 'Pinterest',
}
const PLATFORM_CHAR_LIMITS: Record<string, number> = {
  instagram: 2000, facebook: 2000, twitter: 280, linkedin: 3000, tiktok: 300,
}
const ALL_PLATFORMS = ['instagram', 'facebook', 'tiktok', 'twitter', 'linkedin', 'youtube', 'pinterest']
const FREE_PLATFORMS = ['instagram', 'facebook']

interface Post {
  id: string
  content: string
  content_variants: Record<string, string> | null
  platforms: string[]
  status: string
  media_urls: string[]
  created_at: string
}

export default function EditPostPage() {
  const router = useRouter()
  const params = useParams()
  const { toast } = useToast()
  const id = params.id as string

  const [post, setPost] = useState<Post | null>(null)
  const [loading, setLoading] = useState(true)
  // variants[platform] = contenu éditable
  const [variants, setVariants] = useState<Record<string, string>>({})
  const [platforms, setPlatforms] = useState<string[]>([])
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [userPlan, setUserPlan] = useState<'free' | 'premium' | 'business'>('free')

  useEffect(() => {
    fetch(`/api/posts/${id}`)
      .then(r => r.json())
      .then(d => {
        if (d.id) {
          setPost(d)
          setPlatforms(d.platforms || [])
          setMediaUrl(d.media_urls?.[0] || null)
          // Charger les variantes par plateforme
          if (d.content_variants && Object.keys(d.content_variants).length > 0) {
            setVariants(d.content_variants)
          } else {
            // Post sans variantes : même contenu pour toutes les plateformes
            const v: Record<string, string> = {}
            for (const p of (d.platforms || [])) v[p] = d.content
            setVariants(v)
          }
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))

    fetch('/api/auth/me').then(r => r.json()).then(d => { if (d?.plan) setUserPlan(d.plan) }).catch(() => {})
  }, [id])

  async function handleMediaUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      setMediaUrl(d.url)
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur upload', 'error')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave() {
    const primaryContent = platforms[0] ? variants[platforms[0]] : Object.values(variants)[0] || ''
    if (!primaryContent.trim()) { toast('Le contenu ne peut pas être vide', 'error'); return }
    setSaving(true)
    try {
      const res = await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: primaryContent,
          platforms,
          media_urls: mediaUrl ? [mediaUrl] : [],
          content_variants: Object.keys(variants).length > 1 ? variants : undefined,
        }),
      })
      if (!res.ok) throw new Error('Erreur de sauvegarde')
      toast('Brouillon mis à jour', 'success')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handlePublish() {
    if (platforms.includes('instagram') && !mediaUrl) {
      toast('Veuillez ajouter une image pour Instagram.', 'warning')
      return
    }
    setPublishing(true)
    try {
      await handleSave()
      const res = await fetch(`/api/posts/${id}/publish`, { method: 'POST' })
      const d = await res.json()
      if (!res.ok) throw new Error(d.error)
      toast('Post publié !', 'success')
      router.push('/posts')
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Erreur de publication', 'error')
    } finally {
      setPublishing(false)
    }
  }

  async function handleReject() {
    try {
      const primaryContent = platforms[0] ? variants[platforms[0]] : Object.values(variants)[0] || ''
      await fetch(`/api/posts/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: primaryContent,
          platforms,
          media_urls: mediaUrl ? [mediaUrl] : [],
          content_variants: Object.keys(variants).length > 1 ? variants : undefined,
          status: 'failed',
        }),
      })
      toast('Post rejeté', 'success')
      router.push('/posts')
    } catch {
      toast('Erreur', 'error')
    }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
      <div style={{ width: '28px', height: '28px', border: '2.5px solid rgba(255,255,255,.08)', borderTopColor: '#4646FF', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
    </div>
  )

  if (!post) return (
    <div style={{ padding: '2rem', textAlign: 'center', color: '#52525C' }}>Post introuvable</div>
  )

  return (
    <div style={{ padding: '1.5rem 2rem 4rem', maxWidth: '720px' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '2rem' }}>
        <button onClick={() => router.push('/posts')}
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#52525C', display: 'flex', alignItems: 'center', gap: '.4rem', fontSize: '.82rem', padding: '4px' }}>
          <ArrowLeft size={16} /> Retour
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ fontFamily: "'Bricolage Grotesque', sans-serif", fontSize: '1.2rem', fontWeight: 700, color: '#F4F4F6', letterSpacing: '-.02em' }}>
            {post.status === 'failed' ? 'Modifier le post rejeté' : 'Modifier le brouillon'}
          </h1>
          <p style={{ fontSize: '.78rem', color: '#52525C', marginTop: '.15rem' }}>
            Créé le {new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>

        {/* Image */}
        <div className="card p-4">
          <label className="label" style={{ marginBottom: '.5rem', display: 'block' }}>Image / Vidéo</label>
          {mediaUrl ? (
            <div style={{ position: 'relative' }}>
              <img src={mediaUrl} alt="" style={{ width: '100%', maxHeight: '260px', objectFit: 'contain', borderRadius: '8px', display: 'block', background: '#0D0D0F' }} />
              <div style={{ position: 'absolute', bottom: '8px', right: '8px', display: 'flex', gap: '.4rem' }}>
                <label style={{ cursor: 'pointer', background: 'rgba(0,0,0,.75)', border: '1px solid rgba(255,255,255,.15)', borderRadius: '6px', padding: '.3rem .6rem', display: 'flex', alignItems: 'center', gap: '.35rem', fontSize: '.72rem', color: '#E4E4E7' }}>
                  <Upload size={12} /> {uploading ? 'Upload...' : 'Changer'}
                  <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f) }} />
                </label>
                <button onClick={() => setMediaUrl(null)} style={{ background: 'rgba(239,68,68,.7)', border: 'none', borderRadius: '6px', padding: '.3rem .5rem', cursor: 'pointer', color: '#fff', display: 'flex' }}>
                  <X size={12} />
                </button>
              </div>
            </div>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '.5rem', padding: '2rem', background: '#0D0D0F', border: '1px dashed #27272D', borderRadius: '8px', cursor: 'pointer', transition: '.15s' }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#4646FF')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#27272D')}
            >
              {uploading
                ? <div style={{ width: '20px', height: '20px', border: '2px solid rgba(59,123,246,.3)', borderTopColor: '#4646FF', borderRadius: '50%', animation: 'rot .7s linear infinite' }} />
                : <Upload size={20} color="#3f3f46" />}
              <span style={{ fontSize: '.78rem', color: '#52525C' }}>{uploading ? 'Upload en cours...' : 'Ajouter une image ou vidéo'}</span>
              <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleMediaUpload(f) }} />
            </label>
          )}
        </div>

        {/* Contenu — un textarea par plateforme */}
        {platforms.map(p => {
          const limit = PLATFORM_CHAR_LIMITS[p]
          const val = variants[p] || ''
          const over = limit ? val.length > limit : false
          return (
            <div key={p} className="card p-4">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: PLATFORM_COLORS[p] || '#555' }} />
                  <label className="label" style={{ marginBottom: 0 }}>{PLATFORM_NAMES[p] || p}</label>
                </div>
                {limit && (
                  <span style={{ fontSize: '.72rem', fontFamily: 'monospace', color: over ? '#EF4444' : '#52525C' }}>
                    {val.length}/{limit}
                  </span>
                )}
              </div>
              <textarea
                className="input resize-none"
                rows={6}
                value={val}
                onChange={e => setVariants(prev => ({ ...prev, [p]: e.target.value }))}
                style={{ width: '100%', lineHeight: 1.65, borderColor: over ? 'rgba(239,68,68,.4)' : undefined }}
                placeholder={`Contenu pour ${PLATFORM_NAMES[p] || p}…`}
              />
              {over && <p style={{ fontSize: '.75rem', color: '#EF4444', marginTop: '.35rem' }}>⚠ Dépasse la limite de {limit} caractères ({val.length - limit} de trop)</p>}
            </div>
          )
        })}

        {/* Plateformes */}
        <div className="card p-4">
          <label className="label" style={{ marginBottom: '.6rem', display: 'block' }}>Plateformes</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '.4rem' }}>
            {ALL_PLATFORMS.map(p => {
              const locked = userPlan === 'free' && !FREE_PLATFORMS.includes(p)
              const active = platforms.includes(p)
              return (
                <button key={p}
                  onClick={() => {
                    if (locked) return
                    setPlatforms(prev => prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p])
                    if (!variants[p]) setVariants(prev => ({ ...prev, [p]: Object.values(prev)[0] || '' }))
                  }}
                  title={locked ? 'Plan Pro requis' : undefined}
                  style={{
                    padding: '.3rem .75rem', borderRadius: '7px', fontSize: '.78rem', fontWeight: 600,
                    border: `1px solid ${locked ? '#1E1E24' : active ? PLATFORM_COLORS[p] + '70' : '#27272D'}`,
                    background: locked ? 'transparent' : active ? PLATFORM_COLORS[p] + '18' : 'transparent',
                    color: locked ? '#2a2a30' : active ? PLATFORM_COLORS[p] : '#52525C',
                    cursor: locked ? 'not-allowed' : 'pointer', transition: '.12s', display: 'flex', alignItems: 'center', gap: '.3rem',
                  }}
                >
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: locked ? '#2a2a30' : active ? PLATFORM_COLORS[p] : '#3f3f46', flexShrink: 0 }} />
                  {PLATFORM_NAMES[p]}
                  {locked && <span style={{ fontSize: '.6rem', opacity: .6 }}>Pro</span>}
                </button>
              )
            })}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '.6rem', flexWrap: 'wrap' }}>
          <button onClick={handleSave} disabled={saving}
            style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', padding: '.65rem 1rem', borderRadius: '8px', border: '1px solid #27272D', background: '#111113', color: saving ? '#52525C' : '#E4E4E7', cursor: saving ? 'not-allowed' : 'pointer', fontSize: '.83rem', fontWeight: 500 }}>
            <Save size={14} /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
          <button onClick={handlePublish} disabled={publishing || !platforms.length}
            style={{ flex: 1, minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', padding: '.65rem 1rem', borderRadius: '8px', border: 'none', background: publishing ? '#16A34A80' : '#22C55E', color: '#fff', cursor: publishing ? 'not-allowed' : 'pointer', fontSize: '.83rem', fontWeight: 600 }}>
            {publishing ? <div style={{ width: '13px', height: '13px', border: '2px solid rgba(255,255,255,.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'rot .7s linear infinite' }} /> : <Send size={14} />}
            {publishing ? 'Publication...' : 'Publier maintenant'}
          </button>
          {post.status === 'draft' && (
            <button onClick={handleReject}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem', padding: '.65rem .9rem', borderRadius: '8px', border: '1px solid rgba(239,68,68,.3)', background: 'rgba(239,68,68,.08)', color: '#EF4444', cursor: 'pointer', fontSize: '.83rem', fontWeight: 500 }}>
              <Trash2 size={14} /> Rejeter
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
