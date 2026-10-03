import { s3CredentialsManager } from '@internal/database'
import { ERRORS } from '@internal/errors'
import { isUuid } from '@storage/limits'
import { FastifyInstance, RequestGenericInterface } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { registerApiKeyAuth } from '../../plugins/apikey'

const createCredentialsSchema = {
  description: 'Create S3 Credentials',
  params: {
    type: 'object',
    properties: {
      tenantId: { type: 'string' },
    },
    required: ['tenantId'],
  },
  body: {
    type: 'object',
    properties: {
      description: { type: 'string', minLength: 3, maxLength: 2000 },
      claims: {
        type: 'object',
        properties: {
          role: { type: 'string' },
          sub: { type: 'string' },
        },
        required: ['role'],
        additionalProperties: true,
      },
    },
    required: ['description'],
  },
} as const

const deleteCredentialsSchema = {
  description: 'Delete S3 Credentials',
  params: {
    type: 'object',
    properties: {
      tenantId: { type: 'string' },
    },
    required: ['tenantId'],
  },
  body: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },
} as const

const listCredentialsSchema = {
  description: 'List S3 Credentials',
  params: {
    type: 'object',
    properties: {
      tenantId: { type: 'string' },
    },
    required: ['tenantId'],
  },
} as const

interface CreateCredentialsRequest extends RequestGenericInterface {
  Body: FromSchema<typeof createCredentialsSchema.body>
  Params: {
    tenantId: string
  }
}

interface DeleteCredentialsRequest extends RequestGenericInterface {
  Body: FromSchema<typeof deleteCredentialsSchema.body>
  Params: {
    tenantId: string
  }
}

interface ListCredentialsRequest extends RequestGenericInterface {
  Params: {
    tenantId: string
  }
}

export default async function routes(fastify: FastifyInstance) {
  registerApiKeyAuth(fastify)

  fastify.post<CreateCredentialsRequest>(
    '/:tenantId/credentials',
    {
      schema: { ...createCredentialsSchema, tags: ['s3-credentials'] },
    },
    async (req, reply) => {
      const credentials = await s3CredentialsManager.createS3Credentials(req.params.tenantId, {
        description: req.body.description,
        claims: req.body.claims,
      })

      reply.status(201).send({
        id: credentials.id,
        access_key: credentials.access_key,
        secret_key: credentials.secret_key,
        description: req.body.description,
      })
    }
  )

  fastify.get<ListCredentialsRequest>(
    '/:tenantId/credentials',
    { schema: { ...listCredentialsSchema, tags: ['s3-credentials'] } },
    async (req, reply) => {
      const credentials = await s3CredentialsManager.listS3Credentials(req.params.tenantId)
      return reply.send(credentials)
    }
  )

  fastify.delete<DeleteCredentialsRequest>(
    '/:tenantId/credentials',
    { schema: { ...deleteCredentialsSchema, tags: ['s3-credentials'] } },
    async (req, reply) => {
      if (!isUuid(req.body.id)) {
        throw ERRORS.InvalidParameter('id not uuid')
      }
      await s3CredentialsManager.deleteS3Credential(req.params.tenantId, req.body.id)

      return reply.code(204).send()
    }
  )
}
