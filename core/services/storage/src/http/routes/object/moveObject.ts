import { FastifyInstance, FastifyRequest } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const moveObjectsBodySchema = {
  type: 'object',
  properties: {
    bucketId: { type: 'string', examples: ['avatars'] },
    sourceKey: { type: 'string', examples: ['folder/cat.png'] },
    sourceVersionId: { type: 'string', examples: ['eaa8bdb5-2e00-4767-b5a9-d2502efe2196'] },
    destinationBucket: { type: 'string', examples: ['users'] },
    destinationKey: { type: 'string', examples: ['folder/newcat.png'] },
  },
  required: ['bucketId', 'sourceKey', 'destinationKey'],
} as const
const successResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', examples: ['Successfully moved'] },
  },
  required: ['message'],
}
interface moveObjectRequestInterface extends AuthenticatedRequest {
  Body: FromSchema<typeof moveObjectsBodySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Moves an object'

  const schema = createDefaultSchema(successResponseSchema, {
    body: moveObjectsBodySchema,
    summary,
    tags: ['object'],
  })

  fastify.post<moveObjectRequestInterface>(
    '/move',
    {
      schema,
      config: {
        operation: ROUTE_OPERATIONS.MOVE_OBJECT,
        resources: (req: FastifyRequest<moveObjectRequestInterface>) => {
          const { sourceKey, destinationKey, bucketId, destinationBucket } = req.body
          return [`${bucketId}/${sourceKey}`, `${destinationBucket || bucketId}/${destinationKey}`]
        },
      },
    },
    async (request, response) => {
      const { destinationKey, sourceKey, sourceVersionId, bucketId, destinationBucket } =
        request.body

      const destinationBucketId = destinationBucket || bucketId

      const move = await request.storage
        .from(bucketId)
        .moveObject(
          sourceKey,
          destinationBucketId,
          destinationKey,
          'standard',
          request.owner,
          sourceVersionId
        )

      return response.status(200).send({
        message: 'Successfully moved',
        Id: move.destObject.id,
        Key: move.destObject.name,
      })
    }
  )
}
