import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema, createResponse } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const deleteObjectParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
    '*': { type: 'string', examples: ['folder/cat.png'] },
  },
  required: ['bucketName', '*'],
} as const
const deleteObjectQuerySchema = {
  type: 'object',
  properties: {
    versionId: { type: 'string', examples: ['eaa8bdb5-2e00-4767-b5a9-d2502efe2196'] },
  },
} as const
const successResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', examples: ['Successfully deleted'] },
  },
}
interface deleteObjectRequestInterface extends AuthenticatedRequest {
  Params: FromSchema<typeof deleteObjectParamsSchema>
  Querystring: FromSchema<typeof deleteObjectQuerySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Delete an object'

  const schema = createDefaultSchema(successResponseSchema, {
    params: deleteObjectParamsSchema,
    querystring: deleteObjectQuerySchema,
    summary,
    tags: ['object'],
  })

  fastify.delete<deleteObjectRequestInterface>(
    '/:bucketName/*',
    {
      schema,
      config: {
        operation: ROUTE_OPERATIONS.DELETE_OBJECT,
      },
    },
    async (request, response) => {
      const { bucketName } = request.params
      const { versionId } = request.query
      const objectName = request.params['*']

      await request.storage.from(bucketName).deleteObject(objectName, versionId)

      return response.status(200).send(createResponse('Successfully deleted'))
    }
  )
}
