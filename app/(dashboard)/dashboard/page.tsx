import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { LiveClock } from '@/components/dashboard/LiveClock'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { PostsTableCard } from '@/components/dashboard/PostsTableCard'
import { CommunityPreview } from '@/components/dashboard/CommunityPreview'
import { TypingGreeting } from '@/components/dashboard/TypingGreeting'
import { AutoRefresh } from '@/components/dashboard/AutoRefresh'
import { type Plan, PLAN_LIMITS } from '@/types'

const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
  twitter: 'X (Twitter)', linkedin: 'LinkedIn',
}

function PlatformIcon({ platform }: { platform: string }) {
  switch (platform) {
    case 'linkedin': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/>
        <rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/>
      </svg>
    )
    case 'instagram': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <rect x="2" y="2" width="20" height="20" rx="5"/>
        <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
        <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
      </svg>
    )
    case 'twitter': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
      </svg>
    )
    case 'facebook': return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
      </svg>
    )
    default: return null
  }
}

function getAiTip(weeks: number[], bestPlatform: string | null, avgPerWeek: number): string {
  if (avgPerWeek === 0) return "Commencez par publier 3 fois cette semaine pour établir une présence régulière."
  if (avgPerWeek < 2) return "Publier au moins 3×/semaine double en moyenne le taux d'engagement. Vous y êtes presque !"
  if (weeks[3] === 0) return "Vous n'avez encore rien publié cette semaine — c'est le moment idéal pour un post."
  if (bestPlatform === 'instagram') return "Instagram performe mieux avec des posts le mardi et vendredi entre 11h et 13h."
  if (bestPlatform === 'facebook') return "Facebook favorise les posts avec une question ou un appel à l'action explicite."
  if (bestPlatform === 'linkedin') return "LinkedIn : les posts du mardi matin génèrent 2× plus d'impressions professionnelles."
  return "La régularité est clé : publier à heure fixe améliore la portée organique jusqu'à 40%."
}

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const admin = createAdminClient()

  const [allPostsRes, userRes, scheduledRes, baselinesRes] = await Promise.all([
    admin.from('posts').select('*').eq('user_id', authUser.id).order('created_at', { ascending: false }),
    admin.from('users').select('full_name, plan').eq('id', authUser.id).single(),
    admin.from('posts')
      .select('id, content, platforms, scheduled_at')
      .eq('user_id', authUser.id).eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true }).limit(3),
    admin.from('social_baselines')
      .select('platform, baseline_followers, current_followers, posts_count, baseline_at, refreshed_at')
      .eq('user_id', authUser.id),
  ])

  const allPosts       = allPostsRes.data || []
  const userData       = userRes.data
  const scheduledPosts = scheduledRes.data || []
  const baselines      = (baselinesRes as any).data || []

  // Fetch community posts safely — table may not exist yet
  let topCommunityPosts: any[] = []
  const communityRes = await admin
    .from('vw_community_posts')
    .select('*')
    .order('likes_count', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(3)
  if (!communityRes.error) {
    topCommunityPosts = communityRes.data || []
  }

  const postIds = allPosts.map((p: any) => p.id)
  const analyticsRes = postIds.length > 0
    ? await admin.from('analytics').select('post_id, platform, likes, comments, shares, impressions').in('post_id', postIds)
    : { data: [] }
  const analytics = analyticsRes.data || []

  const totalImpressions = analytics.reduce((s: number, a: any) => s + (a.impressions || 0), 0)
  const totalEngagement  = analytics.reduce((s: number, a: any) => s + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0)
  const publishedCount   = allPosts.filter((p: any) => p.status === 'published').length
  const generatedCount   = allPosts.filter((p: any) => p.status !== 'deleted').length

  const engagementRate = totalImpressions > 0 ? ((totalEngagement / totalImpressions) * 100).toFixed(1) : '0.0'
  
  // Calcul de la série (streak)
  let streak = 0
  const publishedDates = new Set(allPosts
    .filter((p: any) => p.status === 'published')
    .map((p: any) => new Date(p.created_at).toDateString())
  )
  let checkDate = new Date()
  while (publishedDates.has(checkDate.toDateString())) {
    streak++
    checkDate.setDate(checkDate.getDate() - 1)
  }

  const now = new Date()
  const weeks: number[] = [0, 0, 0, 0]
  for (const post of allPosts) {
    if (post.status !== 'published') continue
    const diffDays = Math.floor((now.getTime() - new Date(post.created_at).getTime()) / 86400000)
    const wi = Math.floor(diffDays / 7)
    if (wi < 4) weeks[3 - wi]++
  }
  const avgPerWeek = parseFloat((weeks.reduce((a: number, b: number) => a + b, 0) / 4).toFixed(1))

  const platformEng: Record<string, number> = {}
  for (const a of analytics) {
    platformEng[a.platform] = (platformEng[a.platform] || 0) + (a.likes || 0) + (a.comments || 0) + (a.shares || 0)
  }
  const bestPlatform = Object.entries(platformEng).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  const nextPost = scheduledPosts[0]
  const aiTip = getAiTip(weeks, bestPlatform, avgPerWeek)
  const firstName = userData?.full_name?.split(' ')[0] || authUser.email?.split('@')[0] || 'vous'

  return (
    <>
      <AutoRefresh />
      <WelcomeBanner firstName={firstName} />

      {/* Greeting */}
      <div className="greeting-row">
        <div className="greeting-left">
          <TypingGreeting firstName={firstName} />
          <p>Votre tableau de bord est prêt. Continuez à publier régulièrement !</p>
        </div>
        
        <div style={{ display: 'flex', gap: '12px' }}>
          {/* Prochain Post avec le style exact de l'horloge */}
          <div className="time-box">
            <div style={{ textAlign: 'right' }}>
              <div className="time-label">Prochain Post</div>
              <div className="time-val">
                {nextPost ? (
                  new Date(nextPost.scheduled_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
                ) : (
                  "Aucun"
                )}
              </div>
            </div>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z"/>
            </svg>
          </div>

          <LiveClock />
        </div>
      </div>

      {/* KPI Row */}
      <div className="kpi-row">
        <div className="kpi-card c-blue">
          <div className="kpi-card-header">
            <span className="kpi-label">Taux d'Engagement</span>
            <div className="kpi-icon ki-blue">
              <svg viewBox="0 0 24 24"><path d="M12 20.25c4.97 0 9-3.694 9-8.25s-4.03-8.25-9-8.25S3 7.444 3 12c0 2.104.859 4.023 2.273 5.48.432.447.74 1.04.586 1.641a4.483 4.483 0 0 1-.923 1.785 0.225.225 0 0 0 .192.358 5.976 5.976 0 0 0 3.07-1.127c.231-.15.525-.157.77-.042A8.97 8.97 0 0 0 12 20.25Z"/></svg>
            </div>
          </div>
          <div className="kpi-val">{engagementRate}%</div>
          <div className="kpi-bottom">
            <span className="kpi-score-label">Engagement / Impressions</span>
          </div>
        </div>

        <div className="kpi-card c-teal">
          <div className="kpi-card-header">
            <span className="kpi-label">Engagement total</span>
            <div className="kpi-icon ki-teal">
              <svg viewBox="0 0 24 24"><path d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"/></svg>
            </div>
          </div>
          <div className="kpi-val">{totalEngagement > 999 ? (totalEngagement / 1000).toFixed(1) + 'K' : totalEngagement}</div>
          <div className="kpi-bottom">
            <span className="kpi-score-label">Likes · Commentaires · Partages</span>
          </div>
        </div>

        <div className="kpi-card c-green">
          <div className="kpi-card-header">
            <span className="kpi-label">Série (Streak)</span>
            <div className="kpi-icon ki-green">
              <svg viewBox="0 0 24 24"><path d="M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z"/></svg>
            </div>
          </div>
          <div className="kpi-val">{streak} <small>jours</small></div>
          <div className="kpi-bottom">
            <span className="kpi-score-label">{streak > 0 ? '🔥 Continuez comme ça !' : '❄️ Commencez votre série'}</span>
          </div>
        </div>

        <div className="kpi-card c-orange">
          <div className="kpi-card-header">
            <span className="kpi-label">Impressions</span>
            <div className="kpi-icon ki-orange">
              <svg viewBox="0 0 24 24"><path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"/><path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/></svg>
            </div>
          </div>
          <div className="kpi-val">{totalImpressions > 999 ? (totalImpressions / 1000).toFixed(1) + 'K' : totalImpressions}</div>
          <div className="kpi-bottom">
            <span className="kpi-score-label">Vues totales cumulées</span>
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="bottom-row">
        <PostsTableCard posts={allPosts} analytics={analytics} aiTip={aiTip} />

        {/* Right column */}
        <div className="right-col">

          <CommunityPreview topPosts={topCommunityPosts} />

          {/* Suggestions IA */}
          <div className="sugg-card">
            <div className="card-title" style={{ marginBottom: 6 }}>Suggestions IA</div>
            <div className="sugg-legend">
              <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--purple)' }} />Engagement</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--teal)' }} />Portée</div>
              <div className="legend-item"><div className="legend-dot" style={{ background: 'var(--green)' }} />Régularité</div>
            </div>
            <div className="sugg-item">
              <div className="sugg-avatar" style={{ background: 'rgba(245,158,11,.12)', color: 'var(--orange)' }}>
                <svg viewBox="0 0 24 24"><path d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z"/></svg>
              </div>
              <div className="sugg-info">
                <div className="sugg-name">Publier 3×/semaine</div>
                <div className="sugg-sub">Doublez votre engagement</div>
              </div>
              <div className="sugg-bar-wrap"><div className="sugg-bar-bg"><div className="sugg-bar-fill" style={{ width: '80%', background: 'var(--purple)' }} /></div></div>
            </div>
            <div className="sugg-item">
              <div className="sugg-avatar" style={{ background: 'rgba(6,182,212,.10)', color: 'var(--teal)' }}>
                <svg viewBox="0 0 24 24"><path d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
              </div>
              <div className="sugg-info">
                <div className="sugg-name">Publier entre 18h–20h</div>
                <div className="sugg-sub">Meilleure heure d'engagement</div>
              </div>
              <div className="sugg-bar-wrap"><div className="sugg-bar-bg"><div className="sugg-bar-fill" style={{ width: '65%', background: 'var(--teal)' }} /></div></div>
            </div>
            <div className="sugg-item">
              <div className="sugg-avatar" style={{ background: 'rgba(16,185,129,.10)', color: 'var(--green)' }}>
                <svg viewBox="0 0 24 24"><path d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 0 0 1.5-1.5V6a1.5 1.5 0 0 0-1.5-1.5H3.75A1.5 1.5 0 0 0 2.25 6v12a1.5 1.5 0 0 0 1.5 1.5Zm10.5-11.25h.008v.008h-.008V8.25Zm.375 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"/></svg>
              </div>
              <div className="sugg-info">
                <div className="sugg-name">Ajouter plus de visuels</div>
                <div className="sugg-sub">+40% de portée organique</div>
              </div>
              <div className="sugg-bar-wrap"><div className="sugg-bar-bg"><div className="sugg-bar-fill" style={{ width: '45%', background: 'var(--green)' }} /></div></div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
