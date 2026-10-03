import { ERRORS, StorageBackendError } from '@internal/errors'
import { type SignRequestOptions, signRequest } from 'aws-sigv4-sign'
import JSONBigint from 'json-bigint'
import {
  createAlreadyExistsError,
  createAuthenticationTimeoutError,
  createBadRequestError,
  createForbiddenError,
  createInternalServerError,
  createNoSuchNamespaceError,
  createNoSuchTableError,
  createSlowDownError,
  createUnauthorizedError,
  createUnprocessableEntityError,
  createUnsupportedOperationError,
  IcebergError,
  IcebergHttpStatusCode,
} from './errors'

const DEFAULT_REQUEST_TIMEOUT_MS = 60_000

type QueryParamPrimitive = string | number | boolean
type QueryParamValue = QueryParamPrimitive | readonly QueryParamPrimitive[] | null | undefined
type CatalogResource = 'namespace' | 'table'
type NotFoundResource = CatalogResource

export interface GetConfigRequest {
  tenantId?: string
  warehouse: string
}

export interface GetConfigResponse {
  overrides?: {
    warehouse?: string
    prefix?: string
  }
  defaults?: {
    clients?: string
  }
  endpoints?: string[]
}

export interface ListNamespacesRequest {
  warehouse: string
  pageToken?: string
  pageSize?: number
  parent?: string
}

export interface ListNamespacesResponse {
  namespaces: string[][]
  'next-page-token'?: string
}

export interface FetchRequestConfig {
  method: string
  url: string
  headers: Headers
  body?: string
}

type FetchRequestInput = {
  method?: string
  url: string
  params?: Record<string, QueryParamValue>
  data?: unknown
  headers?: Record<string, string>
  notFoundResource?: NotFoundResource
  conflictResource?: CatalogResource
}

interface CatalogAuth {
  authorize(req: FetchRequestConfig): FetchRequestConfig | Promise<FetchRequestConfig>
}

function appendSearchParam(url: URL, name: string, value: unknown) {
  if (value === undefined || value === null) return

  if (Array.isArray(value)) {
    for (const item of value) {
      appendSearchParam(url, name, item)
    }
    return
  }

  const valueType = typeof value
  if (valueType !== 'string' && valueType !== 'number' && valueType !== 'boolean') {
    throw ERRORS.InternalError(
      new TypeError(`Unsupported query parameter "${name}" type: ${valueType}`),
      'Unsupported Iceberg catalog query parameter'
    )
  }

  url.searchParams.append(name, String(value))
}

function buildCatalogRequestUrl(
  catalogUrl: string,
  path: string,
  params?: Record<string, QueryParamValue>
) {
  const url = new URL(catalogUrl)
  if (path) {
    const basePath = url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname
    const suffix = path.startsWith('/') ? path : '/' + path
    url.pathname = basePath + suffix
  }
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      appendSearchParam(url, k, v)
    }
  }
  return url
}

function isJsonContentType(contentType: string) {
  return /^\s*application\/(?:json|[^;\s]+\+json)\s*(?:;|$)/i.test(contentType)
}

function isIcebergErrorEnvelope(data: unknown): boolean {
  if (!data || typeof data !== 'object') return false
  const error = (data as Record<string, unknown>).error
  if (!error || typeof error !== 'object') return false
  const e = error as Record<string, unknown>
  return (
    typeof e.message === 'string' &&
    typeof e.type === 'string' &&
    (typeof e.code === 'number' || typeof e.code === 'string')
  )
}

function toError(error: unknown) {
  if (error instanceof Error) return error

  if (error && typeof error === 'object' && 'message' in error) {
    const message = String((error as { message: unknown }).message)
    if ('name' in error && error.name === 'SyntaxError') {
      return new SyntaxError(message)
    }
    return new Error(message)
  }

  return new Error(String(error))
}

