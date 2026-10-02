import { ERRORS } from '@internal/errors'
import {
  MAX_PGVECTOR_QUERY_TOP_K,
  MAX_QUERY_NEXT_TOKEN_LENGTH,
  MAX_S3_QUERY_TOP_K,
  MIN_VECTOR_DIMENSIONS,
} from '@storage/protocols/vector/limits'
import { FastifyInstance } from 'fastify'
import { FromSchema } from 'json-schema-to-ts'
import { sharedErrorResponseSchemas } from '../../schemas/error'
import { AuthenticatedRequest } from '../../types'
import { ROUTE_OPERATIONS } from '../operations'
import { compileNoCoercionValidator } from './validation'

const queryVectorPrimitiveSchema = {
  $id: 'queryVectorPrimitive',
  anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'boolean' }],
} as const

const queryVectorFieldOperatorsSchema = {
  $id: 'queryVectorFieldOperators',
  type: 'object',
  minProperties: 1,
  propertyNames: { pattern: '^\\$' },
  properties: {
    $eq: { $ref: 'queryVectorPrimitive#' },
    $ne: { $ref: 'queryVectorPrimitive#' },
    $gt: { type: 'number' },
    $gte: { type: 'number' },
    $lt: { type: 'number' },
    $lte: { type: 'number' },
    $in: { type: 'array', minItems: 1, items: { $ref: 'queryVectorPrimitive#' } },
    $nin: { type: 'array', minItems: 1, items: { $ref: 'queryVectorPrimitive#' } },
    $exists: { type: 'boolean' },
  },
  additionalProperties: false,
} as const

const queryVectorLogicalFilterSchema = {
  $id: 'queryVectorLogicalFilter',
  anyOf: [
    {
      type: 'object',
      properties: {
        $and: {
          type: 'array',
          minItems: 1,
          items: { $ref: 'queryVectorFilter#' },
        },
      },
      required: ['$and'],
      additionalProperties: false,
    },
    {
      type: 'object',
      properties: {
        $or: {
          type: 'array',
          minItems: 1,
          items: { $ref: 'queryVectorFilter#' },
        },
      },
      required: ['$or'],
      additionalProperties: false,
    },
  ],
} as const

const queryVectorFilterSchema = {
  $id: 'queryVectorFilter',
  anyOf: [
    { $ref: 'queryVectorLogicalFilter#' },
    {
      type: 'object',
      propertyNames: { not: { pattern: '^\\$' } },
      additionalProperties: {
        anyOf: [{ $ref: 'queryVectorPrimitive#' }, { $ref: 'queryVectorFieldOperators#' }],
      },
    },
  ],
} as const

const queryVectorBodyBaseProperties = {
  indexArn: { type: 'string' },
  indexName: {
    type: 'string',
    minLength: 3,
    maxLength: 45,
    pattern: '^[a-z0-9](?:[a-z0-9.-]{1,61})?[a-z0-9]$',
  },
  nextToken: {
    type: 'string',
    minLength: 1,
    maxLength: MAX_QUERY_NEXT_TOKEN_LENGTH,
    description:
      'S3 Vectors pagination token from a previous QueryVectors request. The local pgvector backend does not paginate QueryVectors and will reject this parameter.',
  },
  queryVector: {
    type: 'object',
    properties: {
      float32: {
        type: 'array',
        minItems: MIN_VECTOR_DIMENSIONS,
        items: { type: 'number' },
      },
    },
    required: ['float32'],
    additionalProperties: false,
  },
  returnDistance: { type: 'boolean' },
  returnMetadata: { type: 'boolean' },
  topK: {
    type: 'integer',
    minimum: 1,
    maximum: MAX_S3_QUERY_TOP_K,
    description: `Number of nearest-neighbor results to return. S3 Vectors supports 1 to ${MAX_S3_QUERY_TOP_K}. The local pgvector backend supports 1 to ${MAX_PGVECTOR_QUERY_TOP_K} and will reject larger values.`,
  },
  vectorBucketName: { type: 'string' },
} as const

const queryVectorBodyRequired = ['vectorBucketName', 'indexName', 'queryVector', 'topK'] as const

