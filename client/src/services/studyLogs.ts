import { get, post, put, del } from './api'
import type { StudyLog } from '@/types'

interface StudyLogParams {
  subjectId?: number
  topicId?: number
  startDate?: string
  endDate?: string
  date?: string
}

function buildQuery(params?: StudyLogParams): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

export function getStudyLogs(params?: StudyLogParams): Promise<StudyLog[]> {
  return get<StudyLog[]>(`/api/study-logs${buildQuery(params)}`)
}

export function getStudyLog(id: number): Promise<StudyLog> {
  return get<StudyLog>(`/api/study-logs/${id}`)
}

export function createStudyLog(data: Partial<StudyLog>): Promise<StudyLog> {
  return post<StudyLog>('/api/study-logs', data)
}

export function updateStudyLog(id: number, data: Partial<StudyLog>): Promise<StudyLog> {
  return put<StudyLog>(`/api/study-logs/${id}`, data)
}

export function deleteStudyLog(id: number): Promise<void> {
  return del(`/api/study-logs/${id}`)
}