function parseSuccessfulResponse<T>(response: Response, text: string): T | undefined {
  // Keep empty responses explicit in the type system. Void endpoints accept
  // this, while JSON-returning public methods narrow through requestRequired().
  if (!text.trim()) return undefined

  const contentType = response.headers.get('content-type')
  if (contentType && !isJsonContentType(contentType)) {
    throw ERRORS.InternalError(
      new Error(`Unexpected Content-Type: ${contentType}`),
      'Unexpected non-JSON response from Iceberg catalog'
    )
  }

  try {
    return JSONBigint.parse(text) as T
  } catch (error) {
    throw ERRORS.InternalError(toError(error), 'Invalid JSON response from Iceberg catalog')
  }
}

function getAbortErrorMessage(signal: AbortSignal | undefined, error: Error) {
  if (error.name === 'TimeoutError' || getAbortReasonName(signal) === 'TimeoutError') {
    return 'Iceberg catalog request timed out'
  }

  if (error.name === 'AbortError') {
    return 'Iceberg catalog request aborted'
  }

  return undefined
}

function getAbortReasonName(signal: AbortSignal | undefined) {
  if (!signal?.aborted) return undefined

  const reason = signal.reason
  if (reason instanceof Error) return reason.name
  if (reason && typeof reason === 'object' && 'name' in reason) {
    return String((reason as { name: unknown }).name)
  }

  return undefined
}

function getNotFoundMessage(resource?: NotFoundResource) {
  switch (resource) {
    case 'table':
      return 'Table not found'
    case 'namespace':
      return 'Namespace not found'
    default:
      return 'Resource not found'
  }
}

function getAlreadyExistsMessage(resource?: CatalogResource) {
  switch (resource) {
    case 'table':
      return 'Table already exists'
    case 'namespace':
      return 'Namespace already exists'
    default:
      return 'Resource already exists'
  }
}

export type CatalogAuthType = CatalogAuth

export interface RestCatalogClientOptions {
  catalogUrl: string
  auth: CatalogAuthType
  timeoutMs?: number
}

export interface CreateNamespaceRequest {
  namespace: string[]
  warehouse: string
  properties?: Record<string, string | number>
}

export interface CreateNamespaceResponse {
  namespace: string[]
  properties?: Record<string, string | number>
}

export interface DeleteNamespaceRequest {
  namespace: string
  warehouse: string
}

// TypeScript definitions for the inlined CreateTableRequest schema:

/** Represents a request to create a new Iceberg table */
export interface CreateTableRequest {
  namespace: string

  warehouse: string

  /** The table identifier (just the final name segment) */
  name: string

  /** Optional URI where table metadata/data will live */
  location?: string | null

  /** The table’s schema definition */
  schema: Schema

  /** The partitioning spec for the table */
  spec: PartitionSpec

  /** Arbitrary key/value properties to set on the table */
  properties?: Record<string, string>

  /**
   * If true, initialize metadata for a create transaction
   * instead of committing immediately
   */
  'stage-create'?: boolean

  /** The initial sort order for writes (optional) */
  'write-order'?: SortOrder | null
}

/** The Iceberg Schema object: always a struct of fields */
export interface Schema {
  type: 'struct'
  fields: Field[]

  /** schema identifier assigned by the catalog */
  /** Schema identifier assigned by the catalog */
  'schema-id'?: number

  /** list of identifier (primary key) field IDs */
  'identifier-field-ids'?: number[]
}

/** A single field in a Schema */
export interface Field {
  id: number
  name: string
  /** Field type: primitive or nested container */
  type: FieldType
  required: boolean
  doc?: string
}

/** Union of all possible Iceberg field types */
export type FieldType = PrimitiveType | StructType | ListType | MapType

/** Any primitive Iceberg type name */
export type PrimitiveType =
  | 'boolean'
  | 'integer'
  | 'long'
  | 'float'
  | 'double'
  | 'date'
  | 'time'
  | 'timestamp'
  | 'timestamptz'
  | 'string'
  | 'uuid'
  | 'fixed'
  | 'binary'

