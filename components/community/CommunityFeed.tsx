'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Heart, MessageCircle, Send } from 'lucide-react'

type Post = {
  id: string
  user_id: string
  content: string
  created_at: string
  full_name: string | null
  avatar_url: string | null
  plan: string | null
  likes_count: number
  comments_count: number
}

export function CommunityFeed({ 
  initialPosts, 
  currentUserId,
  initialLikedIds
}: { 
  initialPosts: Post[]
  currentUserId: string
  initialLikedIds: string[]
}) {
  const [posts, setPosts] = useState(initialPosts)
  const [likedIds, setLikedIds] = useState(new Set(initialLikedIds))
  const [newPostContent, setNewPostContent] = useState('')
  const [isPosting, setIsPosting] = useState(false)
  const supabase = createClient()

  async function handlePost(e: React.FormEvent) {
    e.preventDefault()
    if (!newPostContent.trim() || isPosting) return

    setIsPosting(true)
    const { data, error } = await supabase
      .from('community_posts')
      .insert({ content: newPostContent.trim(), user_id: currentUserId })
      .select('id, created_at')
      .single()

    if (!error && data) {
      // Optimistic update : on ajoute le post en haut (les infos user sont incomplètes mais suffisantes pour l'UI immédiate)
      setPosts([{
        id: data.id,
        user_id: currentUserId,
        content: newPostContent.trim(),
        created_at: data.created_at,
        full_name: 'Moi',
        avatar_url: null,
        plan: null,
        likes_count: 0,
        comments_count: 0
      }, ...posts])
      setNewPostContent('')
    }
    setIsPosting(false)
  }

  async function toggleLike(postId: string) {
    const isLiked = likedIds.has(postId)
    
    // Optimistic UI update
    const newLikedIds = new Set(likedIds)
    if (isLiked) newLikedIds.delete(postId)
    else newLikedIds.add(postId)
    setLikedIds(newLikedIds)

    setPosts(posts.map(p => {
      if (p.id === postId) {
        return { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) }
      }
      return p
    }))

    // Database update
    if (isLiked) {
      await supabase.from('community_likes').delete().match({ post_id: postId, user_id: currentUserId })
    } else {
      await supabase.from('community_likes').insert({ post_id: postId, user_id: currentUserId })
    }
  }

  return (
    <div className="community-feed" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Create Post Form */}
      <div style={{ background: 'var(--card)', borderRadius: '12px', padding: '1rem', border: '1px solid var(--b1)' }}>
        <form onSubmit={handlePost}>
          <textarea 
            value={newPostContent}
            onChange={e => setNewPostContent(e.target.value)}
            placeholder="Partagez une astuce, posez une question..."
            style={{ 
              width: '100%', minHeight: '80px', background: 'transparent', border: 'none', 
              color: 'var(--t1)', outline: 'none', resize: 'none', fontSize: '.95rem' 
            }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '.5rem', borderTop: '1px solid var(--b1)', paddingTop: '.5rem' }}>
            <span style={{ fontSize: '.8rem', color: 'var(--t3)' }}>
              Restez bienveillant et constructif.
            </span>
            <button 
              type="submit" 
              disabled={isPosting || !newPostContent.trim()}
              style={{ 
                background: 'var(--accent)', color: '#fff', padding: '.4rem 1rem', borderRadius: '20px', 
                border: 'none', fontWeight: 600, cursor: 'pointer', opacity: (isPosting || !newPostContent.trim()) ? 0.5 : 1,
                display: 'flex', alignItems: 'center', gap: '.4rem'
              }}>
              <Send size={14} /> Publier
            </button>
          </div>
        </form>
      </div>

      {/* Feed */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {posts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--t3)', background: 'var(--card)', borderRadius: '12px', border: '1px dashed var(--b1)' }}>
            Soyez le premier à publier sur le mur !
          </div>
        ) : (
          posts.map(post => {
            const isLiked = likedIds.has(post.id)
            return (
              <div key={post.id} style={{ background: 'var(--card)', borderRadius: '12px', padding: '1.2rem', border: '1px solid var(--b1)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '.8rem', marginBottom: '1rem' }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--s2)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {post.avatar_url ? <img src={post.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/> : <span style={{ color: 'var(--t2)', fontWeight: 600 }}>{(post.full_name || 'U').slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: 'var(--t1)', display: 'flex', alignItems: 'center', gap: '.4rem' }}>
                      {post.full_name || 'Utilisateur'}
                      {post.plan && <span style={{ fontSize: '.6rem', background: 'rgba(123,92,245,0.15)', color: '#7B5CF5', padding: '.1rem .4rem', borderRadius: '10px' }}>{post.plan.toUpperCase()}</span>}
                    </div>
                    <div style={{ fontSize: '.75rem', color: 'var(--t3)' }}>
                      {new Date(post.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>

                <p style={{ color: 'var(--t1)', fontSize: '.95rem', lineHeight: 1.5, whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                  {post.content}
                </p>

                <div style={{ display: 'flex', gap: '1.5rem', borderTop: '1px solid var(--b1)', paddingTop: '.8rem' }}>
                  <button 
                    onClick={() => toggleLike(post.id)}
                    style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '.4rem', color: isLiked ? '#ef4444' : 'var(--t2)', cursor: 'pointer', transition: 'color 0.2s' }}>
                    <Heart size={18} fill={isLiked ? '#ef4444' : 'none'} />
                    <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{post.likes_count}</span>
                  </button>
                  <button style={{ background: 'none', border: 'none', display: 'flex', alignItems: 'center', gap: '.4rem', color: 'var(--t2)', cursor: 'not-allowed', opacity: 0.7 }}>
                    <MessageCircle size={18} />
                    <span style={{ fontWeight: 600, fontSize: '.9rem' }}>{post.comments_count}</span>
                  </button>
                </div>
              </div>
            )
          })
        )}
      </div>

    </div>
  )
}
