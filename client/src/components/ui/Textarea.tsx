import React from 'react'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  rows?: number
}

export default function Textarea({ label, error, rows = 3, className = '', id, ...rest }: TextareaProps) {
  const textareaId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={textareaId} className="block text-sm font-medium text-text-primary mb-1">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={rows}
        className={`input resize-none ${error ? 'border-coral-strong focus:ring-coral focus:border-coral-strong' : ''} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-coral-strong">{error}</p>}
    </div>
  )
}