/** Nested struct type */
export interface StructType {
  type: 'struct'
  fields: Field[]
}

/** List type */
export interface ListType {
  type: 'list'
  /** Unique element field ID */
  'element-id': number
  /** Element’s data type (may recurse) */
  element: FieldType
  'element-required': boolean
}

/** Map type */
export interface MapType {
  type: 'map'
  'key-id': number
  key: FieldType
  'value-id': number
  value: FieldType
  'value-required': boolean
}

/** The Iceberg PartitionSpec object */
export interface PartitionSpec {
  /** spec identifier assigned by the catalog */
  'spec-id'?: number
  fields: PartitionField[]
}

/** A single partition field definition */
export interface PartitionField {
  /** field ID (catalog‐assigned) */
  'field-id'?: number
  'source-id': number
  name: string
  transform: string
}

/** The Iceberg SortOrder object */
export interface SortOrder {
  /** order identifier assigned by the catalog */
  'order-id'?: number
  fields: SortField[]
}

/** A single sort-field entry */
export interface SortField {
  'source-id': number
  transform: string
  direction: 'asc' | 'desc'
  'null-order': 'nulls-first' | 'nulls-last'
}

export interface ListTableRequest {
  namespace: string
  warehouse: string
  pageSize?: number
  pageToken?: string
}

export interface ListTableResponse {
  'next-page-token'?: string | undefined
  identifiers: {
    namespace: string[]
    name: string
  }[]
}

export interface LoadTableRequest {
  namespace: string
  table: string
  warehouse: string
  snapshots?: string
}

/**
 * Request to commit updates to multiple Iceberg tables in an atomic operation.
 */
export interface CommitTableRequest extends TableChange {
  /** List of changes to apply, one entry per table */
  namespace: string
  warehouse: string
  table: string
}

/** Changes for a single table */
export interface TableChange {
  /**
   * Assertions to validate before applying updates.
   * All must pass or the whole commit is rejected.
   */
  requirements?: Requirement[]

  /** Metadata updates to apply to the table */
  updates: TableUpdate[]
}

/** A pre-commit assertion requirement */
export interface Requirement {
  /** Name of the requirement (e.g. "assert-ref-snapshot-id") */
  name?: string

  /** Arguments for the requirement; arbitrary key/value pairs */
  args?: Record<string, unknown>
}

/** A single metadata update operation */
export interface TableUpdate {
  /** Name of the update operation (e.g. "add-column") */
  name?: string

  /** Arguments for the update; arbitrary key/value pairs */
  args?: Record<string, unknown>
}

export interface TableMetadata {
  /** The version of the table format (1 or 2). */
  'format-version': number
  /** A UUID that uniquely identifies the table. */
  'table-uuid': string
  /** The base location of the table. */
  location?: string
  /** When the metadata was last updated, in milliseconds since the epoch. */
  'last-updated-ms'?: number
  /** Arbitrary key/value table properties. */
  properties?: Record<string, string>
  /** Schema history for the table. */
  schemas?: Schema[]
  /** The ID of the current schema in the `schemas` array. */
  'current-schema-id'?: number

  'current-snapshot-id'?: number

  /** The last column ID assigned (for tracking new columns). */
  'last-column-id'?: number
  /** All known partition specs for the table. */
  'partition-specs'?: PartitionSpec[]
  /** The ID of the default partition spec in the `partition-specs` array. */
  'default-spec-id'?: number

  'metadata-log'?: MetadataLog[]
}

interface MetadataLog {
  'metadata-file': string
  'timestamp-ms': number
}

/**
 * Result returned when creating or loading a table.
 */
export interface LoadTableResult {
  /** The location of the table metadata file. */
  'metadata-location': string
  /** The deserialized table metadata. */
  metadata: TableMetadata
}