// Strict body: used by Ajv for runtime validation. Filter is recursive
// (LogicalFilter <> Filter), so this schema is intentionally NOT registered on
// Fastify: cyclic refs cannot be represented in OpenAPI 3.0.3 `--dereferenced`
// JSON, which Redocly emits for the public docs spec.
const queryVectorBodySchema = {
  $id: 'queryVectorBody',
  type: 'object',
  properties: {
    filter: { $ref: 'queryVectorFilter#' },
    ...queryVectorBodyBaseProperties,
  },
  required: queryVectorBodyRequired,
  additionalProperties: false,
} as const

// Doc body: registered on Fastify for the OpenAPI spec. Filter is loosened
// to a generic object to avoid leaking the recursive Filter/LogicalFilter
// pair into the bundled spec. Filter syntax is documented in prose.
const queryVectorBodyDocSchema = {
  $id: 'queryVectorBodyDoc',
  type: 'object',
  properties: {
    filter: {
      type: 'object',
      description:
        'Boolean filter expression. Supports field operators ($eq, $ne, $gt, $gte, $lt, $lte, $in, $nin, $exists) and logical operators ($and, $or) with arbitrary nesting.',
      additionalProperties: true,
    },
    ...queryVectorBodyBaseProperties,
  },
  required: queryVectorBodyRequired,
  additionalProperties: false,
} as const

type QueryVectorPrimitive = string | number | boolean
type NonEmptyArray<T> = [T, ...T[]]
type RequireAtLeastOne<T extends object> = {
  [K in keyof T]-?: Required<Pick<T, K>> & Partial<Omit<T, K>>
}[keyof T]

type QueryVectorFieldOperators = RequireAtLeastOne<{
  $eq: QueryVectorPrimitive
  $ne: QueryVectorPrimitive
  $gt: number
  $gte: number
  $lt: number
  $lte: number
  $in: NonEmptyArray<QueryVectorPrimitive>
  $nin: NonEmptyArray<QueryVectorPrimitive>
  $exists: boolean
}>

type QueryVectorFilter =
  | { $and: NonEmptyArray<QueryVectorFilter> }
  | { $or: NonEmptyArray<QueryVectorFilter> }
  | ({
      [fieldName: string]: QueryVectorPrimitive | QueryVectorFieldOperators
    } & {
      [operatorName in `$${string}`]?: never
    })

type QueryVectorBody = Omit<FromSchema<typeof queryVectorBodySchema>, 'filter'> & {
  filter?: QueryVectorFilter
}

interface queryVectorRequest extends AuthenticatedRequest {
  Body: QueryVectorBody
}

export default async function routes(fastify: FastifyInstance) {
  // Only register the doc-facing body on Fastify so the recursive Filter
  // schemas never appear in components.schemas of the emitted OpenAPI spec.
  fastify.addSchema(queryVectorBodyDocSchema)

  // Strict validation runs through a separate Ajv instance so vector filters
  // keep their scalar types and payloads aren't silently stripped.
  const queryVectorsValidator = compileNoCoercionValidator(queryVectorBodySchema, [
    queryVectorPrimitiveSchema,
    queryVectorFieldOperatorsSchema,
    queryVectorLogicalFilterSchema,
    queryVectorFilterSchema,
  ])

  fastify.post<queryVectorRequest>(
    '/QueryVectors',
    {
      validatorCompiler: queryVectorsValidator,
      config: {
        operation: ROUTE_OPERATIONS.QUERY_VECTORS,
      },
      schema: {
        body: { $ref: 'queryVectorBodyDoc#' },
        response: sharedErrorResponseSchemas,
        tags: ['vector'],
        summary: 'Query vectors',
      },
    },
    async (request, response) => {
      if (!request.s3Vector) {
        throw ERRORS.FeatureNotEnabled('vectorStore', 'Vector service not configured')
      }

      const indexResult = await request.s3Vector.queryVectors({
        vectorBucketName: request.body.vectorBucketName,
        indexName: request.body.indexName,
        indexArn: request.body.indexArn,
        nextToken: request.body.nextToken,
        queryVector: request.body.queryVector,
        topK: request.body.topK,
        filter: request.body.filter,
        returnDistance: request.body.returnDistance,
        returnMetadata: request.body.returnMetadata,
      })

      return response.send(indexResult)
    }
  )
}
