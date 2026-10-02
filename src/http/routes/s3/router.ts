import { Storage } from '@storage/storage'
import type { ValidateFunction } from 'ajv'
import Ajv from 'ajv'
import { JTDDataType } from 'ajv/dist/jtd'
import fastUri from 'fast-uri'
import { FastifyRequest } from 'fastify'
import { FromSchema, JSONSchema } from 'json-schema-to-ts'
import { finiteKeyword } from '../../finite'
import { default as AbortMultiPartUpload } from './commands/abort-multipart-upload'
import { default as BucketLifecycle } from './commands/bucket-lifecycle'
import { default as CompleteMultipartUpload } from './commands/complete-multipart-upload'
import { default as CopyObject } from './commands/copy-object'
import { default as CreateBucket } from './commands/create-bucket'
import { default as CreateMultipartUpload } from './commands/create-multipart-upload'
import { default as DeleteBucket } from './commands/delete-bucket'
import { default as DeleteObject } from './commands/delete-object'
import { default as GetBucket } from './commands/get-bucket'
import { default as GetObject } from './commands/get-object'
import { default as HeadBucket } from './commands/head-bucket'
import { default as HeadObject } from './commands/head-object'
import { default as ListBucket } from './commands/list-buckets'
import { default as ListMultipartUploads } from './commands/list-multipart-uploads'
import { default as ListObjects } from './commands/list-objects'
import { default as ListParts } from './commands/list-parts'
import { default as PutObject } from './commands/put-object'
import { default as UploadPart } from './commands/upload-part'
import { default as UploadPartCopy } from './commands/upload-part-copy'

export type Context = {
  storage: Storage
  tenantId: string
  owner?: string
  req: FastifyRequest
  signals: { body: AbortSignal; response: AbortSignal }
}
export type S3Router = Router<Context>

const s3Commands = [
  BucketLifecycle,
  UploadPartCopy,
  CopyObject,
  DeleteBucket,
  HeadObject,
  CreateBucket,
  CompleteMultipartUpload,
  CreateMultipartUpload,
  UploadPart,
  PutObject,
  AbortMultiPartUpload,
  ListMultipartUploads,
  DeleteObject,
  GetBucket,
  HeadBucket,
  ListBucket,
  ListParts,
  GetObject,
  ListObjects,
]

export function getRouter() {
  const router = new Router<Context>()
  s3Commands.forEach((command) => command(router))
  return router
}

export type HTTPMethod = 'get' | 'put' | 'post' | 'head' | 'delete' | 'patch'

export type Schema<
  Q extends JSONSchema = JSONSchema,
  H extends JSONSchema = JSONSchema,
  P extends JSONSchema = JSONSchema,
  B extends JSONSchema = JSONSchema,
> = {
  summary?: string
  Querystring?: Q
  Headers?: H
  Params?: P
  Body?: B
}

type ResponseType = {
  statusCode?: number
  headers?: Record<string, string>
  responseBody?: unknown
}

export type RequestInput<
  S extends Schema,
  A extends {
    [key in keyof S]: S[key] extends JSONSchema ? FromSchema<S[key]> : unknown
  } = {
    [key in keyof S]: S[key] extends JSONSchema ? FromSchema<S[key]> : unknown
  },
> = {
  Querystring: A['Querystring']
  Headers: A['Headers']
  Params: A['Params']
  Body: A['Body']
}

type Handler<Req extends Schema, Context = unknown> = (
  req: RequestInput<Req>,
  ctx: Context
) => Promise<ResponseType>

export type QuerystringMatch = {
  key: string
  value: string | undefined
}

export type HeaderMatch = {
  name: string
  value?: string
}

export type RouteQuery = Record<string, string | undefined>

type Route<S extends Schema, Context> = {
  method: HTTPMethod
  type?: string
  path: string
  querystringMatches: QuerystringMatch[]
  headersMatches: string[]
  handler?: Handler<S, Context>
  schema: S
  disableContentTypeParser?: boolean
  allowEmptyJsonBody?: boolean
  acceptMultiformData?: boolean
  operation: string
  validate: ValidateFunction<JTDDataType<S>>
  // Precompiled matcher: the query/header criteria are parsed once at registration
  // time so request-time matching is a single closure call with no string parsing.
  matches: (type: string | undefined, query: RouteQuery, headers: Record<string, string>) => boolean
}

