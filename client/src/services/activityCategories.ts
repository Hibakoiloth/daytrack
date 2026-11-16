import { get, post, put, del } from './api'
import type { ActivityCategory } from '@/types'

export function getActivityCategories(): Promise<ActivityCategory[]> {
  return get<ActivityCategory[]>('/api/activity-categories')
}

export function createActivityCategory(data: Partial<ActivityCategory>): Promise<ActivityCategory> {
  return post<ActivityCategory>('/api/activity-categories', data)
}

export function updateActivityCategory(id: number, data: Partial<ActivityCategory>): Promise<ActivityCategory> {
  return put<ActivityCategory>(`/api/activity-categories/${id}`, data)
}

export function deleteActivityCategory(id: number): Promise<void> {
  return del(`/api/activity-categories/${id}`)
}
