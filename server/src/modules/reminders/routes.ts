import { FastifyPluginAsync } from 'fastify'
import { remindersService } from './service'
import { CreateReminderSchema, UpdateReminderSchema } from './schema'
import { success } from '../../utils/response'

export const remindersRoutes: FastifyPluginAsync = async (app) => {
  // GET /due - list due reminders (for polling) - must be before /:id
  app.get('/due', async (_req, reply) => {
    const reminders = remindersService.findDue()
    return reply.send(success(reminders))
  })

  // GET / - list reminders
  app.get('/', async (req, reply) => {
    const { upcoming, date, showDismissed } = req.query as {
      upcoming?: string
      date?: string
      showDismissed?: string
    }
    const reminders = remindersService.findAll({
      upcoming: upcoming === 'true',
      date,
      showDismissed: showDismissed === 'true',
    })
    return reply.send(success(reminders))
  })

  // POST / - create reminder
  app.post('/', async (req, reply) => {
    const data = CreateReminderSchema.parse(req.body)
    const reminder = remindersService.create(data)
    return reply.status(201).send(success(reminder, 'Reminder created'))
  })

  // GET /:id - get single reminder
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const reminder = remindersService.findById(parseInt(id))
    return reply.send(success(reminder))
  })

  // PUT /:id - update reminder
  app.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = UpdateReminderSchema.parse(req.body)
    const reminder = remindersService.update(parseInt(id), data)
    return reply.send(success(reminder, 'Reminder updated'))
  })

  // DELETE /:id - delete reminder
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    remindersService.delete(parseInt(id))
    return reply.send(success(null, 'Reminder deleted'))
  })
}
