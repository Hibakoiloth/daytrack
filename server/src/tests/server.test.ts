import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { buildServer } from '../server'

process.env.NODE_ENV = 'test'

type App = Awaited<ReturnType<typeof buildServer>>
let app: App

beforeAll(async () => {
  app = await buildServer()
  await app.ready()
})

afterAll(async () => {
  await app.close()
})

describe('Health', () => {
  it('GET /health returns ok', async () => {
    const res = await app.inject({ method: 'GET', url: '/health' })
    expect(res.statusCode).toBe(200)
    expect(res.json().status).toBe('ok')
    expect(res.json().timestamp).toBeDefined()
  })
})

describe('Subjects', () => {
  it('GET /api/subjects returns empty array initially', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/subjects' })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toEqual([])
  })

  it('POST /api/subjects creates a subject', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/subjects',
      payload: { name: 'Mathematics' },
    })
    expect(res.statusCode).toBe(201)
    expect(res.json().data.name).toBe('Mathematics')
    expect(typeof res.json().data.id).toBe('number')
    expect(res.json().data.color).toBeDefined()
  })

  it('GET /api/subjects returns the created subject', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/subjects' })
    expect(res.statusCode).toBe(200)
    expect(res.json().data).toHaveLength(1)
    expect(res.json().data[0].name).toBe('Mathematics')
  })

  it('POST /api/subjects rejects missing name', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/subjects',
      payload: { color: '#ff0000' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('DELETE /api/subjects/:id removes the subject', async () => {
    const list = await app.inject({ method: 'GET', url: '/api/subjects' })
    const id = list.json().data[0].id
    const del = await app.inject({ method: 'DELETE', url: `/api/subjects/${id}` })
    expect(del.statusCode).toBe(204)
    const after = await app.inject({ method: 'GET', url: '/api/subjects' })
    expect(after.json().data).toHaveLength(0)
  })

  it('DELETE /api/subjects/:id returns 404 for unknown id', async () => {
    const res = await app.inject({ method: 'DELETE', url: '/api/subjects/999' })
    expect(res.statusCode).toBe(404)
  })
})
