import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { formatDate } from '@/lib/utils'
import { PLATFORM_NAMES, PLATFORM_COLORS } from '@/types'
import type { Platform } from '@/types'
import { Calendar, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function CalendarPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const admin = createAdminClient()
  const { data: scheduled } = await admin
    .from('posts')
    .select('*')
    .eq('user_id', user.id)
    .in('status', ['scheduled', 'published'])
    .order('scheduled_at', { ascending: true })
    .limit(50)

  const posts = scheduled || []

  // Grouper par date
  const grouped = posts.reduce<Record<string, typeof posts>>((acc, post) => {
    const date = formatDate(post.scheduled_at || post.published_at || post.created_at)
    if (!acc[date]) acc[date] = []
    acc[date].push(post)
    return acc
  }, {})

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-2xl font-bold text-t1">Calendrier</h1>
          <p className="text-t3 text-sm mt-0.5">Posts programmés et publiés</p>
        </div>
        <Link href="/posts/create" className="btn-primary flex items-center gap-2">
          <Calendar size={16} />
          Programmer un post
        </Link>
      </div>

      {posts.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-20 text-center">
          <div className="w-14 h-14 rounded-xl bg-s2 flex items-center justify-center mb-4">
            <Calendar size={24} className="text-t3" />
          </div>
          <p className="text-t2 font-medium mb-1">Aucun post programmé</p>
          <p className="text-t3 text-sm mb-4">Créez des posts et programmez-les à l'avance</p>
          <Link href="/posts/create" className="btn-primary text-sm">Créer un post</Link>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(grouped).map(([date, datePosts]) => (
            <div key={date}>
              <h3 className="text-t3 text-sm font-medium mb-3 flex items-center gap-2">
                <Calendar size={14} />
                {date}
              </h3>
              <div className="space-y-2">
                {datePosts.map(post => (
                  <div key={post.id} className="card p-4 flex items-start gap-4">
                    <div className="flex items-center gap-1.5 text-t3 text-xs shrink-0 w-16">
                      <Clock size={12} />
                      {post.scheduled_at
                        ? new Date(post.scheduled_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
                        : '—'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-t2 text-sm line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        {(post.platforms as Platform[]).map(p => (
                          <span
                            key={p}
                            className="text-xs px-2 py-0.5 rounded-md font-medium"
                            style={{ background: PLATFORM_COLORS[p] + '20', color: PLATFORM_COLORS[p] }}
                          >
                            {PLATFORM_NAMES[p]}
                          </span>
                        ))}
                      </div>
                    </div>
                    <span className={`badge shrink-0 ${post.status === 'published' ? 'badge-green' : 'badge-yellow'}`}>
                      {post.status === 'published' ? 'Publié' : 'Programmé'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
