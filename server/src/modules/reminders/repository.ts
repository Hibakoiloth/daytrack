import db from '../../database/db'

export interface Reminder {
  id: number
  title: string
  description?: string
  reminderDate: string
  reminderTime: string
  taskId?: number
  isDismissed: number
  isCompleted: number
  createdAt: string
  updatedAt: string
  taskTitle?: string
}

const BASE_SELECT = `
  SELECT
    r.id, r.title, r.description,
    r.reminder_date as reminderDate,
    r.reminder_time as reminderTime,
    r.task_id as taskId,
    r.is_dismissed as isDismissed,
    r.is_completed as isCompleted,
    r.created_at as createdAt,
    r.updated_at as updatedAt,
    t.title as taskTitle
  FROM reminders r
  LEFT JOIN tasks t ON t.id = r.task_id
`

export const remindersRepo = {
  findAll(filters: {
    upcoming?: boolean
    date?: string
    showDismissed?: boolean
  }): Reminder[] {
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (!filters.showDismissed) {
      conditions.push('r.is_dismissed = 0')
    }
    if (filters.upcoming) {
      conditions.push("r.reminder_date >= date('now','localtime')")
    }
    if (filters.date) {
      conditions.push('r.reminder_date = ?')
      params.push(filters.date)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    return db.prepare(`${BASE_SELECT} ${where} ORDER BY r.reminder_date, r.reminder_time`).all(...params) as Reminder[]
  },

  findById(id: number): Reminder | undefined {
    return db.prepare(`${BASE_SELECT} WHERE r.id = ?`).get(id) as Reminder | undefined
  },

  create(data: {
    title: string
    description?: string
    reminderDate: string
    reminderTime: string
    taskId?: number
  }): Reminder {
    const result = db.prepare(`
      INSERT INTO reminders (title, description, reminder_date, reminder_time, task_id)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      data.title,
      data.description ?? null,
      data.reminderDate,
      data.reminderTime,
      data.taskId ?? null,
    )
    return this.findById(result.lastInsertRowid as number)!
  },

  update(id: number, data: Partial<{
    title: string
    description?: string
    reminderDate: string
    reminderTime: string
    taskId?: number
    isDismissed: boolean
    isCompleted: boolean
  }>): Reminder | undefined {
    const fields: string[] = []
    const params: (string | number | null)[] = []

    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title) }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description ?? null) }
    if (data.reminderDate !== undefined) { fields.push('reminder_date = ?'); params.push(data.reminderDate) }
    if (data.reminderTime !== undefined) { fields.push('reminder_time = ?'); params.push(data.reminderTime) }
    if (data.taskId !== undefined) { fields.push('task_id = ?'); params.push(data.taskId ?? null) }
    if (data.isDismissed !== undefined) { fields.push('is_dismissed = ?'); params.push(data.isDismissed ? 1 : 0) }
    if (data.isCompleted !== undefined) { fields.push('is_completed = ?'); params.push(data.isCompleted ? 1 : 0) }

    if (fields.length === 0) return this.findById(id)

    fields.push("updated_at = datetime('now')")
    params.push(id)

    db.prepare(`UPDATE reminders SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return this.findById(id)
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM reminders WHERE id = ?').run(id)
    return result.changes > 0
  },

  findDue(now: string): Reminder[] {
    return db.prepare(`
      ${BASE_SELECT}
      WHERE (r.reminder_date || ' ' || r.reminder_time) <= ?
        AND r.is_dismissed = 0
        AND r.is_completed = 0
      ORDER BY r.reminder_date, r.reminder_time
    `).all(now) as Reminder[]
  },
}
