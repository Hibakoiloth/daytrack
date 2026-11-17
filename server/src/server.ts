import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import path from 'path'
import fs from 'fs'

const PORT = parseInt(process.env.PORT || '3001')
const isDev = process.env.NODE_ENV !== 'production'



interface Subject {
  id: number
  name: string
  color: string
  createdAt: string
}

export async function buildServer() {
  const app = Fastify({ logger: false })

  // In-memory store — fresh per server instance (isolated between tests)
  const subjects: Subject[] = []
  let nextId = 1

  await app.register(cors, {
    origin: isDev ? (process.env.CORS_ORIGIN || 'http://localhost:5173') : false,
  })

  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }))

  app.get('/api/subjects', async () => ({ data: subjects }))

  app.post<{ Body: unknown }>('/api/subjects', async (req, reply) => {
    const body = req.body as Record<string, unknown>
    const name = typeof body?.name === 'string' ? body.name.trim() : ''
    if (!name) return reply.code(400).send({ error: 'name is required' })
    const color = typeof body?.color === 'string' ? body.color : '#6976CC'
    const subject: Subject = { id: nextId++, name, color, createdAt: new Date().toISOString() }
    subjects.push(subject)
    return reply.code(201).send({ data: subject })
  })

  app.delete<{ Params: { id: string } }>('/api/subjects/:id', async (req, reply) => {
    const id = parseInt(req.params.id)
    const idx = subjects.findIndex(s => s.id === id)
    if (idx === -1) return reply.code(404).send({ error: 'not found' })
    subjects.splice(idx, 1)
    return reply.code(204).send()
  })

  if (!isDev) {
    const publicDir = path.join(__dirname, '../public')
    if (fs.existsSync(publicDir)) {
      await app.register(staticFiles, { root: publicDir, prefix: '/' })
      app.setNotFoundHandler((_req, reply) => reply.sendFile('index.html'))
    }
  }

  return app
}

async function start() {
  const app = await buildServer()
  await app.listen({ port: PORT, host: '0.0.0.0' })
  console.log(`DayTrack running on http://localhost:${PORT}`)
}

if (require.main === module) {
  start().catch(err => { console.error(err); process.exit(1) })
}
