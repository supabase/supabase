import { ERRORS } from '@internal/errors'
import { Obj } from '@storage/schemas'
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { getConfig } from '../../../config'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { transformationOptionsSchema } from '../../schemas/transformations'
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

const getObjectInfoQuerySchema = {
  ...transformationOptionsSchema,
  properties: {
    ...transformationOptionsSchema.properties,
    versionId: { type: 'string', examples: ['eaa8bdb5-2e00-4767-b5a9-d2502efe2196'] },
  },
} as const

interface getObjectRequestInterface extends AuthenticatedRangeRequest {
  Params: FromSchema<typeof getObjectParamsSchema>
  Querystring: FromSchema<typeof getObjectInfoQuerySchema>
}

type GetObjectInfoRequest = FastifyRequest<getObjectRequestInterface>

async function requestHandler(
  request: GetObjectInfoRequest,
  response: FastifyReply,
  publicRoute = false,
  method: 'head' | 'info' = 'head'
) {
  const { bucketName } = request.params
  const objectName = request.params['*']
  const { versionId } = request.query

  const s3Key = request.storage.location.getKeyLocation({
    tenantId: request.tenantId,
    bucketId: bucketName,
    objectName,
  })

  const bucket = await request.storage.asSuperUser().findBucket(bucketName, 'id,public', {
    dontErrorOnEmpty: true,
  })

  // Not Authenticated flow
  if (!request.isAuthenticated) {
    if (!bucket?.public) {
      throw ERRORS.NoSuchBucket(bucketName)
    }
  }

  // Authenticated flow
  if (!bucket) {
    throw ERRORS.NoSuchBucket(bucketName)
  }

  const hasVersioningColumns = await request.storage.db.hasMigration('object-versioning-core')
  const columns = hasVersioningColumns
    ? 'id,name,version,bucket_id,metadata,user_metadata,updated_at,created_at,archived_at,is_delete_marker,is_versioned'
    : 'id,name,version,bucket_id,metadata,user_metadata,updated_at,created_at'

  let obj: Obj

  if (bucket.public || publicRoute) {
    obj = await request.storage
      .asSuperUser()
      .from(bucketName)
      .findObject(objectName, columns, undefined, versionId)
  } else {
    obj = await request.storage
      .from(bucketName)
      .findObject(objectName, columns, undefined, versionId)
  }

  return request.storage.renderer(method).render(request, response, {
    bucket: storageS3Bucket,
    key: s3Key,
    version: obj.version,
    object: obj,
  })
}

export async function publicRoutes(fastify: FastifyInstance) {
  fastify.head<getObjectRequestInterface>(
    '/public/:bucketName/*',
    {
      schema: {
        params: getObjectParamsSchema,
        querystring: getObjectInfoQuerySchema,
        summary: 'Get object info',
        description: 'returns object info',
        tags: ['object'],
        response: sharedErrorResponseSchemas,
      },
      config: {
        operation: ROUTE_OPERATIONS.INFO_PUBLIC_OBJECT,
      },
    },
    async (request, response) => {
      return requestHandler(request, response, true)
    }
  )

  fastify.get<getObjectRequestInterface>(
    '/info/public/:bucketName/*',
    {
      exposeHeadRoute: false,
      schema: {
        params: getObjectParamsSchema,
        querystring: getObjectInfoQuerySchema,
        summary: 'Get object info',
        description: 'returns object info',
        tags: ['object'],
        response: sharedErrorResponseSchemas,
      },
      config: {
        operation: ROUTE_OPERATIONS.INFO_PUBLIC_OBJECT,
      },
    },
    async (request, response) => {
      return requestHandler(request, response, true, 'info')
    }
  )
}

export async function authenticatedRoutes(fastify: FastifyInstance) {
  const summary = 'Retrieve object info'
  fastify.head<getObjectRequestInterface>(
    '/authenticated/:bucketName/*',
    {
      schema: {
        params: getObjectParamsSchema,
        querystring: getObjectInfoQuerySchema,
        headers: { $ref: 'authSchema#' },
        summary,
        response: sharedErrorResponseSchemas,
        tags: ['object'],
      },
      config: {
        operation: ROUTE_OPERATIONS.HEAD_AUTH_OBJECT_INFO,
      },
    },
    async (request, response) => {
      return requestHandler(request, response)
    }
  )

  fastify.get<getObjectRequestInterface>(
    '/info/authenticated/:bucketName/*',
    {
      schema: {
        params: getObjectParamsSchema,
        querystring: getObjectInfoQuerySchema,
        headers: { $ref: 'authSchema#' },
        summary,
        response: sharedErrorResponseSchemas,
        tags: ['object'],
      },
      config: {
        operation: ROUTE_OPERATIONS.GET_AUTH_OBJECT_INFO,
      },
    },
    async (request, response) => {
      return requestHandler(request, response, false, 'info')
    }
  )

  fastify.get<getObjectRequestInterface>(
    '/info/:bucketName/*',
    {
      schema: {
        params: getObjectParamsSchema,
        querystring: getObjectInfoQuerySchema,
        summary,
        description: 'Object Info',
        tags: ['object'],
        response: sharedErrorResponseSchemas,
      },
      config: {
        operation: ROUTE_OPERATIONS.GET_AUTH_OBJECT_INFO,
        allowInvalidJwt: true,
      },
    },
    async (request, response) => {
      return requestHandler(request, response, false, 'info')
    }
  )

  fastify.head<getObjectRequestInterface>(
    '/:bucketName/*',
    {
      schema: {
        params: getObjectParamsSchema,
        querystring: getObjectInfoQuerySchema,
        summary,
        description: 'Head object info',
        tags: ['object'],
        response: sharedErrorResponseSchemas,
      },
      config: {
        operation: ROUTE_OPERATIONS.HEAD_AUTH_OBJECT_INFO,
        allowInvalidJwt: true,
      },
    },
    async (request, response) => {
      return requestHandler(request, response)
    }
  )
}
