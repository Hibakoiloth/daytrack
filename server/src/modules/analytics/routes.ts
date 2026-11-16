import { FastifyPluginAsync } from 'fastify'
import { analyticsRepo } from './repository'
import { success } from '../../utils/response'

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  // GET /dashboard - overall summary stats
  app.get('/dashboard', async (_req, reply) => {
    const summary = analyticsRepo.getDashboardSummary()
    return reply.send(success(summary))
  })

  // GET /study - study time by day
  app.get('/study', async (req, reply) => {
    const { startDate, endDate } = req.query as {
      startDate?: string
      endDate?: string
      groupBy?: string
    }

    // Default to last 30 days if no dates provided
    const end = endDate || new Date().toISOString().split('T')[0]
    const start = startDate || (() => {
      const d = new Date()
      d.setDate(d.getDate() - 29)
      return d.toISOString().split('T')[0]
    })()

    const daily = analyticsRepo.getStudyByDay(start, end)
    const totalMinutes = daily.reduce((sum: number, d: { minutes: number }) => sum + d.minutes, 0)
    return reply.send(success({ daily, totalMinutes }))
  })

  // GET /subjects - study totals per subject
  app.get('/subjects', async (req, reply) => {
    const { startDate, endDate } = req.query as {
      startDate?: string
      endDate?: string
    }
    const data = analyticsRepo.getSubjectTotals(startDate, endDate)
    return reply.send(success(data))
  })

  // GET /topics - study totals per topic
  app.get('/topics', async (req, reply) => {
    const { startDate, endDate } = req.query as {
      startDate?: string
      endDate?: string
    }
    const data = analyticsRepo.getTopicTotals(startDate, endDate)
    return reply.send(success(data))
  })

  // GET /activity - activity stats with productivity breakdown
  app.get('/activity', async (req, reply) => {
    const { startDate, endDate } = req.query as {
      startDate?: string
      endDate?: string
    }
    const stats = analyticsRepo.getActivityStats(startDate, endDate)
    const breakdown = analyticsRepo.getCategoryBreakdown(startDate, endDate)
    return reply.send(success({ stats, breakdown }))
  })
}