interface RouteOptions<S extends Schema> {
  disableContentTypeParser?: boolean
  allowEmptyJsonBody?: boolean
  acceptMultiformData?: boolean
  operation: string
  schema: S
  type?: string
}

export class Router<Context = unknown> {
  protected _routes: Map<string, Route<Schema, Context>[]> = new Map<
    string,
    Route<Schema, Context>[]
  >()

  protected ajv = new Ajv({
    coerceTypes: 'array',
    useDefaults: true,
    removeAdditional: true,
    uriResolver: fastUri,
    addUsedSchema: false,
    allErrors: false,
  }).addKeyword(finiteKeyword)

  registerRoute(
    method: HTTPMethod,
    url: string,
    options: RouteOptions<Schema>,
    handler: Handler<Schema, Context>
  ) {
    const { query, headers } = this.parseRequestInfo(url)
    const normalizedUrl = url.split('?')[0].split('|')[0]

    const existingPath = this._routes.get(normalizedUrl)
    const schemaToCompile: {
      Params?: JSONSchema
      Headers?: JSONSchema
      Querystring?: JSONSchema
      Body?: JSONSchema
    } = {}

    const { schema, disableContentTypeParser, allowEmptyJsonBody, acceptMultiformData, operation } =
      options

    if (schema.Params) {
      schemaToCompile.Params = schema.Params
    }
    if (schema.Body) {
      schemaToCompile.Body = schema.Body
    }
    if (schema.Headers) {
      schemaToCompile.Headers = schema.Headers
    }

    if (schema.Querystring) {
      schemaToCompile.Querystring = schema.Querystring
    }

    // If any of the keys has a required property, then the top level object is also required
    const required = Object.keys(schemaToCompile).map((key) => {
      const k = key as keyof typeof schemaToCompile
      const schemaObj = schemaToCompile[k]

      if (typeof schemaObj === 'boolean') {
        return
      }

      if (schemaObj?.required && schemaObj.required.length > 0) {
        return key as string
      }
    })

    const schemaKey = method + url
    const existingSchema = this.ajv.getSchema(schemaKey)

    if (!existingSchema) {
      this.ajv.addSchema(
        {
          type: 'object',
          properties: schemaToCompile,
          required: required.filter(Boolean),
        },
        schemaKey
      )
    }

    const validate = this.ajv.getSchema(schemaKey) as ValidateFunction<JTDDataType<Schema>>

    const compiledOperation = compileOperation(operation, options.type)

    const newRoute: Route<Schema, Context> = {
      method,
      path: normalizedUrl,
      querystringMatches: query,
      headersMatches: headers,
      schema,
      validate,
      handler,
      disableContentTypeParser,
      allowEmptyJsonBody,
      acceptMultiformData,
      operation: compiledOperation,
      type: options.type,
      matches: compileMatcher(query, headers, options.type),
    }

    if (!existingPath) {
      this._routes.set(normalizedUrl, [newRoute])
      return
    }

    existingPath.push(newRoute)
    this._routes.set(normalizedUrl, existingPath)
  }

  // The deep mapped types in RouteOptions<R> / Handler<R> (JTDDataType, FromSchema)
  // hit TS2589 when checked against Schema, and Handler is contravariant in R, so the
  // per-route generic is erased at the call boundary into the schema-agnostic registry.
  get<R extends Schema>(url: string, options: RouteOptions<R>, handler: Handler<R, Context>) {
    this.registerRoute('get', url, ...erase<R, Context>(options, handler))
  }

  post<R extends Schema>(url: string, options: RouteOptions<R>, handler: Handler<R, Context>) {
    this.registerRoute('post', url, ...erase<R, Context>(options, handler))
  }

  put<R extends Schema>(url: string, options: RouteOptions<R>, handler: Handler<R, Context>) {
    this.registerRoute('put', url, ...erase<R, Context>(options, handler))
  }

  delete<R extends Schema>(url: string, options: RouteOptions<R>, handler: Handler<R, Context>) {
    this.registerRoute('delete', url, ...erase<R, Context>(options, handler))
  }

  head<R extends Schema>(url: string, options: RouteOptions<R>, handler: Handler<R, Context>) {
    this.registerRoute('head', url, ...erase<R, Context>(options, handler))
  }

  parseQueryMatch(query: string): QuerystringMatch {
    const [key, value] = query.split('=')
    return { key, value }
  }

