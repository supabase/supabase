import { ERRORS } from '@internal/errors'
import {
  assertLifecycleApiEnabled,
  assertLifecycleWriteReady,
  LifecycleConfigurationValidationError,
  normalizeLifecycleConfiguration,
} from '@storage/lifecycle'
import { bucketLifecycleConfigurationSchema } from '@storage/schemas/lifecycle'
import Ajv from 'ajv'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { finiteKeyword } from '../../finite'
import { registerJsonParserAllowingEmptyBody } from '../../plugins/empty-json-body'
import { createDefaultSchema, createResponse } from '../../routes-helper'
import { authSchema } from '../../schemas/auth'
import { deleteSuccessResponseSchema } from '../../schemas/delete-response'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const lifecycleParamsSchema = {
  type: 'object',
  properties: {
    bucketId: { type: 'string', examples: ['avatars'] },
  },
  required: ['bucketId'],
} as const

interface LifecycleRequest extends AuthenticatedRequest {
  Params: FromSchema<typeof lifecycleParamsSchema>
}

interface PutLifecycleRequest extends LifecycleRequest {
  Body: FromSchema<typeof bucketLifecycleConfigurationSchema>
}

function normalizeRestLifecycleConfiguration(input: unknown) {
  try {
    return normalizeLifecycleConfiguration(input)
  } catch (error) {
    if (error instanceof LifecycleConfigurationValidationError) {
      // REST keeps its parameter-validation envelope. The S3 adapter maps the
      // same validator categories to the corresponding AWS error codes.
      throw ERRORS.InvalidParameter('lifecycle_configuration', {
        error,
        message: error.message,
      })
    }
    throw error
  }
}

export default async function routes(fastify: FastifyInstance) {
  // Policy selectors and expiration values must retain their original JSON types.
  const putValidator = new Ajv({
    coerceTypes: false,
    schemas: [authSchema],
  }).addKeyword(finiteKeyword)

  const getSchema = createDefaultSchema(bucketLifecycleConfigurationSchema, {
    params: lifecycleParamsSchema,
    summary: 'Get a bucket lifecycle configuration',
    tags: ['bucket'],
  })
  const putSchema = createDefaultSchema(bucketLifecycleConfigurationSchema, {
    body: bucketLifecycleConfigurationSchema,
    description:
      'The full configuration replaces any existing policy. Semantic validation failures use the REST InvalidParameter error contract.',
    params: lifecycleParamsSchema,
    summary: 'Replace a bucket lifecycle configuration',
    tags: ['bucket'],
  })
  const deleteSchema = createDefaultSchema(deleteSuccessResponseSchema, {
    params: lifecycleParamsSchema,
    summary: 'Delete a bucket lifecycle configuration',
    tags: ['bucket'],
  })

  fastify.get<LifecycleRequest>(
    '/:bucketId/lifecycle',
    {
      schema: getSchema,
      config: { operation: ROUTE_OPERATIONS.GET_BUCKET_LIFECYCLE },
    },
    async (request, response) => {
      const { bucketId } = request.params
      assertLifecycleApiEnabled(bucketId)

      const configuration = await request.storage.getBucketLifecycle(bucketId)
      if (!configuration) {
        throw ERRORS.NoSuchLifecycleConfiguration(bucketId)
      }

      return response.send(configuration)
    }
  )

  fastify.put<PutLifecycleRequest>(
    '/:bucketId/lifecycle',
    {
      schema: putSchema,
      validatorCompiler: ({ schema }) => putValidator.compile(schema),
      config: { operation: ROUTE_OPERATIONS.PUT_BUCKET_LIFECYCLE },
    },
    async (request, response) => {
      const { bucketId } = request.params
      await assertLifecycleWriteReady(request.storage.db, bucketId)
      const configuration = normalizeRestLifecycleConfiguration(request.body)
      const storedConfiguration = await request.storage.putBucketLifecycle(bucketId, configuration)

      return response.send(storedConfiguration)
    }
  )

  fastify.register(async (f) => {
    registerJsonParserAllowingEmptyBody(f)

    f.delete<LifecycleRequest>(
      '/:bucketId/lifecycle',
      {
        schema: deleteSchema,
        config: { operation: ROUTE_OPERATIONS.DELETE_BUCKET_LIFECYCLE },
      },
      async (request, response) => {
        const { bucketId } = request.params
        assertLifecycleApiEnabled(bucketId)
        await request.storage.deleteBucketLifecycle(bucketId)

        return response.status(200).send(createResponse('Successfully deleted'))
      }
    )
  })
}
