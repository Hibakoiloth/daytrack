import { get, post, put, del } from './api'
import type { Subject, Topic } from '@/types'

export function getSubjects(): Promise<Subject[]> {
  return get<Subject[]>('/api/subjects')
}

export function getSubject(id: number): Promise<Subject> {
  return get<Subject>(`/api/subjects/${id}`)
}

export function createSubject(data: Partial<Subject>): Promise<Subject> {
  return post<Subject>('/api/subjects', data)
}

export function updateSubject(id: number, data: Partial<Subject>): Promise<Subject> {
  return put<Subject>(`/api/subjects/${id}`, data)
}

export function deleteSubject(id: number): Promise<void> {
  return del(`/api/subjects/${id}`)
}

export function getSubjectTopics(id: number): Promise<Topic[]> {
  return get<Topic[]>(`/api/subjects/${id}/topics`)
}
