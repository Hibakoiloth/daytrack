import { get } from './api'
import type { DashboardSummary, DailyStudy, SubjectStudyTotal, TopicStudyTotal, ActivityStats, CategoryBreakdown } from '@/types'

interface DateRangeParams {
  startDate?: string
  endDate?: string
  groupBy?: string
}

function buildQuery(params?: Record<string, string | number | undefined>): string {
  if (!params) return ''
  const entries = Object.entries(params).filter(([, v]) => v !== undefined && v !== '')
  if (entries.length === 0) return ''
  return '?' + entries.map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`).join('&')
}

export function getDashboardSummary(): Promise<DashboardSummary> {
  return get<DashboardSummary>('/api/analytics/dashboard')
}

export interface StudyAnalytics {
  daily: DailyStudy[]
  totalMinutes: number
}

export function getStudyAnalytics(params?: DateRangeParams): Promise<StudyAnalytics> {
  return get<StudyAnalytics>(`/api/analytics/study${buildQuery(params as Record<string, string | undefined>)}`)
}

export function getSubjectAnalytics(params?: DateRangeParams): Promise<SubjectStudyTotal[]> {
  return get<SubjectStudyTotal[]>(`/api/analytics/subjects${buildQuery(params as Record<string, string | undefined>)}`)
}

export function getTopicAnalytics(params?: DateRangeParams): Promise<TopicStudyTotal[]> {
  return get<TopicStudyTotal[]>(`/api/analytics/topics${buildQuery(params as Record<string, string | undefined>)}`)
}

export interface ActivityAnalyticsResult {
  stats: ActivityStats
  breakdown: CategoryBreakdown[]
}

export function getActivityAnalytics(params?: DateRangeParams): Promise<ActivityAnalyticsResult> {
  return get<ActivityAnalyticsResult>(`/api/analytics/activity${buildQuery(params as Record<string, string | undefined>)}`)
}
