import { assertValidNumericJWTExpiration } from '@internal/auth'
import { MAX_OBJECTS_PER_REQUEST } from '@storage/limits'
import { FastifyInstance, FastifyRequest } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const getSignedURLsParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
  },
  required: ['bucketName'],
} as const
const getSignedURLsBodySchema = {
  type: 'object',
  properties: {
    expiresIn: {
      type: 'integer',
      finite: true,
      minimum: 1,
      examples: [60000],
    },
    paths: {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
      maxItems: MAX_OBJECTS_PER_REQUEST,
      examples: [['folder/cat.png', 'folder/morecats.png']],
    },
  },
  required: ['expiresIn', 'paths'],
} as const
const successResponseSchema = {
  type: 'array',
  items: {
    type: 'object',
    properties: {
      error: {
        type: ['string', 'null'],
        examples: ['Either the object does not exist or you do not have access to it'],
      },
      path: {
        type: 'string',
        examples: ['folder/cat.png'],
      },
      signedURL: {
        type: ['string', 'null'],
        examples: [
          '/object/sign/avatars/folder/cat.png?token=TEST_JWT_REDACTED',
        ],
      },
    },
    required: ['error', 'path', 'signedURL'],
  },
}
interface getSignedURLsRequestInterface extends AuthenticatedRequest {
  Params: FromSchema<typeof getSignedURLsParamsSchema>
  Body: FromSchema<typeof getSignedURLsBodySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Generate presigned urls to retrieve objects'

  const schema = createDefaultSchema(successResponseSchema, {
    body: getSignedURLsBodySchema,
    params: getSignedURLsParamsSchema,
    summary,
    tags: ['object'],
  })

  fastify.post<getSignedURLsRequestInterface>(
    '/sign/:bucketName',
    {
      schema,
      config: {
        operation: ROUTE_OPERATIONS.SIGN_OBJECT_URLS,
        resources: (req: FastifyRequest<getSignedURLsRequestInterface>) => {
          const { paths } = req.body
          return paths.map((path) => `${req.params.bucketName}/${path}`)
        },
      },
    },
    async (request, response) => {
      const { bucketName } = request.params
      const { expiresIn, paths } = request.body
      assertValidNumericJWTExpiration(expiresIn)

      const signedURLs = await request.storage.from(bucketName).signObjectUrls(paths, expiresIn)

      return response.status(200).send(signedURLs)
    }
  )
}
