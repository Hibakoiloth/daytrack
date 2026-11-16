import type { FastifyPluginAsync } from 'fastify'
import { TopicsService } from './service'
import { CreateTopicSchema, UpdateTopicSchema } from './schema'
import { success } from '../../utils/response'

const service = new TopicsService()

export const topicsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET / ?subjectId=&status=&priority=&search=
  fastify.get('/', async (req, reply) => {
    const query = req.query as Record<string, string>
    const filters = {
      subjectId: query.subjectId ? +query.subjectId : undefined,
      status: query.status,
      priority: query.priority,
      search: query.search,
    }
    const topics = await service.getAll(filters)
    return reply.code(200).send(success(topics))
  })

  // POST /
  fastify.post('/', async (req, reply) => {
    const body = CreateTopicSchema.parse(req.body)
    const topic = await service.create(body)
    return reply.code(201).send(success(topic))
  })

  // GET /:id
  fastify.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const topic = await service.getById(+req.params.id)
    return reply.code(200).send(success(topic))
  })

  // PUT /:id
  fastify.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const body = UpdateTopicSchema.parse(req.body)
    const topic = await service.update(+req.params.id, body)
    return reply.code(200).send(success(topic))
  })

  // DELETE /:id
  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await service.delete(+req.params.id)
    return reply.code(204).send()
  })
}
