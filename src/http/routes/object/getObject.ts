import { ERRORS } from '@internal/errors'
import { Obj } from '@storage/schemas'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { getConfig } from '../../../config'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRangeRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const { storageS3Bucket } = getConfig()

const getObjectParamsSchema = {
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

interface getObjectRequestInterface extends AuthenticatedRangeRequest {
  Params: FromSchema<typeof getObjectParamsSchema>
  Querystring: FromSchema<typeof getObjectQuerySchema>
}

type GetObjectRequest = FastifyRequest<getObjectRequestInterface>

async function requestHandler(request: GetObjectRequest, response: FastifyReply) {
  const { bucketName } = request.params
  const { download, versionId } = request.query
  const objectName = request.params['*']

  // send the object from s3
  const s3Key = request.storage.location.getKeyLocation({
    tenantId: request.tenantId,
    bucketId: bucketName,
    objectName,
  })
  const bucket = await request.storage.asSuperUser().findBucket(bucketName, 'id,public', {
    dontErrorOnEmpty: true,
  })

  // The request is not authenticated
  if (!request.isAuthenticated) {
    // The bucket must be public to access its content
    if (!bucket?.public) {
      throw ERRORS.NoSuchBucket(bucketName)
    }
  }

  // The request is authenticated
  if (!bucket) {
    throw ERRORS.NoSuchBucket(bucketName)
  }

  let obj: Obj | undefined

  if (bucket.public) {
    // request is authenticated but we still use the superUser as we don't need to check RLS
    obj = await request.storage
      .asSuperUser()
      .from(bucketName)
      .findObject(objectName, 'id, version, metadata', undefined, versionId)
  } else {
    // request is authenticated use RLS
    obj = await request.storage
      .from(bucketName)
      .findObject(objectName, 'id, version, metadata', undefined, versionId)
  }

  return request.storage.renderer('asset').render(request, response, {
    bucket: storageS3Bucket,
    key: s3Key,
    version: obj.version,
    download,
    xRobotsTag: obj.metadata?.['xRobotsTag'] as string | undefined,
    signal: request.signals.disconnect.signal,
  })
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Retrieve an object'
  fastify.get<getObjectRequestInterface>(
    '/authenticated/:bucketName/*',
    {
      exposeHeadRoute: false,
      // @todo add success response schema here
      schema: {
        params: getObjectParamsSchema,
        querystring: getObjectQuerySchema,
        headers: { $ref: 'authSchema#' },
        summary,
        response: sharedErrorResponseSchemas,
        tags: ['object'],
      },
      config: {
        operation: ROUTE_OPERATIONS.GET_AUTH_OBJECT,
      },
    },
    async (request, response) => {
      return requestHandler(request, response)
    }
  )

  fastify.get<getObjectRequestInterface>(
    '/:bucketName/*',
    {
      exposeHeadRoute: false,
      // @todo add success response schema here
      schema: {
        params: getObjectParamsSchema,
        querystring: getObjectQuerySchema,
        summary,
        description: 'Serve objects',
        tags: ['object'],
        response: sharedErrorResponseSchemas,
      },
      config: {
        operation: ROUTE_OPERATIONS.GET_AUTH_OBJECT,
        allowInvalidJwt: true,
      },
    },
    async (request, response) => {
      return requestHandler(request, response)
    }
  )
}
