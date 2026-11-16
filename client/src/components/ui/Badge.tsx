import React from 'react'

type BadgeVariant = 'primary' | 'success' | 'warning' | 'danger' | 'neutral' | 'productive' | 'distracting'
type BadgeSize = 'sm' | 'md'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  size?: BadgeSize
  className?: string
}

const variantClasses: Record<BadgeVariant, string> = {
  primary: 'bg-lavender-pale text-primary',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-coral-strong',
  neutral: 'bg-bg-secondary text-text-secondary',
  productive: 'badge-productive',
  distracting: 'badge-distracting',
}

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-xs px-2 py-1',
}

export default function Badge({ children, variant = 'neutral', size = 'sm', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      {children}
    </span>
  )
}
