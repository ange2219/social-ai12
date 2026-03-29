import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ToastProvider } from '@/components/ui/Toast'
import type { User } from '@/types'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const admin = createAdminClient()
  const { data: user } = await admin.from('users').select('*').eq('id', authUser.id).single()
  if (!user) redirect('/login')

  const topbar = (
    <div className="topbar">
      <div className="tb-title" id="tb-t">Tableau de bord</div>
      <div className="tb-right">
        <div className="ib" title="Notifications">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          <div className="ndot" />
        </div>
        <div className="av" style={{ width: '28px', height: '28px', fontSize: '.68rem', cursor: 'pointer', borderRadius: '50%' }}>
          {(user.full_name || user.email || 'U').slice(0, 2).toUpperCase()}
        </div>
      </div>
    </div>
  )

  return (
    <ToastProvider>
      <DashboardShell user={user as User} topbar={topbar}>
        {children}
      </DashboardShell>
    </ToastProvider>
  )
}
