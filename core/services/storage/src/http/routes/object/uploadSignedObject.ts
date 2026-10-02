import fastifyMultipart from '@fastify/multipart'
import { SIGNED_URL_SCOPE_UPLOAD } from '@internal/auth'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { ROUTE_OPERATIONS } from '../operations'

const uploadSignedObjectParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
    '*': { type: 'string', examples: ['folder/cat.png'] },
  },
  required: ['bucketName', '*'],
} as const

const uploadSignedObjectQSSchema = {
  type: 'object',
  properties: {
    token: {
      type: 'string',
      examples: [
        'TEST_JWT_REDACTED',
      ],
    },
  },
  required: ['token'],
} as const

const successResponseSchema = {
  type: 'object',
  properties: {
    Key: { type: 'string', examples: ['avatars/folder/cat.png'] },
  },
  required: ['Key'],
}

interface UploadSignedObjectRequestInterface {
  Params: FromSchema<typeof uploadSignedObjectParamsSchema>
  Querystring: FromSchema<typeof uploadSignedObjectQSSchema>
  Headers: {
    range?: string
  }
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Uploads an object via a presigned URL'

  fastify.register(fastifyMultipart, {
    limits: {
      fields: 10,
      files: 1,
    },
    throwFileSizeLimit: false,
  })

  fastify.addContentTypeParser(
    ['application/json', 'text/plain'],
    function (request, payload, done) {
      done(null)
    }
  )

  fastify.put<UploadSignedObjectRequestInterface>(
    '/upload/sign/:bucketName/*',
    {
      // @todo add success response schema here
      schema: {
        params: uploadSignedObjectParamsSchema,
        querystring: uploadSignedObjectQSSchema,
        summary,
        response: {
          200: { description: 'Successful response', ...successResponseSchema },
          ...sharedErrorResponseSchemas,
        },
        tags: ['object'],
      },
      config: {
        operation: ROUTE_OPERATIONS.UPLOAD_SIGN_OBJECT,
      },
    },
    async (request, response) => {
      // Validate sender
      const { token } = request.query
      const { bucketName } = request.params
      const objectName = request.params['*']

      const { owner, upsert } = await request.storage
        .from(bucketName)
        .verifyObjectSignature(token, objectName, SIGNED_URL_SCOPE_UPLOAD)

      const { objectMetadata, path } = await request.storage
        .asSuperUser()
        .from(bucketName)
        .uploadFromRequest(request, {
          owner,
          objectName,
          isUpsert: upsert,
          signal: request.signals.body.signal,
        })

      return response.status(objectMetadata?.httpStatusCode ?? 200).send({
        Key: path,
      })
    }
  )
}
