import { getTenantConfig } from '@internal/database'
import { ImageRenderer } from '@storage/renderer'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { getConfig } from '../../../config'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { transformationOptionsSchema } from '../../schemas/transformations'
import { ROUTE_OPERATIONS } from '../operations'

const { storageS3Bucket, isMultitenant } = getConfig()

const renderAuthenticatedImageParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
    '*': { type: 'string', examples: ['folder/cat.png'] },
  },
  required: ['bucketName', '*'],
} as const

const renderImageQuerySchema = {
  ...transformationOptionsSchema,
  properties: {
    ...transformationOptionsSchema.properties,
    download: { type: 'string', examples: ['filename.png'] },
    versionId: { type: 'string', examples: ['eaa8bdb5-2e00-4767-b5a9-d2502efe2196'] },
  },
} as const

interface renderImageRequestInterface {
  Params: FromSchema<typeof renderAuthenticatedImageParamsSchema>
  Querystring: FromSchema<typeof renderImageQuerySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Render an authenticated image with the given transformations'
  fastify.get<renderImageRequestInterface>(
    '/authenticated/:bucketName/*',
    {
      schema: {
        params: renderAuthenticatedImageParamsSchema,
        querystring: renderImageQuerySchema,
        summary,
        response: sharedErrorResponseSchemas,
        tags: ['transformation'],
      },
      config: {
        operation: ROUTE_OPERATIONS.RENDER_AUTH_IMAGE,
      },
    },
    async (request, response) => {
      const { download, versionId } = request.query
      const { bucketName } = request.params
      const objectName = request.params['*']

      const obj = await request.storage
        .from(bucketName)
        .findObject(objectName, 'id,version,metadata', undefined, versionId)

      const s3Key = request.storage.location.getKeyLocation({
        tenantId: request.tenantId,
        bucketId: bucketName,
        objectName,
      })

      const renderer = request.storage.renderer('image') as ImageRenderer

      if (isMultitenant) {
        const tenantConfig = await getTenantConfig(request.tenantId)
        renderer.setLimits({
          maxResolution: tenantConfig.features.imageTransformation.maxResolution,
        })
      }

      return renderer.setTransformations(request.query).render(request, response, {
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
