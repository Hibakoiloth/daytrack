import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import path from 'path'
import fs from 'fs'
import os from 'os'

// Set test DB before any imports that touch server code
const testDbPath = path.join(os.tmpdir(), `daytrack-test-${process.pid}.db`)
process.env.DB_PATH = testDbPath
process.env.NODE_ENV = 'test'
process.env.PORT = '0'

import { buildServer } from '../server'

type App = Awaited<ReturnType<typeof buildServer>>
let app: App

beforeAll(async () => {
  app = await buildServer()
  await app.ready()
})

afterAll(async () => {
  await app.close()
  for (const f of [testDbPath, testDbPath + '-shm', testDbPath + '-wal']) {
    try { fs.unlinkSync(f) } catch {}
  }
})

async function get(url: string) {
  return app.inject({ method: 'GET', url })
}
async function post(url: string, payload: unknown) {
  return app.inject({ method: 'POST', url, payload })
}
async function put(url: string, payload: unknown) {
  return app.inject({ method: 'PUT', url, payload })
}
async function del(url: string) {
  return app.inject({ method: 'DELETE', url })
}

describe('Health', () => {
  it('GET /health returns 200 with status ok', async () => {
    const res = await get('/health')
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('ok')
    expect(res.json().db).toBe('connected')
    expect(res.json().timestamp).toBeDefined()
  })
})

describe('Subjects', () => {
  let subjectId: number

  it('GET /api/subjects returns empty array initially', async () => {
    const res = await get('/api/subjects')
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json().data)).toBe(true)
  })

  it('POST /api/subjects creates a subject', async () => {
    const res = await post('/api/subjects', { name: 'Algorithms', color: '#6976CC' })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.name).toBe('Algorithms')
    expect(res.json().data.color).toBe('#6976CC')
    expect(res.json().data.id).toBeTypeOf('number')
    subjectId = res.json().data.id
  })

  it('GET /api/subjects/:id returns the subject with stats', async () => {
    const res = await get(`/api/subjects/${subjectId}`)
    expect(res.statusCode).toBe(200)
    expect(res.json().data.id).toBe(subjectId)
    expect(res.json().data.totalMinutes).toBeTypeOf('number')
    expect(res.json().data.topicCount).toBeTypeOf('number')
  })

  it('PUT /api/subjects/:id updates the subject', async () => {
    const res = await put(`/api/subjects/${subjectId}`, { name: 'DSA' })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.name).toBe('DSA')
  })

  it('POST /api/subjects rejects missing name with 400', async () => {
    const res = await post('/api/subjects', { color: '#6976CC' })
    expect(res.statusCode).toBe(400)
  })

  it('GET /api/subjects/:id returns 404 after deletion', async () => {
    await del(`/api/subjects/${subjectId}`)
    const res = await get(`/api/subjects/${subjectId}`)
    expect(res.statusCode).toBe(404)
  })
})

describe('Topics', () => {
  let subjectId: number

  beforeEach(async () => {
    const res = await post('/api/subjects', { name: `AI-${Date.now()}`, color: '#626FC5' })
    subjectId = res.json().data.id
  })

  it('creates topic with only required fields (subjectId + title)', async () => {
    const res = await post('/api/topics', { subjectId, title: 'Neural Networks' })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.title).toBe('Neural Networks')
    expect(res.json().data.status).toBe('not_started')
    expect(res.json().data.priority == null).toBe(true)
    expect(res.json().data.deadline == null).toBe(true)
    expect(res.json().data.targetHours == null).toBe(true)
  })

  it('creates topic with optional deadline', async () => {
    const res = await post('/api/topics', { subjectId, title: 'Backprop', deadline: '2027-01-15' })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.deadline).toBe('2027-01-15')
  })

  it('creates topic with optional targetHours', async () => {
    const res = await post('/api/topics', { subjectId, title: 'Transformers', targetHours: 20 })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.targetHours).toBe(20)
  })

  it('creates topic with optional priority', async () => {
    const res = await post('/api/topics', { subjectId, title: 'GANs', priority: 'high' })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.priority).toBe('high')
  })

  it('GET /api/topics with subjectId filter', async () => {
    await post('/api/topics', { subjectId, title: 'Topic A' })
    const res = await get(`/api/topics?subjectId=${subjectId}`)
    expect(res.statusCode).toBe(200)
    expect(Array.isArray(res.json().data)).toBe(true)
    expect(res.json().data.length).toBeGreaterThanOrEqual(1)
  })

  it('updates topic status', async () => {
    const t = await post('/api/topics', { subjectId, title: 'Status test' })
    const id = t.json().data.id
    const res = await put(`/api/topics/${id}`, { status: 'completed' })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('completed')
  })

  it('deletes a topic', async () => {
    const t = await post('/api/topics', { subjectId, title: 'To delete' })
    const id = t.json().data.id
    const d = await del(`/api/topics/${id}`)
    expect(d.statusCode).toBe(204)
    const check = await get(`/api/topics/${id}`)
    expect(check.statusCode).toBe(404)
  })
})

