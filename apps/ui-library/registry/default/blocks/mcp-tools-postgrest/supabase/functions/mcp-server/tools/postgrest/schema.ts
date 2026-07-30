import { getDefaultPublishableKey, getSupabaseEnvironment } from '../../supabase.ts'

// Reads the API description PostgREST serves at the REST root and turns it into
// a small model this toolset can generate tools from.
//
// PostgREST emits Swagger 2.0, where non-body parameters carry `type` directly
// rather than a `schema`. Generic OpenAPI-to-MCP converters read
// `parameter.schema`, so they either drop every filter or need a 2.0-to-3.0
// conversion step first. Reading it directly is both smaller and more faithful:
// PostgREST's shape is regular, and the parts worth exposing as tools (tables,
// updatable views, functions) are all identifiable from it.
//
// The description is filtered by the requesting role's privileges, so the tools
// a user sees already reflect what they are allowed to reach.

export type ColumnType = 'string' | 'number' | 'integer' | 'boolean' | 'object' | 'array' | 'json'

export type Column = {
  name: string
  type: ColumnType
  /** The Postgres type, e.g. `uuid` or `timestamp with time zone`. */
  format: string | null
  description: string | null
  isPrimaryKey: boolean
  /** Required by the table and without a default, so an insert must supply it. */
  isRequiredOnInsert: boolean
}

export type Resource = {
  /** The name to address in PostgREST, unchanged. */
  name: string
  description: string | null
  columns: Column[]
  primaryKey: string[]
  /** Which verbs PostgREST exposes, which is how a read-only view is identified. */
  canSelect: boolean
  canInsert: boolean
  canUpdate: boolean
  canDelete: boolean
}

export type RpcFunction = {
  name: string
  description: string | null
  args: Column[]
  /** PostgREST exposes immutable and stable functions on GET; volatile ones only on POST. */
  isReadOnly: boolean
}

export type ApiSchema = {
  resources: Resource[]
  functions: RpcFunction[]
}

type JsonObject = Record<string, unknown>

const isObject = (value: unknown): value is JsonObject =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** Resolve a local `#/...` JSON pointer, which is all PostgREST uses. */
function resolveRef(spec: JsonObject, node: unknown): unknown {
  if (!isObject(node)) return node
  const ref = node.$ref
  if (typeof ref !== 'string' || !ref.startsWith('#/')) return node

  let current: unknown = spec
  for (const rawSegment of ref.slice(2).split('/')) {
    const segment = rawSegment.replaceAll('~1', '/').replaceAll('~0', '~')
    if (!isObject(current)) return undefined
    current = current[segment]
  }
  return current
}

function columnType(property: JsonObject): ColumnType {
  const format = typeof property.format === 'string' ? property.format : ''
  // jsonb columns arrive with a format and no type, and accept any JSON value.
  if (format === 'json' || format === 'jsonb') return 'json'
  if (format.endsWith('[]')) return 'array'

  switch (property.type) {
    case 'integer':
      return 'integer'
    case 'number':
      return 'number'
    case 'boolean':
      return 'boolean'
    case 'object':
      return 'object'
    case 'array':
      return 'array'
    case 'string':
      return 'string'
    default:
      return 'json'
  }
}

/**
 * PostgREST embeds key information in descriptions as pseudo-tags, e.g.
 * `Note:\nThis is a Primary Key.<pk/>` and
 * `<fk table='authors' column='id'/>`. Keep the human sentence, turn the
 * foreign-key tag into something a model can act on, and drop the markup.
 */
function readDescription(raw: unknown): { text: string | null; isPrimaryKey: boolean } {
  if (typeof raw !== 'string' || !raw) return { text: null, isPrimaryKey: false }

  const isPrimaryKey = raw.includes('<pk/>')
  const foreignKey = raw.match(/<fk table='([^']+)' column='([^']+)'\/>/)

  let text = raw
    .replace(/<pk\/>/g, '')
    .replace(/<fk table='[^']*' column='[^']*'\/>/g, '')
    .replace(/^Note:\s*/m, '')
    .replace(/\s+/g, ' ')
    .trim()

  if (foreignKey) {
    text = [text, `References ${foreignKey[1]}.${foreignKey[2]}.`].filter(Boolean).join(' ')
  }

  return { text: text || null, isPrimaryKey }
}

