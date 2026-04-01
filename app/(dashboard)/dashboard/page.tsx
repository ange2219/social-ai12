import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GenerateButton } from '@/components/dashboard/GenerateButton'
import Link from 'next/link'

const PLATFORM_COLORS: Record<string, string> = {
  instagram: '#E1306C', facebook: '#1877F2', tiktok: '#000',
  twitter: '#1DA1F2', linkedin: '#0A66C2',
}
const PLATFORM_SHORT: Record<string, string> = {
  instagram: 'IG', facebook: 'FB', tiktok: 'TK', twitter: 'X', linkedin: 'LI',
}

function stClass(s: string) {
  if (s === 'draft') return 'st st-p'
  if (s === 'scheduled') return 'st st-pub'
  if (s === 'published') return 'st st-a'
  return 'st st-r'
}
function stLabel(s: string) {
  if (s === 'draft') return 'Brouillon'
  if (s === 'scheduled') return 'Programmé'
  if (s === 'published') return 'Publié'
  return 'Rejeté'
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const admin = createAdminClient()

  const [postsRes, userRes] = await Promise.all([
    admin.from('posts').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }).limit(6),
    admin.from('users').select('full_name, plan').eq('id', authUser.id).single(),
  ])

  const posts = postsRes.data || []
  const userData = userRes.data

  const postIds = posts.map((p: any) => p.id)
  const analyticsRes = postIds.length > 0
    ? await admin.from('analytics').select('likes, comments, shares, impressions').in('post_id', postIds)
    : { data: [] }
  const analytics = analyticsRes.data || []

  const totalImpressions = analytics.reduce((s: number, a: any) => s + (a.impressions || 0), 0)
  const totalEngagement = analytics.reduce((s: number, a: any) => s + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0)
  const publishedCount = posts.filter((p: any) => p.status === 'published').length
  const scheduledCount = posts.filter((p: any) => p.status === 'scheduled').length
  const draftCount = posts.filter((p: any) => p.status === 'draft').length
  const totalPosts = posts.length

  const firstName = userData?.full_name?.split(' ')[0] || authUser.email?.split('@')[0] || 'vous'

  return (
    <div className="v2-page">

      {/* ── Hero row — greeting + big stat ── */}
      <div className="v2-hero">
        <div className="v2-hero-left">
          <div className="v2-period">Ce mois-ci</div>
          <div className="v2-bigstat">{totalPosts}</div>
          <div className="v2-bigstat-label">
            Posts créés · <span style={{ color: '#22C55E' }}>↑ {publishedCount} publiés</span>
          </div>
        </div>

        <div className="v2-hero-right">
          <div className="v2-hero-stats">
            <div className="v2-hs">
              <span className="v2-hs-l">Engagement</span>
              <span className="v2-hs-v">{totalEngagement}</span>
            </div>
            <div className="v2-hs">
              <span className="v2-hs-l">Impressions</span>
              <span className="v2-hs-v">{totalImpressions > 1000 ? (totalImpressions / 1000).toFixed(1) + 'K' : totalImpressions}</span>
            </div>
            <div className="v2-hs">
              <span className="v2-hs-l">Programmés</span>
              <span className="v2-hs-v">{scheduledCount}</span>
            </div>
            <div className="v2-hs">
              <span className="v2-hs-l">Brouillons</span>
              <span className="v2-hs-v">{draftCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Quick actions row ── */}
      <div className="v2-actions-row">
        {/* Generate card */}
        <div className="v2-gen-card">
          <div>
            <div className="v2-gen-title">Générer la semaine</div>
            <div className="v2-gen-sub">7 posts avec captions, hashtags et images en 30 secondes</div>
          </div>
          <GenerateButton />
        </div>

        {/* Quick stats cards */}
        <div className="v2-qstats">
          <Link href="/posts/create" className="v2-qcard v2-qcard-blue">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            <span>Nouveau post</span>
          </Link>
          <Link href="/calendar" className="v2-qcard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <span>Calendrier</span>
          </Link>
          <Link href="/analytics" className="v2-qcard">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <line x1="18" y1="20" x2="18" y2="10"/>
              <line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            <span>Analytiques</span>
          </Link>
        </div>
      </div>

      {/* ── Recent posts table ── */}
      <div className="v2-section">
        <div className="v2-section-head">
          <h3>Posts récents</h3>
          <Link href="/posts" className="lk">Voir tous →</Link>
        </div>

        {posts.length === 0 ? (
          <div className="v2-empty">
            <div style={{ fontSize: '2rem', marginBottom: '.75rem' }}>✨</div>
            <div style={{ fontWeight: 700, color: '#F4F4F6', marginBottom: '.3rem' }}>Aucun post pour le moment</div>
            <div style={{ fontSize: '.83rem', color: '#8E8E98' }}>
              Cliquez sur "Générer la semaine" pour créer vos premiers posts.
            </div>
          </div>
        ) : (
          <div className="v2-table-wrap">
            <table className="v2-table">
              <thead>
                <tr>
                  <th>Contenu</th>
                  <th>Plateformes</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {posts.map((post: any) => (
                  <tr key={post.id}>
                    <td className="v2-td-content">
                      <div className="v2-post-text">{post.content}</div>
                    </td>
                    <td>
                      <div className="v2-platforms">
                        {(post.platforms as string[]).slice(0, 4).map((p: string) => (
                          <span
                            key={p}
                            className="v2-plat"
                            style={{ background: PLATFORM_COLORS[p] || '#333' }}
                          >
                            {PLATFORM_SHORT[p] || p.slice(0, 2).toUpperCase()}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td><span className={stClass(post.status)}>{stLabel(post.status)}</span></td>
                    <td className="v2-td-date">
                      {new Date(post.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </td>
                    <td>
                      <Link href={`/posts/${post.id}/edit`} className="v2-view-btn">
                        Voir →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