  parseRequestInfo(queryString: string) {
    const queries = queryString.replace(/\|.*/, '').split('?')[1]?.split('&') || []
    const headers = queryString.split('|').splice(1)

    if (queries.length === 0) {
      return { query: [{ key: '*', value: '*' }], headers }
    }
    return { query: queries.map(this.parseQueryMatch), headers }
  }

  routes() {
    return this._routes
  }

  matchRoute(
    route: Route<Schema, Context>,
    type: string | undefined,
    query: RouteQuery,
    headers: Record<string, string>
  ) {
    return route.matches(type, query, headers)
  }
}

function compileOperation(operation: string, type?: string) {
  return type ? operation.replaceAll('s3.', `s3.${type}.`) : operation
}

/**
 * Precompiles a route's query/header/type criteria into a single matcher closure.
 *
 * The query wildcard flag and the header name/value pairs are derived once here
 * instead of on every request, so request-time matching is a closure call with no
 * per-request string splitting or array scanning to recompute static information.
 */
function compileMatcher(
  query: QuerystringMatch[],
  headers: string[],
  type?: string
): (
  matchType: string | undefined,
  reqQuery: RouteQuery,
  reqHeaders: Record<string, string>
) => boolean {
  const hasWildcardQuery = query.some((match) => match.key === '*')
  const valuedQueryMatches = query.filter((match) => match.key !== '*')
  const hasOnlyWildcardQuery = hasWildcardQuery && valuedQueryMatches.length === 0
  const headerMatches = headers.map(parseHeaderMatch)
  const hasHeaderMatches = headerMatches.length > 0

  return (
    matchType: string | undefined,
    reqQuery: RouteQuery,
    reqHeaders: Record<string, string>
  ) => {
    if (matchType !== type) {
      return false
    }

    if (hasHeaderMatches && !matchHeaders(headerMatches, reqHeaders)) {
      return false
    }

    if (hasOnlyWildcardQuery) {
      return true
    }

    return matchQueryString(valuedQueryMatches, hasWildcardQuery, reqQuery)
  }
}

function parseHeaderMatch(header: string): HeaderMatch {
  const separatorIndex = header.indexOf('=')
  if (separatorIndex === -1) {
    return { name: header }
  }
  return { name: header.slice(0, separatorIndex), value: header.slice(separatorIndex + 1) }
}

function matchHeaders(matches: HeaderMatch[], received: Record<string, string>) {
  for (const match of matches) {
    const value = received[match.name]
    if (value === undefined) {
      return false
    }
    if (match.value && !value.startsWith(match.value)) {
      return false
    }
  }

  return true
}

function matchQueryString(
  valuedMatches: QuerystringMatch[],
  hasWildcard: boolean,
  received: RouteQuery
) {
  for (const match of valuedMatches) {
    if (!(match.key in received)) {
      return hasWildcard
    }

    if (match.value !== undefined && match.value !== received[match.key]) {
      return hasWildcard
    }
  }

  return true
}

/**
 * The per-route generic R is preserved at the public-method call site for inference,
 * then erased here into the schema-agnostic registry shape. Centralising the casts
 * avoids both TS2589 (deep instantiation of RouteOptions<R>/Handler<R>) and the
 * Handler contravariance mismatch in one place.
 */
function erase<R extends Schema, Context>(
  options: RouteOptions<R>,
  handler: Handler<R, Context>
): [RouteOptions<Schema>, Handler<Schema, Context>] {
  return [
    options as unknown as RouteOptions<Schema>,
    handler as unknown as Handler<Schema, Context>,
  ]
}

/**
 * Returns dotted paths for all array nodes in the provided JSON schemas.
 * Traversing an array's item schemas retains the current path because `items`
 * does not add a property segment to the parsed document.
 * @param schemas
 */
export function findArraySchemaPaths(schemas: JSONSchema[]): string[] {
  const paths: string[] = []

  function traverse(schema: JSONSchema, currentPath = ''): void {
    if (typeof schema === 'boolean') {
      return
    }

    if (schema.type === 'array') {
      paths.push(currentPath)
    }

    if (schema.properties) {
      for (const key in schema.properties) {
        const nextSchema = schema.properties[key]
        traverse(nextSchema, currentPath ? `${currentPath}.${key}` : key)
      }
    }

    if (schema.items) {
      const itemSchemas = Array.isArray(schema.items) ? schema.items : [schema.items]
      itemSchemas.forEach((itemSchema) => traverse(itemSchema, currentPath))
    }
  }

  schemas.forEach((schema) => traverse(schema))

  return paths
}
