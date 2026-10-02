import { heapSnapshotController, ProfilingBusyError } from '@internal/monitoring/pprof/controller'
import {
  closeProfileStore,
  getProfileStore,
  InvalidProfileCursorError,
  InvalidProfileDateError,
  ProfileNotFoundError,
} from '@internal/monitoring/pprof/store'
import type { ProfileClass, ProfileKind } from '@internal/monitoring/pprof/store-key'
import { triggerManualProfile } from '@internal/monitoring/pprof/trigger'
import type { FastifyInstance } from 'fastify'
import { getConfig } from '../../../config'
import { registerApiKeyAuth } from '../../plugins/apikey'

const { profilingS3Bucket } = getConfig()

const captureQuery = {
  type: 'object',
  properties: {
    seconds: { type: 'integer', finite: true, minimum: 1, maximum: 300, default: 30 },
  },
  additionalProperties: false,
} as const

const profileKeyQuery = {
  type: 'object',
  properties: {
    key: {
      type: 'string',
      pattern: '^v1/(?:auto|manual)/[a-z0-9._/-]+$',
      minLength: 1,
      maxLength: 1024,
    },
  },
  required: ['key'],
  additionalProperties: false,
} as const

function filenameTimestamp(date = new Date()) {
  return date.toISOString().replace(/[:.]/g, '-')
}

export default async function routes(fastify: FastifyInstance) {
  registerApiKeyAuth(fastify)
  fastify.addHook('onSend', (_request, reply, payload, done) => {
    reply.header('cache-control', 'no-store')
    done(null, payload)
  })
  const shutdown = new AbortController()
  fastify.addHook('preClose', (done) => {
    shutdown.abort()
    done()
  })
  fastify.addHook('onClose', (_instance, done) => {
    closeProfileStore()
    done()
  })

  for (const [path, type] of [
    ['profile', 'cpu'],
    ['heap', 'heap'],
  ] as const) {
    const label = type === 'cpu' ? 'CPU' : 'heap'
    fastify.get(
      `/${path}`,
      { schema: { tags: ['pprof'], querystring: captureQuery } },
      async (request, reply) => {
        const seconds = (request.query as { seconds?: number }).seconds ?? 30
        const result = await triggerManualProfile(type, seconds)
        if (result.scheduled) {
          return reply.status(202).send({
            scheduled: true,
            class: 'manual',
            kind: type,
            message: 'Profile capture scheduled; use list and download to retrieve it',
          })
        }
        if (result.reason === 'busy') {
          return reply
            .status(409)
            .send({ error: `A ${label} profile capture is already active for this worker` })
        }
        if (result.reason === 'not-watt') {
          return reply.status(501).send({ error: 'Manual profiling requires Watt' })
        }
        return reply.status(503).send({ error: 'Watt profiling extension is unavailable' })
      }
    )
  }

  fastify.get('/heap-snapshot', { schema: { tags: ['pprof'] } }, async (request, reply) => {
    const signal = AbortSignal.any([request.signals.disconnect.signal, shutdown.signal])
    try {
      const snapshot = heapSnapshotController.heapSnapshot(signal)
      return reply
        .header('content-type', 'application/json')
        .header(
          'content-disposition',
          `attachment; filename="heap-${filenameTimestamp()}.heapsnapshot"`
        )
        .send(snapshot)
    } catch (error) {
      if (error instanceof ProfilingBusyError)
        return reply.status(409).send({ error: error.message })
      throw error
    }
  })

  if (!profilingS3Bucket) return

  fastify.get(
    '/profiles',
    {
      schema: {
        tags: ['pprof'],
        querystring: {
          type: 'object',
          properties: {
            class: { type: 'string', enum: ['auto', 'manual'] },
            kind: { type: 'string', enum: ['cpu', 'heap'] },
            date: { type: 'string', format: 'date' },
            limit: { type: 'integer', finite: true, minimum: 1, maximum: 1000, default: 100 },
            cursor: {
              type: 'string',
              pattern: '^[A-Za-z0-9_-]+$',
              minLength: 1,
              maxLength: 2048,
            },
          },
          required: ['class'],
          additionalProperties: false,
        },
      },
    },
    async (request, reply) => {
      const query = request.query as {
        class: ProfileClass
        kind?: ProfileKind
        date?: string
        limit?: number
        cursor?: string
      }
      try {
        return await getProfileStore().list({ ...query, limit: query.limit ?? 100 })
      } catch (error) {
        if (
          error instanceof InvalidProfileCursorError ||
          error instanceof InvalidProfileDateError
        ) {
          return reply.status(400).send({ error: error.message })
        }
        throw error
      }
    }
  )

  fastify.get(
    '/profiles/download',
    { schema: { tags: ['pprof'], querystring: profileKeyQuery } },
    async (request, reply) => {
      try {
        const { key } = request.query as { key: string }
        const { object, profile } = await getProfileStore().get(key)
        const filename = `${profile.class}-${profile.kind}-${filenameTimestamp(profile.startedAt)}.pprof.gz`
        return reply
          .header('content-type', object.ContentType ?? 'application/gzip')
          .header('content-disposition', `attachment; filename="${filename}"`)
          .send(object.Body)
      } catch (error) {
        if (error instanceof ProfileNotFoundError)
          return reply.status(404).send({ error: error.message })
        throw error
      }
    }
  )
}
