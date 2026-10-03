import { QueryResultRow } from 'pg'
import { getConfig, JwksConfigKey } from '../../config'
import type { DatabaseExecutor } from './connection'
import { quoteIdentifier } from './postgres/sql'

const { multitenantDatabaseQueryTimeout } = getConfig()
const QUOTED_ID_COLUMN = quoteIdentifier('id')
const MIN_MIGRATION_LIST_QUERY_TIMEOUT_MS = 60_000
const MIGRATION_LIST_QUERY_TIMEOUT_MS = Math.max(
  MIN_MIGRATION_LIST_QUERY_TIMEOUT_MS,
  multitenantDatabaseQueryTimeout
)

export interface TenantConfigRow {
  id: string
  anon_key: string
  database_url: string
  database_pool_url?: string | null
  max_connections?: number | null
  jwt_secret: string
  jwks?: { keys?: JwksConfigKey[] } | null
  service_key: string
  file_size_limit?: number
  delete_objects_limit?: number | null
  feature_s3_protocol?: boolean
  feature_purge_cache?: boolean
  feature_image_transformation?: boolean
  feature_iceberg_catalog?: boolean
  feature_iceberg_catalog_max_namespaces?: number | null
  feature_iceberg_catalog_max_tables?: number | null
  feature_iceberg_catalog_max_catalogs?: number | null
  image_transformation_max_resolution?: number | null
  feature_vector_buckets?: boolean
  feature_vector_buckets_max_buckets?: number
  feature_vector_buckets_max_indexes?: number
  migrations_status?: string | null
  migrations_version?: string | null
  tracing_mode?: string | null
  disable_events?: string[] | null
  subscription_tier?: string | null
  cursor_id?: number
  created_at?: Date
}

// Every entry must satisfy quoteIdentifier's strict PostgreSQL identifier pattern.
const tenantWritableColumns = [
  'id',
  'anon_key',
  'database_url',
  'database_pool_url',
  'max_connections',
  'jwt_secret',
  'jwks',
  'service_key',
  'file_size_limit',
  'delete_objects_limit',
  'feature_s3_protocol',
  'feature_purge_cache',
  'feature_image_transformation',
  'feature_iceberg_catalog',
  'feature_iceberg_catalog_max_namespaces',
  'feature_iceberg_catalog_max_tables',
  'feature_iceberg_catalog_max_catalogs',
  'image_transformation_max_resolution',
  'feature_vector_buckets',
  'feature_vector_buckets_max_buckets',
  'feature_vector_buckets_max_indexes',
  'migrations_status',
  'migrations_version',
  'tracing_mode',
  'disable_events',
  'subscription_tier',
] as const satisfies readonly (keyof TenantConfigRow)[]

type TenantWritableColumn = (typeof tenantWritableColumns)[number]
export type TenantConfigRowInput = Partial<Pick<TenantConfigRow, TenantWritableColumn>>
export type TenantCursorRow = Pick<TenantConfigRow, 'id' | 'cursor_id'> & { cursor_id: number }

interface TenantQueryOptions {
  db?: DatabaseExecutor
  signal?: AbortSignal
  /**
   * Positive values add an internal timeout. Zero or negative values disable
   * the internal timeout and use only the caller signal, if provided.
   */
  timeoutMs?: number
}

export class TenantConfigStorePg {
  constructor(private db: DatabaseExecutor) {}

  async list(): Promise<TenantConfigRow[]> {
    const result = await this.query<TenantConfigRow>({
      text: 'SELECT * FROM tenants',
    })

    return result.rows
  }

  async findById(tenantId: string): Promise<TenantConfigRow | undefined> {
    const result = await this.query<TenantConfigRow>({
      text: `
        SELECT *
        FROM tenants
        WHERE id = $1
        LIMIT 1
      `,
      values: [tenantId],
    })

    return result.rows[0]
  }

  async insert(tenantInfo: TenantConfigRowInput, db: DatabaseExecutor = this.db): Promise<void> {
    const entries = getTenantEntries(tenantInfo)
    const columns = entries.map(([column]) => quoteIdentifier(column))
    const values = entries.map(([, value]) => value)
    const placeholders = entries.map((_, index) => `$${index + 1}`)

    await this.query(
      {
        text: `
          INSERT INTO tenants (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
        `,
        values,
      },
      { db }
    )
  }

