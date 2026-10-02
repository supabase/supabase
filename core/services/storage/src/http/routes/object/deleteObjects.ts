import { DELETE_OBJECTS_LIMIT_DESCRIPTION, enforceDeleteObjectsLimit } from '@storage/limits'
import { objectSchema } from '@storage/schemas/object'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const deleteObjectsParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
  },
  required: ['bucketName'],
} as const
const deleteObjectsBodySchema = {
  type: 'object',
  properties: {
    prefixes: {
      type: 'array',
      items: {
        anyOf: [
          { type: 'string' },
          {
            type: 'object',
            properties: {
              path: { type: 'string' },
              versionId: { type: 'string' },
            },
            required: ['path', 'versionId'],
            additionalProperties: false,
          },
        ],
      },
      minItems: 1,
      description: DELETE_OBJECTS_LIMIT_DESCRIPTION,
      examples: [
        [
          'folder/cat.png',
          { path: 'folder/dog.png', versionId: 'eaa8bdb5-2e00-4767-b5a9-d2502efe2196' },
        ],
      ],
    },
  },
  required: ['prefixes'],
} as const
const successResponseSchema = {
  type: 'array',
  items: objectSchema,
}
interface deleteObjectsInterface extends AuthenticatedRequest {
  Params: FromSchema<typeof deleteObjectsParamsSchema>
  Body: FromSchema<typeof deleteObjectsBodySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Delete multiple objects'

  const schema = createDefaultSchema(successResponseSchema, {
    body: deleteObjectsBodySchema,
    params: deleteObjectsParamsSchema,
    summary,
    tags: ['object'],
  })

  fastify.delete<deleteObjectsInterface>(
    '/:bucketName',
    {
      schema,
      config: {
        operation: ROUTE_OPERATIONS.DELETE_OBJECTS,
        resources: (req: FastifyRequest<deleteObjectsInterface>) => {
          const { prefixes } = req.body
          return prefixes.map((prefix) => {
            const path = typeof prefix === 'string' ? prefix : prefix.path
            return `${req.params.bucketName}/${path}`
          })
        },
      },
    },
    async (request, response) => {
      const { bucketName } = request.params
      const prefixes = request.body['prefixes']

      await enforceDeleteObjectsLimit(request.tenantId, prefixes.length)

      const results = await request.storage.from(bucketName).deleteObjects(prefixes)

      return response.status(200).send(results)
    }
  )
}
