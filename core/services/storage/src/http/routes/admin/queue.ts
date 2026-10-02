import { SYSTEM_TENANT } from '@internal/queue/constants'
import { MoveJobs } from '@storage/events'
import { FastifyInstance, RequestGenericInterface } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { getConfig } from '../../../config'
import { registerApiKeyAuth } from '../../plugins/apikey'

const { pgQueueEnable } = getConfig()

const moveJobsSchema = {
  body: {
    type: 'object',
    properties: {
      fromQueue: {
        type: 'string',
      },
      toQueue: {
        type: 'string',
      },
      deleteJobsFromOriginalQueue: {
        type: 'boolean',
        default: false,
      },
    },
    required: ['fromQueue', 'toQueue'],
  },
} as const

interface MoveJobsRequestInterface extends RequestGenericInterface {
  Body: FromSchema<typeof moveJobsSchema.body>
}

export default async function routes(fastify: FastifyInstance) {
  registerApiKeyAuth(fastify)

  fastify.post<MoveJobsRequestInterface>(
    '/move',
    { schema: { ...moveJobsSchema, tags: ['queue'] } },
    async (req, reply) => {
      if (!pgQueueEnable) {
        return reply.status(400).send({ message: 'Queue is not enabled' })
      }

      const fromQueue = req.body.fromQueue
      const toQueue = req.body.toQueue
      const deleteJobsFromOriginalQueue = req.body.deleteJobsFromOriginalQueue || false

      await MoveJobs.send({
        fromQueue,
        toQueue,
        deleteJobsFromOriginalQueue,
        sbReqId: req.sbReqId,
        tenant: SYSTEM_TENANT,
      })

      return reply.send({ message: 'Move jobs scheduled' })
    }
  )
}
