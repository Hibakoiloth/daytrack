import { get, post, put, del } from './api'
import type { ActivityLog } from '@/types'

interface ActivityLogParams {
  categoryId?: number
  startDate?: string
  endDate?: string
  date?: string
  search?: string
}

function buildQuery(params?: ActivityLogParams): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

export function getActivityLogs(params?: ActivityLogParams): Promise<ActivityLog[]> {
  return get<ActivityLog[]>(`/api/activity-logs${buildQuery(params)}`)
}

export function getActivityLog(id: number): Promise<ActivityLog> {
  return get<ActivityLog>(`/api/activity-logs/${id}`)
}

export function createActivityLog(data: Partial<ActivityLog>): Promise<ActivityLog> {
  return post<ActivityLog>('/api/activity-logs', data)
}

export function updateActivityLog(id: number, data: Partial<ActivityLog>): Promise<ActivityLog> {
  return put<ActivityLog>(`/api/activity-logs/${id}`, data)
}

export function deleteActivityLog(id: number): Promise<void> {
  return del(`/api/activity-logs/${id}`)
}