describe('Study Logs', () => {
  let subjectId: number
  let topicId: number

  beforeEach(async () => {
    const s = await post('/api/subjects', { name: `Math-${Date.now()}`, color: '#5BA85B' })
    subjectId = s.json().data.id
    const t = await post('/api/topics', { subjectId, title: 'Calculus' })
    topicId = t.json().data.id
  })

  it('creates a study log with all fields', async () => {
    const res = await post('/api/study-logs', {
      subjectId, topicId, date: '2026-11-15', durationMinutes: 90, notes: 'Great session'
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.durationMinutes).toBe(90)
    expect(res.json().data.notes).toBe('Great session')
    expect(res.json().data.subjectName).toBeDefined()
    expect(res.json().data.topicTitle).toBeDefined()
  })

  it('creates a study log without topic (topic is optional)', async () => {
    const res = await post('/api/study-logs', {
      subjectId, date: '2026-11-15', durationMinutes: 30
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.topicId == null).toBe(true)
  })

  it('creates multiple logs on the same day', async () => {
    await post('/api/study-logs', { subjectId, date: '2026-11-20', durationMinutes: 60 })
    await post('/api/study-logs', { subjectId, date: '2026-11-20', durationMinutes: 45 })
    const res = await get('/api/study-logs?startDate=2026-11-20&endDate=2026-11-20')
    expect(res.statusCode).toBe(200)
    expect(res.json().data.length).toBeGreaterThanOrEqual(2)
  })

  it('creates a study log for a past date', async () => {
    const res = await post('/api/study-logs', {
      subjectId, date: '2026-01-01', durationMinutes: 120
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.date).toBe('2026-01-01')
  })

  it('updates a study log', async () => {
    const c = await post('/api/study-logs', { subjectId, date: '2026-11-15', durationMinutes: 30 })
    const id = c.json().data.id
    const res = await put(`/api/study-logs/${id}`, { durationMinutes: 60, notes: 'Updated' })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.durationMinutes).toBe(60)
  })

  it('deletes a study log', async () => {
    const c = await post('/api/study-logs', { subjectId, date: '2026-11-01', durationMinutes: 60 })
    const id = c.json().data.id
    const d = await del(`/api/study-logs/${id}`)
    expect(d.statusCode).toBe(204)
  })

  it('filters study logs by subjectId', async () => {
    await post('/api/study-logs', { subjectId, date: '2026-11-15', durationMinutes: 30 })
    const res = await get(`/api/study-logs?subjectId=${subjectId}`)
    expect(res.statusCode).toBe(200)
    expect(res.json().data.every((l: any) => l.subjectId === subjectId)).toBe(true)
  })
})

describe('Activity Logs', () => {
  it('GET /api/activity-categories returns default categories', async () => {
    const res = await get('/api/activity-categories')
    expect(res.statusCode).toBe(200)
    expect(res.json().data.length).toBeGreaterThan(0)
    const names = res.json().data.map((c: any) => c.name)
    expect(names).toContain('Work')
    expect(names).toContain('Exercise')
  })

  it('creates a custom activity category', async () => {
    const res = await post('/api/activity-categories', {
      name: 'Coding', classification: 'productive', color: '#6976CC'
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.classification).toBe('productive')
  })

  it('creates an activity log', async () => {
    const cats = await get('/api/activity-categories')
    const catId = cats.json().data[0].id
    const res = await post('/api/activity-logs', {
      activityName: 'Morning run', categoryId: catId, date: '2026-11-15', durationMinutes: 45
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.activityName).toBe('Morning run')
  })
})

describe('Analytics Dashboard', () => {
  it('returns all required fields with correct types', async () => {
    const res = await get('/api/analytics/dashboard')
    expect(res.statusCode).toBe(200)
    const d = res.json().data
    expect(typeof d.studyToday).toBe('number')
    expect(typeof d.studyWeek).toBe('number')
    expect(typeof d.studyMonth).toBe('number')
    expect(typeof d.subjectCount).toBe('number')
    expect(typeof d.topicCount).toBe('number')
    expect(typeof d.completedTopics).toBe('number')
    expect(typeof d.inProgressTopics).toBe('number')
    expect(typeof d.pendingTasks).toBe('number')
  })

  it('studyToday increases after adding a log for today', async () => {
    const before = (await get('/api/analytics/dashboard')).json().data.studyToday
    const s = await post('/api/subjects', { name: `Test-${Date.now()}`, color: '#6976CC' })
    const todayDate = new Date().toISOString().split('T')[0]
    await post('/api/study-logs', {
      subjectId: s.json().data.id, date: todayDate, durationMinutes: 45
    })
    const after = (await get('/api/analytics/dashboard')).json().data.studyToday
    expect(after).toBeGreaterThan(before)
    expect(after - before).toBe(45)
  })
})

describe('Settings', () => {
  it('GET /api/settings returns all default settings', async () => {
    const res = await get('/api/settings')
    expect(res.statusCode).toBe(200)
    expect(res.json().data.dateFormat).toBeDefined()
    expect(res.json().data.timeFormat).toBeDefined()
    expect(res.json().data.theme).toBeDefined()
  })

  it('PUT /api/settings updates a setting', async () => {
    const res = await put('/api/settings', { theme: 'dark' })
    expect(res.statusCode).toBe(200)
    const check = await get('/api/settings')
    expect(check.json().data.theme).toBe('dark')
  })
})

describe('Tasks', () => {
  it('creates a task with only required fields', async () => {
    const res = await post('/api/tasks', { title: 'Review lecture notes' })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.status).toBe('pending')
    expect(res.json().data.priority).toBe('medium')
    expect(res.json().data.dueDate == null).toBe(true)
  })

  it('creates task with optional dueDate', async () => {
    const res = await post('/api/tasks', { title: 'Assignment', dueDate: '2026-12-31' })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.dueDate).toBe('2026-12-31')
  })

  it('updates task status to completed', async () => {
    const c = await post('/api/tasks', { title: 'A task' })
    const id = c.json().data.id
    const res = await put(`/api/tasks/${id}`, { status: 'completed' })
    expect(res.statusCode).toBe(200)
    expect(res.json().data.status).toBe('completed')
  })

  it('deletes a task', async () => {
    const c = await post('/api/tasks', { title: 'Deletable' })
    const id = c.json().data.id
    const d = await del(`/api/tasks/${id}`)
    expect(d.statusCode).toBe(204)
  })
})

describe('Calendar Events', () => {
  it('creates an event with all-day default', async () => {
    const res = await post('/api/calendar-events', {
      title: 'Study session', eventDate: '2026-12-01', category: 'study'
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.title).toBe('Study session')
    expect(res.json().data.allDay).toBe(1)
  })

  it('creates an event with start/end time', async () => {
    const res = await post('/api/calendar-events', {
      title: 'Morning class', eventDate: '2026-12-02',
      startTime: '09:00', endTime: '11:00', allDay: false, category: 'work'
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.startTime).toBe('09:00')
  })

  it('filters events by date range', async () => {
    await post('/api/calendar-events', { title: 'Dec event', eventDate: '2026-12-15', category: 'general' })
    const res = await get('/api/calendar-events?startDate=2026-12-01&endDate=2026-12-31')
    expect(res.statusCode).toBe(200)
    expect(res.json().data.length).toBeGreaterThanOrEqual(1)
  })
})

describe('Reminders', () => {
  it('creates a reminder', async () => {
    const res = await post('/api/reminders', {
      title: 'Study reminder', reminderDate: '2026-12-01', reminderTime: '09:00'
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.isDismissed).toBeFalsy()
    expect(res.json().data.isCompleted).toBeFalsy()
  })

  it('dismisses a reminder', async () => {
    const c = await post('/api/reminders', {
      title: 'To dismiss', reminderDate: '2026-12-01', reminderTime: '10:00'
    })
    const id = c.json().data.id
    const res = await put(`/api/reminders/${id}`, { isDismissed: true })
    expect(res.statusCode).toBe(200)
  })
})

describe('Data Export', () => {
  it('GET /api/export returns JSON with all collections', async () => {
    const res = await get('/api/export')
    expect(res.statusCode).toBe(200)
    const d = res.json().data ?? res.json()
    expect(d.subjects !== undefined || d.studyLogs !== undefined).toBe(true)
  })
})
