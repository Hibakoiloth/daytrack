import React, { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import MainLayout from './layouts/MainLayout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { useReminders } from './hooks/useReminders'
import { X, Bell } from 'lucide-react'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const StudyTracker = lazy(() => import('./pages/StudyTracker'))
const SubjectsTopics = lazy(() => import('./pages/SubjectsTopics'))
const ActivityLog = lazy(() => import('./pages/ActivityLog'))
const Calendar = lazy(() => import('./pages/Calendar'))
const TasksReminders = lazy(() => import('./pages/TasksReminders'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Settings = lazy(() => import('./pages/Settings'))

function ReminderBanner() {
  const { dueReminders, dismissReminder, completeReminder } = useReminders()

  if (dueReminders.length === 0) return null

  return (
    <div className="fixed bottom-4 right-4 z-40 flex flex-col gap-2 max-w-sm w-full">
      {dueReminders.map((reminder) => (
        <div
          key={reminder.id}
          className="bg-white border border-border rounded-xl shadow-modal px-4 py-3 flex items-start gap-3"
        >
          <Bell size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text-primary truncate">{reminder.title}</p>
            {reminder.description && (
              <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{reminder.description}</p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => completeReminder(reminder.id)}
                className="text-xs text-primary font-medium hover:underline"
              >
                Done
              </button>
              <button
                onClick={() => dismissReminder(reminder.id)}
                className="text-xs text-text-secondary hover:underline"
              >
                Dismiss
              </button>
            </div>
          </div>
          <button
            onClick={() => dismissReminder(reminder.id)}
            className="flex-shrink-0 text-text-secondary hover:text-text-primary transition-colors"
            aria-label="Dismiss reminder"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

function PageFallback() {
  return (
    <div className="flex items-center justify-center h-48">
      <LoadingSpinner size="md" />
    </div>
  )
}

export default function App() {
  return (
    <>
      <Suspense fallback={<PageFallback />}>
        <Routes>
          <Route element={<MainLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/study-tracker" element={<StudyTracker />} />
            <Route path="/subjects" element={<SubjectsTopics />} />
            <Route path="/subjects/:id" element={<SubjectsTopics />} />
            <Route path="/activity-log" element={<ActivityLog />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/tasks" element={<TasksReminders />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </Suspense>
      <ReminderBanner />
    </>
  )
}
