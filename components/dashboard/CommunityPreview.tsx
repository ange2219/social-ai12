'use client'

import Link from 'next/link'



function getInitials(name: string) {
  return (name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function getColor(name: string) {
  const colors = [
    'rgba(123,92,245,0.15)', 'rgba(6,182,212,0.15)',
    'rgba(16,185,129,0.15)', 'rgba(245,158,11,0.15)',
  ]
  const textColors = ['#7B5CF5', '#06b6d4', '#10b981', '#f59e0b']
  const i = (name?.charCodeAt(0) || 0) % colors.length
  return { bg: colors[i], color: textColors[i] }
}

export function CommunityPreview({ topPosts }: { topPosts: any[] }) {
  // Utilise les vrais posts si dispo, sinon les placeholders pour inciter au clic
  const displayPosts = topPosts.slice(0, 3)

  return (
    <div className="sugg-card" style={{ padding: '1.25rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.2rem' }}>
        <div>
          <div className="card-title" style={{ marginBottom: '.1rem' }}>Communauté</div>
          <p style={{ fontSize: '.78rem', color: 'var(--t3)', margin: 0 }}>
            Ce que la communauté partage en ce moment
          </p>
        </div>
        </div>
      </div>

      {/* Posts list — style "Suggestions IA" */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '.9rem' }}>
        {displayPosts.map((post, i) => {
          const { bg, color } = getColor(post.full_name || '')
          const isPlaceholder = !post.user_id
          return (
            <div key={post.id || i} className="sugg-item" style={{ opacity: isPlaceholder ? 0.7 : 1 }}>
              {/* Avatar initiales colorées — même style que l'icône IA */}
              <div className="sugg-avatar" style={{ background: bg, color }}>
                {getInitials(post.full_name || 'U')}
              </div>
              <div className="sugg-info">
                <div className="sugg-name" style={{ fontWeight: 600 }}>
                  {post.full_name || 'Utilisateur'}
                </div>
                <div className="sugg-sub" style={{
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}>
                  {post.content}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '.2rem', flexShrink: 0 }}>
                <span style={{ fontSize: '.7rem', color: post.likes_count > 0 ? '#ef4444' : 'var(--t3)', fontWeight: 700 }}>
                  ♥ {post.likes_count}
                </span>
                <span style={{ fontSize: '.7rem', color: 'var(--t3)', fontWeight: 600 }}>
                  💬 {post.comments_count}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      {displayPosts.length === 0 && (
        <div style={{ fontSize: '.82rem', color: 'var(--t3)', textAlign: 'center', padding: '1rem 0', border: '1px dashed var(--b1)', borderRadius: 8 }}>
          Aucun post pour le moment.
        </div>
      )}

      {/* CTA */}
      <Link href="/community" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '.4rem',
        marginTop: '1.1rem',
        fontSize: '.82rem', fontWeight: 700, color: 'var(--accent)',
        textDecoration: 'none', background: 'rgba(123,92,245,0.07)',
        padding: '.55rem', borderRadius: '8px', border: '1px solid rgba(123,92,245,0.18)',
        transition: 'background 0.2s',
      }}>
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
        Rejoindre la discussion →
      </Link>
    </div>
  )
}
