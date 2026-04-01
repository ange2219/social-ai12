import { PLATFORM_NAMES, PLATFORM_COLORS } from '@/types'
import type { Platform } from '@/types'

const PLATFORM_CHAR_LIMITS: Partial<Record<Platform, number>> = {
  twitter: 280,
  instagram: 2000,
  linkedin: 3000,
  facebook: 2000,
  tiktok: 300,
}

export function PlatformPreview({ platform, content }: { platform: Platform; content: string }) {
  const limit = PLATFORM_CHAR_LIMITS[platform]
  const count = content.length
  const over = limit ? count > limit : false
  const color = PLATFORM_COLORS[platform]

  return (
    <div className="card p-4">
      {/* Platform header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div
            className="w-2 h-2 rounded-full"
            style={{ background: color }}
          />
          <span className="text-sm font-medium text-t1">{PLATFORM_NAMES[platform]}</span>
        </div>
        {limit && (
          <span className={`text-xs font-mono ${over ? 'text-red' : 'text-t3'}`}>
            {count}/{limit}
          </span>
        )}
      </div>

      {/* Preview bubble */}
      <div
        className="bg-s2 rounded-lg p-3 text-sm text-t2 leading-relaxed whitespace-pre-wrap border-l-2"
        style={{ borderColor: color }}
      >
        {content || <span className="text-t3 italic">Aperçu du post…</span>}
      </div>

      {over && (
        <p className="text-red text-xs mt-2">
          ⚠ Dépasse la limite de {limit} caractères ({count - limit!} de trop)
        </p>
      )}
    </div>
  )
}
