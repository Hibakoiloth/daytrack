import { get, post, put, del } from './api'
import type { Task } from '@/types'

interface TaskParams {
  status?: string
  priority?: string
  subjectId?: number
  search?: string
}

function buildQuery(params?: TaskParams): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

export function getTasks(params?: TaskParams): Promise<Task[]> {
  return get<Task[]>(`/api/tasks${buildQuery(params)}`)
}

export function getTask(id: number): Promise<Task> {
  return get<Task>(`/api/tasks/${id}`)
}

export function createTask(data: Partial<Task>): Promise<Task> {
  return post<Task>('/api/tasks', data)
}

export function updateTask(id: number, data: Partial<Task>): Promise<Task> {
  return put<Task>(`/api/tasks/${id}`, data)
}

export function deleteTask(id: number): Promise<void> {
  return del(`/api/tasks/${id}`)
}
