import { assertValidNumericJWTExpiration } from '@internal/auth'
import { isImageTransformationEnabled } from '@storage/limits'
import { ImageRenderer } from '@storage/renderer'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema } from '../../routes-helper'
import { transformationOptionsSchema } from '../../schemas/transformations'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const getSignedURLParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
    '*': { type: 'string', examples: ['folder/cat.png'] },
  },
  required: ['bucketName', '*'],
} as const
const getSignedURLBodySchema = {
  type: 'object',
  properties: {
    expiresIn: {
      type: 'integer',
      finite: true,
      minimum: 1,
      examples: [60000],
    },
    transform: transformationOptionsSchema,
    versionId: { type: 'string', examples: ['eaa8bdb5-2e00-4767-b5a9-d2502efe2196'] },
  },
  required: ['expiresIn'],
} as const

const successResponseSchema = {
  type: 'object',
  properties: {
    signedURL: {
      type: 'string',
      examples: [
        '/object/sign/avatars/folder/cat.png?token=TEST_JWT_REDACTED',
      ],
    },
  },
  required: ['signedURL'],
}
interface getSignedURLRequestInterface extends AuthenticatedRequest {
  Params: FromSchema<typeof getSignedURLParamsSchema>
  Body: FromSchema<typeof getSignedURLBodySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Generate a presigned url to retrieve an object'

  const schema = createDefaultSchema(successResponseSchema, {
    body: getSignedURLBodySchema,
    params: getSignedURLParamsSchema,
    summary,
    tags: ['object'],
  })

  fastify.post<getSignedURLRequestInterface>(
    '/sign/:bucketName/*',
    {
      schema,
      config: {
        operation: ROUTE_OPERATIONS.SIGN_OBJECT_URL,
      },
    },
    async (request, response) => {
      const { bucketName } = request.params
      const objectName = request.params['*']
      const { expiresIn, versionId } = request.body
      assertValidNumericJWTExpiration(expiresIn)

      const urlPath = request.url.split('?').shift()
      const imageTransformationEnabled = await isImageTransformationEnabled(request.tenantId)

      const transformationOptions = imageTransformationEnabled
        ? {
            transformations: ImageRenderer.applyTransformation(
              request.body.transform || {},
              true
            ).join(','),
            format: request.body.transform?.format || '',
          }
        : undefined

      const signedURL = await request.storage
        .from(bucketName)
        .signObjectUrl(objectName, urlPath as string, expiresIn, transformationOptions, versionId)

      return response.status(200).send({ signedURL })
    }
  )
}
