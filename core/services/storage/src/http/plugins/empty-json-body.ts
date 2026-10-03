import { FastifyInstance } from 'fastify'

export function registerJsonParserAllowingEmptyBody(fastify: FastifyInstance) {
  const defaultJsonParser = fastify.getDefaultJsonParser(
    fastify.initialConfig.onProtoPoisoning ?? 'error',
    fastify.initialConfig.onConstructorPoisoning ?? 'error'
  )

  fastify.addContentTypeParser('application/json', { parseAs: 'string' }, (request, body, done) => {
    if (!body) {
      done(null, null)
      return
    }

    const jsonBody = typeof body === 'string' ? body : body.toString('utf8')

    defaultJsonParser(request, jsonBody, done)
  })
}
