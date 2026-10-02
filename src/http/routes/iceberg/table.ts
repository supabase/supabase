import { ERRORS } from '@internal/errors'
import { CreateTableRequest } from '@storage/protocols/iceberg/catalog/rest-catalog-client'
import { FastifyInstance } from 'fastify'
import JSONBigint from 'json-bigint'
import { FromSchema } from 'json-schema-to-ts'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'

const createTableSchema = {
  body: {
    type: 'object',
    required: ['name', 'schema'],
    properties: {
      name: { type: 'string' },
      location: { type: 'string', format: 'uri', nullable: true },

      schema: {
        allOf: [
          {
            type: 'object',
            required: ['type', 'fields'],
            properties: {
              type: { type: 'string', enum: ['struct'] },
              fields: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['id', 'name', 'type', 'required'],
                  properties: {
                    id: { type: 'integer', finite: true },
                    name: { type: 'string' },
                    // A field’s type can be a primitive or any nested container
                    type: {
                      oneOf: [
                        { type: 'string' }, // PrimitiveType
                        {
                          type: 'object', // StructType
                          required: ['type', 'fields'],
                          properties: {
                            type: { type: 'string', enum: ['struct'] },
                            fields: {
                              type: 'array',
                              items: { $comment: 'recurse nested StructField definitions here' },
                            },
                          },
                        },
                        {
                          type: 'object', // ListType
                          required: ['type', 'element-id', 'element', 'element-required'],
                          properties: {
                            type: { type: 'string', enum: ['list'] },
                            'element-id': { type: 'integer', finite: true },
                            element: { $comment: 'Type object (recurse)' },
                            'element-required': { type: 'boolean' },
                          },
                        },
                        {
                          type: 'object', // MapType
                          required: [
                            'type',
                            'key-id',
                            'key',
                            'value-id',
                            'value',
                            'value-required',
                          ],
                          properties: {
                            type: { type: 'string', enum: ['map'] },
                            'key-id': { type: 'integer', finite: true },
                            key: { $comment: 'Type object (recurse)' },
                            'value-id': { type: 'integer', finite: true },
                            value: { $comment: 'Type object (recurse)' },
                            'value-required': { type: 'boolean' },
                          },
                        },
                      ],
                    },
                    required: { type: 'boolean' },
                    doc: { type: 'string' },
                  },
                },
              },
            },
          },
          {
            type: 'object',
            properties: {
              'schema-id': { type: 'integer', finite: true, readOnly: true },
              'identifier-field-ids': {
                type: 'array',
                items: { type: 'integer', finite: true },
              },
            },
          },
        ],
      },

      spec: {
        type: 'object',
        required: ['fields'],
        properties: {
          'spec-id': { type: 'integer', finite: true, readOnly: true },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              required: ['source-id', 'transform', 'name'],
              properties: {
                'field-id': { type: 'integer', finite: true },
                'source-id': { type: 'integer', finite: true },
                name: { type: 'string' },
                transform: { type: 'string' },
              },
            },
          },
        },
      },
      properties: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
      'stage-create': { type: 'boolean', default: false },
      'write-order': {
        type: 'object',
        nullable: true,
        required: ['fields'],
        properties: {
          'order-id': { type: 'integer', finite: true, readOnly: true },
          fields: {
            type: 'array',
            items: {
              type: 'object',
              required: ['source-id', 'transform', 'direction', 'null-order'],
              properties: {
                'source-id': { type: 'integer', finite: true },
                transform: { type: 'string' },
                direction: { type: 'string', enum: ['asc', 'desc'] },
                'null-order': { type: 'string', enum: ['nulls-first', 'nulls-last'] },
              },
            },
          },
        },
      },
    },
  },
  params: {
    type: 'object',
    properties: {
      prefix: { type: 'string', examples: ['prefix'] },
      namespace: { type: 'string', examples: ['prefix'] },
    },
    required: ['prefix', 'namespace'],
  },
  summary: 'Create a table in the given namespace',
} as const

const listTableSchema = {
  type: 'object',
  querystring: {
    type: 'object',
    properties: {
      pageToken: { type: 'string' },
      pageSize: { type: 'integer', finite: true, minimum: 0 },
      parent: { type: 'string' },
    },
  },
  params: {
    type: 'object',
    properties: {
      prefix: { type: 'string', examples: ['prefix'] },
      namespace: { type: 'string', examples: ['namespace'] },
    },
    required: ['prefix', 'namespace'],
  },
  summary: 'Create a table',
} as const

const loadTableSchema = {
  type: 'object',
  params: {
    type: 'object',
    properties: {
      prefix: { type: 'string', examples: ['prefix'] },
      namespace: { type: 'string', examples: ['namespace'] },
      table: { type: 'string', examples: ['table'] },
    },
    required: ['prefix', 'namespace', 'table'],
  },
  summary: 'Load an Iceberg Table',
} as const

