import React from 'react'

interface DurationInputProps {
  value: number
  onChange: (minutes: number) => void
  label?: string
  error?: string
}

export default function DurationInput({ value, onChange, label, error }: DurationInputProps) {
  const hours = Math.floor(value / 60)
  const minutes = value % 60

  function handleHoursChange(e: React.ChangeEvent<HTMLInputElement>) {
    const h = Math.max(0, Math.min(23, parseInt(e.target.value) || 0))
    onChange(h * 60 + minutes)
  }

  function handleMinutesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const m = Math.max(0, Math.min(59, parseInt(e.target.value) || 0))
    onChange(hours * 60 + m)
  }

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-text-primary mb-1">{label}</label>
      )}
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 flex-1">
          <input
            type="number"
            min={0}
            max={23}
            value={hours}
            onChange={handleHoursChange}
            className="input text-center w-16"
            aria-label="Hours"
          />
          <span className="text-xs text-text-secondary font-medium">h</span>
        </div>
        <div className="flex items-center gap-1 flex-1">
          <input
            type="number"
            min={0}
            max={59}
            value={minutes}
            onChange={handleMinutesChange}
            className="input text-center w-16"
            aria-label="Minutes"
          />
          <span className="text-xs text-text-secondary font-medium">m</span>
        </div>
      </div>
      {error && <p className="mt-1 text-xs text-coral-strong">{error}</p>}
    </div>
  )
}
