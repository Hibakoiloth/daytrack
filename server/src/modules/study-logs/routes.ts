import type { FastifyPluginAsync } from 'fastify'
import { StudyLogsService } from './service'
import { CreateStudyLogSchema, UpdateStudyLogSchema } from './schema'
import { success } from '../../utils/response'

const service = new StudyLogsService()

export const studyLogsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET / ?subjectId=&topicId=&startDate=&endDate=&limit=&offset=
  fastify.get('/', async (req, reply) => {
    const query = req.query as Record<string, string>
    const filters = {
      subjectId: query.subjectId ? +query.subjectId : undefined,
      topicId: query.topicId ? +query.topicId : undefined,
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit ? +query.limit : undefined,
      offset: query.offset ? +query.offset : undefined,
    }
    const logs = await service.getLogs(filters)
    return reply.code(200).send(success(logs))
  })

  // POST /
  fastify.post('/', async (req, reply) => {
    const body = CreateStudyLogSchema.parse(req.body)
    const log = await service.create(body)
    return reply.code(201).send(success(log))
  })

  // GET /:id
  fastify.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const log = await service.getById(+req.params.id)
    return reply.code(200).send(success(log))
  })

  // PUT /:id
  fastify.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const body = UpdateStudyLogSchema.parse(req.body)
    const log = await service.update(+req.params.id, body)
    return reply.code(200).send(success(log))
  })

  // DELETE /:id
  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await service.delete(+req.params.id)
    return reply.code(204).send()
  })
}
