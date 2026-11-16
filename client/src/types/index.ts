export interface Subject {
  id: number
  name: string
  description?: string
  color: string
  createdAt: string
  updatedAt: string
  totalMinutes?: number
  topicCount?: number
  completedTopics?: number
}

export interface Topic {
  id: number
  subjectId: number
  title: string
  description?: string
  status: 'not_started' | 'in_progress' | 'completed'
  priority?: 'low' | 'medium' | 'high'
  deadline?: string
  targetHours?: number
  createdAt: string
  updatedAt: string
  subjectName?: string
  subjectColor?: string
  totalMinutes?: number
}

export interface StudyLog {
  id: number
  subjectId: number
  topicId?: number
  date: string
  durationMinutes: number
  notes?: string
  createdAt: string
  updatedAt: string
  subjectName?: string
  subjectColor?: string
  topicTitle?: string
}

export interface ActivityCategory {
  id: number
  name: string
  classification: 'productive' | 'neutral' | 'distracting'
  color?: string
  isDefault: boolean
  createdAt: string
}

export interface ActivityLog {
  id: number
  activityName: string
  categoryId?: number
  date: string
  durationMinutes: number
  notes?: string
  createdAt: string
  updatedAt: string
  categoryName?: string
  categoryClassification?: 'productive' | 'neutral' | 'distracting'
  categoryColor?: string
}

export interface CalendarEvent {
  id: number
  title: string
  description?: string
  eventDate: string
  startTime?: string
  endTime?: string
  allDay: boolean
  category: string
  subjectId?: number
  topicId?: number
  createdAt: string
  updatedAt: string
  subjectName?: string
  topicTitle?: string
}

export interface Task {
  id: number
  title: string
  description?: string
  status: 'pending' | 'in_progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  dueDate?: string
  subjectId?: number
  topicId?: number
  createdAt: string
  updatedAt: string
  subjectName?: string
  topicTitle?: string
}

export interface Reminder {
  id: number
  title: string
  description?: string
  reminderDate: string
  reminderTime: string
  taskId?: number
  isDismissed: boolean
  isCompleted: boolean
  createdAt: string
  updatedAt: string
  taskTitle?: string
}

export interface AppSettings {
  dateFormat: string
  timeFormat: string
  defaultDailyStudyGoalMinutes: number
  weekStartDay: string
  theme: string
}

export interface DashboardSummary {
  studyToday: number
  studyWeek: number
  studyMonth: number
  subjectCount: number
  topicCount: number
  completedTopics: number
  inProgressTopics: number
  pendingTasks: number
}

export interface DailyStudy { date: string; minutes: number }
export interface SubjectStudyTotal { subjectId: number; subjectName: string; subjectColor: string; totalMinutes: number }
export interface TopicStudyTotal { topicId: number; topicTitle: string; subjectName: string; subjectColor: string; totalMinutes: number; targetHours?: number; status: string }
export interface ActivityStats { totalMinutes: number; productiveMinutes: number; neutralMinutes: number; distractingMinutes: number; productivityPercent: number }
export interface CategoryBreakdown { categoryId: number; categoryName: string; classification: string; color?: string; totalMinutes: number }

export interface ApiResponse<T> { data: T; message?: string }
export interface PaginatedResponse<T> { data: T[]; total: number }
