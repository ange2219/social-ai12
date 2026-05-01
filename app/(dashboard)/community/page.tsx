import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CommunityFeed } from '@/components/community/CommunityFeed'

export const revalidate = 0

export default async function CommunityPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()

  // On récupère les posts via la vue qui inclut les infos utilisateur
  const { data: posts } = await admin
    .from('vw_community_posts')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50)

  // On récupère les likes de l'utilisateur connecté pour savoir quels posts il a liké
  const { data: userLikes } = await admin
    .from('community_likes')
    .select('post_id')
    .eq('user_id', user.id)

  const likedPostIds = new Set((userLikes || []).map(l => l.post_id))

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '1rem 0' }}>
      <header style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--t1)', marginBottom: '.5rem' }}>Mur d'entraide</h1>
        <p style={{ color: 'var(--t2)', fontSize: '.95rem' }}>
          Échangez des idées, posez vos questions et partagez vos meilleures astuces avec la communauté des créateurs.
        </p>
      </header>

      <CommunityFeed 
        initialPosts={posts || []} 
        currentUserId={user.id} 
        initialLikedIds={Array.from(likedPostIds)}
      />
    </div>
  )
}
