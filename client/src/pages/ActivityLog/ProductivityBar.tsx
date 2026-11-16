import React from 'react'
import type { ActivityStats } from '@/types'

interface ProductivityBarProps {
  stats: ActivityStats
}

function formatMinutes(minutes: number): string {
  if (minutes === 0) return '0m'
  if (minutes < 60) return `${minutes}m`
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

const SEGMENTS = [
  { key: 'productiveMinutes' as const, label: 'Productive', color: '#6976CC' },
  { key: 'neutralMinutes' as const, label: 'Neutral', color: '#C4C9E5' },
  { key: 'distractingMinutes' as const, label: 'Distracting', color: '#E98F91' },
]

export default function ProductivityBar({ stats }: ProductivityBarProps) {
  const total = stats.totalMinutes

  if (total === 0) {
    return (
      <div className="space-y-2">
        <div className="h-3 rounded-full bg-bg-secondary w-full" />
        <p className="text-xs text-text-secondary text-center">No activity logged for this period</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Stacked bar */}
      <div className="flex h-3 rounded-full overflow-hidden w-full bg-bg-secondary">
        {SEGMENTS.map(({ key, label, color }) => {
          const value = stats[key]
          if (value <= 0) return null
          const pct = (value / total) * 100
          return (
            <div
              key={key}
              className="h-full transition-all duration-300"
              style={{ width: `${pct}%`, backgroundColor: color }}
              title={`${label}: ${formatMinutes(value)} (${Math.round(pct)}%)`}
            />
          )
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-5 gap-y-1.5">
        {SEGMENTS.map(({ key, label, color }) => {
          const value = stats[key]
          const pct = total > 0 ? Math.round((value / total) * 100) : 0
          return (
            <div key={key} className="flex items-center gap-1.5 text-xs">
              <span
                className="w-2.5 h-2.5 rounded-sm flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-text-secondary">{label}</span>
              <span className="font-medium text-text-primary">{formatMinutes(value)}</span>
              <span className="text-text-secondary">({pct}%)</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
