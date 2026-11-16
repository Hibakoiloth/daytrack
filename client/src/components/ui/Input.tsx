import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export default function Input({ label, error, helper, className = '', id, ...rest }: InputProps) {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined)

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-text-primary mb-1">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${error ? 'border-coral-strong focus:ring-coral focus:border-coral-strong' : ''} ${className}`}
        {...rest}
      />
      {error && <p className="mt-1 text-xs text-coral-strong">{error}</p>}
      {helper && !error && <p className="mt-1 text-xs text-text-secondary">{helper}</p>}
    </div>
  )
}
