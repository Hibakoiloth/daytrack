import db from '../../database/db'
import type { CreateSubjectInput, UpdateSubjectInput } from './schema'

const SELECT_SUBJECT_ALL = `
  SELECT
    s.id, s.name, s.description, s.color,
    s.created_at as createdAt, s.updated_at as updatedAt,
    COALESCE(SUM(sl.duration_minutes), 0) as totalMinutes,
    COUNT(DISTINCT t.id) as topicCount,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completedTopics
  FROM subjects s
  LEFT JOIN topics t ON t.subject_id = s.id
  LEFT JOIN study_logs sl ON sl.subject_id = s.id
  GROUP BY s.id
`

const SELECT_SUBJECT_BY_ID = `
  SELECT
    s.id, s.name, s.description, s.color,
    s.created_at as createdAt, s.updated_at as updatedAt,
    COALESCE(SUM(sl.duration_minutes), 0) as totalMinutes,
    COUNT(DISTINCT t.id) as topicCount,
    COUNT(DISTINCT CASE WHEN t.status = 'completed' THEN t.id END) as completedTopics
  FROM subjects s
  LEFT JOIN topics t ON t.subject_id = s.id
  LEFT JOIN study_logs sl ON sl.subject_id = s.id
  WHERE s.id = ?
  GROUP BY s.id
`

export interface Subject {
  id: number
  name: string
  description: string | null
  color: string
  createdAt: string
  updatedAt: string
  totalMinutes: number
  topicCount: number
  completedTopics: number
}

function findAll(): Subject[] {
  return db.prepare(`${SELECT_SUBJECT_ALL} ORDER BY s.name`).all() as Subject[]
}

function findById(id: number): Subject | undefined {
  return db.prepare(SELECT_SUBJECT_BY_ID).get(id) as Subject | undefined
}

function create(data: CreateSubjectInput): Subject {
  const stmt = db.prepare(
    `INSERT INTO subjects (name, description, color) VALUES (?, ?, ?)`
  )
  const result = stmt.run(data.name, data.description ?? null, data.color)
  return findById(result.lastInsertRowid as number)!
}

function update(id: number, fields: UpdateSubjectInput): Subject | undefined {
  const existing = findById(id)
  if (!existing) return undefined

  const updates: string[] = []
  const values: unknown[] = []

  if (fields.name !== undefined) {
    updates.push('name = ?')
    values.push(fields.name)
  }
  if (fields.description !== undefined) {
    updates.push('description = ?')
    values.push(fields.description)
  }
  if (fields.color !== undefined) {
    updates.push('color = ?')
    values.push(fields.color)
  }

  if (updates.length === 0) return findById(id)

  updates.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE subjects SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return findById(id)
}

function deleteSubject(id: number): void {
  db.prepare('DELETE FROM subjects WHERE id = ?').run(id)
}

export const subjectsRepo = {
  findAll,
  findById,
  create,
  update,
  delete: deleteSubject,
}
