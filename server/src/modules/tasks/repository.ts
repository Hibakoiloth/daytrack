import db from '../../database/db'

export interface Task {
  id: number
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string
  subjectId?: number
  topicId?: number
  createdAt: string
  updatedAt: string
  subjectName?: string
  topicTitle?: string
}

const BASE_SELECT = `
  SELECT
    tasks.id, tasks.title, tasks.description,
    tasks.status, tasks.priority,
    tasks.due_date as dueDate,
    tasks.subject_id as subjectId,
    tasks.topic_id as topicId,
    tasks.created_at as createdAt,
    tasks.updated_at as updatedAt,
    s.name as subjectName,
    t.title as topicTitle
  FROM tasks
  LEFT JOIN subjects s ON s.id = tasks.subject_id
  LEFT JOIN topics t ON t.id = tasks.topic_id
`

export const tasksRepo = {
  findAll(filters: {
    status?: string
    priority?: string
    subjectId?: number
    search?: string
  }): Task[] {
    const conditions: string[] = []
    const params: (string | number)[] = []

    if (filters.status) {
      conditions.push('tasks.status = ?')
      params.push(filters.status)
    }
    if (filters.priority) {
      conditions.push('tasks.priority = ?')
      params.push(filters.priority)
    }
    if (filters.subjectId !== undefined) {
      conditions.push('tasks.subject_id = ?')
      params.push(filters.subjectId)
    }
    if (filters.search) {
      conditions.push('(tasks.title LIKE ? OR tasks.description LIKE ?)')
      params.push(`%${filters.search}%`, `%${filters.search}%`)
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    return db.prepare(`${BASE_SELECT} ${where} ORDER BY tasks.due_date ASC, tasks.created_at DESC`).all(...params) as Task[]
  },

  findById(id: number): Task | undefined {
    return db.prepare(`${BASE_SELECT} WHERE tasks.id = ?`).get(id) as Task | undefined
  },

  create(data: {
    title: string
    description?: string
    status: string
    priority: string
    dueDate?: string
    subjectId?: number
    topicId?: number
  }): Task {
    const result = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, due_date, subject_id, topic_id)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.title,
      data.description ?? null,
      data.status,
      data.priority,
      data.dueDate ?? null,
      data.subjectId ?? null,
      data.topicId ?? null,
    )
    return this.findById(result.lastInsertRowid as number)!
  },

  update(id: number, data: Partial<{
    title: string
    description?: string
    status: string
    priority: string
    dueDate?: string
    subjectId?: number
    topicId?: number
  }>): Task | undefined {
    const fields: string[] = []
    const params: (string | number | null)[] = []

    if (data.title !== undefined) { fields.push('title = ?'); params.push(data.title) }
    if (data.description !== undefined) { fields.push('description = ?'); params.push(data.description ?? null) }
    if (data.status !== undefined) { fields.push('status = ?'); params.push(data.status) }
    if (data.priority !== undefined) { fields.push('priority = ?'); params.push(data.priority) }
    if (data.dueDate !== undefined) { fields.push('due_date = ?'); params.push(data.dueDate ?? null) }
    if (data.subjectId !== undefined) { fields.push('subject_id = ?'); params.push(data.subjectId ?? null) }
    if (data.topicId !== undefined) { fields.push('topic_id = ?'); params.push(data.topicId ?? null) }

    if (fields.length === 0) return this.findById(id)

    fields.push("updated_at = datetime('now')")
    params.push(id)

    db.prepare(`UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`).run(...params)
    return this.findById(id)
  },

  delete(id: number): boolean {
    const result = db.prepare('DELETE FROM tasks WHERE id = ?').run(id)
    return result.changes > 0
  },
}
