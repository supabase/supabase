import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { getConfig } from '../../../config'
import { SIGNED_URL_SCOPE_DOWNLOAD } from '../../../internal/auth'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { ROUTE_OPERATIONS } from '../operations'

const { storageS3Bucket } = getConfig()

const getSignedObjectParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
    '*': { type: 'string', examples: ['folder/cat.png'] },
  },
  required: ['bucketName', '*'],
} as const

const getSignedObjectQSSchema = {
  type: 'object',
  properties: {
    download: { type: 'string', examples: ['filename.jpg', null] },
    token: {
      type: 'string',
      examples: [
        'TEST_JWT_REDACTED',
      ],
    },
  },
  required: ['token'],
} as const

interface GetSignedObjectRequestInterface {
  Params: FromSchema<typeof getSignedObjectParamsSchema>
  Querystring: FromSchema<typeof getSignedObjectQSSchema>
  Headers: {
    range?: string
  }
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Retrieve an object via a presigned URL'
  fastify.get<GetSignedObjectRequestInterface>(
    '/sign/:bucketName/*',
    {
      // @todo add success response schema here
      schema: {
        params: getSignedObjectParamsSchema,
        querystring: getSignedObjectQSSchema,
        summary,
        response: sharedErrorResponseSchemas,
        tags: ['object'],
      },
      config: {
        operation: ROUTE_OPERATIONS.GET_SIGNED_OBJECT,
      },
    },
    async (request, response) => {
      const { token } = request.query
      const { download } = request.query

      const { url, exp, versionId } = await request.storage
        .from(request.params.bucketName)
        .verifyObjectSignature(token, request.params['*'], SIGNED_URL_SCOPE_DOWNLOAD)

      const s3Key = `${request.tenantId}/${url}`

      const [bucketName, ...objParts] = url.split('/')
      const obj = await request.storage
        .asSuperUser()
        .from(bucketName)
        .findObject(objParts.join('/'), 'id,version,metadata', undefined, versionId)

      return request.storage.renderer('asset').render(request, response, {
        bucket: storageS3Bucket,
        key: s3Key,
        version: obj.version,
        download,
        expires: new Date(exp * 1000).toUTCString(),
        xRobotsTag: obj.metadata?.['xRobotsTag'] as string | undefined,
        signal: request.signals.disconnect.signal,
      })
    }
  )
}
