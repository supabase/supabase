import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { getConfig } from '../../../config'
import { parseUserMetadata } from '../../../storage/uploader'
import { createDefaultSchema } from '../../routes-helper'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const { uploadSignedUrlExpirationTime } = getConfig()

const getSignedUploadURLParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
    '*': { type: 'string', examples: ['folder/cat.png'] },
  },
  required: ['bucketName', '*'],
} as const

const getSignedUploadURLHeadersSchema = {
  type: 'object',
  properties: {
    'x-upsert': { type: 'string' },
    'x-metadata': { type: 'string' },
    'content-type': { type: 'string' },
    'content-length': { type: 'string' },
    authorization: { type: 'string' },
  },
  required: ['authorization'],
} as const

const successResponseSchema = {
  type: 'object',
  properties: {
    url: {
      type: 'string',
      examples: [
        '/object/sign/upload/avatars/folder/cat.png?token=TEST_JWT_REDACTED',
      ],
    },
    token: {
      type: 'string',
    },
  },
  required: ['url'],
}
interface getSignedURLRequestInterface extends AuthenticatedRequest {
  Params: FromSchema<typeof getSignedUploadURLParamsSchema>
  Headers: FromSchema<typeof getSignedUploadURLHeadersSchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Generate a presigned url to upload an object'

  const schema = createDefaultSchema(successResponseSchema, {
    params: getSignedUploadURLParamsSchema,
    summary,
    tags: ['object'],
  })

  fastify.post<getSignedURLRequestInterface>(
    '/upload/sign/:bucketName/*',
    {
      schema,
      config: {
        operation: ROUTE_OPERATIONS.SIGN_UPLOAD_URL,
      },
    },
    async (request, response) => {
      const { bucketName } = request.params
      const objectName = request.params['*']
      const owner = request.owner

      const urlPath = `${bucketName}/${objectName}`

      let userMetadata: Record<string, unknown> | undefined

      const customMd = request.headers['x-metadata']

      if (typeof customMd === 'string') {
        // TODO: parseUserMetadata casts to Record<string, string> but values could be anything;
        // validation should be added in a follow-up
        userMetadata = parseUserMetadata(customMd)
      }

      const contentType = request.headers['content-type']
      const contentLengthHeader = request.headers['content-length']
      const contentLength = contentLengthHeader ? Number(contentLengthHeader) : undefined

      const signedUpload = await request.storage
        .from(bucketName)
        .signUploadObjectUrl(objectName, urlPath as string, uploadSignedUrlExpirationTime, owner, {
          upsert: request.headers['x-upsert'] === 'true',
          userMetadata,
          metadata: {
            mimetype: contentType,
            contentLength,
          },
        })

      return response.status(200).send({ url: signedUpload.url, token: signedUpload.token })
    }
  )
}
