import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityFeed } from '@/components/community/CommunityFeed'

export const revalidate = 0

export default async function CommunityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  let posts: any[] = []
  let likedPostIds = new Set<string>()
  let dbReady = true

  try {
    const { data: postsData } = await admin
      .from('vw_community_posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    const { data: userLikes } = await admin
      .from('community_likes')
      .select('post_id')
      .eq('user_id', user.id)

    posts = postsData || []
    likedPostIds = new Set((userLikes || []).map((l: any) => l.post_id))
  } catch {
    dbReady = false
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem 0' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--t1)', marginBottom: '.5rem' }}>Mur d'entraide</h1>
        <p style={{ color: 'var(--t2)', fontSize: '.95rem' }}>
          Échangez des idées, posez vos questions et partagez vos meilleures astuces avec la communauté des créateurs.
        </p>
      </header>

      {!dbReady ? (
        <div style={{ background: 'var(--card)', border: '1px dashed var(--b1)', borderRadius: 12, padding: '3rem', textAlign: 'center', color: 'var(--t2)' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⚠️</div>
          <div style={{ fontWeight: 700, marginBottom: '.5rem', color: 'var(--t1)' }}>Configuration requise</div>
          <p style={{ fontSize: '.9rem' }}>Les tables de la communauté n'ont pas encore été créées.<br/>Exécutez le script <code>supabase/migration_community.sql</code> dans votre éditeur SQL Supabase.</p>
        </div>
      ) : (
        <CommunityFeed
          initialPosts={posts}
          currentUserId={user.id}
          initialLikedIds={Array.from(likedPostIds)}
        />
      )}
    </div>
  )
}
