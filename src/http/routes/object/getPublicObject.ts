import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { getConfig } from '../../../config'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { ROUTE_OPERATIONS } from '../operations'

const { storageS3Bucket } = getConfig()

const getPublicObjectParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
    '*': { type: 'string', examples: ['folder/cat.png'] },
  },
  required: ['bucketName', '*'],
} as const

const getObjectQuerySchema = {
  type: 'object',
  properties: {
    download: { type: 'string', examples: ['filename.jpg', null] },
    versionId: { type: 'string', examples: ['eaa8bdb5-2e00-4767-b5a9-d2502efe2196'] },
  },
} as const

interface getObjectRequestInterface {
  Params: FromSchema<typeof getPublicObjectParamsSchema>
  Headers: {
    range?: string
  }
  Querystring: FromSchema<typeof getObjectQuerySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Retrieve an object from a public bucket'
  fastify.get<getObjectRequestInterface>(
    '/public/:bucketName/*',
    {
      // @todo add success response schema here
      exposeHeadRoute: false,
      schema: {
        params: getPublicObjectParamsSchema,
        querystring: getObjectQuerySchema,
        summary,
        response: sharedErrorResponseSchemas,
        tags: ['object'],
      },
      config: {
        operation: ROUTE_OPERATIONS.GET_PUBLIC_OBJECT,
      },
    },
    async (request, response) => {
      const { bucketName } = request.params
      const objectName = request.params['*']
      const { download, versionId } = request.query

      const bucketRef = request.storage.asSuperUser().from(bucketName)
      const [, obj] = await Promise.all([
        request.storage.asSuperUser().findBucket(bucketName, 'id,public', {
          isPublic: true,
        }),
        bucketRef.findObject(objectName, 'id,version,metadata', undefined, versionId),
      ])

      // send the object from s3
      const s3Key = request.storage.location.getKeyLocation({
        tenantId: request.tenantId,
        bucketId: bucketName,
        objectName,
      })

      return request.storage.renderer('asset').render(request, response, {
        bucket: storageS3Bucket,
        key: s3Key,
        version: obj.version,
        download,
        xRobotsTag: obj.metadata?.['xRobotsTag'] as string | undefined,
        signal: request.signals.disconnect.signal,
      })
    }
  )
}
