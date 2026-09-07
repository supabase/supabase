import { FastifyInstance } from 'fastify'
import {
  listDatabases,
  registerDatabase,
  unregisterDatabase,
  getDatabaseConfig,
} from '../../lib/db-registry.js'

export default async function routes(fastify: FastifyInstance) {
  /**
   * GET /databases
   * List all registered named databases (connection strings are not returned).
   */
  fastify.get('/', async (_request, reply) => {
    const databases = listDatabases()
    return reply.send(databases)
  })

  /**
   * GET /databases/:name
   * Get a single registered database entry (without connection string).
   */
  fastify.get<{ Params: { name: string } }>('/:name', async (request, reply) => {
    const { name } = request.params
    const databases = listDatabases()
    const db = databases.find((d) => d.name === name)
    if (!db) {
      return reply.status(404).send({ error: `Database '${name}' not found` })
    }
    return reply.send(db)
  })

  /**
   * POST /databases
   * Register a new named database.
   * Body: { name: string, connectionString: string, description?: string, upsert?: boolean }
   */
  fastify.post<{
    Body: {
      name: string
      connectionString: string
      description?: string
      upsert?: boolean
    }
  }>(
    '/',
    {
      schema: {
        body: {
          type: 'object',
          required: ['name', 'connectionString'],
          properties: {
            name: { type: 'string' },
            connectionString: { type: 'string' },
            description: { type: 'string' },
            upsert: { type: 'boolean', default: false },
          },
        },
      },
    },
    async (request, reply) => {
      const { name, connectionString, description, upsert } = request.body
      const result = registerDatabase(name, connectionString, description, upsert ?? false)
      if (result.error) {
        return reply.status(400).send({ error: result.error })
      }
      const databases = listDatabases()
      const db = databases.find((d) => d.name === name)
      return reply.status(upsert ? 200 : 201).send(db)
    }
  )

  /**
   * DELETE /databases/:name
   * Unregister a named database.
   */
  fastify.delete<{ Params: { name: string } }>('/:name', async (request, reply) => {
    const { name } = request.params
    const removed = unregisterDatabase(name)
    if (!removed) {
      return reply.status(404).send({ error: `Database '${name}' not found` })
    }
    return reply.status(204).send()
  })
}