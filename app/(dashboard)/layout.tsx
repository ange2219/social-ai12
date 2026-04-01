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

  return (
    <ToastProvider>
      <DashboardShell user={user as User} topbar={null}>
        {children}
      </DashboardShell>
    </ToastProvider>
  )
}
