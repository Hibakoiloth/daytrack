import React from 'react'

interface CardProps {
  title?: string
  subtitle?: string
  actions?: React.ReactNode
  children?: React.ReactNode
  className?: string
}

export default function Card({ title, subtitle, actions, children, className = '' }: CardProps) {
  const hasHeader = title || subtitle || actions

  return (
    <div className={`card ${className}`}>
      {hasHeader && (
        <div className="flex items-start justify-between mb-4">
          <div>
            {title && <h3 className="text-base font-semibold text-text-primary">{title}</h3>}
            {subtitle && <p className="text-xs text-text-secondary mt-0.5">{subtitle}</p>}
          </div>
          {actions && <div className="flex-shrink-0 ml-4">{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
