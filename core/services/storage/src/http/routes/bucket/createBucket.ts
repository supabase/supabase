import { FastifyInstance, FastifyRequest } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema } from '../../routes-helper'
import { fileSizeLimitSchema } from '../../schemas/file-size-limit'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const createBucketBodySchema = {
  type: 'object',
  properties: {
    name: { type: 'string', examples: ['avatars'] },
    id: { type: 'string', examples: ['avatars'] },
    public: { type: 'boolean', examples: [false] },
    type: { type: 'string', enum: ['STANDARD', 'ANALYTICS'] },
    file_size_limit: fileSizeLimitSchema,
    allowed_mime_types: {
      type: 'array',
      nullable: true,
      examples: [['image/png', 'image/jpg']],
      items: { type: 'string' },
    },
  },
  required: ['name'],
  not: { required: ['lifecycle_configuration'] },
} as const

const successResponseSchema = {
  type: 'object',
  properties: {
    name: { type: 'string', examples: ['avatars'] },
  },
  required: ['name'],
}
interface createBucketRequestInterface extends AuthenticatedRequest {
  Body: FromSchema<typeof createBucketBodySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Create a bucket'
  const schema = createDefaultSchema(successResponseSchema, {
    allowUnionTypes: true,
    body: createBucketBodySchema,
    summary,
    tags: ['bucket'],
  })
  fastify.post<createBucketRequestInterface>(
    '/',
    {
      config: {
        operation: ROUTE_OPERATIONS.CREATE_BUCKET,
        resources: (req: FastifyRequest<createBucketRequestInterface>) => [
          req.body.id || req.body.name || '',
        ],
      },
      schema,
    },
    async (request, response) => {
      const owner = request.owner

      const {
        name: bucketName,
        public: isPublic,
        id,
        allowed_mime_types,
        file_size_limit,
        type,
      } = request.body

      await request.storage.createBucket({
        id: id || bucketName,
        type,
        name: bucketName,
        owner,
        public: isPublic ?? false,
        fileSizeLimit: file_size_limit,
        allowedMimeTypes: allowed_mime_types
          ? allowed_mime_types?.filter((mime) => mime)
          : allowed_mime_types,
      })

      return response.status(200).send({
        name: bucketName,
      })
    }
  )
}