const dropTableSchema = {
  type: 'object',
  querystring: {
    type: 'object',
    properties: {
      purgeRequested: {
        type: 'string',
        enum: ['true', 'false', 'True', 'False'],
        default: 'false',
        description: 'If true, the table will be permanently deleted',
      },
    },
  },
  params: {
    type: 'object',
    properties: {
      prefix: { type: 'string', examples: ['prefix'] },
      namespace: { type: 'string', examples: ['namespace'] },
      table: { type: 'string', examples: ['table'] },
    },
    required: ['prefix', 'namespace', 'table'],
  },
  summary: 'Drop a Table',
} as const

const commitTransactionSchema = {
  type: 'object',
  params: {
    type: 'object',
    properties: {
      prefix: { type: 'string', examples: ['prefix'] },
      namespace: { type: 'string', examples: ['namespace'] },
      table: { type: 'string', examples: ['table'] },
    },
    required: ['prefix', 'namespace', 'table'],
  },
  body: {
    type: 'object',
    description: 'Commit updates to multiple tables in an atomic operation',
    properties: {
      requirements: {
        type: 'array',
        description: 'Assertions to validate before applying updates',
        items: {
          type: 'object',
          description: 'A requirement assertion',
          required: ['type'],
          properties: {
            type: {
              type: 'string',
              description:
                'Type of the requirement (e.g. assert-ref-snapshot-id, assert-table-uuid)',
              examples: ['assert-ref-snapshot-id', 'assert-table-uuid'],
            },
            // allow arbitrary additional args specific to the requirement
            ref: { type: 'string' },
            // 'snapshot-id': { type: 'number', format: 'int64', bigint: true },
            uuid: { type: 'string' },
            args: {
              type: 'object',
              additionalProperties: true,
            },
          },
          additionalProperties: true,
        },
      },
      updates: {
        type: 'array',
        description: 'Metadata updates to apply to the table',
        items: {
          type: 'object',
          description: 'A single update operation',
          required: ['action'],
          properties: {
            action: {
              type: 'string',
              description: 'Action to perform (e.g. add-snapshot, set-snapshot-ref)',
              examples: ['add-snapshot', 'set-snapshot-ref'],
            },
            snapshot: {
              type: 'object',
              properties: {
                // 'snapshot-id': { type: 'string', format: 'int64', bigint: true },
                // 'parent-snapshot-id': {
                //   type: 'integer',
                //   format: 'int64',
                //   bigint: true,
                //   nullable: true,
                // },
                'sequence-number': { type: 'integer', finite: true },
                'timestamp-ms': { type: 'integer', finite: true },
                'manifest-list': { type: 'string' },
                summary: {
                  type: 'object',
                  additionalProperties: true,
                  properties: {
                    operation: { type: 'string' },
                    'added-files-size': { type: 'string' },
                    'added-data-files': { type: 'string' },
                    'added-records': { type: 'string' },
                    'total-delete-files': { type: 'string' },
                    'total-records': { type: 'string' },
                    'total-position-deletes': { type: 'string' },
                    'total-equality-deletes': { type: 'string' },
                  },
                },
                'schema-id': { type: 'integer', finite: true },
              },
              additionalProperties: true,
            },
            // Fields for set-snapshot-ref or similar actions
            'ref-name': { type: 'string' },
            type: { type: 'string' },
            // 'snapshot-id': { type: 'integer', format: 'int64', bigint: true },
            args: {
              type: 'object',
              additionalProperties: true,
            },
          },
          additionalProperties: true,
        },
      },
    },
    required: ['updates', 'requirements'],
  },
  summary: 'Commit updates to multiple tables in an atomic operation',
} as const

interface createTableSchemaRequest extends AuthenticatedRequest {
  Body: FromSchema<(typeof createTableSchema)['body']>
  Params: FromSchema<(typeof createTableSchema)['params']>
}

interface listTableSchemaRequest extends AuthenticatedRequest {
  Querystring: FromSchema<(typeof listTableSchema)['querystring']>
  Params: FromSchema<(typeof listTableSchema)['params']>
}

interface dropTableSchemaRequest extends AuthenticatedRequest {
  Params: FromSchema<(typeof dropTableSchema)['params']>
  Querystring: FromSchema<(typeof dropTableSchema)['querystring']>
}

interface loadTableRequest extends AuthenticatedRequest {
  Params: FromSchema<(typeof loadTableSchema)['params']>
}

interface commitTableRequest extends AuthenticatedRequest {
  Params: FromSchema<(typeof commitTransactionSchema)['params']>
  Body: FromSchema<(typeof commitTransactionSchema)['body']>
}

const BigIntSerializer = JSONBigint({
  strict: true,
  useNativeBigInt: true,
})

