import { render } from '@internal/errors'
import { logSchema } from '@internal/monitoring'
import { S3_KEYS_SCRATCH_TABLE_QUALIFIED_PATTERN } from '@storage/database'
import { ObjectScanner } from '@storage/scanner/scanner'
import { FastifyInstance, RequestGenericInterface } from 'fastify'
import { FastifyReply } from 'fastify/types/reply'
import { dbSuperUser, storage } from '../../plugins'
import { registerApiKeyAuth } from '../../plugins/apikey'

const listOrphanedObjects = {
  description: 'List Orphaned Objects',
  params: {
    type: 'object',
    properties: {
      tenantId: { type: 'string' },
      bucketId: { type: 'string' },
    },
    required: ['tenantId', 'bucketId'],
  },
  query: {
    type: 'object',
    properties: {
      before: { type: 'string' },
      keepTmpTable: { type: 'boolean' },
    },
  },
} as const

const syncOrphanedObjects = {
  description: 'Sync Orphaned Objects',
  params: {
    type: 'object',
    properties: {
      tenantId: { type: 'string' },
      bucketId: { type: 'string' },
    },
    required: ['tenantId', 'bucketId'],
  },
  body: {
    type: 'object',
    properties: {
      deleteDbKeys: { type: 'boolean' },
      deleteS3Keys: { type: 'boolean' },
      tmpTable: { type: 'string', pattern: `^$|${S3_KEYS_SCRATCH_TABLE_QUALIFIED_PATTERN}` },
    },
  },
  optional: ['deleteDbKeys', 'deleteS3Keys'],
} as const

interface ListOrphanObjectsRequest extends RequestGenericInterface {
  Params: {
    tenantId: string
    bucketId: string
  }
  Querystring: {
    before?: string
    keepTmpTable?: boolean
  }
}

interface SyncOrphanObjectsRequest extends RequestGenericInterface {
  Params: {
    tenantId: string
    bucketId: string
  }
  Body: {
    deleteDbKeys?: boolean
    deleteS3Keys?: boolean
    before?: string
    tmpTable?: string
    keepTmpTable?: boolean
  }
}

export default async function routes(fastify: FastifyInstance) {
  registerApiKeyAuth(fastify)
  fastify.register(dbSuperUser, {
    disableHostCheck: true,
  })
  fastify.register(storage)

  fastify.get<ListOrphanObjectsRequest>(
    '/:tenantId/buckets/:bucketId/orphan-objects',
    {
      schema: { ...listOrphanedObjects, tags: ['object'] },
    },
    async (req, reply) => {
      const bucket = req.params.bucketId
      let before = req.query.before ? new Date(req.query.before as string) : undefined

      if (before && isNaN(before.getTime())) {
        return reply.status(400).send({
          error: 'Invalid date format',
        })
      }
      if (!before) {
        before = new Date()
        before.setHours(before.getHours() - 1)
      }

      const scanner = new ObjectScanner(req.storage)
      const orphanObjects = scanner.listOrphaned(bucket, {
        signal: req.signals.disconnect.signal,
        before,
        keepTmpTable: Boolean(req.query.keepTmpTable),
      })

      reply.header('Content-Type', 'application/x-ndjson; charset=utf-8')

      // Do not let the connection time out, periodically send
      // a ping message to keep the connection alive
      const respPing = ping(reply)

      try {
        for await (const result of orphanObjects) {
          if (result.value.length > 0) {
            respPing.update()
            writeNdjson(reply, {
              ...result,
              event: 'data',
            })
          }
        }
      } catch (e) {
        logSchema.error(req.log, 'list orphaned objects stream failed', {
          type: 'orphan',
          tenantId: req.tenantId,
          project: req.tenantId,
          reqId: req.id,
          sbReqId: req.sbReqId,
          error: e,
          metadata: JSON.stringify({ bucket }),
        })
        writeNdjson(reply, {
          event: 'error',
          error: render(e),
        })
        return
      } finally {
        respPing.clear()
        endNdjson(reply)
      }
    }
  )

  fastify.delete<SyncOrphanObjectsRequest>(
    '/:tenantId/buckets/:bucketId/orphan-objects',
    {
      schema: { ...syncOrphanedObjects, tags: ['object'] },
    },
    async (req, reply) => {
      if (!req.body.deleteDbKeys && !req.body.deleteS3Keys) {
        return reply.status(400).send({
          error: 'At least one of deleteDbKeys or deleteS3Keys must be set to true',
        })
      }

      const bucket = `${req.params.bucketId}`
      let before = req.body.before ? new Date(req.body.before as string) : undefined

      if (before && isNaN(before.getTime())) {
        return reply.status(400).send({
          error: 'Invalid date format',
        })
      }
      if (!before) {
        before = new Date()
        before.setHours(before.getHours() - 1)
      }

      reply.header('Content-Type', 'application/x-ndjson; charset=utf-8')

      const respPing = ping(reply)

      try {
        const scanner = new ObjectScanner(req.storage)
        const result = scanner.deleteOrphans(bucket, {
          deleteDbKeys: req.body.deleteDbKeys,
          deleteS3Keys: req.body.deleteS3Keys,
          signal: req.signals.disconnect.signal,
          before,
          tmpTable: req.body.tmpTable,
        })

        for await (const deleted of result) {
          respPing.update()
          writeNdjson(reply, {
            ...deleted,
            event: 'data',
          })
        }
      } catch (e) {
        logSchema.error(req.log, 'delete orphaned objects stream failed', {
          type: 'orphan',
          tenantId: req.tenantId,
          project: req.tenantId,
          reqId: req.id,
          sbReqId: req.sbReqId,
          error: e,
          metadata: JSON.stringify({ bucket }),
        })
        writeNdjson(reply, {
          event: 'error',
          error: render(e),
        })
        return
      } finally {
        respPing.clear()
        endNdjson(reply)
      }
    }
  )
}

function canWriteNdjson(reply: FastifyReply) {
  return !reply.raw.destroyed && !reply.raw.writableEnded
}

function writeNdjson(reply: FastifyReply, payload: unknown) {
  if (!canWriteNdjson(reply)) {
    return false
  }

  try {
    reply.raw.write(JSON.stringify(payload) + '\n')
    return true
  } catch {
    return false
  }
}

function endNdjson(reply: FastifyReply) {
  if (!canWriteNdjson(reply)) {
    return
  }

  try {
    reply.raw.end()
  } catch {}
}

// Occasionally write a ping message to the response stream
function ping(reply: FastifyReply) {
  let lastSend = undefined as Date | undefined
  const clearPing = setInterval(() => {
    const fiveSecondsEarly = new Date()
    fiveSecondsEarly.setSeconds(fiveSecondsEarly.getSeconds() - 5)

    if (!lastSend || (lastSend && lastSend < fiveSecondsEarly)) {
      lastSend = new Date()
      writeNdjson(reply, {
        event: 'ping',
      })
    }
  }, 1000 * 10)

  return {
    clear: () => clearInterval(clearPing),
    update: () => {
      lastSend = new Date()
    },
  }
}
