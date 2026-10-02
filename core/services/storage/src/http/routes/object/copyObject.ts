import { objectSchema } from '@storage/schemas'
import { parseUserMetadata } from '@storage/uploader'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const copyRequestBodySchema = {
  type: 'object',
  properties: {
    bucketId: { type: 'string', examples: ['avatars'] },
    sourceKey: { type: 'string', examples: ['folder/source.png'] },
    sourceVersionId: { type: 'string', examples: ['eaa8bdb5-2e00-4767-b5a9-d2502efe2196'] },
    destinationBucket: { type: 'string', examples: ['users'] },
    destinationKey: { type: 'string', examples: ['folder/destination.png'] },
    metadata: {
      type: 'object',
      properties: {
        cacheControl: { type: 'string' },
        mimetype: { type: 'string' },
      },
    },
    copyMetadata: { type: 'boolean', examples: [true] },
  },
  required: ['sourceKey', 'bucketId', 'destinationKey'],
} as const
const successResponseSchema = {
  type: 'object',
  properties: {
    Id: { type: 'string' },
    Key: { type: 'string', examples: ['folder/destination.png'] },
    ...objectSchema.properties,
  },
  required: ['Key'],
}
interface copyRequestInterface extends AuthenticatedRequest {
  Body: FromSchema<typeof copyRequestBodySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Copies an object'

  const schema = createDefaultSchema(successResponseSchema, {
    body: copyRequestBodySchema,
    summary,
    tags: ['object'],
  })

  fastify.post<copyRequestInterface>(
    '/copy',
    {
      schema,
      config: {
        operation: ROUTE_OPERATIONS.COPY_OBJECT,
        resources: (req: FastifyRequest<copyRequestInterface>) => {
          const { sourceKey, destinationKey, bucketId, destinationBucket } = req.body
          return [`${bucketId}/${sourceKey}`, `${destinationBucket || bucketId}/${destinationKey}`]
        },
      },
    },
    async (request, response) => {
      const { sourceKey, sourceVersionId, destinationKey, bucketId, destinationBucket, metadata } =
        request.body

      const destinationBucketId = destinationBucket || bucketId
      const userMetadata = request.headers['x-metadata']

      const result = await request.storage.from(bucketId).copyObject({
        sourceKey,
        sourceVersionId,
        destinationBucket: destinationBucketId,
        destinationKey,
        owner: request.owner,
        userMetadata:
          typeof userMetadata === 'string' ? parseUserMetadata(userMetadata) : undefined,
        metadata,
        copyMetadata: request.body.copyMetadata ?? true,
        preserveUnspecifiedFileMetadata: true,
        upsert: request.headers['x-upsert'] === 'true',
        uploadType: 'standard',
      })

      return response.status(result.httpStatusCode ?? 200).send({
        // Deprecated, remove in next major
        Id: result.destObject.id,
        Key: `${destinationBucketId}/${destinationKey}`,

        ...result.destObject,
      })
    }
  )
}
