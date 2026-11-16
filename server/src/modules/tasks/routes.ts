import { FastifyPluginAsync } from 'fastify'
import { tasksService } from './service'
import { CreateTaskSchema, UpdateTaskSchema } from './schema'
import { success } from '../../utils/response'

export const tasksRoutes: FastifyPluginAsync = async (app) => {
  // GET / - list tasks
  app.get('/', async (req, reply) => {
    const { status, priority, subjectId, search } = req.query as {
      status?: string
      priority?: string
      subjectId?: string
      search?: string
    }
    const tasks = tasksService.findAll({
      status,
      priority,
      subjectId: subjectId ? parseInt(subjectId) : undefined,
      search,
    })
    return reply.send(success(tasks))
  })

  // POST / - create task
  app.post('/', async (req, reply) => {
    const data = CreateTaskSchema.parse(req.body)
    const task = tasksService.create(data)
    return reply.status(201).send(success(task, 'Task created'))
  })

  // GET /:id - get single task
  app.get('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const task = tasksService.findById(parseInt(id))
    return reply.send(success(task))
  })

  // PUT /:id - update task (supports partial updates including status changes)
  app.put('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    const data = UpdateTaskSchema.parse(req.body)
    const task = tasksService.update(parseInt(id), data)
    return reply.send(success(task, 'Task updated'))
  })

  // DELETE /:id - delete task
  app.delete('/:id', async (req, reply) => {
    const { id } = req.params as { id: string }
    tasksService.delete(parseInt(id))
    return reply.send(success(null, 'Task deleted'))
  })
}
