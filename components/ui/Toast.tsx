'use client'

import { useState, useEffect, createContext, useContext, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'
import { cn } from '@/lib/utils'

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const remove = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  const ICONS = { success: CheckCircle, error: AlertCircle, info: Info }
  const COLORS = {
    success: 'border-green/30 bg-green/5 text-green',
    error: 'border-red/30 bg-red/5 text-red',
    info: 'border-accent/30 bg-accent/5 text-accent',
  }

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed bottom-4 right-4 flex flex-col gap-2 pointer-events-none" style={{ zIndex: 9999 }}>
        {toasts.map(t => {
          const Icon = ICONS[t.type]
          return (
            <div
              key={t.id}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg border backdrop-blur-sm shadow-xl animate-fadeUp pointer-events-auto max-w-sm',
                COLORS[t.type]
              )}
            >
              <Icon size={16} className="shrink-0" />
              <span className="text-sm text-t1 flex-1">{t.message}</span>
              <button onClick={() => remove(t.id)} className="text-t3 hover:text-t1 transition-colors">
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
