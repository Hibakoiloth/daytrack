import type { FastifyPluginAsync } from 'fastify'
import { SubjectsService } from './service'
import { CreateSubjectSchema, UpdateSubjectSchema } from './schema'
import { success } from '../../utils/response'
import db from '../../database/db'

const service = new SubjectsService()

export const subjectsRoutes: FastifyPluginAsync = async (fastify) => {
  // GET /
  fastify.get('/', async (_req, reply) => {
    const subjects = await service.getAll()
    return reply.code(200).send(success(subjects))
  })

  // POST /
  fastify.post('/', async (req, reply) => {
    const body = CreateSubjectSchema.parse(req.body)
    const subject = await service.create(body)
    return reply.code(201).send(success(subject))
  })

  // GET /:id
  fastify.get<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const subject = await service.getById(+req.params.id)
    return reply.code(200).send(success(subject))
  })

  // PUT /:id
  fastify.put<{ Params: { id: string } }>('/:id', async (req, reply) => {
    const body = UpdateSubjectSchema.parse(req.body)
    const subject = await service.update(+req.params.id, body)
    return reply.code(200).send(success(subject))
  })

  // DELETE /:id
  fastify.delete<{ Params: { id: string } }>('/:id', async (req, reply) => {
    await service.delete(+req.params.id)
    return reply.code(204).send()
  })

  // GET /:id/topics
  fastify.get<{ Params: { id: string } }>('/:id/topics', async (req, reply) => {
    const subjectId = +req.params.id
    // Verify subject exists
    await service.getById(subjectId)

    const topics = db.prepare(`
      SELECT
        t.id, t.subject_id as subjectId, t.title, t.description, t.status, t.priority,
        t.deadline, t.target_hours as targetHours,
        t.created_at as createdAt, t.updated_at as updatedAt,
        s.name as subjectName, s.color as subjectColor,
        COALESCE(SUM(sl.duration_minutes), 0) as totalMinutes
      FROM topics t
      JOIN subjects s ON s.id = t.subject_id
      LEFT JOIN study_logs sl ON sl.topic_id = t.id
      WHERE t.subject_id = ?
      GROUP BY t.id
      ORDER BY t.title
    `).all(subjectId)

    return reply.code(200).send(success(topics))
  })
}
