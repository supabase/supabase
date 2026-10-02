import { ErrorCode } from '@internal/errors'
import { FastifyInstance } from 'fastify'
import { errorSchema } from './schemas'

export function setRestNotFoundHandler(fastify: FastifyInstance) {
  fastify.setNotFoundHandler((request, reply) => {
    const serialize = reply.compileSerializationSchema(errorSchema, '404', 'application/json')

    return reply
      .status(404)
      .type('application/json')
      .serializer(serialize)
      .send({
        statusCode: '404',
        error: 'Not Found',
        message: `Route ${request.method}:${request.raw.url} not found`,
        code: ErrorCode.InvalidRequest,
      })
  })
}
