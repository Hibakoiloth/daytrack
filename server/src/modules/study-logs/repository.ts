import db from '../../database/db'
import type { CreateStudyLogInput, UpdateStudyLogInput } from './schema'

export interface StudyLog {
  id: number
  subjectId: number
  topicId: number | null
  date: string
  durationMinutes: number
  notes: string | null
  createdAt: string
  updatedAt: string
  subjectName: string
  subjectColor: string
  topicTitle: string | null
}

const SELECT_LOG = `
  SELECT
    sl.id, sl.subject_id as subjectId, sl.topic_id as topicId, sl.date,
    sl.duration_minutes as durationMinutes, sl.notes,
    sl.created_at as createdAt, sl.updated_at as updatedAt,
    s.name as subjectName, s.color as subjectColor,
    t.title as topicTitle
  FROM study_logs sl
  JOIN subjects s ON s.id = sl.subject_id
  LEFT JOIN topics t ON t.id = sl.topic_id
`

export interface StudyLogFilters {
  subjectId?: number
  topicId?: number
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

function findAll(filters: StudyLogFilters = {}): StudyLog[] {
  const conditions: string[] = []
  const values: unknown[] = []

  if (filters.subjectId !== undefined) {
    conditions.push('sl.subject_id = ?')
    values.push(filters.subjectId)
  }
  if (filters.topicId !== undefined) {
    conditions.push('sl.topic_id = ?')
    values.push(filters.topicId)
  }
  if (filters.startDate !== undefined) {
    conditions.push('sl.date >= ?')
    values.push(filters.startDate)
  }
  if (filters.endDate !== undefined) {
    conditions.push('sl.date <= ?')
    values.push(filters.endDate)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  let sql = `${SELECT_LOG} ${where} ORDER BY sl.date DESC, sl.id DESC`

  if (filters.limit !== undefined) {
    sql += ` LIMIT ?`
    values.push(filters.limit)
    if (filters.offset !== undefined) {
      sql += ` OFFSET ?`
      values.push(filters.offset)
    }
  }

  return db.prepare(sql).all(...values) as StudyLog[]
}

function findById(id: number): StudyLog | undefined {
  return db.prepare(`${SELECT_LOG} WHERE sl.id = ?`).get(id) as StudyLog | undefined
}

function create(data: CreateStudyLogInput): StudyLog {
  const stmt = db.prepare(`
    INSERT INTO study_logs (subject_id, topic_id, date, duration_minutes, notes)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.subjectId,
    data.topicId ?? null,
    data.date,
    data.durationMinutes,
    data.notes ?? null
  )
  return findById(result.lastInsertRowid as number)!
}

function update(id: number, fields: UpdateStudyLogInput): StudyLog | undefined {
  const existing = findById(id)
  if (!existing) return undefined

  const columnMap: Record<string, string> = {
    subjectId: 'subject_id',
    topicId: 'topic_id',
    date: 'date',
    durationMinutes: 'duration_minutes',
    notes: 'notes',
  }

  const updates: string[] = []
  const values: unknown[] = []

  for (const [key, col] of Object.entries(columnMap)) {
    if (key in fields) {
      updates.push(`${col} = ?`)
      values.push((fields as Record<string, unknown>)[key] ?? null)
    }
  }

  if (updates.length === 0) return findById(id)

  updates.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE study_logs SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return findById(id)
}

function deleteLog(id: number): void {
  db.prepare('DELETE FROM study_logs WHERE id = ?').run(id)
}

function getTotalMinutesBySubject(subjectId: number): number {
  const row = db.prepare(
    `SELECT COALESCE(SUM(duration_minutes), 0) as total FROM study_logs WHERE subject_id = ?`
  ).get(subjectId) as { total: number }
  return row.total
}

function getTotalMinutesByTopic(topicId: number): number {
  const row = db.prepare(
    `SELECT COALESCE(SUM(duration_minutes), 0) as total FROM study_logs WHERE topic_id = ?`
  ).get(topicId) as { total: number }
  return row.total
}

export const studyLogsRepo = {
  findAll,
  findById,
  create,
  update,
  delete: deleteLog,
  getTotalMinutesBySubject,
  getTotalMinutesByTopic,
}
