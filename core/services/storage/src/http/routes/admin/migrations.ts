import {
  MIGRATION_ADMIN_JOB_LIMIT,
  MigrationAdminStorePg,
  multitenantPgExecutor,
} from '@internal/database'
import {
  isDBMigrationName,
  resetMigrationsOnTenants,
  runMigrationsOnAllTenants,
} from '@internal/database/migrations'
import { PG_BOSS_SCHEMA, Queue } from '@internal/queue'
import { RunMigrationsOnTenants } from '@storage/events'
import { FastifyInstance, RequestGenericInterface } from 'fastify'
import { getConfig } from '../../../config'
import { registerApiKeyAuth } from '../../plugins/apikey'

const { pgQueueEnable } = getConfig()
const migrationQueueName = RunMigrationsOnTenants.getQueueName()
const migrationAdminStorePg = new MigrationAdminStorePg(multitenantPgExecutor, PG_BOSS_SCHEMA)

interface FailedMigrationsRequest extends RequestGenericInterface {
  Querystring: {
    cursor?: string
  }
}

export default async function routes(fastify: FastifyInstance) {
  registerApiKeyAuth(fastify)

  fastify.post('/migrate/fleet', { schema: { tags: ['migration'] } }, async (req, reply) => {
    if (!pgQueueEnable) {
      return reply.status(400).send({ message: 'Queue is not enabled' })
    }

    await runMigrationsOnAllTenants({
      signal: req.signals.disconnect.signal,
      sbReqId: req.sbReqId,
    })

    return reply.send({ message: 'Migrations scheduled' })
  })

  fastify.post('/reset/fleet', { schema: { tags: ['migration'] } }, async (req, reply) => {
    if (!pgQueueEnable) {
      return reply.status(400).send({ message: 'Queue is not enabled' })
    }

    const { untilMigration, markCompletedTillMigration } = req.body as Record<string, unknown>

    if (!isDBMigrationName(untilMigration)) {
      return reply.status(400).send({ message: 'Invalid migration' })
    }

    if (
      typeof markCompletedTillMigration === 'string' &&
      !isDBMigrationName(markCompletedTillMigration)
    ) {
      return reply.status(400).send({ message: 'Invalid migration' })
    }

    await resetMigrationsOnTenants({
      till: untilMigration,
      markCompletedTillMigration: isDBMigrationName(markCompletedTillMigration)
        ? markCompletedTillMigration
        : undefined,
      signal: req.signals.disconnect.signal,
      sbReqId: req.sbReqId,
    })

    return reply.send({ message: 'Migrations scheduled' })
  })

  fastify.get('/active', { schema: { tags: ['migration'] } }, async (req, reply) => {
    if (!pgQueueEnable) {
      return reply.code(400).send({ message: 'Queue is not enabled' })
    }
    const data = await migrationAdminStorePg.listActiveJobs(
      migrationQueueName,
      MIGRATION_ADMIN_JOB_LIMIT
    )

    return reply.send(data)
  })

  fastify.delete('/active', { schema: { tags: ['migration'] } }, async (req, reply) => {
    if (!pgQueueEnable) {
      return reply.code(400).send({ message: 'Queue is not enabled' })
    }
    const data = await migrationAdminStorePg.completeActiveJobs(
      migrationQueueName,
      MIGRATION_ADMIN_JOB_LIMIT
    )

    return reply.send(data)
  })

  fastify.get('/progress', { schema: { tags: ['migration'] } }, async (req, reply) => {
    if (!pgQueueEnable) {
      return reply.code(400).send({ message: 'Queue is not enabled' })
    }
    const queueSize = await Queue.getInstance().getQueueSize(RunMigrationsOnTenants.getQueueName())
    return { remaining: queueSize }
  })

  fastify.get<FailedMigrationsRequest>(
    '/failed',
    { schema: { tags: ['migration'] } },
    async (req, reply) => {
      if (!pgQueueEnable) {
        return reply.code(400).send({ message: 'Queue is not enabled' })
      }
      let offset = 0

      if (req.query.cursor !== undefined) {
        const parsedCursor = Number(req.query.cursor)

        if (!Number.isFinite(parsedCursor) || !Number.isInteger(parsedCursor) || parsedCursor < 0) {
          return reply.code(400).send({ message: 'Invalid cursor' })
        }

        offset = parsedCursor
      }

      const failed = await migrationAdminStorePg.listFailedTenants(offset, 50)

      reply.status(200).send({
        next_cursor_id: failed[failed.length - 1]?.cursor_id || null,
        data: failed,
      })
    }
  )
}
