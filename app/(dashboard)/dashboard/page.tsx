import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { GenerateButton } from '@/components/dashboard/GenerateButton'
import { StatsRow } from '@/components/dashboard/StatsRow'
import Link from 'next/link'

const PLATFORM_DOTS: Record<string, string> = {
  instagram: 'ig', facebook: 'fb', linkedin: 'li', tiktok: 'tk',
}

function stClass(status: string) {
  return status === 'draft' ? 'st-p'
    : status === 'scheduled' ? 'st-pub'
    : status === 'published' ? 'st-a'
    : 'st-r'
}
function stLabel(status: string) {
  return status === 'draft' ? 'En attente'
    : status === 'scheduled' ? 'Programmé'
    : status === 'published' ? 'Publié'
    : 'Rejeté'
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const admin = createAdminClient()

  const postsRes = await admin
    .from('posts')
    .select('*')
    .eq('user_id', authUser.id)
    .order('created_at', { ascending: false })
    .limit(3)

  const posts = postsRes.data || []

  const postIds = posts.map(p => p.id)
  const analyticsRes = postIds.length > 0
    ? await admin.from('analytics').select('likes, comments, shares, impressions').in('post_id', postIds)
    : { data: [] }

  const analytics = analyticsRes.data || []

  const totalImpressions = analytics.reduce((s, a) => s + (a.impressions || 0), 0)
  const totalEngagement = analytics.reduce((s, a) => s + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0)
  const publishedCount = posts.filter(p => p.status === 'published').length
  const scheduledCount = posts.filter(p => p.status === 'scheduled').length

  const stats = [
    { l: 'Posts publiés',    v: String(publishedCount), d: publishedCount > 0 ? '↑ en cours' : 'Aucun encore',      dc: publishedCount > 0 ? 'up' as const : 'neu' as const, ic: '📄' },
    { l: 'Engagement total', v: String(totalEngagement), d: totalEngagement > 0 ? '↑ interactions' : 'Aucun encore', dc: totalEngagement > 0 ? 'up' as const : 'neu' as const, ic: '❤️' },
    { l: 'Impressions',      v: totalImpressions > 1000 ? (totalImpressions / 1000).toFixed(1) + 'K' : String(totalImpressions), d: totalImpressions > 0 ? '↑ vues' : 'Aucune encore', dc: totalImpressions > 0 ? 'up' as const : 'neu' as const, ic: '👁' },
    { l: 'Programmés',       v: String(scheduledCount), d: scheduledCount > 0 ? `${scheduledCount} en attente` : 'Aucun encore', dc: scheduledCount > 0 ? 'neu' as const : 'neu' as const, ic: '🕐' },
  ]

  return (
    <div className="pc">

      {/* Stats animées */}
      <StatsRow stats={stats} />

      {/* gen-band */}
      <div className="gen-band">
        <div className="gen-l">
          <div className="gen-t">Générer les posts de la semaine</div>
          <div className="gen-s">L'IA crée 7 posts avec captions, hashtags et images en 30 secondes.</div>
        </div>
        <GenerateButton />
      </div>

      {/* Posts récents */}
      <div className="sh">
        <h3>Posts récents</h3>
        <Link href="/posts" className="lk">Voir tous →</Link>
      </div>

      {posts.length === 0 ? (
        /* Empty state */
        <div style={{
          background: '#111113',
          border: '1px solid #27272D',
          borderRadius: '10px',
          padding: '3rem',
          textAlign: 'center',
        }}>
          <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>✨</div>
          <div style={{
            fontFamily: "'Bricolage Grotesque', sans-serif",
            fontSize: '.95rem',
            fontWeight: 700,
            color: '#F4F4F6',
            marginBottom: '.4rem',
          }}>
            Aucun post pour le moment
          </div>
          <div style={{ fontSize: '.83rem', color: '#8E8E98', marginBottom: '1.5rem' }}>
            Cliquez sur "Générer maintenant" pour créer vos premiers posts en 30 secondes.
          </div>
        </div>
      ) : (
        <div className="mini-grid">
          {posts.map((post: any) => (
            <div key={post.id} className="mini">
              <div className="mini-img" style={{ background: '#18181C' }}>
                <span>📝</span>
                <div className="pbadge">
                  {(post.platforms as string[]).slice(0, 3).map((p: string) => (
                    <span key={p} className={`pd ${PLATFORM_DOTS[p] || 'ig'}`}>
                      {(PLATFORM_DOTS[p] || 'ig').toUpperCase()}
                    </span>
                  ))}
                </div>
              </div>
              <div className="mini-b">
                <div className="mini-cap">{post.content}</div>
                <div className="mini-ft">
                  <span className={`st ${stClass(post.status)}`}>{stLabel(post.status)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
