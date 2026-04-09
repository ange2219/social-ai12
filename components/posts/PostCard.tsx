'use client'

import { useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { PLATFORM_NAMES, PLATFORM_COLORS } from '@/types'
import type { Post, Platform } from '@/types'
import { Clock, CheckCircle, XCircle, FileText, Trash2, Send } from 'lucide-react'

const STATUS_CONFIG = {
  draft:     { label: 'Brouillon',  icon: FileText,    cls: 'badge-gray' },
  scheduled: { label: 'Programmé',  icon: Clock,       cls: 'badge-yellow' },
  published: { label: 'Publié',     icon: CheckCircle, cls: 'badge-green' },
  failed:    { label: 'Échec',      icon: XCircle,     cls: 'badge-red' },
  partial:   { label: 'Partiel',    icon: Clock,       cls: 'badge-yellow' },
  deleted:   { label: 'Supprimé',   icon: Trash2,      cls: 'badge-gray' },
} as const satisfies Record<import('@/types').PostStatus, { label: string; icon: typeof FileText; cls: string }>

export function PostCard({ post, onDelete, onPublish }: {
  post: Post
  onDelete: (id: string) => void
  onPublish: (id: string) => void
}) {
  const [loading, setLoading] = useState(false)
  const status = STATUS_CONFIG[post.status]
  const StatusIcon = status.icon

  async function handlePublish() {
    setLoading(true)
    await onPublish(post.id)
    setLoading(false)
  }

  return (
    <div className="card p-4 hover:border-b2 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className={status.cls}>
            <StatusIcon size={11} />
            {status.label}
          </span>
          {post.ai_generated && (
            <span className="badge badge-blue">IA</span>
          )}
        </div>
        <span className="text-t3 text-xs">{formatDateTime(post.created_at)}</span>
      </div>

      {/* Content */}
      <p className="text-t2 text-sm leading-relaxed line-clamp-3 mb-3">{post.content}</p>

      {/* Platforms */}
      <div className="flex items-center gap-1.5 mb-4">
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

      {/* Actions */}
      {post.status === 'draft' && (
        <div className="flex items-center gap-2 pt-3 border-t border-b1">
          <button
            onClick={handlePublish}
            disabled={loading}
            className="btn-primary flex items-center gap-1.5 text-xs py-1.5"
          >
            <Send size={13} />
            {loading ? 'Publication...' : 'Publier'}
          </button>
          <button
            onClick={() => onDelete(post.id)}
            className="btn-ghost flex items-center gap-1.5 text-xs py-1.5 text-t3 hover:text-red"
          >
            <Trash2 size={13} />
            Supprimer
          </button>
        </div>
      )}

      {post.status === 'failed' && post.error_message && (
        <div className="mt-3 p-2 bg-red/5 border border-red/20 rounded-md text-red text-xs">
          {post.error_message}
        </div>
      )}
    </div>
  )
}
