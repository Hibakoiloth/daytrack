import { useState, useEffect, useCallback } from 'react'
import type { Reminder } from '@/types'
import { getDueReminders, updateReminder } from '@/services/reminders'

const POLL_INTERVAL_MS = 60_000

export function useReminders() {
  const [dueReminders, setDueReminders] = useState<Reminder[]>([])

  const fetchDue = useCallback(async () => {
    try {
      const reminders = await getDueReminders()
      setDueReminders(reminders)
      // Show browser notification for each new due reminder
      if (
        reminders.length > 0 &&
        'Notification' in window &&
        Notification.permission === 'granted'
      ) {
        reminders.forEach((r) => {
          new Notification('DayTrack Reminder', {
            body: r.title + (r.description ? `: ${r.description}` : ''),
            icon: '/favicon.ico',
          })
        })
      }
    } catch {
      // fail silently on poll errors
    }
  }, [])

  useEffect(() => {
    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }

    fetchDue()
    const intervalId = setInterval(fetchDue, POLL_INTERVAL_MS)
    return () => clearInterval(intervalId)
  }, [fetchDue])

  const dismissReminder = useCallback(async (id: number) => {
    try {
      await updateReminder(id, { isDismissed: true })
      setDueReminders((prev) => prev.filter((r) => r.id !== id))
    } catch {
      // ignore
    }
  }, [])

  const completeReminder = useCallback(async (id: number) => {
    try {
      await updateReminder(id, { isCompleted: true })
      setDueReminders((prev) => prev.filter((r) => r.id !== id))
    } catch {
      // ignore
    }
  }, [])

  return { dueReminders, dismissReminder, completeReminder }
}