export interface NamespaceExistsRequest {
  namespace: string
  warehouse: string
}

export interface TableExistsRequest {
  namespace: string
  warehouse: string
  table: string
}

export interface LoadNamespaceMetadataRequest {
  namespace: string
  warehouse: string
}

export interface LoadNamespaceMetadataResponse {
  namespace: string[]
  properties?: Record<string, string | number>
}

export interface DropTableRequest {
  namespace: string
  warehouse: string
  table: string
  purgeRequested?: boolean
  tenantId?: string
}

/**
 * The response returned by the CreateTable endpoint.
 */
export type CreateTableResponse = LoadTableResult

export class RestCatalogClient {
  catalogUrl: string
  auth: CatalogAuthType
  timeoutMs: number

  constructor(options: RestCatalogClientOptions) {
    this.catalogUrl = options.catalogUrl
    this.auth = options.auth
    this.timeoutMs = options.timeoutMs ?? DEFAULT_REQUEST_TIMEOUT_MS
  }

  private async request<T>(input: FetchRequestInput): Promise<T | undefined> {
    const method = (input.method || 'GET').toUpperCase()
    const url = buildCatalogRequestUrl(this.catalogUrl, input.url, input.params)
    const headers = new Headers(input.headers || {})
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json')
    }
    const hasBody = input.data !== undefined && input.data !== null
    const body = hasBody ? JSONBigint.stringify(input.data) : undefined
    if (hasBody) {
      headers.set('Content-Type', 'application/json')
    }

    let authorized: FetchRequestConfig
    try {
      authorized = await this.auth.authorize({
        method,
        url: url.toString(),
        headers,
        body,
      })
    } catch (error) {
      if (error instanceof IcebergError || error instanceof StorageBackendError) {
        throw error
      }
      throw ERRORS.InternalError(toError(error), 'Failed to authorize Iceberg catalog request')
    }

    const signal = this.timeoutMs > 0 ? AbortSignal.timeout(this.timeoutMs) : undefined
    let response: Response
    try {
      response = await fetch(authorized.url, {
        method: authorized.method,
        headers: authorized.headers,
        body: authorized.body,
        signal,
      })
    } catch (error) {
      const err = toError(error)
      throw ERRORS.InternalError(
        err,
        getAbortErrorMessage(signal, err) ?? 'Network error reaching Iceberg catalog'
      )
    }

