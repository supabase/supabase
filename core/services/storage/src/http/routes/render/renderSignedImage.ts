import { SIGNED_URL_SCOPE_DOWNLOAD } from '@internal/auth'
import { getTenantConfig } from '@internal/database'
import { ImageRenderer } from '@storage/renderer'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { getConfig } from '../../../config'
import { sharedErrorResponseSchemas } from '../../schemas/error'
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
  type: 'object',
  properties: {
    token: {
      type: 'string',
      examples: [
        'TEST_JWT_REDACTED',
      ],
    },
    download: { type: 'string', examples: ['filename.png'] },
  },
  required: ['token'],
} as const

interface renderImageRequestInterface {
  Params: FromSchema<typeof renderAuthenticatedImageParamsSchema>
  Querystring: FromSchema<typeof renderImageQuerySchema>
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Render an authenticated image with the given transformations'
  fastify.get<renderImageRequestInterface>(
    '/sign/:bucketName/*',
    {
      schema: {
        params: renderAuthenticatedImageParamsSchema,
        querystring: renderImageQuerySchema,
        summary,
        response: sharedErrorResponseSchemas,
        tags: ['transformation'],
      },
      config: {
        operation: ROUTE_OPERATIONS.RENDER_SIGNED_IMAGE,
      },
    },
    async (request, response) => {
      const { token } = request.query
      const { download } = request.query

      const { url, transformations, format, exp, versionId } = await request.storage
        .from(request.params.bucketName)
        .verifyObjectSignature(token, request.params['*'], SIGNED_URL_SCOPE_DOWNLOAD)

      const s3Key = `${request.tenantId}/${url}`

      const [bucketName, ...objParts] = url.split('/')
      const obj = await request.storage
        .asSuperUser()
        .from(bucketName)
        .findObject(objParts.join('/'), 'id,version,metadata', undefined, versionId)

      const renderer = request.storage.renderer('image') as ImageRenderer

      if (isMultitenant) {
        const tenantConfig = await getTenantConfig(request.tenantId)
        renderer.setLimits({
          maxResolution: tenantConfig.features.imageTransformation.maxResolution,
        })
      }

      // The signed URL keeps `format` in its own claim, and the transformations
      // string never contains format:origin, so restore it from the claim.
      const signedTransformations =
        format === 'origin'
          ? [transformations, 'format:origin'].filter(Boolean).join(',')
          : transformations || ''

      return renderer
        .setTransformationsFromString(signedTransformations)
        .render(request, response, {
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
