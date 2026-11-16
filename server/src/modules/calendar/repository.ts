import db from '../../database/db'

export interface CalendarEvent {
  id: number
  title: string
  description?: string
  eventDate: string
  startTime?: string
  endTime?: string
  allDay: number
  category: string
  subjectId?: number
  topicId?: number
  createdAt: string
  updatedAt: string
  subjectName?: string
  topicTitle?: string
}

const BASE_SELECT = `
  SELECT
    e.id, e.title, e.description,
    e.event_date as eventDate,
    e.start_time as startTime,
    e.end_time as endTime,
    e.all_day as allDay,
    e.category,
    e.subject_id as subjectId,
    e.topic_id as topicId,
    e.created_at as createdAt,
    e.updated_at as updatedAt,
    s.name as subjectName,
    t.title as topicTitle
  FROM calendar_events e
  LEFT JOIN subjects s ON s.id = e.subject_id
  LEFT JOIN topics t ON t.id = e.topic_id
`

export const calendarRepo = {
  findAll(filters: {
    startDate?: string
    endDate?: string
    category?: string
    year?: number
    month?: number
  }): CalendarEvent[] {
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (filters.startDate) {
      conditions.push('e.event_date >= ?')
      params.push(filters.startDate)
    }
    if (filters.endDate) {
      conditions.push('e.event_date <= ?')
      params.push(filters.endDate)
    }
    if (filters.category) {
      conditions.push('e.category = ?')
      params.push(filters.category)
    }
    if (filters.year !== undefined) {
      conditions.push("strftime('%Y', e.event_date) = ?")
      params.push(String(filters.year).padStart(4, '0'))
    }
    if (filters.month !== undefined) {
      conditions.push("strftime('%m', e.event_date) = ?")
      params.push(String(filters.month).padStart(2, '0'))
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    return db.prepare(`${BASE_SELECT} ${where} ORDER BY e.event_date, e.start_time`).all(...params) as CalendarEvent[]
  },

  findById(id: number): CalendarEvent | undefined {
    return db.prepare(`${BASE_SELECT} WHERE e.id = ?`).get(id) as CalendarEvent | undefined
  },

  create(data: {
    title: string
    description?: string
    eventDate: string
    startTime?: string
    endTime?: string
    allDay: boolean
    category: string
    subjectId?: number
    topicId?: number
  }): CalendarEvent {
    const result = db.prepare(`
      INSERT INTO calendar_events (title, description, event_date, start_time, end_time, all_day, category, subject_id, topic_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.title,
      data.description ?? null,
      data.eventDate,
      data.startTime ?? null,
      data.endTime ?? null,
      data.allDay ? 1 : 0,
      data.category,
      data.subjectId ?? null,
      data.topicId ?? null,
    )
    return this.findById(result.lastInsertRowid as number)!
  },

  update(id: number, data: Partial<{
    title: string
    description?: string
    eventDate: string
    startTime?: string
    endTime?: string
    allDay: boolean
    category: string
    subjectId?: number
    topicId?: number
  }>): CalendarEvent | undefined {
    const fields: string[] = []
    const params: (string | number | null)[] = []

    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title) }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description ?? null) }
    if (data.eventDate !== undefined) { fields.push('event_date = ?'); params.push(data.eventDate) }
    if (data.startTime !== undefined) { fields.push('start_time = ?'); params.push(data.startTime ?? null) }
    if (data.endTime !== undefined) { fields.push('end_time = ?'); params.push(data.endTime ?? null) }
    if (data.allDay !== undefined) { fields.push('all_day = ?'); params.push(data.allDay ? 1 : 0) }
    if (data.category !== undefined) { fields.push('category = ?'); params.push(data.category) }
    if (data.subjectId !== undefined) { fields.push('subject_id = ?'); params.push(data.subjectId ?? null) }
    if (data.topicId !== undefined) { fields.push('topic_id = ?'); params.push(data.topicId ?? null) }

    if (fields.length === 0) return this.findById(id)

    fields.push("updated_at = datetime('now')")
    params.push(id)

    db.prepare(`UPDATE calendar_events SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return this.findById(id)
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM calendar_events WHERE id = ?').run(id)
    return result.changes > 0
  },
}
