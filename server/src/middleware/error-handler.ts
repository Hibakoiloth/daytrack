import { FastifyError, FastifyReply, FastifyRequest } from 'fastify'
import { ZodError } from 'zod'
import { AppError } from '../utils/errors'

export function errorHandler(error: FastifyError, _req: FastifyRequest, reply: FastifyReply): void {
  if (error instanceof AppError) {
    reply.status(error.statusCode).send({ error: error.code, message: error.message, statusCode: error.statusCode })
    return
  }
  if (error instanceof ZodError) {
    const msg = error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join('; ')
    reply.status(400).send({ error: 'ValidationError', message: msg, statusCode: 400 })
    return
  }
  if ((error as any).statusCode === 400) {
    reply.status(400).send({ error: 'BadRequest', message: error.message, statusCode: 400 })
    return
  }
  console.error('[error]', error)
  reply.status(500).send({ error: 'InternalServerError', message: 'An unexpected error occurred', statusCode: 500 })
}