function parseColumns(definition: unknown): Column[] {
  if (!isObject(definition) || !isObject(definition.properties)) return []

  const required = Array.isArray(definition.required)
    ? definition.required.filter((name): name is string => typeof name === 'string')
    : []

  return Object.entries(definition.properties).map(([name, rawProperty]) => {
    const property = isObject(rawProperty) ? rawProperty : {}
    const { text, isPrimaryKey } = readDescription(property.description)

    return {
      name,
      type: columnType(property),
      format: typeof property.format === 'string' ? property.format : null,
      description: text,
      isPrimaryKey,
      // A column with a default (a generated id, a timestamp) is required by the
      // table but must not be required of the caller.
      isRequiredOnInsert: required.includes(name) && property.default === undefined,
    }
  })
}

/** The body parameter's schema for a POST path, resolving a `$ref` if present. */
function bodySchema(spec: JsonObject, operation: unknown): unknown {
  if (!isObject(operation) || !Array.isArray(operation.parameters)) return undefined

  for (const rawParameter of operation.parameters) {
    const parameter = resolveRef(spec, rawParameter)
    if (isObject(parameter) && parameter.in === 'body') {
      return resolveRef(spec, parameter.schema)
    }
  }
  return undefined
}

export function parseApiSchema(rawSpec: unknown): ApiSchema {
  if (!isObject(rawSpec) || !isObject(rawSpec.paths)) {
    throw new Error('The PostgREST description is missing its paths.')
  }

  const definitions = isObject(rawSpec.definitions) ? rawSpec.definitions : {}
  const resources: Resource[] = []
  const functions: RpcFunction[] = []

  for (const [path, rawOperations] of Object.entries(rawSpec.paths)) {
    // `/` is the description itself.
    if (path === '/' || !isObject(rawOperations)) continue

    if (path.startsWith('/rpc/')) {
      const name = path.slice('/rpc/'.length)
      const operation = rawOperations.post ?? rawOperations.get
      if (!isObject(operation)) continue

      functions.push({
        name,
        description: readDescription(operation.description ?? operation.summary).text,
        args: parseColumns(bodySchema(rawSpec, rawOperations.post)),
        isReadOnly: 'get' in rawOperations,
      })
      continue
    }

    const name = path.slice(1)
    const definition = definitions[name]
    const columns = parseColumns(definition)
    if (!columns.length) continue

    resources.push({
      name,
      description: isObject(definition) ? readDescription(definition.description).text : null,
      columns,
      primaryKey: columns.filter((column) => column.isPrimaryKey).map((column) => column.name),
      canSelect: 'get' in rawOperations,
      canInsert: 'post' in rawOperations,
      canUpdate: 'patch' in rawOperations,
      canDelete: 'delete' in rawOperations,
    })
  }

  return { resources, functions }
}

// -----------------------------------------------------------------------------
// Fetching, with a per-worker cache
// -----------------------------------------------------------------------------

type CacheEntry = { schema: ApiSchema; fetchedAt: number }

let cache: CacheEntry | null = null

function cacheTtlMs(): number {
  const configured = Number(Deno.env.get('MCP_POSTGREST_SCHEMA_TTL')?.trim())
  const seconds = Number.isFinite(configured) && configured >= 0 ? configured : 300
  return seconds * 1000
}

function postgrestConnection(): { restUrl: string; apiKey: string } {
  const environment = getSupabaseEnvironment()

  return {
    restUrl: `${environment.url.replace(/\/+$/, '')}/rest/v1/`,
    apiKey: getDefaultPublishableKey(),
  }
}

/**
 * The API schema as the calling user sees it. Cached per worker: it describes
 * shape, not rows, and it is the same for every user of a given role — Row Level
 * Security is still applied to each individual tool call.
 */
export async function loadApiSchema(accessToken: string): Promise<ApiSchema> {
  const ttl = cacheTtlMs()
  if (cache && ttl > 0 && Date.now() - cache.fetchedAt < ttl) {
    return cache.schema
  }

  const { restUrl, apiKey } = postgrestConnection()
  const response = await fetch(restUrl, {
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(
      `Unable to read the PostgREST schema (${response.status}). Check that the REST API is reachable.`
    )
  }

  const schema = parseApiSchema(await response.json())
  cache = { schema, fetchedAt: Date.now() }
  return schema
}

/** Drop the cached schema. Exposed for tests and for a schema-change hook. */
export function clearSchemaCache(): void {
  cache = null
}