  async upsert(tenantInfo: TenantConfigRowInput, db: DatabaseExecutor = this.db): Promise<void> {
    const entries = getTenantEntries(tenantInfo)
    const columns = entries.map(([column]) => quoteIdentifier(column))
    const values = entries.map(([, value]) => value)
    const placeholders = entries.map((_, index) => `$${index + 1}`)

    const updateClause = columns
      .filter((column) => column !== QUOTED_ID_COLUMN)
      .map((column) => `${column} = EXCLUDED.${column}`)
      .join(', ')

    await this.query(
      {
        text: `
          INSERT INTO tenants (${columns.join(', ')})
          VALUES (${placeholders.join(', ')})
          ON CONFLICT (${QUOTED_ID_COLUMN}) ${
            updateClause ? `DO UPDATE SET ${updateClause}` : 'DO NOTHING'
          }
        `,
        values,
      },
      { db }
    )
  }

  async update(
    tenantId: string,
    tenantInfo: TenantConfigRowInput,
    db: DatabaseExecutor = this.db
  ): Promise<number> {
    const entries = getTenantEntries(tenantInfo).filter(([column]) => column !== 'id')
    if (entries.length === 0) {
      return 0
    }

    const values = entries.map(([, value]) => value)
    const setClause = entries
      .map(([column], index) => `${quoteIdentifier(column)} = $${index + 1}`)
      .join(', ')

    const result = await this.query(
      {
        text: `
          UPDATE tenants
          SET ${setClause}
          WHERE id = $${entries.length + 1}
        `,
        values: [...values, tenantId],
      },
      { db }
    )

    return result.rowCount || 0
  }

  async delete(tenantId: string): Promise<number> {
    const result = await this.query({
      text: `
        DELETE FROM tenants
        WHERE id = $1
      `,
      values: [tenantId],
    })

    return result.rowCount || 0
  }

  async findMigrationsInfo(
    tenantId: string
  ): Promise<Pick<TenantConfigRow, 'migrations_version' | 'migrations_status'> | undefined> {
    const result = await this.query<
      Pick<TenantConfigRow, 'migrations_version' | 'migrations_status'>
    >({
      text: `
        SELECT migrations_version, migrations_status
        FROM tenants
        WHERE id = $1
        LIMIT 1
      `,
      values: [tenantId],
    })

    return result.rows[0]
  }

  async findDatabaseUrl(
    tenantId: string
  ): Promise<Pick<TenantConfigRow, 'database_url'> | undefined> {
    const result = await this.query<Pick<TenantConfigRow, 'database_url'>>({
      text: `
        SELECT database_url
        FROM tenants
        WHERE id = $1
        LIMIT 1
      `,
      values: [tenantId],
    })

    return result.rows[0]
  }

  async listTenantsToMigrateBatch(
    migrationVersion: string,
    lastCursor: number,
    failedStatuses: string[],
    batchSize: number,
    signal?: AbortSignal
  ): Promise<TenantCursorRow[]> {
    const result = await this.query<TenantCursorRow>(
      {
        text: `
          SELECT id, cursor_id
          FROM tenants
          WHERE cursor_id > $1
            AND (
              (
                migrations_version != $2
                AND migrations_status != ALL($3::text[])
              )
              OR migrations_status IS NULL
            )
          ORDER BY cursor_id ASC
          LIMIT $4
        `,
        values: [lastCursor, migrationVersion, failedStatuses, batchSize],
      },
      { signal, timeoutMs: MIGRATION_LIST_QUERY_TIMEOUT_MS }
    )

    return result.rows
  }

  async listTenantsToResetMigrationsBatch(
    migrationVersions: string[],
    lastCursor: number,
    batchSize: number,
    signal?: AbortSignal
  ): Promise<TenantCursorRow[]> {
    if (migrationVersions.length === 0) {
      return []
    }

    const result = await this.query<TenantCursorRow>(
      {
        text: `
          SELECT id, cursor_id
          FROM tenants
          WHERE cursor_id > $1
            AND migrations_version = ANY($2::text[])
          ORDER BY cursor_id ASC
          LIMIT $3
        `,
        values: [lastCursor, migrationVersions, batchSize],
      },
      { signal, timeoutMs: MIGRATION_LIST_QUERY_TIMEOUT_MS }
    )

    return result.rows
  }

  private query<T extends QueryResultRow = QueryResultRow>(
    statement: Parameters<DatabaseExecutor['query']>[0],
    options: TenantQueryOptions = {}
  ) {
    const db = options.db ?? this.db
    const timeoutMs = options.timeoutMs ?? multitenantDatabaseQueryTimeout
    const timeoutSignal = timeoutMs > 0 ? AbortSignal.timeout(timeoutMs) : undefined
    const signal =
      options.signal && timeoutSignal
        ? AbortSignal.any([options.signal, timeoutSignal])
        : (options.signal ?? timeoutSignal)

    return signal ? db.query<T>(statement, { signal }) : db.query<T>(statement)
  }
}

function getTenantEntries(tenantInfo: TenantConfigRowInput) {
  return tenantWritableColumns
    .filter((column) => tenantInfo[column] !== undefined)
    .map((column) => [column, tenantInfo[column]] as const)
}
