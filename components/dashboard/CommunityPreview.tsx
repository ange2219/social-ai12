'use client'

import Link from 'next/link'
import { Heart, MessageCircle } from 'lucide-react'

export function CommunityPreview({ topPosts }: { topPosts: any[] }) {
  return (
    <div className="sugg-card" style={{ padding: '1.25rem' }}>
      <div className="card-title" style={{ marginBottom: '.2rem' }}>Communauté</div>
      <p style={{ fontSize: '.8rem', color: 'var(--t2)', marginBottom: '1.2rem' }}>
        Les posts les plus populaires du moment.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '.8rem' }}>
        {topPosts.length === 0 ? (
          <div style={{ fontSize: '.85rem', color: 'var(--t3)', textAlign: 'center', padding: '1rem 0' }}>
            Aucun post pour le moment. Soyez le premier !
          </div>
        ) : (
          topPosts.map(post => (
            <Link key={post.id} href="/community" style={{ textDecoration: 'none' }}>
              <div style={{ 
                background: 'var(--s2)', 
                border: '1px solid var(--b1)', 
                borderRadius: '8px', 
                padding: '.8rem',
                transition: 'all 0.2s',
                cursor: 'pointer'
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(123,92,245,0.4)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--b1)'}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.4rem' }}>
                  <div style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--card)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {post.avatar_url ? <img src={post.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt=""/> : <span style={{ color: 'var(--t2)', fontSize: '.6rem', fontWeight: 700 }}>{(post.full_name || 'U').slice(0, 2).toUpperCase()}</span>}
                  </div>
                  <span style={{ fontSize: '.8rem', fontWeight: 600, color: 'var(--t1)' }}>{post.full_name || 'Utilisateur'}</span>
                </div>
                
                <p style={{ fontSize: '.85rem', color: 'var(--t1)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: '.6rem', lineHeight: 1.4 }}>
                  {post.content}
                </p>

                <div style={{ display: 'flex', gap: '1rem', color: 'var(--t3)', fontSize: '.75rem', fontWeight: 600 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem', color: post.likes_count > 0 ? '#ef4444' : 'var(--t3)' }}>
                    <Heart size={12} fill={post.likes_count > 0 ? '#ef4444' : 'none'} /> {post.likes_count}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '.3rem' }}>
                    <MessageCircle size={12} /> {post.comments_count}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>

      <Link href="/community" style={{ 
        display: 'block', textAlign: 'center', marginTop: '1rem', 
        fontSize: '.85rem', fontWeight: 600, color: '#7B5CF5', 
        textDecoration: 'none', background: 'rgba(123,92,245,0.08)',
        padding: '.6rem', borderRadius: '8px', border: '1px solid rgba(123,92,245,0.2)'
      }}>
        Rejoindre la discussion
      </Link>
    </div>
  )
}
