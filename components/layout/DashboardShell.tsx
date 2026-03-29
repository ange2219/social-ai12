'use client'

import { useState, useEffect } from 'react'
import { Sidebar } from './Sidebar'
import type { User } from '@/types'

export function DashboardShell({ user, topbar, children }: {
  user: User
  topbar: React.ReactNode
  children: React.ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem('sb-collapsed')
    if (saved === 'true') setCollapsed(true)
  }, [])

  function toggle() {
    setCollapsed(prev => {
      localStorage.setItem('sb-collapsed', String(!prev))
      return !prev
    })
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090B' }}>
      <Sidebar user={user} collapsed={collapsed} onToggle={toggle} />
      <div className={`main${collapsed ? ' main-exp' : ''}`}>
        {topbar}
        {children}
      </div>
    </div>
  )
}
