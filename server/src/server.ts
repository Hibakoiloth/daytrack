import Fastify from 'fastify'
import cors from '@fastify/cors'
import staticFiles from '@fastify/static'
import path from 'path'
import fs from 'fs'
import dotenv from 'dotenv'
dotenv.config({ path: path.join(__dirname, '../../.env') })

import { runMigrations } from './database/migrate'
import { errorHandler } from './middleware/error-handler'
import { success } from './utils/response'
import db from './database/db'

// Import all route plugins
import subjectsRoutes from './modules/subjects'
import topicsRoutes from './modules/topics'
import studyLogsRoutes from './modules/study-logs'
import { categoriesRoutes, activityLogsRoutes } from './modules/activity-logs'
import calendarRoutes from './modules/calendar'
import tasksRoutes from './modules/tasks'
import remindersRoutes from './modules/reminders'
import analyticsRoutes from './modules/analytics'
import settingsRoutes from './modules/settings'

const PORT = parseInt(process.env.PORT || '3001')
const isDev = process.env.NODE_ENV !== 'production'

async function buildServer() {
  const app = Fastify({ logger: isDev })

  await app.register(cors, {
    origin: isDev ? process.env.CORS_ORIGIN || 'http://localhost:5173' : false,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  })

  // Register all API routes under /api prefix
  await app.register(subjectsRoutes, { prefix: '/api/subjects' })
  await app.register(topicsRoutes, { prefix: '/api/topics' })
  await app.register(studyLogsRoutes, { prefix: '/api/study-logs' })
  await app.register(categoriesRoutes, { prefix: '/api/activity-categories' })
  await app.register(activityLogsRoutes, { prefix: '/api/activity-logs' })
  await app.register(calendarRoutes, { prefix: '/api/calendar-events' })
  await app.register(tasksRoutes, { prefix: '/api/tasks' })
  await app.register(remindersRoutes, { prefix: '/api/reminders' })
  await app.register(analyticsRoutes, { prefix: '/api/analytics' })
  await app.register(settingsRoutes, { prefix: '/api' })

  // Health check
  app.get('/health', async () => {
    try {
      db.prepare('SELECT 1').get()
      return { status: 'ok', db: 'connected', timestamp: new Date().toISOString() }
    } catch (e) {
      return { status: 'error', db: 'disconnected', timestamp: new Date().toISOString() }
    }
  })

  // Serve static files in production
  if (!isDev) {
    const publicDir = path.join(__dirname, '../public')
    if (fs.existsSync(publicDir)) {
      await app.register(staticFiles, { root: publicDir, prefix: '/' })
      app.setNotFoundHandler((_req, reply) => reply.sendFile('index.html'))
    }
  }

  app.setErrorHandler(errorHandler)
  return app
}

async function start() {
  runMigrations()
  const app = await buildServer()
  try {
    await app.listen({ port: PORT, host: '0.0.0.0' })
    console.log(`[server] DayTrack running on http://localhost:${PORT}`)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => { process.exit(0) })
process.on('SIGINT', async () => { process.exit(0) })

if (require.main === module) {
  start()
}

export { buildServer }
