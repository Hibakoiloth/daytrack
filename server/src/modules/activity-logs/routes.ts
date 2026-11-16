import type { FastifyPluginAsync } from 'fastify'
import { ActivityCategoriesService, ActivityLogsService } from './service'
import {
  CreateCategorySchema,
  UpdateCategorySchema,
  CreateActivityLogSchema,
  UpdateActivityLogSchema,
} from './schema'
import { success } from '../../utils/response'

const categoriesService = new ActivityCategoriesService()
const activityLogsService = new ActivityLogsService()

export const categoriesRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (_req, reply) => {
    const categories = await categoriesService.getAll()
    return reply.code(200).send(success(categories))
  })

  fastify.post('/', async (req, reply) => {
    const body = CreateCategorySchema.parse(req.body)
    const category = await categoriesService.create(body)
    return reply.code(201).send(success(category))
  })

  fastify.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const body = UpdateCategorySchema.parse(req.body)
    const category = await categoriesService.update(+req.params.id, body)
    return reply.code(200).send(success(category))
  })

  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await categoriesService.delete(+req.params.id)
    return reply.code(204).send()
  })
}

export const activityLogsRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', async (req, reply) => {
    const query = req.query as Record<string, string>
    const filters = {
      categoryId: query.categoryId ? +query.categoryId : undefined,
      startDate: query.startDate,
      endDate: query.endDate,
      limit: query.limit ? +query.limit : undefined,
      offset: query.offset ? +query.offset : undefined,
    }
    const logs = await activityLogsService.getLogs(filters)
    return reply.code(200).send(success(logs))
  })

  fastify.post('/', async (req, reply) => {
    const body = CreateActivityLogSchema.parse(req.body)
    const log = await activityLogsService.create(body)
    return reply.code(201).send(success(log))
  })

  fastify.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const log = await activityLogsService.getById(+req.params.id)
    return reply.code(200).send(success(log))
  })

  fastify.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const body = UpdateActivityLogSchema.parse(req.body)
    const log = await activityLogsService.update(+req.params.id, body)
    return reply.code(200).send(success(log))
  })

  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await activityLogsService.delete(+req.params.id)
    return reply.code(204).send()
  })
}