export default async function routes(fastify: FastifyInstance) {
  // Make sure big ints responses are serialized correctly as integers and not strings
  fastify.setSerializerCompiler(() => {
    return BigIntSerializer.stringify
  })

  fastify.post<createTableSchemaRequest>(
    '/:prefix/namespaces/:namespace/tables',
    {
      schema: {
        ...createTableSchema,
        response: {
          200: {
            type: 'object',
            additionalProperties: true,
          },
        },
        tags: ['iceberg'],
      },
    },
    async (request, response) => {
      if (!request.icebergCatalog) {
        throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
      }

      const result = await request.icebergCatalog.createTable({
        ...(request.body as unknown as CreateTableRequest),
        warehouse: request.params.prefix,
        namespace: request.params.namespace,
      })

      return response.send(result)
    }
  )

  fastify.get<listTableSchemaRequest>(
    '/:prefix/namespaces/:namespace/tables',
    {
      config: {
        operation: ROUTE_OPERATIONS.ICEBERG_LIST_TABLES,
      },
      schema: {
        ...listTableSchema,
        response: {
          200: {
            type: 'object',
            additionalProperties: true,
          },
        },
        tags: ['iceberg'],
      },
    },
    async (request, response) => {
      if (!request.icebergCatalog) {
        throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
      }

      const result = await request.icebergCatalog.listTables({
        warehouse: request.params.prefix,
        namespace: request.params.namespace,
        pageSize: request.query.pageSize,
        pageToken: request.query.pageToken,
      })

      return response.send(result)
    }
  )

  fastify.get<loadTableRequest>(
    '/:prefix/namespaces/:namespace/tables/:table',
    {
      config: {
        operation: ROUTE_OPERATIONS.ICEBERG_LOAD_TABLE,
      },
      schema: {
        ...loadTableSchema,
        response: {
          200: {
            type: 'object',
            additionalProperties: true,
          },
        },
        tags: ['iceberg'],
      },
      exposeHeadRoute: false,
    },
    async (request, response) => {
      if (!request.icebergCatalog) {
        throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
      }

      const result = await request.icebergCatalog.loadTable({
        warehouse: request.params.prefix,
        namespace: request.params.namespace,
        table: request.params.table,
      })

      return response.send(result)
    }
  )

  fastify.head<loadTableRequest>(
    '/:prefix/namespaces/:namespace/tables/:table',
    {
      config: {
        operation: ROUTE_OPERATIONS.ICEBERG_TABLE_EXISTS,
      },
      schema: {
        ...loadTableSchema,
        response: {
          200: {
            type: 'object',
            additionalProperties: true,
          },
        },
        tags: ['iceberg'],
      },
    },
    async (request, response) => {
      if (!request.icebergCatalog) {
        throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
      }

      const result = await request.icebergCatalog.tableExists({
        warehouse: request.params.prefix,
        namespace: request.params.namespace,
        table: request.params.table,
      })

      return response.status(204).send(result)
    }
  )

  fastify.register(async (fastify) => {
    fastify.addContentTypeParser(
      'application/json',
      { bodyLimit: 0 },
      (_request, _payload, done) => {
        done(null, null)
      }
    )

    fastify.delete<dropTableSchemaRequest>(
      '/:prefix/namespaces/:namespace/tables/:table',
      {
        config: {
          operation: ROUTE_OPERATIONS.ICEBERG_DROP_TABLE,
        },
        schema: { ...dropTableSchema, tags: ['iceberg'] },
      },
      async (request, response) => {
        if (!request.icebergCatalog) {
          throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
        }

        const result = await request.icebergCatalog.dropTable({
          namespace: request.params.namespace,
          table: request.params.table,
          warehouse: request.params.prefix,
          purgeRequested: request.query.purgeRequested?.toLowerCase() === 'true',
        })

        return response.status(204).send(result)
      }
    )
  })

  fastify.register(async (fastify) => {
    fastify.addContentTypeParser('application/json', {}, (_request, payload: unknown, done) => {
      try {
        if (typeof payload === 'string') return done(null, JSONBigint.parse(payload))
        if (Buffer.isBuffer(payload)) return done(null, JSONBigint.parse(payload.toString('utf8')))
        if (isReadablePayload(payload)) {
          const chunks: Buffer[] = []
          payload.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))))
          payload.on('end', () => {
            try {
              done(null, JSONBigint.parse(Buffer.concat(chunks).toString('utf8')))
            } catch (err) {
              done(err as Error)
            }
          })
          ;(payload as NodeJS.ReadableStream).on('error', (err) => done(err as Error))
          return
        }
        done(null, payload)
      } catch (err) {
        done(err as Error)
      }
    })

    fastify.post<commitTableRequest>(
      '/:prefix/namespaces/:namespace/tables/:table',
      {
        config: {
          operation: ROUTE_OPERATIONS.ICEBERG_COMMIT_TABLE,
        },
        schema: {
          ...commitTransactionSchema,
          response: {
            200: {
              type: 'object',
              additionalProperties: true,
            },
          },
          tags: ['iceberg'],
        },
      },
      async (request, response) => {
        if (!request.icebergCatalog) {
          throw ERRORS.FeatureNotEnabled('icebergCatalog', 'iceberg_catalog')
        }

        const result = await request.icebergCatalog.updateTable({
          namespace: request.params.namespace,
          table: request.params.table,
          warehouse: request.params.prefix,
          requirements: request.body.requirements,
          updates: request.body.updates,
        })

        return response.send(result)
      }
    )
  })
}

function isReadablePayload(payload: unknown): payload is NodeJS.ReadableStream {
  return (
    !!payload && typeof payload === 'object' && 'on' in payload && typeof payload.on === 'function'
  )
}
