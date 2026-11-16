import React from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface StatCardProps {
  label: string
  value: string | number
  unit?: string
  icon: React.ReactNode
  color?: string
  change?: {
    value: number
    label: string
  }
  className?: string
}

export default function StatCard({ label, value, unit, icon, color = '#6976CC', change, className = '' }: StatCardProps) {
  return (
    <div className={`card flex items-start justify-between ${className}`}>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary font-medium uppercase tracking-wide mb-1">{label}</p>
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-text-primary">{value}</span>
          {unit && <span className="text-sm text-text-secondary">{unit}</span>}
        </div>
        {change && (
          <div className={`flex items-center gap-1 mt-1 text-xs ${change.value >= 0 ? 'text-green-600' : 'text-coral-strong'}`}>
            {change.value >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <span>{change.label}</span>
          </div>
        )}
      </div>
      <div
        className="flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ml-3"
        style={{ backgroundColor: `${color}1A` }}
      >
        <span style={{ color }}>{icon}</span>
      </div>
    </div>
  )
}
