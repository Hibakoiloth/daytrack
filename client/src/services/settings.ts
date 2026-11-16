import { get, put } from './api'
import type { AppSettings } from '@/types'

export function getSettings(): Promise<AppSettings> {
  return get<AppSettings>('/api/settings')
}

export function updateSettings(data: Partial<AppSettings>): Promise<AppSettings> {
  return put<AppSettings>('/api/settings', data)
}

export async function exportData(): Promise<void> {
  const response = await fetch('/api/export')
  if (!response.ok) {
    throw new Error('Export failed')
  }
  const blob = await response.blob()
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  const contentDisposition = response.headers.get('Content-Disposition')
  const filename = contentDisposition
    ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') || 'daytrack-export.json'
    : 'daytrack-export.json'
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
