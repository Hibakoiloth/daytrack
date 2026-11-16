import { FastifyPluginAsync } from 'fastify'
import { settingsRepo } from './repository'
import { success } from '../../utils/response'
import db from '../../database/db'

export const settingsRoutes: FastifyPluginAsync = async (app) => {
  // GET /settings - return all settings as object
  app.get('/settings', async (_req, reply) => {
    const settings = settingsRepo.getAll()
    return reply.send(success(settings))
  })

  // PUT /settings - update provided keys
  app.put('/settings', async (req, reply) => {
    const body = req.body as Record<string, unknown>
    if (!body || typeof body !== 'object') {
      return reply.status(400).send({ error: 'Invalid body' })
    }
    // Convert all values to strings
    const updates: Record<string, string> = {}
    for (const [key, value] of Object.entries(body)) {
      if (value !== undefined && value !== null) {
        updates[key] = String(value)
      }
    }
    if (Object.keys(updates).length > 0) {
      settingsRepo.setMany(updates)
    }
    const settings = settingsRepo.getAll()
    return reply.send(success(settings, 'Settings updated'))
  })

  // GET /export - export all data as JSON
  app.get('/export', async (_req, reply) => {
    const subjects = db.prepare(`
      SELECT id, name, description, color,
        created_at as createdAt, updated_at as updatedAt
      FROM subjects ORDER BY id
    `).all()

    const topics = db.prepare(`
      SELECT id, subject_id as subjectId, title, description, status, priority,
        deadline, target_hours as targetHours,
        created_at as createdAt, updated_at as updatedAt
      FROM topics ORDER BY id
    `).all()

    const studyLogs = db.prepare(`
      SELECT id, subject_id as subjectId, topic_id as topicId,
        date, duration_minutes as durationMinutes, notes,
        created_at as createdAt, updated_at as updatedAt
      FROM study_logs ORDER BY date DESC, id DESC
    `).all()

    const activityCategories = db.prepare(`
      SELECT id, name, classification, color, is_default as isDefault,
        created_at as createdAt
      FROM activity_categories ORDER BY id
    `).all()

    const activityLogs = db.prepare(`
      SELECT id, activity_name as activityName, category_id as categoryId,
        date, duration_minutes as durationMinutes, notes,
        created_at as createdAt, updated_at as updatedAt
      FROM activity_logs ORDER BY date DESC, id DESC
    `).all()

    const calendarEvents = db.prepare(`
      SELECT id, title, description, event_date as eventDate,
        start_time as startTime, end_time as endTime,
        all_day as allDay, category,
        subject_id as subjectId, topic_id as topicId,
        created_at as createdAt, updated_at as updatedAt
      FROM calendar_events ORDER BY event_date, id
    `).all()

    const tasks = db.prepare(`
      SELECT id, title, description, status, priority,
        due_date as dueDate,
        subject_id as subjectId, topic_id as topicId,
        created_at as createdAt, updated_at as updatedAt
      FROM tasks ORDER BY id
    `).all()

    const reminders = db.prepare(`
      SELECT id, title, description,
        reminder_date as reminderDate, reminder_time as reminderTime,
        task_id as taskId,
        is_dismissed as isDismissed, is_completed as isCompleted,
        created_at as createdAt, updated_at as updatedAt
      FROM reminders ORDER BY reminder_date, reminder_time
    `).all()

    const settings = settingsRepo.getAll()

    const exportData = {
      exportedAt: new Date().toISOString(),
      version: 1,
      subjects,
      topics,
      studyLogs,
      activityCategories,
      activityLogs,
      calendarEvents,
      tasks,
      reminders,
      settings,
    }

    return reply.send(success(exportData, 'Data exported successfully'))
  })
}
