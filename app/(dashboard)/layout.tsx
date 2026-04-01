import { redirect } from 'next/navigation'
import { cache } from 'react'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { DashboardShell } from '@/components/layout/DashboardShell'
import { ToastProvider } from '@/components/ui/Toast'
import type { User } from '@/types'

const getUser = cache(async (id: string) => {
  const admin = createAdminClient()
  const { data } = await admin.from('users').select('*').eq('id', id).single()
  return data
})

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const user = await getUser(authUser.id)
  if (!user) redirect('/login')

  return (
    <ToastProvider>
      <DashboardShell user={user as User} topbar={null}>
        {children}
      </DashboardShell>
    </ToastProvider>
  )
}
