import { get, post, put, del } from './api'
import type { Topic } from '@/types'

interface TopicParams {
  subjectId?: number
  status?: string
  priority?: string
  search?: string
}

function buildQuery(params?: TopicParams): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

export function getTopics(params?: TopicParams): Promise<Topic[]> {
  return get<Topic[]>(`/api/topics${buildQuery(params)}`)
}

export function getTopic(id: number): Promise<Topic> {
  return get<Topic>(`/api/topics/${id}`)
}

export function createTopic(data: Partial<Topic>): Promise<Topic> {
  return post<Topic>('/api/topics', data)
}

export function updateTopic(id: number, data: Partial<Topic>): Promise<Topic> {
  return put<Topic>(`/api/topics/${id}`, data)
}

export function deleteTopic(id: number): Promise<void> {
  return del(`/api/topics/${id}`)
}
