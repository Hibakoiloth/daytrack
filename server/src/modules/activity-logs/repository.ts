import db from '../../database/db'
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateActivityLogInput,
  UpdateActivityLogInput,
} from './schema'

// ─── Activity Categories ───────────────────────────────────────────────────────

export interface ActivityCategory {
  id: number
  name: string
  classification: string
  color: string | null
  isDefault: number
  createdAt: string
}

const SELECT_CATEGORY = `
  SELECT id, name, classification, color, is_default as isDefault, created_at as createdAt
  FROM activity_categories
`

function findAllCategories(): ActivityCategory[] {
  return db.prepare(`${SELECT_CATEGORY} ORDER BY name`).all() as ActivityCategory[]
}

function findCategoryById(id: number): ActivityCategory | undefined {
  return db.prepare(`${SELECT_CATEGORY} WHERE id = ?`).get(id) as ActivityCategory | undefined
}

function createCategory(data: CreateCategoryInput): ActivityCategory {
  const stmt = db.prepare(
    `INSERT INTO activity_categories (name, classification, color) VALUES (?, ?, ?)`
  )
  const result = stmt.run(data.name, data.classification, data.color ?? null)
  return findCategoryById(result.lastInsertRowid as number)!
}

function updateCategory(id: number, fields: UpdateCategoryInput): ActivityCategory | undefined {
  const existing = findCategoryById(id)
  if (!existing) return undefined

  const updates: string[] = []
  const values: unknown[] = []

  if (fields.name !== undefined) {
    updates.push('name = ?')
    values.push(fields.name)
  }
  if (fields.classification !== undefined) {
    updates.push('classification = ?')
    values.push(fields.classification)
  }
  if (fields.color !== undefined) {
    updates.push('color = ?')
    values.push(fields.color)
  }

  if (updates.length === 0) return findCategoryById(id)

  values.push(id)
  db.prepare(`UPDATE activity_categories SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return findCategoryById(id)
}

function deleteCategory(id: number): void {
  db.prepare('DELETE FROM activity_categories WHERE id = ?').run(id)
}

export const categoriesRepo = {
  findAll: findAllCategories,
  findById: findCategoryById,
  create: createCategory,
  update: updateCategory,
  delete: deleteCategory,
}

// ─── Activity Logs ─────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: number
  activityName: string
  categoryId: number | null
  date: string
  durationMinutes: number
  notes: string | null
  createdAt: string
  updatedAt: string
  categoryName: string | null
  categoryClassification: string | null
  categoryColor: string | null
}

const SELECT_ACTIVITY_LOG = `
  SELECT
    al.id, al.activity_name as activityName, al.category_id as categoryId,
    al.date, al.duration_minutes as durationMinutes, al.notes,
    al.created_at as createdAt, al.updated_at as updatedAt,
    ac.name as categoryName, ac.classification as categoryClassification, ac.color as categoryColor
  FROM activity_logs al
  LEFT JOIN activity_categories ac ON ac.id = al.category_id
`

export interface ActivityLogFilters {
  categoryId?: number
  startDate?: string
  endDate?: string
  limit?: number
  offset?: number
}

function findAllActivityLogs(filters: ActivityLogFilters = {}): ActivityLog[] {
  const conditions: string[] = []
  const values: unknown[] = []

  if (filters.categoryId !== undefined) {
    conditions.push('al.category_id = ?')
    values.push(filters.categoryId)
  }
  if (filters.startDate !== undefined) {
    conditions.push('al.date >= ?')
    values.push(filters.startDate)
  }
  if (filters.endDate !== undefined) {
    conditions.push('al.date <= ?')
    values.push(filters.endDate)
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''
  let sql = `${SELECT_ACTIVITY_LOG} ${where} ORDER BY al.date DESC, al.id DESC`

  if (filters.limit !== undefined) {
    sql += ` LIMIT ?`
    values.push(filters.limit)
    if (filters.offset !== undefined) {
      sql += ` OFFSET ?`
      values.push(filters.offset)
    }
  }

  return db.prepare(sql).all(...values) as ActivityLog[]
}

function findActivityLogById(id: number): ActivityLog | undefined {
  return db.prepare(`${SELECT_ACTIVITY_LOG} WHERE al.id = ?`).get(id) as ActivityLog | undefined
}

function createActivityLog(data: CreateActivityLogInput): ActivityLog {
  const stmt = db.prepare(`
    INSERT INTO activity_logs (activity_name, category_id, date, duration_minutes, notes)
    VALUES (?, ?, ?, ?, ?)
  `)
  const result = stmt.run(
    data.activityName,
    data.categoryId ?? null,
    data.date,
    data.durationMinutes,
    data.notes ?? null
  )
  return findActivityLogById(result.lastInsertRowid as number)!
}

function updateActivityLog(id: number, fields: UpdateActivityLogInput): ActivityLog | undefined {
  const existing = findActivityLogById(id)
  if (!existing) return undefined

  const columnMap: Record<string, string> = {
    activityName: 'activity_name',
    categoryId: 'category_id',
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

  if (updates.length === 0) return findActivityLogById(id)

  updates.push("updated_at = datetime('now')")
  values.push(id)

  db.prepare(`UPDATE activity_logs SET ${updates.join(', ')} WHERE id = ?`).run(...values)
  return findActivityLogById(id)
}

function deleteActivityLog(id: number): void {
  db.prepare('DELETE FROM activity_logs WHERE id = ?').run(id)
}

export const activityLogsRepo = {
  findAll: findAllActivityLogs,
  findById: findActivityLogById,
  create: createActivityLog,
  update: updateActivityLog,
  delete: deleteActivityLog,
}
