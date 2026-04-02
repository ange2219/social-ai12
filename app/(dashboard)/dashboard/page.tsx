import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { IconInstagram, IconFacebook, IconTikTok, IconTwitterX, IconLinkedIn } from '@/components/icons/BrandIcons'
import { WelcomeBanner } from '@/components/dashboard/WelcomeBanner'
import { ProgressionWidget } from '@/components/dashboard/ProgressionWidget'

function PlatformIcon({ platform, size = 17 }: { platform: string; size?: number }) {
  switch (platform) {
    case 'instagram': return <IconInstagram size={size} />
    case 'facebook':  return <IconFacebook size={size} />
    case 'tiktok':    return <IconTikTok size={size} />
    case 'twitter':   return <IconTwitterX size={size} />
    case 'linkedin':  return <IconLinkedIn size={size} />
    default: return null
  }
}


const PLAN_LIMITS: Record<string, number> = { free: 10, premium: 100, business: 999 }
const PLATFORM_NAMES: Record<string, string> = {
  instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok',
  twitter: 'X (Twitter)', linkedin: 'LinkedIn',
}

// Suggestion IA contextuelle basée sur les données
function getAiTip(weeks: number[], bestPlatform: string | null, avgPerWeek: number): string {
  if (avgPerWeek === 0) return "Commencez par publier 3 fois cette semaine pour établir une présence régulière."
  if (avgPerWeek < 2) return "Publier au moins 3x/semaine double en moyenne le taux d'engagement. Vous y êtes presque !"
  if (weeks[3] === 0) return "Vous n'avez encore rien publié cette semaine — c'est le moment idéal pour un post."
  if (bestPlatform === 'instagram') return "Instagram performe mieux avec des posts le mardi et vendredi entre 11h et 13h."
  if (bestPlatform === 'facebook') return "Facebook favorise les posts avec une question ou un appel à l'action explicite."
  if (bestPlatform === 'linkedin') return "LinkedIn : les posts du mardi matin génèrent 2x plus d'impressions professionnelles."
  return "La régularité est clé : publier à heure fixe améliore la portée organique jusqu'à 40%."
}

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
      .eq('user_id', authUser.id)
      .eq('status', 'scheduled')
      .order('scheduled_at', { ascending: true })
      .limit(3),
    admin.from('social_baselines')
      .select('platform, baseline_followers, current_followers, posts_count, baseline_at, refreshed_at')
      .eq('user_id', authUser.id),
  ])

  const allPosts    = allPostsRes.data || []
  const userData    = userRes.data
  const scheduledPosts = scheduledRes.data || []
  const baselines   = (baselinesRes as any).data || []
  // Analytics
  const postIds = allPosts.map((p: any) => p.id)
  const analyticsRes = postIds.length > 0
    ? await admin.from('analytics').select('post_id, platform, likes, comments, shares, impressions').in('post_id', postIds)
    : { data: [] }
  const analytics = analyticsRes.data || []

  // Stats globales
  const totalImpressions = analytics.reduce((s: number, a: any) => s + (a.impressions || 0), 0)
  const totalEngagement  = analytics.reduce((s: number, a: any) => s + (a.likes || 0) + (a.comments || 0) + (a.shares || 0), 0)
  const publishedCount   = allPosts.filter((p: any) => p.status === 'published').length
  const scheduledCount   = allPosts.filter((p: any) => p.status === 'scheduled').length
  const draftCount       = allPosts.filter((p: any) => p.status === 'draft').length

  // Posts publiés par semaine — 4 dernières semaines (sparkline)
  const now = new Date()
  const weeks: number[] = [0, 0, 0, 0]
  for (const post of allPosts) {
    if (post.status !== 'published') continue
    const diffDays = Math.floor((now.getTime() - new Date(post.created_at).getTime()) / 86400000)
    const wi = Math.floor(diffDays / 7)
    if (wi < 4) weeks[3 - wi]++
  }
  const maxWeek    = Math.max(...weeks, 1)
  const avgPerWeek = parseFloat((weeks.reduce((a, b) => a + b, 0) / 4).toFixed(1))

  // Meilleure plateforme
  const platformEng: Record<string, number> = {}
  for (const a of analytics) {
    platformEng[a.platform] = (platformEng[a.platform] || 0) + (a.likes || 0) + (a.comments || 0) + (a.shares || 0)
  }
  const bestPlatform = Object.entries(platformEng).sort((a, b) => b[1] - a[1])[0]?.[0] || null

  // Quota mensuel
  const plan = userData?.plan || 'free'
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const monthRes = await admin.from('posts').select('id', { count: 'exact' })
    .eq('user_id', authUser.id).gte('created_at', monthStart).neq('status', 'deleted')
  const monthCount = monthRes.count || 0
  const planLimit  = PLAN_LIMITS[plan]
  const quotaPct   = planLimit === 999 ? 15 : Math.min(100, Math.round((monthCount / planLimit) * 100))

  // Suggestion IA
  const aiTip = getAiTip(weeks, bestPlatform, avgPerWeek)

  const firstName = userData?.full_name?.split(' ')[0] || authUser.email?.split('@')[0] || 'vous'

  // Sparkline SVG (courbe)
  const sparkW = 200
  const sparkH = 48
  const pts = weeks.map((v, i) => {
    const x = (i / 3) * sparkW
    const y = sparkH - Math.max(4, Math.round((v / maxWeek) * (sparkH - 4)))
    return `${x},${y}`
  })
  const sparkPath = `M ${pts.join(' L ')}`

  return (
    <div className="pc">
      <WelcomeBanner firstName={firstName} />

      {/* ── Topbar ── */}
      <div className="topbar" style={{ marginLeft: '-1.5rem', marginRight: '-1.5rem', marginTop: '-1.5rem', marginBottom: '1.5rem' }}>
        <div className="tb-title">Tableau de bord</div>
        <div className="tb-right">
          <button className="ib" title="WhatsApp">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.52 3.48A11.84 11.84 0 0 0 12 0C5.37 0 0 5.37 0 12c0 2.11.55 4.16 1.6 5.97L0 24l6.18-1.62A11.93 11.93 0 0 0 12 24c6.63 0 12-5.37 12-12 0-3.21-1.25-6.22-3.48-8.52zM12 22c-1.85 0-3.66-.5-5.24-1.44l-.37-.22-3.87 1.02 1.03-3.77-.24-.38A9.96 9.96 0 0 1 2 12C2 6.48 6.48 2 12 2c2.67 0 5.18 1.04 7.07 2.93A9.94 9.94 0 0 1 22 12c0 5.52-4.48 10-10 10zm5.47-7.4c-.3-.15-1.77-.87-2.04-.97-.28-.1-.48-.15-.68.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.68-2.08-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.68-1.63-.93-2.23-.24-.59-.49-.51-.68-.52h-.58c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.3 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.77-.72 2.02-1.42.25-.7.25-1.3.17-1.42-.07-.12-.27-.2-.57-.35z"/>
            </svg>
          </button>
          <button className="ib" title="Notifications">
            <div className="ndot" />
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          {/* Bouton + comme dans Mes Posts */}
          <Link href="/posts/create" className="ib" title="Créer un post" style={{ background: '#4646FF', borderColor: '#4646FF', color: '#fff' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
          </Link>
        </div>
      </div>

      {/* ── Stats row ── */}
      <div className="stats-row">
        <div className="sc">
          <div className="sc-top"><span className="sc-l">Posts publiés</span><div className="sc-ico">📝</div></div>
          <div className="sc-v">{publishedCount}</div>
          <div className="sc-d up">↑ {scheduledCount} programmés</div>
        </div>
        <div className="sc">
          <div className="sc-top"><span className="sc-l">Engagement</span><div className="sc-ico">❤️</div></div>
          <div className="sc-v">{totalEngagement > 1000 ? (totalEngagement / 1000).toFixed(1) + 'K' : totalEngagement}</div>
          <div className="sc-d neu">Likes · Commentaires · Partages</div>
        </div>
        <div className="sc">
          <div className="sc-top"><span className="sc-l">Impressions</span><div className="sc-ico">👁️</div></div>
          <div className="sc-v">{totalImpressions > 1000 ? (totalImpressions / 1000).toFixed(1) + 'K' : totalImpressions}</div>
          <div className="sc-d neu">Vues totales</div>
        </div>
        <div className="sc">
          <div className="sc-top"><span className="sc-l">Brouillons</span><div className="sc-ico">🗂️</div></div>
          <div className="sc-v">{draftCount}</div>
          <div className="sc-d neu">En attente de publication</div>
        </div>
      </div>

      {/* ── Ligne widgets : Sparkline + Score régularité + Meilleure plateforme ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: '.9rem', marginBottom: '.9rem' }}>

        {/* Sparkline activité */}
        <div className="sc">
          <div className="sc-top" style={{ marginBottom: '.75rem' }}>
            <span className="sc-l">Activité — 4 semaines</span>
            <span style={{ fontSize: '.72rem', color: '#4646FF', fontWeight: 600 }}>{avgPerWeek} /sem</span>
          </div>
          <svg width="100%" viewBox={`0 0 ${sparkW} ${sparkH}`} preserveAspectRatio="none" style={{ height: '48px', display: 'block' }}>
            <defs>
              <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4646FF" stopOpacity="0.25"/>
                <stop offset="100%" stopColor="#4646FF" stopOpacity="0"/>
              </linearGradient>
            </defs>
            <path d={`${sparkPath} L ${sparkW},${sparkH} L 0,${sparkH} Z`} fill="url(#spark-grad)" />
            <path d={sparkPath} stroke="#4646FF" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
            {weeks.map((v, i) => (
              <circle
                key={i}
                cx={(i / 3) * sparkW}
                cy={sparkH - Math.max(4, Math.round((v / maxWeek) * (sparkH - 4)))}
                r="3"
                fill={i === 3 ? '#4646FF' : '#27272D'}
                stroke={i === 3 ? '#fff' : '#4646FF'}
                strokeWidth="1.5"
              />
            ))}
          </svg>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '.5rem' }}>
            {['S-3', 'S-2', 'S-1', 'Cette sem.'].map((lbl, i) => (
              <div key={i} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '.72rem', fontWeight: 700, color: i === 3 ? '#4646FF' : '#E4E4E7' }}>{weeks[i]}</div>
                <div style={{ fontSize: '.58rem', color: '#52525C' }}>{lbl}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Score de régularité */}
        <div className="sc" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="sc-top"><span className="sc-l">Régularité</span></div>
          <div>
            <div className="sc-v" style={{ fontSize: '2rem' }}>{avgPerWeek}</div>
            <div style={{ fontSize: '.72rem', color: '#8E8E98', marginTop: '.15rem' }}>posts/semaine en moyenne</div>
          </div>
          <div style={{ marginTop: '.75rem' }}>
            {[1, 2, 3, 4, 5].map(star => (
              <span key={star} style={{ fontSize: '.85rem', color: star <= Math.round(avgPerWeek / 1.4) ? '#4646FF' : '#27272D' }}>●</span>
            ))}
            <div style={{ fontSize: '.68rem', color: '#52525C', marginTop: '.25rem' }}>
              {avgPerWeek === 0 ? 'Commencez à publier !' : avgPerWeek < 2 ? 'À améliorer' : avgPerWeek < 4 ? 'Bonne régularité' : 'Excellent rythme 🔥'}
            </div>
          </div>
        </div>

        {/* Meilleure plateforme */}
        <div className="sc" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div className="sc-top"><span className="sc-l">Meilleure plateforme</span></div>
          {bestPlatform ? (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.65rem', margin: '.5rem 0' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                  <PlatformIcon platform={bestPlatform} size={36} />
                </div>
                <div>
                  <div style={{ fontSize: '.9rem', fontWeight: 700, color: '#F4F4F6' }}>{PLATFORM_NAMES[bestPlatform] || bestPlatform}</div>
                  <div style={{ fontSize: '.7rem', color: '#52525C' }}>{platformEng[bestPlatform]} interactions</div>
                </div>
              </div>
              <div style={{ height: '3px', background: '#27272D', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '100%', background: '#4646FF', borderRadius: '2px' }} />
              </div>
            </>
          ) : (
            <div style={{ fontSize: '.8rem', color: '#52525C', flex: 1, display: 'flex', alignItems: 'center' }}>
              Publiez des posts pour voir vos stats plateformes.
            </div>
          )}
        </div>
      </div>

      {/* ── Ligne : Suggestion IA + Quota + Prochains programmés ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '.9rem', marginBottom: '1.5rem' }}>

        {/* Suggestion IA du jour */}
        <div className="sc" style={{ background: 'linear-gradient(135deg, #0D0D1A 0%, #111113 100%)', borderColor: 'rgba(70,70,255,.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '.5rem', marginBottom: '.65rem' }}>
            <div style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(70,70,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '.85rem' }}>✨</div>
            <span style={{ fontSize: '.72rem', color: '#4646FF', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.06em' }}>Suggestion IA</span>
          </div>
          <p style={{ fontSize: '.8rem', color: '#C4C4CC', lineHeight: 1.55, margin: 0 }}>{aiTip}</p>
        </div>

        {/* Quota mensuel */}
        <div className="sc">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '.5rem' }}>
            <span className="sc-l">Quota mensuel</span>
            <span style={{ fontSize: '.72rem', color: quotaPct >= 80 ? '#EF4444' : '#52525C', fontWeight: 600 }}>
              {monthCount} / {planLimit === 999 ? '∞' : planLimit}
            </span>
          </div>
          <div style={{ height: '6px', background: '#27272D', borderRadius: '3px', overflow: 'hidden', marginBottom: '.6rem' }}>
            <div style={{
              height: '100%', borderRadius: '3px',
              width: `${quotaPct}%`,
              background: quotaPct >= 80 ? '#EF4444' : quotaPct >= 50 ? '#F59E0B' : '#4646FF',
              transition: 'width .4s ease',
            }} />
          </div>
          <div style={{ fontSize: '.72rem', color: '#52525C', lineHeight: 1.4 }}>
            {plan === 'free' ? `Plan Gratuit · ${planLimit - monthCount} posts restants ce mois` : `Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)} · Accès étendu`}
          </div>
          {plan === 'free' && quotaPct >= 70 && (
            <Link href="/settings" style={{ display: 'inline-block', marginTop: '.5rem', fontSize: '.72rem', color: '#4646FF', textDecoration: 'none', fontWeight: 500 }}>
              Passer au Pro →
            </Link>
          )}
        </div>

        {/* Prochains posts programmés */}
        <div className="sc" style={{ padding: '1rem 1.1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '.65rem' }}>
            <span className="sc-l">Programmés</span>
            <Link href="/calendar" style={{ fontSize: '.7rem', color: '#4646FF', textDecoration: 'none' }}>Calendrier →</Link>
          </div>
          {scheduledPosts.length === 0 ? (
            <div style={{ fontSize: '.78rem', color: '#52525C' }}>Aucun post programmé.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '.45rem' }}>
              {scheduledPosts.map((post: any) => (
                <Link key={post.id} href={`/posts/${post.id}/edit`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '.55rem' }}>
                  <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
                    {(post.platforms as string[]).slice(0, 2).map((p: string) => (
                      <div key={p} style={{ width: 14, height: 14, borderRadius: 3, overflow: 'hidden' }}>
                        <PlatformIcon platform={p} size={14} />
                      </div>
                    ))}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '.73rem', color: '#E4E4E7', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{post.content}</div>
                    <div style={{ fontSize: '.63rem', color: '#52525C' }}>
                      {new Date(post.scheduled_at).toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Progression abonnés ── */}
      <ProgressionWidget initialBaselines={baselines} />

    </div>
  )
}
