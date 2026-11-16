import { FastifyPluginAsync } from 'fastify'
import { calendarService } from './service'
import { CreateEventSchema, UpdateEventSchema } from './schema'
import { success } from '../../utils/response'

export const calendarRoutes: FastifyPluginAsync = async (app) => {
  // GET / - list events
  app.get('/', async (req, reply) => {
    const { startDate, endDate, category, year, month } = req.query as {
      startDate?: string
      endDate?: string
      category?: string
      year?: string
      month?: string
    }
    const events = calendarService.findAll({
      startDate,
      endDate,
      category,
      year: year ? parseInt(year) : undefined,
      month: month ? parseInt(month) : undefined,
    })
    return reply.send(success(events))
  })

  // POST / - create event
  app.post('/', async (req, reply) => {
    const data = CreateEventSchema.parse(req.body)
    const event = calendarService.create(data)
    return reply.status(201).send(success(event, 'Calendar event created'))
  })

  // GET /:id - get single event
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const event = calendarService.findById(parseInt(id))
    return reply.send(success(event))
  })

  // PUT /:id - update event
  app.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = UpdateEventSchema.parse(req.body)
    const event = calendarService.update(parseInt(id), data)
    return reply.send(success(event, 'Calendar event updated'))
  })

  // DELETE /:id - delete event
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    calendarService.delete(parseInt(id))
    return reply.send(success(null, 'Calendar event deleted'))
  })
}
