/**
 * TEMPORARY: Spark's admin API, read by Studio's server for a local Spark project.
 *
 * Exit condition: Spark's `pg_catalog` runs pg-meta's SQL, so Studio sends its usual queries and
 * this directory is deleted. Hosted Studio must not call Spark's admin API: it needs a project-
 * authorized Management API route for the schema description instead.
 */

export type SparkColumn = {
  name: string
  position: number
  type: string
  not_null: boolean
  default: string | null
  identity: 'a' | 'd' | null
  generated: string | null
  comment: string | null
}

export type SparkConstraint = {
  name: string
  type: 'p' | 'u' | 'f' | 'c'
  def: string
  columns: string[]
  references: { schema: string; table: string; columns: string[] } | null
}

export type SparkTable = {
  schema: string
  name: string
  managed: boolean
  rls_enabled: boolean
  rls_forced: boolean
  comment: string | null
  columns: SparkColumn[]
  constraints: SparkConstraint[]
  indexes: { name: string; def: string; unique: boolean; constraint: string | null }[]
  policies: {
    name: string
    cmd: string
    permissive: boolean
    roles: string[]
    using: string | null
    check: string | null
  }[]
}

export type SparkEnum = { schema: string; name: string; labels: string[]; comment: string | null }

export type SparkView = {
  schema: string
  name: string
  def: string
  depends_on: { schema: string; name: string }[]
  comment: string | null
}

/** `GET /_spark/v1/schema`. */
export type SparkDescription = {
  schema_version: string
  managed_schemas: string[]
  schemas: { name: string; comment: string | null }[]
  enums: SparkEnum[]
  tables: SparkTable[]
  views: SparkView[]
}

export type SparkMigration = { version: string; name: string; statements: string[] | null }

export type SparkRow = Record<string, unknown>

export class SparkQueryError extends Error {
  constructor(
    message: string,
    readonly statusCode: number,
    readonly code?: string
  ) {
    super(message)
  }
}

type SparkConfig = { url: string; serviceKey: string }

/** Set by the CLI when the local project runs on Spark. */
export function getSparkConfig(): SparkConfig | undefined {
  const url = process.env.STUDIO_SPARK_URL
  const serviceKey = process.env.STUDIO_SPARK_SERVICE_KEY ?? process.env.SUPABASE_SERVICE_KEY
  return url && serviceKey ? { url: url.replace(/\/$/, ''), serviceKey } : undefined
}

export type SparkClient = {
  description: () => Promise<SparkDescription>
  migrations: () => Promise<SparkMigration[]>
  /** Runs one statement read-only. */
  query: (sql: string) => Promise<SparkRow[]>
}

export function makeSparkClient({ url, serviceKey }: SparkConfig): SparkClient {
  const request = async <T>(path: string, body?: unknown): Promise<T> => {
    const response = await fetch(`${url}${path}`, {
      method: body === undefined ? 'GET' : 'POST',
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        ...(body !== undefined && { 'content-type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const text = await response.text()
    if (!response.ok) {
      let message = text || `Spark answered HTTP ${response.status}`
      let code: string | undefined
      try {
        const parsed = JSON.parse(text)
        message = parsed.message ?? message
        code = parsed.code ?? undefined
      } catch {}
      throw new SparkQueryError(message, response.status, code)
    }
    return JSON.parse(text) as T
  }
  return {
    description: () => request<SparkDescription>('/_spark/v1/schema'),
    migrations: () => request<SparkMigration[]>('/_spark/v1/migrations'),
    query: (sql) =>
      request<SparkRow[]>('/_spark/v1/query', { query: sql, parameters: [], read_only: true }),
  }
}