    try {
      const isHead = authorized.method.toUpperCase() === 'HEAD'
      if (!response.ok) {
        let jsonResponse: unknown

        if (isHead) {
          jsonResponse = undefined
        } else {
          const text = await response.text()
          const contentType = response.headers.get('content-type')
          if (contentType && isJsonContentType(contentType)) {
            try {
              jsonResponse = JSONBigint.parse(text)
            } catch {
              jsonResponse = text
            }
          } else {
            jsonResponse = text
          }
        }

        throw this.parseIcebergError(
          response.status,
          jsonResponse,
          input.notFoundResource,
          input.conflictResource
        )
      }

      if (isHead) {
        return undefined
      }

      const resText = await response.text()
      return parseSuccessfulResponse<T>(response, resText)
    } catch (error) {
      if (error instanceof IcebergError || error instanceof StorageBackendError) {
        throw error
      }
      const err = toError(error)
      throw ERRORS.InternalError(
        err,
        getAbortErrorMessage(signal, err) ?? 'Failed to read Iceberg catalog response'
      )
    }
  }

  private async requestRequired<T>(input: FetchRequestInput, emptyMessage: string) {
    const data = await this.request<T>(input)
    if (data === undefined || data === null) {
      throw ERRORS.InternalError(
        new Error(emptyMessage),
        'Iceberg catalog returned an empty response body'
      )
    }

    return data
  }

  /**
   * Parse HTTP response status and body to create appropriate Iceberg error
   * Handles all HTTP error codes from the Iceberg REST specification
   */
  private parseIcebergError(
    status: number,
    data: unknown,
    notFoundResource?: NotFoundResource,
    conflictResource?: CatalogResource
  ): IcebergError {
    // Only trust the response body when it matches the spec envelope
    // ({ error: { message, type, code } }). Otherwise the body is opaque
    // and the HTTP status is the only signal we have.
    if (isIcebergErrorEnvelope(data)) {
      return IcebergError.fromResponse(data)
    }

    return this.createErrorByStatusCode(status, notFoundResource, conflictResource)
  }

  /**
   * Create appropriate error based on HTTP status code
   */
  private createErrorByStatusCode(
    status: number,
    notFoundResource?: NotFoundResource,
    conflictResource?: CatalogResource
  ): IcebergError {
    switch (status) {
      case IcebergHttpStatusCode.BadRequest:
        return createBadRequestError('Bad request')
      case IcebergHttpStatusCode.Unauthorized:
        return createUnauthorizedError('Unauthorized')
      case IcebergHttpStatusCode.Forbidden:
        return createForbiddenError('Forbidden')
      case IcebergHttpStatusCode.NotFound:
        if (notFoundResource === 'table') {
          return createNoSuchTableError(getNotFoundMessage(notFoundResource))
        }
        return createNoSuchNamespaceError(getNotFoundMessage(notFoundResource))
      case IcebergHttpStatusCode.NotAcceptable:
        return createUnsupportedOperationError('Unsupported operation')
      case IcebergHttpStatusCode.Conflict:
        return createAlreadyExistsError(getAlreadyExistsMessage(conflictResource))
      case IcebergHttpStatusCode.UnprocessableEntity:
        return createUnprocessableEntityError('Unprocessable entity')
      case IcebergHttpStatusCode.AuthenticationTimeout:
        return createAuthenticationTimeoutError('Authentication timeout')
      case IcebergHttpStatusCode.ServiceUnavailable:
        return createSlowDownError('Service unavailable')
      default:
        if (status >= 500) {
          return createInternalServerError('Internal server error')
        }
        return createInternalServerError(`HTTP ${status}`)
    }
  }

  /**
   * Retrieves catalog configuration settings
   *
   * @see https://iceberg.apache.org/spec/api/#get-v1config
   * @param params Request parameters including warehouse identifier
   * @returns The catalog configuration response
   */
  async getConfig(params: GetConfigRequest) {
    const data = await this.requestRequired<GetConfigResponse>(
      {
        url: '/config',
        method: 'GET',
        params: { warehouse: params.warehouse },
      },
      'Empty Iceberg getConfig response body'
    )

    const overrides: NonNullable<GetConfigResponse['overrides']> = {
      prefix: params.warehouse,
    }

    return {
      defaults: {
        ...data.defaults,
        prefix: params.warehouse,
      },
      overrides,
    }
  }

  /**
   * Lists all namespaces in the catalog
   *
   * @see https://iceberg.apache.org/spec/api/#list-namespaces
   * @param params Request parameters for listing namespaces
   * @returns List of namespace identifiers
   */
  async listNamespaces(params: ListNamespacesRequest) {
    const warehouse = this.getEncodedWarehouse(params.warehouse)
    return this.requestRequired<ListNamespacesResponse>(
      {
        url: `${warehouse}/namespaces`,
        method: 'GET',
        params: { pageToken: params.pageToken, pageSize: params.pageSize, parent: params.parent },
      },
      'Empty Iceberg listNamespaces response body'
    )
  }

  /**
   * Creates a new namespace in the catalog
   *
   * @see https://iceberg.apache.org/spec/api/#create-namespace
   * @param params Request parameters for namespace creation
   * @returns The created namespace response
   */
  async createNamespace(params: CreateNamespaceRequest) {
    const warehouse = this.getEncodedWarehouse(params.warehouse)
    return this.requestRequired<CreateNamespaceResponse>(
      {
        url: `${warehouse}/namespaces`,
        method: 'POST',
        data: {
          namespace: params.namespace,
          properties: params.properties || {},
        },
        conflictResource: 'namespace',
      },
      'Empty Iceberg createNamespace response body'
    )
  }

  /**
   * Loads metadata for a specific namespace
   *
   * @see https://iceberg.apache.org/spec/api/#get-namespace-properties
   * @param params Request parameters including the namespace name
   * @returns The namespace metadata
   */
  async loadNamespaceMetadata(params: LoadNamespaceMetadataRequest) {
    const warehouse = this.getEncodedWarehouse(params.warehouse)
    return this.requestRequired<LoadNamespaceMetadataResponse>(
      {
        url: `${warehouse}/namespaces/${encodeURIComponent(params.namespace)}`,
        method: 'GET',
        notFoundResource: 'namespace',
      },
      'Empty Iceberg loadNamespaceMetadata response body'
    )
  }

  getEncodedWarehouse(warehouse: string) {
    return '/' + encodeURIComponent(warehouse)
  }

  /**
   * Deletes a namespace from the catalog
   *
   * @see https://iceberg.apache.org/spec/api/#drop-namespace
   * @param params Request parameters for namespace deletion
   * @returns Void response after successful deletion
   */
  async dropNamespace(params: DeleteNamespaceRequest): Promise<void> {
    const warehouse = this.getEncodedWarehouse(params.warehouse)
    return this.request({
      url: `${warehouse}/namespaces/${encodeURIComponent(params.namespace)}`,
      method: 'DELETE',
      notFoundResource: 'namespace',
    })
  }

  /**
   * Lists tables within a specified namespace
   *
   * @see https://iceberg.apache.org/spec/api/#list-tables
   * @param params Request parameters including namespace and pagination options
   * @returns List of table identifiers
   */
  async listTables({ namespace, ...rest }: ListTableRequest) {
    const warehouse = this.getEncodedWarehouse(rest.warehouse)
    return this.requestRequired<ListTableResponse>(
      {
        url: `${warehouse}/namespaces/${encodeURIComponent(namespace)}/tables`,
        method: 'GET',
        params: { pageToken: rest.pageToken, pageSize: rest.pageSize },
        notFoundResource: 'namespace',
      },
      'Empty Iceberg listTables response body'
    )
  }

  /**
   * Creates a new table in the catalog
   *
   * @see https://iceberg.apache.org/spec/api/#create-table
   * @param params Request parameters for table creation including schema and partition spec
   * @returns The created table metadata
   */
  async createTable({ namespace, warehouse: warehouseName, ...table }: CreateTableRequest) {
    const warehouse = this.getEncodedWarehouse(warehouseName)
    return this.requestRequired<CreateTableResponse>(
      {
        url: `${warehouse}/namespaces/${encodeURIComponent(namespace)}/tables`,
        method: 'POST',
        data: table,
        notFoundResource: 'namespace',
        conflictResource: 'table',
      },
      'Empty Iceberg createTable response body'
    )
  }

  /**
   * Loads metadata for a specific table
   *
   * @see https://iceberg.apache.org/spec/api/#load-table
   * @param params Request parameters identifying the table to load
   * @returns The table metadata and location
   */
  async loadTable(params: LoadTableRequest) {
    const warehouse = this.getEncodedWarehouse(params.warehouse)
    return this.requestRequired<LoadTableResult>(
      {
        url: `${warehouse}/namespaces/${encodeURIComponent(params.namespace)}/tables/${encodeURIComponent(params.table)}`,
        method: 'GET',
        params: { snapshots: params.snapshots },
        notFoundResource: 'table',
      },
      'Empty Iceberg loadTable response body'
    )
  }

  /**
   * Updates an existing table's metadata
   *
   * @see https://iceberg.apache.org/spec/api/#commit-table-changes
   * @param params Request parameters with table changes to apply
   * @returns The updated table metadata
   */
  async updateTable({ warehouse: warehouseName, namespace, table, ...commit }: CommitTableRequest) {
    const warehouse = this.getEncodedWarehouse(warehouseName)
    return this.requestRequired<LoadTableResult>(
      {
        url: `${warehouse}/namespaces/${encodeURIComponent(namespace)}/tables/${encodeURIComponent(table)}`,
        method: 'POST',
        data: commit,
        notFoundResource: 'table',
      },
      'Empty Iceberg updateTable response body'
    )
  }

  /**
   * Deletes a table from the catalog
   *
   * @see https://iceberg.apache.org/spec/api/#drop-table
   * @param params Request parameters identifying the table to drop
   * @returns Void response after successful deletion
   */
  async dropTable(params: DropTableRequest): Promise<void> {
    const warehouse = this.getEncodedWarehouse(params.warehouse)
    const query: Record<string, string> = {}

    if (params.purgeRequested) {
      query.purgeRequested = 'true'
    }

    return this.request({
      url: `${warehouse}/namespaces/${encodeURIComponent(params.namespace)}/tables/${encodeURIComponent(params.table)}`,
      method: 'DELETE',
      params: query,
      notFoundResource: 'table',
    })
  }

  /**
   * Renames a table in the catalog
   *
   * @see https://iceberg.apache.org/spec/api/#rename-table
   * @param params Request parameters for table rename operation
   * @returns The updated table metadata
   */
  renameTable() {}

  /**
   * Asserts that a specific table exists in the catalog
   *
   * @see https://iceberg.apache.org/spec/api/#check-table-exists
   * @param params Request parameters identifying the table to check
   * @returns Resolves with no body when the table exists
   * @throws NoSuchTableException when the table is missing
   */
  async tableExists(params: TableExistsRequest): Promise<void> {
    const warehouse = this.getEncodedWarehouse(params.warehouse)
    return this.request({
      url: `${warehouse}/namespaces/${encodeURIComponent(params.namespace)}/tables/${encodeURIComponent(params.table)}`,
      method: 'HEAD',
      notFoundResource: 'table',
    })
  }

  /**
   * Asserts that a specific namespace exists in the catalog
   *
   * @see https://iceberg.apache.org/spec/api/#check-namespace-exists
   * @param params Request parameters identifying the namespace to check
   * @returns Resolves with no body when the namespace exists
   * @throws NoSuchNamespaceException when the namespace is missing
   */
  async namespaceExists(params: NamespaceExistsRequest): Promise<void> {
    const warehouse = this.getEncodedWarehouse(params.warehouse)
    return this.request({
      url: `${warehouse}/namespaces/${encodeURIComponent(params.namespace)}`,
      method: 'HEAD',
      notFoundResource: 'namespace',
    })
  }
}

/**
 * SignV4Auth class for AWS Signature Version 4 authentication
 * This class implements the CatalogAuth interface
 * to sign requests to the S3Tables service.
 */
export class SignV4Auth {
  constructor(
    private readonly opts: {
      region: string
      credentials?: SignRequestOptions['credentials']
    }
  ) {}

  async authorize(req: FetchRequestConfig) {
    const signedReq = await signRequest(
      req.url,
      {
        method: req.method,
        headers: req.headers,
        body: req.body,
      },
      {
        service: 's3tables',
        region: this.opts.region,
        credentials: this.opts.credentials,
      }
    )

    signedReq.headers.forEach((headerValue, headerName) => {
      req.headers.set(headerName, headerValue)
    })

    return req
  }
}

/**
 * BearerTokenAuth class for Bearer token authentication
 * This class implements the CatalogAuth interface
 * to add a Bearer token to the request headers.
 */
export class BearerTokenAuth {
  constructor(private readonly opts: { token: string }) {}

  async authorize(req: FetchRequestConfig) {
    req.headers.set('Authorization', `Bearer ${this.opts.token}`)
    return req
  }
}
