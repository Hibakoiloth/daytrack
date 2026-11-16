import { get, post, put, del } from './api'
import type { Reminder } from '@/types'

interface ReminderParams {
  upcoming?: boolean
  showDismissed?: boolean
}

function buildQuery(params?: ReminderParams): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

export function getReminders(params?: ReminderParams): Promise<Reminder[]> {
  return get<Reminder[]>(`/api/reminders${buildQuery(params)}`)
}

export function getReminder(id: number): Promise<Reminder> {
  return get<Reminder>(`/api/reminders/${id}`)
}

export function createReminder(data: Partial<Reminder>): Promise<Reminder> {
  return post<Reminder>('/api/reminders', data)
}

export function updateReminder(id: number, data: Partial<Reminder>): Promise<Reminder> {
  return put<Reminder>(`/api/reminders/${id}`, data)
}

export function deleteReminder(id: number): Promise<void> {
  return del(`/api/reminders/${id}`)
}

export function getDueReminders(): Promise<Reminder[]> {
  return get<Reminder[]>('/api/reminders/due')
}
