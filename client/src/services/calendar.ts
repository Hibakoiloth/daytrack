import { get, post, put, del } from './api'
import type { CalendarEvent } from '@/types'

interface CalendarParams {
  startDate?: string
  endDate?: string
  year?: number
  month?: number
  category?: string
}

function buildQuery(params?: CalendarParams): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

export function getCalendarEvents(params?: CalendarParams): Promise<CalendarEvent[]> {
  return get<CalendarEvent[]>(`/api/calendar${buildQuery(params)}`)
}

export function getCalendarEvent(id: number): Promise<CalendarEvent> {
  return get<CalendarEvent>(`/api/calendar/${id}`)
}

export function createCalendarEvent(data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  return post<CalendarEvent>('/api/calendar', data)
}

export function updateCalendarEvent(id: number, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
  return put<CalendarEvent>(`/api/calendar/${id}`, data)
}

export function deleteCalendarEvent(id: number): Promise<void> {
  return del(`/api/calendar/${id}`)
}
