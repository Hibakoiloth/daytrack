import db from '../../database/db'
import type { CreateTopicInput, UpdateTopicInput } from './schema'

export interface Topic {
  id: number
  subjectId: number
  title: string
  description: string | null
  status: string
  priority: string | null
  deadline: string | null
  targetHours: number | null
  createdAt: string
  updatedAt: string
  subjectName: string
  subjectColor: string
  totalMinutes: number
}

const SELECT_TOPIC = `
  SELECT
    t.id, t.subject_id as subjectId, t.title, t.description, t.status, t.priority,
    t.deadline, t.target_hours as targetHours,
    t.created_at as createdAt, t.updated_at as updatedAt,
    s.name as subjectName, s.color as subjectColor,
    COALESCE(SUM(sl.duration_minutes), 0) as totalMinutes
  FROM topics t
  JOIN subjects s ON s.id = t.subject_id
  LEFT JOIN study_logs sl ON sl.topic_id = t.id
`

export interface TopicFilters {
  subjectId?: number
  status?: string
  priority?: string
  search?: string
}

function findAll(filters: TopicFilters = {}): Topic[] {
  const conditions: string[] = []
  const values: unknown[] = []

  if (filters.subjectId !== undefined) {
    conditions.push('t.subject_id = ?')
    values.push(filters.subjectId)
  }
  if (filters.status !== undefined) {
    conditions.push('t.status = ?')
    values.push(filters.status)
  }
  if (filters.priority !== undefined) {
    conditions.push('t.priority = ?')
    values.push(filters.priority)
  }
  if (filters.search !== undefined) {
    conditions.push("(t.title LIKE ? OR t.description LIKE ?)")
    values.push(`%${filters.search}%`, `%${filters.search}%`)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  const sql = `${SELECT_TOPIC} ${where} GROUP BY t.id ORDER BY t.title`
  return db.prepare(sql).all(...values) as Topic[]
}

function findById(id: number): Topic | undefined {
  return db.prepare(`${SELECT_TOPIC} WHERE t.id = ? GROUP BY t.id`).get(id) as Topic | undefined
}

function create(data: CreateTopicInput): Topic {
  const stmt = db.prepare(`
    INSERT INTO topics (subject_id, title, description, status, priority, deadline, target_hours)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.subjectId,
    data.title,
    data.description ?? null,
    data.status,
    data.priority ?? null,
    data.deadline ?? null,
    data.targetHours ?? null
  )
  return findById(result.lastInsertRowid as number)!
}

function update(id: number, fields: UpdateTopicInput): Topic | undefined {
  const existing = findById(id)
  if (!existing) return undefined

  const columnMap: Record<string, string> = {
    title: 'title',
    description: 'description',
    status: 'status',
    priority: 'priority',
    deadline: 'deadline',
    targetHours: 'target_hours',
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

  db.prepare(`UPDATE topics SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return findById(id)
}

function deleteTopic(id: number): void {
  db.prepare('DELETE FROM topics WHERE id = ?').run(id)
}

export const topicsRepo = {
  findAll,
  findById,
  create,
  update,
  delete: deleteTopic,
}
