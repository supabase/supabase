import fastifyMultipart from '@fastify/multipart'
import { FastifyInstance, RequestGenericInterface } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { createDefaultSchema } from '../../routes-helper'
import { ROUTE_OPERATIONS } from '../operations'

const updateObjectParamsSchema = {
  type: 'object',
  properties: {
    bucketName: { type: 'string', examples: ['avatars'] },
    '*': { type: 'string', examples: ['folder/cat.png'] },
  },
  required: ['bucketName', '*'],
} as const
const successResponseSchema = {
  type: 'object',
  properties: {
    Id: {
      type: 'string',
    },
    Key: { type: 'string', examples: ['avatars/folder/cat.png'] },
  },
  required: ['Key'],
}
interface updateObjectRequestInterface extends RequestGenericInterface {
  Params: FromSchema<typeof updateObjectParamsSchema>
  Headers: {
    authorization: string
    'content-type': string
    'cache-control'?: string
    'x-upsert'?: string
    'x-robots-tag'?: string
  }
}

export default async function routes(fastify: FastifyInstance) {
  const summary = 'Update the object at an existing key'

  const schema = createDefaultSchema(successResponseSchema, {
    params: updateObjectParamsSchema,
    summary,
    tags: ['object'],
  })

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

  fastify.put<updateObjectRequestInterface>(
    '/:bucketName/*',
    {
      schema,
      config: {
        operation: ROUTE_OPERATIONS.UPDATE_OBJECT,
      },
    },
    async (request, response) => {
      const { bucketName } = request.params
      const objectName = request.params['*']
      const owner = request.owner as string

      const { objectMetadata, path, id } = await request.storage
        .from(bucketName)
        .uploadFromRequest(request, {
          objectName,
          signal: request.signals.body.signal,
          owner,
          isUpsert: true,
        })

      return response.status(objectMetadata?.httpStatusCode ?? 200).send({
        Id: id,
        Key: path,
      })
    }
  )
}
