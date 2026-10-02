import { randomUUID } from 'node:crypto'
import {
  type DatabaseExecutor,
  type DatabaseStatement,
  type DatabaseTransaction,
  quoteIdentifier,
  quoteQualifiedIdentifier,
  type TenantConnection,
  type TransactionOptions,
} from '@internal/database'
import { DBMigration, tenantHasMigrations } from '@internal/database/migrations'
import { ERRORS, ErrorCode, isStorageError, StorageBackendError } from '@internal/errors'
import { hashStringToInt } from '@internal/hashing'
import { logger, logSchema } from '@internal/monitoring'
import { dbQueryPerformance } from '@internal/monitoring/metrics'
import { ObjectMetadata } from '@storage/backend'
import { assertLifecycleSchemaReady, lifecycleConfigurationsEqual } from '@storage/lifecycle'
import { DatabaseError, QueryResultRow } from 'pg'
import { DatabaseEngine, getConfig } from '../../config'
import { isUuid } from '../limits'
import {
  Bucket,
  BucketLifecycleConfiguration,
  IcebergCatalog,
  LifecycleBucket,
  Obj,
  ObjectListEntry,
  S3MultipartUpload,
  S3PartUpload,
} from '../schemas'
import {
  Database,
  FindBucketFilters,
  FindObjectFilters,
  ListBucketOptions,
  ScannerS3Key,
  SearchObjectOption,
} from './adapter'
import { SelectColumnPolicy, selectColumns } from './columns'
import { DBError, mapPgTransactionAbortedError, PgErrorContext } from './errors'

const { databaseEngine, databaseStatementTimeout, isMultitenant, databaseHealthcheckUnscoped } =
  getConfig()
// Scanner cache tables are unlogged scratch tables, not session temp tables.
// They must survive across pooled pg clients used by separate unscoped queries.
const S3_KEYS_SCRATCH_TABLE_SCHEMA = 'storage'
const S3_KEYS_SCRATCH_TABLE_PREFIX = '_s3_remote_keys_'
const S3_KEYS_SCRATCH_TABLE_MAX_AGE_MS = 24 * 60 * 60 * 1000
const S3_KEYS_SCRATCH_TABLE_PATTERN = `^${S3_KEYS_SCRATCH_TABLE_PREFIX}([0-9]{13})(?:_[A-Za-z0-9_]+)?$`
export const S3_KEYS_SCRATCH_TABLE_QUALIFIED_PATTERN = `^${S3_KEYS_SCRATCH_TABLE_SCHEMA}\\.${S3_KEYS_SCRATCH_TABLE_PATTERN.slice(1)}`
const S3_KEYS_SCRATCH_TABLE_QUALIFIED_REGEX = new RegExp(S3_KEYS_SCRATCH_TABLE_QUALIFIED_PATTERN)
// Keep direct search queries aligned with the cap enforced by storage.search.
const SEARCH_OBJECTS_MAX_LIMIT = 1500

function quoteS3KeysScratchTable(tableName: string): string {
  if (!S3_KEYS_SCRATCH_TABLE_QUALIFIED_REGEX.test(tableName)) {
    throw ERRORS.InvalidParameter('tmpTable')
  }

  return quoteQualifiedIdentifier(tableName)
}

export function escapeLike(str: string) {
  return str.replace(/\\/g, '\\\\').replace(/([%_])/g, '\\$1')
}

function buildVersioningConditions(
  noncurrentVersions: 'exclude' | 'include' | 'only',
  deleteMarkers: 'exclude' | 'include' | 'only'
): string[] {
  const conditions: string[] = []
  if (noncurrentVersions === 'exclude') {
    conditions.push('archived_at IS NULL')
  } else if (noncurrentVersions === 'only') {
    conditions.push('archived_at IS NOT NULL')
  }
  if (deleteMarkers === 'exclude') {
    conditions.push('NOT is_delete_marker')
  } else if (deleteMarkers === 'only') {
    conditions.push('is_delete_marker')
  }
  return conditions
}

interface PgDatabaseOptions {
  tenantId: string
  reqId?: string
  sbReqId?: string
  latestMigration?: keyof typeof DBMigration
  databaseEngine?: DatabaseEngine
  host: string
  tnx?: DatabaseTransaction
  parentTnx?: DatabaseTransaction
  parentConnection?: TenantConnection
}

interface UnscopedQueryOptions {
  readonly timeoutMs?: number
}

const HEALTHCHECK_SQL = 'SELECT id from storage.buckets limit 1'
const HEALTHCHECK_QUERY_OPTIONS: UnscopedQueryOptions = Object.freeze({
  timeoutMs: databaseStatementTimeout,
})
const LIFECYCLE_BUCKET_COLUMNS = [
  'id',
  'name',
  'type',
  'lifecycle_configuration',
  'lifecycle_configuration_generation',
].join(',')
async function executeQuery<T extends QueryResultRow = QueryResultRow>(
  db: DatabaseExecutor,
  statement: string | DatabaseStatement,
  signal?: AbortSignal
) {
  try {
    return await db.query<T>(statement, { signal })
  } catch (error) {
    throw mapPgError(error, typeof statement === 'string' ? statement : statement.text)
  }
}

function healthcheckProbe(db: DatabaseExecutor, signal?: AbortSignal) {
  return executeQuery(db, HEALTHCHECK_SQL, signal)
}

class TestPermissionRollbackError extends Error {
  constructor() {
    super('Rollback test permission transaction')
    this.name = 'TestPermissionRollbackError'
    Object.setPrototypeOf(this, TestPermissionRollbackError.prototype)
  }
}

const testPermissionRollbackError = new TestPermissionRollbackError()
testPermissionRollbackError.stack = undefined
Object.freeze(testPermissionRollbackError)

/**
 * Pg-backed storage metadata adapter.
 */
export class StoragePgDB implements Database {
  public readonly tenantHost: string
  public readonly tenantId: string
  public readonly reqId: string | undefined
  public readonly sbReqId: string | undefined
  public readonly role?: string
  public readonly latestMigration?: keyof typeof DBMigration
  private readonly objectColumnPolicy: SelectColumnPolicy
  private readonly multipartColumnPolicy: SelectColumnPolicy
  private readonly bucketColumnPolicy: SelectColumnPolicy | undefined
  private readonly supportsCustomMetadataColumns: boolean
  private readonly supportsMultipartMetadataColumn: boolean

  constructor(
    public readonly connection: TenantConnection,
    private readonly options: PgDatabaseOptions
  ) {
    this.tenantHost = options.host
    this.tenantId = options.tenantId
    this.reqId = options.reqId
    this.sbReqId = options.sbReqId
    this.role = connection.role
    this.latestMigration = options.latestMigration

    const migrationOrdinal = this.latestMigration ? DBMigration[this.latestMigration] : undefined
    this.supportsCustomMetadataColumns =
      !this.latestMigration ||
      (migrationOrdinal !== undefined && migrationOrdinal >= DBMigration['custom-metadata'])
    this.supportsMultipartMetadataColumn =
      !this.latestMigration ||
      (migrationOrdinal !== undefined &&
        migrationOrdinal >= DBMigration['s3-multipart-uploads-metadata'])
    this.objectColumnPolicy = this.supportsCustomMetadataColumns
      ? SelectColumnPolicy.none
      : SelectColumnPolicy.objectWithoutUserMetadata
    this.bucketColumnPolicy =
      migrationOrdinal === undefined
        ? undefined
        : migrationOrdinal >= DBMigration['iceberg-catalog-flag-on-buckets']
          ? SelectColumnPolicy.none
          : SelectColumnPolicy.bucketWithoutType

    if (this.supportsCustomMetadataColumns) {
      this.multipartColumnPolicy = this.supportsMultipartMetadataColumn
        ? SelectColumnPolicy.none
        : SelectColumnPolicy.multipartWithoutMetadata
    } else {
      this.multipartColumnPolicy = this.supportsMultipartMetadataColumn
        ? SelectColumnPolicy.multipartWithoutUserMetadata
        : SelectColumnPolicy.multipartWithoutUserOrMultipartMetadata
    }
  }

  async withTransaction<T>(
    fn: (db: StoragePgDB) => Promise<T>,
    opts?: TransactionOptions
  ): Promise<T> {
    const parentTnx = this.options.tnx
    const tnx = parentTnx ?? (await this.connection.transaction(opts))
    const savepoint = parentTnx ? nextSavepointName() : undefined
    let savepointEstablished = false

    try {
      if (savepoint) {
        await createSavepoint(tnx, savepoint)
        savepointEstablished = true
      }

      await this.connection.setScope(tnx)

      const storageWithTnx = new StoragePgDB(this.connection, {
        ...this.options,
        tnx,
      })

      const result = await fn(storageWithTnx)

      if (savepoint) {
        if (
          this.options.parentConnection?.role &&
          this.connection.role !== this.options.parentConnection.role
        ) {
          // Keep scope restoration inside the savepoint. If it fails, rolling back
          // the nested unit is preferable to leaking elevated scope into the parent transaction.
          await this.options.parentConnection.setScope(tnx)
        }

        await tnx.query(`RELEASE SAVEPOINT ${savepoint}`)
      } else {
        await tnx.commit()
      }

      return result
    } catch (e) {
      if (savepointEstablished && savepoint && !tnx.isCompleted()) {
        try {
          await rollbackSavepoint(tnx, savepoint)
        } catch (rollbackError) {
          logSchema.warning(logger, '[StoragePgDB] Failed to rollback savepoint', {
            type: 'db',
            tenantId: this.tenantId,
            project: this.tenantId,
            reqId: this.reqId,
            sbReqId: this.sbReqId,
            error: rollbackError,
            metadata: JSON.stringify({ originalError: String(e), savepoint }),
          })
        }
      } else if (!savepoint) {
        try {
          await tnx.rollback()
        } catch (rollbackError) {
          logSchema.warning(logger, '[StoragePgDB] Failed to rollback transaction', {
            type: 'db',
            tenantId: this.tenantId,
            project: this.tenantId,
            reqId: this.reqId,
            sbReqId: this.sbReqId,
            error: rollbackError,
            metadata: JSON.stringify({ originalError: String(e) }),
          })
        }
      }

      throw mapPgError(e)
    }
  }

  tenant() {
    return {
      ref: this.tenantId,
      host: this.tenantHost,
    }
  }

  async hasMigration(migration: keyof typeof DBMigration): Promise<boolean> {
    const reportedOrdinal = this.latestMigration ? DBMigration[this.latestMigration] : undefined
    if (reportedOrdinal !== undefined) {
      return reportedOrdinal >= DBMigration[migration]
    }

    return tenantHasMigrations(this.tenantId, migration)
  }

  asSuperUser() {
    return new StoragePgDB(this.connection.asSuperUser(), {
      ...this.options,
      tnx: this.options.tnx,
      parentConnection: this.options.parentConnection ?? this.connection,
      parentTnx: this.options.tnx,
    })
  }

  async testPermission<T>(fn: (db: StoragePgDB) => T | Promise<T>): Promise<Awaited<T>> {
    let result: Awaited<T>
    try {
      await this.withTransaction(async (db) => {
        result = await fn(db)
        throw testPermissionRollbackError
      })
    } catch (e) {
      if (e === testPermissionRollbackError) {
        return result!
      }
      throw e
    }

    return result!
  }

  deleteAnalyticsBucket(id: string, opts?: { soft: boolean }): Promise<IcebergCatalog> {
    return this.runQuery('DeleteAnalyticsBucket', async (db, signal) => {
      const result = opts?.soft
        ? await this.query<IcebergCatalog>(
            db,
            {
              text: `
                UPDATE storage.buckets_analytics
                SET deleted_at = now()
                WHERE id = $1
                  AND deleted_at IS NULL
                RETURNING *
              `,
              values: [id],
            },
            signal
          )
        : await this.query<IcebergCatalog>(
            db,
            {
              text: `
                DELETE FROM storage.buckets_analytics
                WHERE id = $1
                RETURNING *
              `,
              values: [id],
            },
            signal
          )

      const deleted = result.rows[0]
      if (!deleted) {
        throw ERRORS.NoSuchBucket(id)
      }

      return deleted
    })
  }

  listAnalyticsBuckets(
    columns: string,
    options: ListBucketOptions | undefined
  ): Promise<IcebergCatalog[]> {
    const selectedColumns = selectColumns(columns)

    return this.runQuery('ListIcebergBuckets', async (db, signal) => {
      const values: unknown[] = []
      const conditions = ['deleted_at IS NULL']

      if (options?.search !== undefined && options.search.length > 0) {
        values.push(`%${escapeLike(options.search)}%`)
        conditions.push(`name LIKE $${values.length}`)
      }

      const orderBy = options?.sortColumn
        ? `${quoteIdentifier(options.sortColumn)} ${normalizeSortOrder(options.sortOrder)}`
        : `"name" ASC`

      let pagination = ''
      if (options?.limit !== undefined) {
        values.push(options.limit)
        pagination += ` LIMIT $${values.length}`
      }
      if (options?.offset !== undefined) {
        values.push(options.offset)
        pagination += ` OFFSET $${values.length}`
      }

      const result = await this.query<IcebergCatalog>(
        db,
        {
          text: `
            SELECT ${selectedColumns}
            FROM storage.buckets_analytics
            WHERE ${conditions.join(' AND ')}
            ORDER BY ${orderBy}
            ${pagination}
          `,
          values,
        },
        signal
      )

      return result.rows
    })
  }

  findAnalyticsBucketByName(name: string): Promise<IcebergCatalog> {
    return this.runQuery('FindAnalyticsBucketByName', async (db, signal) => {
      const result = await this.query<IcebergCatalog>(
        db,
        {
          text: `
            SELECT *
            FROM storage.buckets_analytics
            WHERE name = $1
              AND deleted_at IS NULL
            LIMIT 1
          `,
          values: [name],
        },
        signal
      )

      const bucket = result.rows[0]
      if (!bucket) {
        throw ERRORS.NoSuchBucket(name)
      }

      return bucket
    })
  }

  createAnalyticsBucket(data: Pick<Bucket, 'name'>): Promise<IcebergCatalog> {
    return this.runQuery('CreateAnalyticsBucket', async (db, signal) => {
      const result = await this.query<IcebergCatalog>(
        db,
        {
          text: `
            INSERT INTO storage.buckets_analytics (name)
            VALUES ($1)
            ON CONFLICT (name) WHERE deleted_at IS NULL DO NOTHING
            RETURNING *
          `,
          values: [data.name],
        },
        signal
      )

      const bucket = result.rows[0]
      if (!bucket) {
        throw ERRORS.ResourceAlreadyExists()
      }

      return bucket
    })
  }

  async createBucket(
    data: Pick<
      Bucket,
      'id' | 'name' | 'public' | 'owner' | 'file_size_limit' | 'allowed_mime_types' | 'type'
    >
  ) {
    const bucketData: Bucket = {
      id: data.id,
      name: data.name,
      owner: isUuid(data.owner || '') ? data.owner : undefined,
      owner_id: data.owner,
      public: data.public,
      allowed_mime_types: data.allowed_mime_types,
      file_size_limit: data.file_size_limit,
    }

    if (await this.hasMigration('iceberg-catalog-flag-on-buckets')) {
      bucketData.type = 'STANDARD'
    }

    try {
      const result = await this.runQuery('CreateBucket', async (db, signal) => {
        const insert = buildInsert(bucketData as Record<string, unknown>)

        return this.query(
          db,
          {
            text: `
              INSERT INTO storage.buckets (${insert.columns})
              VALUES (${insert.placeholders})
            `,
            values: insert.values,
          },
          signal
        )
      })

      if (!result.rowCount) {
        throw ERRORS.NoSuchBucket(data.id)
      }

      return bucketData
    } catch (e) {
      if (isStorageError(ErrorCode.ResourceAlreadyExists, e)) {
        throw ERRORS.BucketAlreadyExists(data.id, e)
      }
      throw e
    }
  }

  async findBucketById(bucketId: string, columns = 'id', filters?: FindBucketFilters) {
    let columnPolicy = this.bucketColumnPolicy
    if (columnPolicy === undefined) {
      columnPolicy = (await this.hasMigration('iceberg-catalog-flag-on-buckets'))
        ? SelectColumnPolicy.none
        : SelectColumnPolicy.bucketWithoutType
    }
    const selectedColumns = selectColumns(columns, columnPolicy)

    const result = await this.runQuery('FindBucketById', async (db, signal) => {
      const conditions = ['id = $1']
      const values: unknown[] = [bucketId]

      if (typeof filters?.isPublic !== 'undefined') {
        values.push(filters.isPublic)
        conditions.push(`public = $${values.length}`)
      }

      const result = await this.query<Bucket>(
        db,
        {
          text: `
            SELECT ${selectedColumns}
            FROM storage.buckets
            WHERE ${conditions.join(' AND ')}
            LIMIT 1
            ${lockClause(filters)}
          `,
          values,
        },
        signal
      )

      return result.rows[0]
    })

    if (!result && !filters?.dontErrorOnEmpty) {
      throw ERRORS.NoSuchBucket(bucketId)
    }

    return result
  }

  async findLifecycleBucket(bucketId: string): Promise<LifecycleBucket> {
    await assertLifecycleSchemaReady(this, bucketId)

    const bucket = await this.findBucketById(bucketId, LIFECYCLE_BUCKET_COLUMNS)
    assertStandardLifecycleBucket(bucket)
    return bucket as LifecycleBucket
  }

  async putLifecycleConfiguration(
    bucketId: string,
    configuration: BucketLifecycleConfiguration
  ): Promise<LifecycleBucket> {
    return this.mutateLifecycleConfiguration({
      bucketId,
      queryName: 'PutLifecycleConfiguration',
      unchanged: (locked) =>
        lifecycleConfigurationsEqual(locked.lifecycle_configuration, configuration),
      write: (unchanged) => ({
        text: `
                  UPDATE storage.buckets
                  SET lifecycle_configuration = $2::jsonb,
                      lifecycle_configuration_generation = $3::uuid
                  WHERE id = $1
                  RETURNING ${selectColumns(LIFECYCLE_BUCKET_COLUMNS)}
                `,
        values: [
          bucketId,
          JSON.stringify(unchanged ? unchanged.lifecycle_configuration : configuration),
          unchanged ? unchanged.lifecycle_configuration_generation : randomUUID(),
        ],
      }),
    })
  }

  async deleteLifecycleConfiguration(bucketId: string): Promise<LifecycleBucket> {
    return this.mutateLifecycleConfiguration({
      bucketId,
      queryName: 'DeleteLifecycleConfiguration',
      unchanged: (locked) => locked.lifecycle_configuration === null,
      write: () => ({
        text: `
                  UPDATE storage.buckets
                  SET lifecycle_configuration = NULL,
                      lifecycle_configuration_generation = NULL
                  WHERE id = $1
                  RETURNING ${selectColumns(LIFECYCLE_BUCKET_COLUMNS)}
                `,
        values: [bucketId],
      }),
    })
  }

  async countObjectsInBucket(bucketId: string, limit?: number): Promise<number> {
    if (limit !== undefined) {
      const result = await this.runQuery('CountObjectsInBucketWithLimit', async (db, signal) => {
        return this.query(
          db,
          {
            text: `
              SELECT 1
              FROM storage.objects
              WHERE bucket_id = $1
              LIMIT $2
            `,
            values: [bucketId, limit],
          },
          signal
        )
      })

      return result.rows.length
    }

    const result = await this.runQuery('CountObjectsInBucket', async (db, signal) => {
      return this.query<{ count: number }>(
        db,
        {
          text: `
            SELECT COUNT(*)::int AS count
            FROM storage.objects
            WHERE bucket_id = $1
          `,
          values: [bucketId],
        },
        signal
      )
    })

    return result.rows[0]?.count || 0
  }

  async listObjects(
    bucketId: string,
    columns = 'id',
    limit = 10,
    before?: Date,
    nextToken?: string
  ) {
    const selectedColumns = selectColumns(columns)

    const result = await this.runQuery('ListObjects', async (db, signal) => {
      const conditions = ['bucket_id = $1']
      const values: unknown[] = [bucketId]

      if (before) {
        values.push(before.toISOString())
        conditions.push(`created_at < $${values.length}`)
      }

      if (nextToken) {
        values.push(nextToken)
        conditions.push(`name COLLATE "C" > $${values.length}`)
      }

      values.push(limit)

      return this.query<Obj>(
        db,
        {
          text: `
            SELECT ${selectedColumns}
            FROM storage.objects
            WHERE ${conditions.join(' AND ')}
            ORDER BY name COLLATE "C"
            LIMIT $${values.length}
          `,
          values,
        },
        signal
      )
    })

    return result.rows
  }

  async listObjectsV2(
    bucketId: string,
    options?: {
      prefix?: string
      delimiter?: string
      nextToken?: string
      maxKeys?: number
      startAfter?: string
      sortBy?: {
        order?: string
        column?: string
        after?: string
        afterVersion?: string
        afterArchivedAt?: string
      }
      noncurrentVersions?: 'exclude' | 'include' | 'only'
      deleteMarkers?: 'exclude' | 'include' | 'only'
      exactMatch?: boolean
    }
  ) {
    let useNewSearchVersion2 = true
    let hasSortSupport = false

    if (options?.delimiter) {
      if (isMultitenant) {
        useNewSearchVersion2 = await this.hasMigration('search-v2')
      }

      if (useNewSearchVersion2 && options.delimiter === '/') {
        hasSortSupport =
          (await this.hasMigration('add-search-v2-sort-support')) ||
          (await this.hasMigration('search-v2-optimised'))
      }
    }

    const hasVersioningStatus = await this.hasMigration('list-objects-with-versions')
    const noncurrentVersions = hasVersioningStatus
      ? (options?.noncurrentVersions ?? 'exclude')
      : 'exclude'
    const deleteMarkers = hasVersioningStatus ? (options?.deleteMarkers ?? 'exclude') : 'exclude'
    const multiRow = noncurrentVersions === 'only' || noncurrentVersions === 'include'

    return this.runQuery('ListObjectsV2', async (db, signal) => {
      if (!options?.delimiter || options?.exactMatch) {
        const values: unknown[] = [bucketId, options?.maxKeys || 100]
        const conditions = ['bucket_id = $1']

        if (hasVersioningStatus) {
          conditions.push(...buildVersioningConditions(noncurrentVersions, deleteMarkers))
        }

        const allowedSortColumns = new Set(['updated_at', 'created_at'])
        const allowedSortOrders = new Set(['asc', 'desc'])
        const sortColumn =
          options?.sortBy?.column && allowedSortColumns.has(options.sortBy.column)
            ? options.sortBy.column
            : undefined
        const sortColumnExpression = sortColumn
          ? `COALESCE(date_trunc('milliseconds', ${quoteIdentifier(sortColumn)}), 'epoch'::timestamptz)`
          : undefined
        const sortOrder =
          options?.sortBy?.order && allowedSortOrders.has(options.sortBy.order)
            ? options.sortBy.order
            : 'asc'
        const pageOperator = sortOrder === 'asc' ? '>' : '<'

        if (options?.exactMatch) {
          values.push(options.nextToken ?? options.prefix ?? '')
          conditions.push(`name COLLATE "C" = $${values.length}`)
        } else if (options?.prefix) {
          values.push(`${escapeLike(options.prefix)}%`)
          conditions.push(`name COLLATE "C" LIKE $${values.length}`)
        }

        if (options?.startAfter && !options?.nextToken) {
          values.push(options.startAfter)
          conditions.push(`name COLLATE "C" ${pageOperator} $${values.length}`)
        }

        if (options?.nextToken) {
          if (sortColumn) {
            values.push(options.sortBy?.after ?? null, options.nextToken)
            const tsPlaceholder = values.length - 1
            const namePlaceholder = values.length
            let storedVersionClause = "''"
            let cursorVersionClause = "''"
            if (multiRow) {
              storedVersionClause = "COALESCE(version, '')"
              values.push(options.sortBy?.afterVersion || '')
              cursorVersionClause = `$${values.length}`
            }
            conditions.push(
              `ROW(${sortColumnExpression}, name COLLATE "C", ${storedVersionClause}) ${pageOperator} ROW(date_trunc('milliseconds', COALESCE(NULLIF($${tsPlaceholder}, '')::timestamptz, 'epoch'::timestamptz)), $${namePlaceholder}, ${cursorVersionClause})`
            )
          } else if (multiRow) {
            values.push(
              options.nextToken,
              options.sortBy?.afterArchivedAt || '',
              options.sortBy?.afterVersion || ''
            )
            const namePlaceholder = values.length - 2
            const tsPlaceholder = values.length - 1
            const versionPlaceholder = values.length
            const archivedAt =
              "COALESCE(date_trunc('milliseconds', archived_at), 'infinity'::timestamptz)"
            conditions.push(
              `name COLLATE "C" ${pageOperator === '>' ? '>=' : '<='} $${namePlaceholder}`
            )
            conditions.push(
              `(name COLLATE "C" ${pageOperator} $${namePlaceholder} OR (name COLLATE "C" = $${namePlaceholder} AND (NULLIF($${tsPlaceholder}, '') IS NULL OR ${archivedAt} < NULLIF($${tsPlaceholder}, '')::timestamptz OR (${archivedAt} = NULLIF($${tsPlaceholder}, '')::timestamptz AND COALESCE(version, '') > $${versionPlaceholder}))))`
            )
          } else {
            values.push(options.nextToken)
            conditions.push(`name COLLATE "C" ${pageOperator} $${values.length}`)
          }
        }

        const result = await this.query<ObjectListEntry>(
          db,
          {
            text: `
              SELECT id, name, metadata, updated_at, created_at, last_accessed_at
                ${hasVersioningStatus ? ', version, archived_at, is_delete_marker, is_versioned' : ''}
              FROM storage.objects
              WHERE ${conditions.join(' AND ')}
              ORDER BY ${sortColumnExpression ? `${sortColumnExpression} ${sortOrder}, ` : ''}
                name COLLATE "C" ${sortOrder}${!sortColumn && multiRow ? ", COALESCE(date_trunc('milliseconds', archived_at), 'infinity'::timestamptz) DESC, COALESCE(version, '') ASC" : ''}${sortColumn && multiRow ? `, COALESCE(version, '') ${sortOrder}` : ''}
              LIMIT $2
            `,
            values,
          },
          signal
        )

        return result.rows
      }

      if (useNewSearchVersion2 && options?.delimiter === '/') {
        const sortParams: (string | null)[] = []

        // Versioning parameters occupy positions after the sort parameters in
        // search_v2's signature, so include the sort defaults even if a
        // non-linear migration state reports versioning without sort support.
        if (hasSortSupport || hasVersioningStatus) {
          sortParams.push(
            options?.sortBy?.order || 'asc',
            options?.sortBy?.column || 'name',
            options?.sortBy?.after || null
          )
        }

        const versioningParams: (string | boolean | null)[] = []
        if (hasVersioningStatus) {
          versioningParams.push(
            noncurrentVersions,
            deleteMarkers,
            options?.sortBy?.afterArchivedAt || null,
            options?.sortBy?.afterVersion || '',
            options?.nextToken !== undefined
          )
        }

        const levels = !options?.prefix ? 1 : options.prefix.split('/').length
        const searchParams = [
          options?.prefix || '',
          bucketId,
          options?.maxKeys || 1000,
          levels,
          options?.startAfter || '',
          ...sortParams,
          ...versioningParams,
        ]
        const paramPlaceholders = searchParams.map((_, index) => `$${index + 1}`).join(',')

        const result = await this.query<ObjectListEntry>(
          db,
          {
            text: `select * from storage.search_v2(${paramPlaceholders})`,
            values: searchParams,
          },
          signal
        )

        return result.rows
      }

      const listParamPlaceholders = hasVersioningStatus
        ? '$1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11'
        : '$1,$2,$3,$4,$5,$6'
      const listValues: unknown[] = [
        bucketId,
        options?.prefix,
        options?.delimiter,
        options?.maxKeys,
        options?.startAfter || '',
        options?.nextToken || '',
      ]
      if (hasVersioningStatus) {
        listValues.push(
          options?.sortBy?.order || 'asc',
          noncurrentVersions,
          deleteMarkers,
          options?.sortBy?.afterArchivedAt || null,
          options?.sortBy?.afterVersion || ''
        )
      }

      const result = await this.query<ObjectListEntry>(
        db,
        {
          text: `select * from storage.list_objects_with_delimiter(${listParamPlaceholders})`,
          values: listValues,
        },
        signal
      )

      return result.rows
    })
  }

  async deleteBucket(bucketId: string | string[]) {
    const result = await this.runQuery('DeleteBucket', async (db, signal) => {
      return this.query(
        db,
        {
          text: `
            DELETE FROM storage.buckets
            WHERE id = ANY($1::text[])
          `,
          values: [Array.isArray(bucketId) ? bucketId : [bucketId]],
        },
        signal
      )
    })

    return result.rowCount || 0
  }

  async listBuckets(columns = 'id', options?: ListBucketOptions) {
    const selectedColumns = selectColumns(columns, SelectColumnPolicy.syntheticBucket)

    return this.runQuery('ListBuckets', async (db, signal) => {
      const conditions: string[] = []
      const values: unknown[] = []

      if (options?.search !== undefined && options.search.length > 0) {
        values.push(`%${escapeLike(options.search)}%`)
        conditions.push(`name ILIKE $${values.length}`)
      }

      const orderBy = options?.sortColumn
        ? ` ORDER BY ${quoteIdentifier(options.sortColumn)} ${normalizeSortOrder(
            options.sortOrder
          )}`
        : ''

      let pagination = ''
      if (options?.limit !== undefined) {
        values.push(options.limit)
        pagination += ` LIMIT $${values.length}`
      }
      if (options?.offset !== undefined) {
        values.push(options.offset)
        pagination += ` OFFSET $${values.length}`
      }

      const result = await this.query<Bucket>(
        db,
        {
          text: `
            SELECT ${selectedColumns}
            FROM storage.buckets
            ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
            ${orderBy}
            ${pagination}
          `,
          values,
        },
        signal
      )

      return result.rows
    })
  }

  async listMultipartUploads(
    bucketId: string,
    options?: {
      prefix?: string
      deltimeter?: string
      nextUploadToken?: string
      nextUploadKeyToken?: string
      maxKeys?: number
    }
  ) {
    const hasRawPrefixParam = options?.deltimeter
      ? await this.hasMigration('list-objects-with-versions')
      : false

    return this.runQuery('ListMultipartsUploads', async (db, signal) => {
      if (!options?.deltimeter) {
        const conditions = ['bucket_id = $1']
        const values: unknown[] = [bucketId]

        if (options?.prefix) {
          values.push(`${escapeLike(options.prefix)}%`)
          conditions.push(`key COLLATE "C" LIKE $${values.length}`)
        }

        if (options?.nextUploadKeyToken) {
          values.push(options.nextUploadKeyToken)
          const keyMarkerIndex = values.length

          if (options.nextUploadToken) {
            // Upload IDs do not follow creation order. A missing marker repeats
            // the remaining same-key uploads instead of skipping them.
            values.push(options.nextUploadToken)
            conditions.push(
              `(key COLLATE "C" > $${keyMarkerIndex} OR (key COLLATE "C" = $${keyMarkerIndex} AND COALESCE((created_at, id COLLATE "C") > (
                SELECT marker.created_at, marker.id COLLATE "C"
                FROM storage.s3_multipart_uploads AS marker
                WHERE marker.bucket_id = $1
                  AND marker.key COLLATE "C" = $${keyMarkerIndex}
                  AND marker.id = $${values.length}
              ), TRUE)))`
            )
          } else {
            conditions.push(`key COLLATE "C" > $${keyMarkerIndex}`)
          }
        }

        values.push(options?.maxKeys || 100)

        const result = await this.query<S3MultipartUpload>(
          db,
          {
            text: `
              SELECT id, key, created_at
              FROM storage.s3_multipart_uploads
              WHERE ${conditions.join(' AND ')}
              ORDER BY key COLLATE "C", created_at, id COLLATE "C"
              LIMIT $${values.length}
            `,
            values,
          },
          signal
        )

        return result.rows
      }

      const result = await this.query<S3MultipartUpload>(
        db,
        {
          text: `select * from storage.list_multipart_uploads_with_delimiter($1,$2,$3,$4,$5,$6${hasRawPrefixParam ? ',$7' : ''})`,
          values: [
            bucketId,
            options?.prefix ? escapeLike(options.prefix) : options?.prefix,
            options?.deltimeter,
            options?.maxKeys,
            options?.nextUploadKeyToken || '',
            options.nextUploadToken || '',
            ...(hasRawPrefixParam ? [options?.prefix ?? ''] : []),
          ],
        },
        signal
      )

      return result.rows
    })
  }

  async updateBucket(
    bucketId: string,
    fields: Pick<Bucket, 'public' | 'file_size_limit' | 'allowed_mime_types'>
  ) {
    const entries = Object.entries(fields).filter(([, value]) => value !== undefined)

    if (entries.length === 0) {
      return
    }

    const result = await this.runQuery('UpdateBucket', async (db, signal) => {
      const values = entries.map(([, value]) => value)
      const setClause = entries
        .map(([column], index) => `${quoteIdentifier(column)} = $${index + 1}`)
        .join(', ')
      const idParam = `$${entries.length + 1}`

      return this.query<Pick<Bucket, 'public'>>(
        db,
        {
          text: `
            WITH previous_bucket AS (
              SELECT public FROM storage.buckets WHERE id = ${idParam}
            )
            UPDATE storage.buckets
            SET ${setClause}
            WHERE id = ${idParam}
            RETURNING (SELECT public FROM previous_bucket) AS public
          `,
          values: [...values, bucketId],
        },
        signal
      )
    })

    if (result.rowCount === 0) {
      throw ERRORS.NoSuchBucket(bucketId)
    }

    return { previous: { public: result.rows[0].public } }
  }

  async upsertObject(
    data: Pick<Obj, 'name' | 'owner' | 'bucket_id' | 'metadata' | 'user_metadata' | 'version'>
  ) {
    const objectData = this.normalizeRecordColumns({
      name: data.name,
      owner: isUuid(data.owner || '') ? data.owner : undefined,
      owner_id: data.owner,
      bucket_id: data.bucket_id,
      metadata: data.metadata,
      user_metadata: data.user_metadata,
      version: data.version,
    })
    const updateData = this.normalizeRecordColumns({
      metadata: data.metadata,
      user_metadata: data.user_metadata,
      version: data.version,
      owner: isUuid(data.owner || '') ? data.owner : undefined,
      owner_id: data.owner,
    })

    const conflictTarget = (await this.hasMigration('objects-current-version-index'))
      ? 'ON CONFLICT (bucket_id, name COLLATE "C") WHERE archived_at IS NULL'
      : 'ON CONFLICT (name, bucket_id)'

    const result = await this.runQuery('UpsertObject', async (db, signal) => {
      const insert = buildInsert(objectData)
      const updateRecord = updateData as Record<string, unknown>
      const updateClauses: string[] = []

      for (const column in updateRecord) {
        if (!Object.prototype.hasOwnProperty.call(updateRecord, column)) {
          continue
        }

        if (updateRecord[column] === undefined) {
          continue
        }

        updateClauses.push(`${quoteIdentifier(column)} = EXCLUDED.${quoteIdentifier(column)}`)
      }

      const updateClause = updateClauses.join(', ')

      return this.query<Obj>(
        db,
        {
          text: `
            INSERT INTO storage.objects (${insert.columns})
            VALUES (${insert.placeholders})
            ${conflictTarget}
            ${updateClause ? `DO UPDATE SET ${updateClause}` : 'DO NOTHING'}
            RETURNING *
          `,
          values: insert.values,
        },
        signal
      )
    })

    return result.rows[0]
  }

  async updateObject(
    bucketId: string,
    name: string,
    data: Pick<Obj, 'owner' | 'metadata' | 'version' | 'name' | 'bucket_id' | 'user_metadata'>,
    currentVersion?: string
  ) {
    const objectData = this.normalizeRecordColumns({
      name: data.name,
      bucket_id: data.bucket_id,
      owner: isUuid(data.owner || '') ? data.owner : undefined,
      owner_id: data.owner,
      metadata: data.metadata,
      user_metadata: data.user_metadata,
      version: data.version,
    })

    const update = buildUpdate(objectData)
    const conditions = [
      `bucket_id = $${update.values.length + 1}`,
      `name COLLATE "C" = $${update.values.length + 2}`,
    ]
    const values = [...update.values, bucketId, name]

    if (currentVersion !== undefined) {
      values.push(currentVersion)
      conditions.push(`version = $${values.length}`)
    } else if (await this.hasMigration('object-versioning-core')) {
      conditions.push('archived_at IS NULL')
    }

    const result = await this.runQuery('UpdateObject', async (db, signal) => {
      return this.query<Obj>(
        db,
        {
          text: `
            UPDATE storage.objects
            SET ${update.setClause}
            WHERE ${conditions.join(' AND ')}
            RETURNING *
          `,
          values,
        },
        signal
      )
    })

    const object = result.rows[0]
    if (!object) {
      throw ERRORS.NoSuchKey(name)
    }

    return object
  }

  async createObject(
    data: Pick<Obj, 'name' | 'owner' | 'bucket_id' | 'metadata' | 'version' | 'user_metadata'>
  ) {
    try {
      const object = this.normalizeRecordColumns({
        name: data.name,
        owner: isUuid(data.owner || '') ? data.owner : undefined,
        owner_id: data.owner,
        bucket_id: data.bucket_id,
        metadata: data.metadata,
        version: data.version,
        user_metadata: data.user_metadata,
      })

      await this.runQuery('CreateObject', async (db, signal) => {
        const insert = buildInsert(object)
        return this.query(
          db,
          {
            text: `
              INSERT INTO storage.objects (${insert.columns})
              VALUES (${insert.placeholders})
            `,
            values: insert.values,
          },
          signal
        )
      })

      return object as Obj
    } catch (e) {
      if (isStorageError(ErrorCode.ResourceAlreadyExists, e)) {
        throw ERRORS.KeyAlreadyExists(data.name, e)
      }
      throw e
    }
  }

  async deleteObject(bucketId: string, objectName: string, version?: string) {
    const conditions = ['name COLLATE "C" = $1', 'bucket_id = $2']
    const values: unknown[] = [objectName, bucketId]

    if (version !== undefined) {
      values.push(version)
      conditions.push(`version = $${values.length}`)
    } else if (await this.hasMigration('object-versioning-core')) {
      conditions.push('archived_at IS NULL')
    }

    const result = await this.runQuery('Delete Object', async (db, signal) => {
      return this.query<Obj>(
        db,
        {
          text: `
            DELETE FROM storage.objects
            WHERE ${conditions.join(' AND ')}
            RETURNING *
          `,
          values,
        },
        signal
      )
    })

    return result.rows[0]
  }

  async deleteObjects(bucketId: string, objectNames: string[], by: keyof Obj = 'name') {
    if (objectNames.length === 0) {
      return []
    }

    const targetColumn = by === 'name' ? 'name COLLATE "C"' : quoteIdentifier(String(by))
    const conditions = ['bucket_id = $1', `${targetColumn} = ANY($2)`]

    if (await this.hasMigration('object-versioning-core')) {
      conditions.push('archived_at IS NULL')
    }

    const result = await this.runQuery('DeleteObjects', async (db, signal) => {
      return this.query<Obj>(
        db,
        {
          text: `
            DELETE FROM storage.objects
            WHERE ${conditions.join(' AND ')}
            RETURNING *
          `,
          values: [bucketId, objectNames],
        },
        signal
      )
    })

    return result.rows
  }

  async deleteObjectVersions(bucketId: string, objectNames: { name: string; version: string }[]) {
    if (objectNames.length === 0) {
      return []
    }

    const result = await this.runQuery('DeleteObjects', async (db, signal) => {
      const names = objectNames.map((entry) => entry.name)
      const versions = objectNames.map((entry) => entry.version)

      return this.query<Obj>(
        db,
        {
          text: `
            DELETE FROM storage.objects
            WHERE bucket_id = $1
              AND (name COLLATE "C", version) IN (SELECT * FROM unnest($2::text[], $3::text[]))
            RETURNING *
          `,
          values: [bucketId, names, versions],
        },
        signal
      )
    })

    return result.rows
  }

  async updateObjectOwner(bucketId: string, objectName: string, owner?: string) {
    const result = await this.runQuery('UpdateObjectOwner', async (db, signal) => {
      return this.query<Obj>(
        db,
        {
          text: `
            UPDATE storage.objects
            SET
              last_accessed_at = now(),
              owner = $1,
              owner_id = $2
            WHERE bucket_id = $3
              AND name COLLATE "C" = $4
            RETURNING *
          `,
          values: [isUuid(owner || '') ? owner : null, owner, bucketId, objectName],
        },
        signal
      )
    })

    const object = result.rows[0]
    if (!object) {
      throw ERRORS.NoSuchKey(objectName)
    }

    return object
  }

  async findObject(
    bucketId: string,
    objectName: string,
    columns = 'id',
    filters?: FindObjectFilters,
    version?: string
  ) {
    const selectedColumns = selectColumns(columns, this.objectColumnPolicy)
    const conditions = ['name COLLATE "C" = $1', 'bucket_id = $2']
    const values: unknown[] = [objectName, bucketId]

    if (version !== undefined) {
      values.push(version)
      conditions.push(`version = $${values.length}`)
    } else if (await this.hasMigration('object-versioning-core')) {
      conditions.push('archived_at IS NULL')
    }

    const result = await this.runQuery('FindObject', async (db, signal) => {
      return this.query<Obj>(
        db,
        {
          text: `
            SELECT ${selectedColumns}
            FROM storage.objects
            WHERE ${conditions.join(' AND ')}
            LIMIT 1
            ${objectLockClause(filters)}
          `,
          values,
        },
        signal
      )
    })

    const object = result.rows[0]
    if (!object && !filters?.dontErrorOnEmpty) {
      throw ERRORS.NoSuchKey(objectName)
    }

    return object
  }

  async findObjects(bucketId: string, objectNames: string[], columns = 'id') {
    if (objectNames.length === 0) {
      return []
    }

    const selectedColumns = selectColumns(columns, this.objectColumnPolicy)
    const conditions = ['bucket_id = $1', 'name COLLATE "C" = ANY($2::text[])']

    if (await this.hasMigration('object-versioning-core')) {
      conditions.push('archived_at IS NULL')
    }

    const result = await this.runQuery('FindObjects', async (db, signal) => {
      return this.query<Obj>(
        db,
        {
          text: `
            SELECT ${selectedColumns}
            FROM storage.objects
            WHERE ${conditions.join(' AND ')}
          `,
          values: [bucketId, objectNames],
        },
        signal
      )
    })

    return result.rows
  }

  async findObjectVersions(bucketId: string, obj: { name: string; version: string }[]) {
    if (obj.length === 0) {
      return []
    }

    const result = await this.runQuery('FindObjectVersions', async (db, signal) => {
      const { placeholders, values } = buildTupleValues(obj)

      return this.query<Pick<Obj, 'name' | 'version'>>(
        db,
        {
          text: `
            SELECT name, version
            FROM storage.objects
            WHERE bucket_id = $1
              AND (name COLLATE "C", version) IN (${placeholders})
          `,
          values: [bucketId, ...values],
        },
        signal
      )
    })

    return result.rows
  }

  async mustLockObject(bucketId: string, objectName: string, version?: string) {
    return this.runQuery('MustLockObject', async (db, signal) => {
      const hash = hashStringToInt(`${bucketId}/${objectName}${version ? `/${version}` : ''}`)
      const result = await this.query<{ pg_try_advisory_xact_lock: boolean }>(
        db,
        {
          text: 'SELECT pg_try_advisory_xact_lock($1)',
          values: [hash],
        },
        signal
      )
      const lockAcquired = result.rows[0]?.pg_try_advisory_xact_lock || false

      if (!lockAcquired) {
        throw ERRORS.ResourceLocked()
      }

      return true
    })
  }

  async waitObjectLock(
    bucketId: string,
    objectName: string,
    version?: string,
    opts?: { timeout: number }
  ) {
    return this.runQuery('WaitObjectLock', async (db, signal) => {
      const hash = hashStringToInt(`${bucketId}/${objectName}${version ? `/${version}` : ''}`)
      const lockTimeout = opts?.timeout

      if (lockTimeout && lockTimeout > 0) {
        if (this.isMultigresDatabase()) {
          await this.waitObjectLockWithTopLevelLockTimeout(db, hash, lockTimeout, signal)
          return true
        }

        // Single round-trip: read current -> set new -> acquire -> restore.
        // MATERIALIZED forces each CTE to materialize before the next scans,
        // which sequences the side-effecting set_config and pg_advisory_xact_lock
        // calls in dependency order. Without MATERIALIZED the optimizer could
        // inline and reorder volatile-function evaluation.
        const query = `
          WITH previous_lock_timeout AS MATERIALIZED (
            SELECT current_setting('lock_timeout') AS value
          ),
          set_lock_timeout AS MATERIALIZED (
            SELECT
              set_config('lock_timeout', $2, true) AS applied_timeout,
              value
            FROM previous_lock_timeout
          ),
          acquire_lock AS MATERIALIZED (
            SELECT
              pg_advisory_xact_lock($1),
              applied_timeout,
              value
            FROM set_lock_timeout
          ),
          restore_lock_timeout AS MATERIALIZED (
            SELECT set_config('lock_timeout', value, true) AS restored_timeout
            FROM acquire_lock
          )
          SELECT true AS locked
          FROM restore_lock_timeout
        `

        try {
          await db.query(
            {
              text: query,
              values: [hash, `${lockTimeout}ms`],
            },
            { signal }
          )
        } catch (e) {
          if (isPgLockTimeoutError(e)) {
            throw ERRORS.LockTimeout(e)
          }

          throw mapPgError(e, 'WaitObjectLock CTE')
        }

        return true
      }

      try {
        await db.query(
          {
            text: 'SELECT pg_advisory_xact_lock($1)',
            values: [hash],
          },
          { signal }
        )
      } catch (e) {
        if (isPgLockTimeoutError(e)) {
          throw ERRORS.LockTimeout(e)
        }

        throw mapPgError(e, 'SELECT pg_advisory_xact_lock($1)')
      }

      return true
    })
  }

  private isMultigresDatabase(): boolean {
    return (this.options.databaseEngine ?? databaseEngine) === 'multigres'
  }

  private async waitObjectLockWithTopLevelLockTimeout(
    db: DatabaseExecutor,
    hash: number,
    lockTimeout: number,
    signal?: AbortSignal
  ): Promise<void> {
    let previousLockTimeout: string

    try {
      const currentLockTimeout = await db.query<{ value: string }>(
        {
          text: `SELECT current_setting('lock_timeout') AS value`,
          values: [],
        },
        { signal }
      )

      previousLockTimeout = currentLockTimeout.rows[0]?.value ?? '0'

      await db.query(
        {
          text: `SELECT set_config('lock_timeout', $1, true)`,
          values: [`${lockTimeout}ms`],
        },
        { signal }
      )
    } catch (e) {
      throw mapPgError(e, 'WaitObjectLock Multigres setup')
    }

    try {
      await db.query(
        {
          text: 'SELECT pg_advisory_xact_lock($1)',
          values: [hash],
        },
        { signal }
      )
    } catch (e) {
      if (isPgLockTimeoutError(e)) {
        throw ERRORS.LockTimeout(e)
      }

      throw mapPgError(e, 'WaitObjectLock Multigres lock')
    }

    try {
      await db.query(
        {
          text: `SELECT set_config('lock_timeout', $1, true)`,
          values: [previousLockTimeout],
        },
        { signal }
      )
    } catch (e) {
      throw mapPgError(e, 'WaitObjectLock Multigres restore')
    }
  }

  async searchObjects(bucketId: string, prefix: string, options: SearchObjectOption) {
    // An un-migrated tenant's deployed storage.search doesn't have the
    // noncurrent_versions/delete_markers parameters at all.
    const hasVersioningStatus = await this.hasMigration('list-objects-with-versions')
    const noncurrentVersions = hasVersioningStatus
      ? (options.noncurrentVersions ?? 'exclude')
      : 'exclude'
    const deleteMarkers = hasVersioningStatus ? (options.deleteMarkers ?? 'exclude') : 'exclude'

    // A single exact key has nothing to fold into folders and no need for
    // storage.search's LIKE/level-based prefix matching - bypass it entirely
    // with a direct query, same approach as listObjectsV2's exactMatch path.
    if (options.exactMatch) {
      return this.runQuery('SearchObjectsExactMatch', async (db, signal) => {
        const conditions = ['bucket_id = $1', 'name COLLATE "C" = $2']
        const values: unknown[] = [bucketId, prefix]

        if (hasVersioningStatus) {
          conditions.push(...buildVersioningConditions(noncurrentVersions, deleteMarkers))
        }

        if (options.search) {
          values.push(`%${escapeLike(options.search)}%`)
          conditions.push(`name ILIKE $${values.length}`)
        }

        const sortColumn = quoteIdentifier(options.sortBy?.column ?? 'name')
        const sortOrder = normalizeSortOrder(options.sortBy?.order)

        values.push(Math.min(options.limit || 100, SEARCH_OBJECTS_MAX_LIMIT))
        const limitPlaceholder = values.length
        values.push(options.offset || 0)
        const offsetPlaceholder = values.length

        const versionTiebreak = hasVersioningStatus
          ? `, archived_at DESC, COALESCE(version, '') ASC`
          : ''

        const result = await this.query<ObjectListEntry>(
          db,
          {
            text: `
              SELECT id, name, metadata, updated_at, created_at, last_accessed_at
                ${hasVersioningStatus ? ', version, archived_at, is_delete_marker, is_versioned' : ''}
              FROM storage.objects
              WHERE ${conditions.join(' AND ')}
              ORDER BY ${sortColumn} ${sortOrder}${versionTiebreak}
              LIMIT $${limitPlaceholder}
              OFFSET $${offsetPlaceholder}
            `,
            values,
          },
          signal
        )

        return result.rows
      })
    }

    return this.runQuery('SearchObjects', async (db, signal) => {
      const sortColumn = options.sortBy?.column ?? 'name'
      const shouldEscapePattern = sortColumn !== 'name'
      const safePrefix = shouldEscapePattern ? escapeLike(prefix) : prefix
      const safeSearch = shouldEscapePattern
        ? escapeLike(options.search || '')
        : options.search || ''

      const values: unknown[] = [
        safePrefix,
        bucketId,
        options.limit || 100,
        (safePrefix + safeSearch).split('/').length,
        options.offset || 0,
        safeSearch,
        sortColumn,
        options.sortBy?.order ?? 'asc',
      ]
      const paramPlaceholders = ['$1', '$2', '$3', '$4', '$5', '$6', '$7', '$8']
      const columns = ['name', 'id', 'updated_at', 'created_at', 'last_accessed_at', 'metadata']
      if (hasVersioningStatus) {
        values.push(noncurrentVersions, deleteMarkers)
        paramPlaceholders.push('$9', '$10')
        columns.push('version', 'archived_at', 'is_delete_marker', 'is_versioned')
      }

      const result = await this.query<ObjectListEntry>(
        db,
        {
          text: `select ${columns.join(',')} from storage.search(${paramPlaceholders.join(',')})`,
          values,
        },
        signal
      )

      return result.rows
    })
  }

  async createMultipartUpload(
    uploadId: string,
    bucketId: string,
    objectName: string,
    version: string,
    signature: string,
    owner?: string,
    userMetadata?: Record<string, string | null>,
    metadata?: Partial<ObjectMetadata>
  ) {
    return this.runQuery('CreateMultipartUpload', async (db, signal) => {
      const data: Record<string, unknown> = {
        id: uploadId,
        bucket_id: bucketId,
        key: objectName,
        version,
        upload_signature: signature,
        owner_id: owner,
        user_metadata: userMetadata,
      }

      if (this.hasMultipartMetadataColumn()) {
        data.metadata = metadata
      }

      const insert = buildInsert(this.normalizeRecordColumns(data))
      const result = await this.query<S3MultipartUpload>(
        db,
        {
          text: `
            INSERT INTO storage.s3_multipart_uploads (${insert.columns})
            VALUES (${insert.placeholders})
            RETURNING *
          `,
          values: insert.values,
        },
        signal
      )

      return result.rows[0]
    })
  }

  async findMultipartUpload(uploadId: string, columns = 'id', options?: { forUpdate?: boolean }) {
    const selectedColumns = selectColumns(columns, this.multipartColumnPolicy)

    const result = await this.runQuery('FindMultipartUpload', async (db, signal) => {
      return this.query<S3MultipartUpload>(
        db,
        {
          text: `
            SELECT ${selectedColumns}
            FROM storage.s3_multipart_uploads
            WHERE id = $1
            LIMIT 1
            ${options?.forUpdate ? 'FOR UPDATE' : ''}
          `,
          values: [uploadId],
        },
        signal
      )
    })

    const multipart = result.rows[0]
    if (!multipart) {
      throw ERRORS.NoSuchUpload(uploadId)
    }

    return multipart
  }

  async updateMultipartUploadProgress(uploadId: string, progress: number, signature: string) {
    return this.runQuery('UpdateMultipartUploadProgress', async (db, signal) => {
      await this.query(
        db,
        {
          text: `
            UPDATE storage.s3_multipart_uploads
            SET
              in_progress_size = $1,
              upload_signature = $2
            WHERE id = $3
          `,
          values: [progress, signature, uploadId],
        },
        signal
      )
    })
  }

  async deleteMultipartUpload(uploadId: string) {
    return this.runQuery('DeleteMultipartUpload', async (db, signal) => {
      await this.query(
        db,
        {
          text: `
            DELETE FROM storage.s3_multipart_uploads
            WHERE id = $1
          `,
          values: [uploadId],
        },
        signal
      )
    })
  }

  async insertUploadPart(part: S3PartUpload) {
    return this.runQuery('InsertUploadPart', async (db, signal) => {
      const insert = buildInsert(part as Record<string, unknown>)
      const result = await this.query<S3PartUpload>(
        db,
        {
          text: `
            INSERT INTO storage.s3_multipart_uploads_parts (${insert.columns})
            VALUES (${insert.placeholders})
            RETURNING *
          `,
          values: insert.values,
        },
        signal
      )

      return result.rows[0]
    })
  }

  async listParts(
    uploadId: string,
    options: { afterPart?: string; maxParts: number }
  ): Promise<S3PartUpload[]> {
    const result = await this.runQuery('ListParts', async (db, signal) => {
      const conditions = ['upload_id = $1']
      const values: unknown[] = [uploadId]

      if (options.afterPart) {
        values.push(options.afterPart)
        conditions.push(`part_number > $${values.length}`)
      }

      values.push(options.maxParts)

      // Uploading a part number again replaces the earlier part, so only the
      // latest row for each part number is listed.
      return this.query<S3PartUpload>(
        db,
        {
          text: `
            SELECT DISTINCT ON (part_number) etag, part_number, size, upload_id, created_at
            FROM storage.s3_multipart_uploads_parts
            WHERE ${conditions.join(' AND ')}
            ORDER BY part_number, created_at DESC
            LIMIT $${values.length}
          `,
          values,
        },
        signal
      )
    })

    return result.rows
  }

  async createS3KeysTempTable(tableName: string): Promise<void> {
    await this.runUnscopedQuery('CreateS3KeysTempTable', async (db, signal) => {
      await this.dropStaleS3KeysScratchTables(db, signal)
      await this.query(
        db,
        `
          CREATE UNLOGGED TABLE IF NOT EXISTS ${quoteS3KeysScratchTable(tableName)} (
            key TEXT COLLATE "C" PRIMARY KEY,
            size BIGINT NOT NULL
          )
        `,
        signal
      )
    })
  }

  private async dropStaleS3KeysScratchTables(
    db: DatabaseExecutor,
    signal?: AbortSignal
  ): Promise<void> {
    const staleBefore = Date.now() - S3_KEYS_SCRATCH_TABLE_MAX_AGE_MS
    const result = await this.query<{ table_name: string }>(
      db,
      {
        text: `
          SELECT c.relname AS table_name
          FROM pg_class c
          INNER JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE n.nspname = $1
            AND c.relkind = 'r'
            AND c.relpersistence = 'u'
            AND c.relname ~ $2
            AND (regexp_match(c.relname, $2))[1]::bigint < $3
        `,
        values: [S3_KEYS_SCRATCH_TABLE_SCHEMA, S3_KEYS_SCRATCH_TABLE_PATTERN, staleBefore],
      },
      signal
    )

    for (const { table_name } of result.rows) {
      await this.query(
        db,
        `DROP TABLE IF EXISTS ${quoteQualifiedIdentifier(
          `${S3_KEYS_SCRATCH_TABLE_SCHEMA}.${table_name}`
        )}`,
        signal
      )
    }
  }

  async dropS3KeysTempTable(tableName: string): Promise<void> {
    await this.runUnscopedQuery('DropS3KeysTempTable', async (db, signal) => {
      await this.query(db, `DROP TABLE IF EXISTS ${quoteS3KeysScratchTable(tableName)}`, signal)
    })
  }

  async listS3KeysFromTempTable(
    tableName: string,
    nextItem: string,
    limit: number
  ): Promise<ScannerS3Key[]> {
    const result = await this.runUnscopedQuery('ListS3KeysFromTempTable', async (db, signal) => {
      const conditions: string[] = []
      const values: unknown[] = []

      if (nextItem) {
        values.push(nextItem)
        conditions.push(`key > $${values.length}`)
      }

      values.push(limit)

      return this.query<ScannerS3Key>(
        db,
        {
          text: `
            SELECT key, size
            FROM ${quoteS3KeysScratchTable(tableName)}
            ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
            ORDER BY key ASC
            LIMIT $${values.length}
          `,
          values,
        },
        signal
      )
    })

    return result.rows
  }

  async findS3KeysInTempTable(
    tableName: string,
    keys: string[]
  ): Promise<Pick<ScannerS3Key, 'key'>[]> {
    if (keys.length === 0) {
      return []
    }

    const result = await this.runUnscopedQuery('FindS3KeysInTempTable', async (db, signal) => {
      return this.query<Pick<ScannerS3Key, 'key'>>(
        db,
        {
          text: `
            SELECT key
            FROM ${quoteS3KeysScratchTable(tableName)}
            WHERE key = ANY($1::text[])
          `,
          values: [keys],
        },
        signal
      )
    })

    return result.rows
  }

  async insertS3KeysIntoTempTable(tableName: string, keys: ScannerS3Key[]): Promise<void> {
    if (keys.length === 0) {
      return
    }

    await this.runUnscopedQuery('InsertS3KeysIntoTempTable', async (db, signal) => {
      const values: (string | number)[] = []
      const placeholders: string[] = []

      for (let index = 0; index < keys.length; index++) {
        const key = keys[index]
        placeholders.push(`($${index * 2 + 1}, $${index * 2 + 2})`)
        values.push(key.key, key.size)
      }

      await this.query(
        db,
        {
          text: `
            INSERT INTO ${quoteS3KeysScratchTable(tableName)} (key, size)
            VALUES ${placeholders.join(', ')}
            ON CONFLICT DO NOTHING
          `,
          values,
        },
        signal
      )
    })
  }

  async healthcheck() {
    if (databaseHealthcheckUnscoped) {
      await this.runUnscopedQuery('Healthcheck', healthcheckProbe, HEALTHCHECK_QUERY_OPTIONS)
    } else {
      await this.runQuery('Healthcheck', healthcheckProbe)
    }
  }

  destroyConnection(): void {
    this.connection.dispose()
  }

  /**
   * Excludes columns selection if a specific migration wasn't run.
   */
  protected normalizeRecordColumns<T extends Record<string, unknown>>(columns: T): T {
    if (this.supportsCustomMetadataColumns) {
      return columns
    }

    const normalizedColumns: Record<string, unknown> = {}
    for (const column in columns) {
      if (column === 'user_metadata' || !Object.hasOwn(columns, column)) {
        continue
      }

      normalizedColumns[column] = columns[column]
    }

    return normalizedColumns as T
  }

  protected hasMultipartMetadataColumn(): boolean {
    return this.supportsMultipartMetadataColumn
  }

  protected async runQuery<T>(
    queryName: string,
    fn: (db: DatabaseExecutor, signal?: AbortSignal) => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    const abortSignal = this.connection.getAbortSignal()
    const recordDuration = this.createDurationRecorder(queryName, startTime, abortSignal)

    let tnx = this.options.tnx
    let differentScopes = false
    let needsNewTransaction = !tnx
    let savepoint: string | undefined
    let savepointEstablished = false

    try {
      differentScopes = Boolean(
        this.options.parentConnection?.role &&
          this.connection.role !== this.options.parentConnection?.role
      )
      needsNewTransaction = !tnx
      const usingSavepoint = !needsNewTransaction && differentScopes

      if (needsNewTransaction) {
        tnx = await this.connection.transaction()
      }

      if (!tnx) {
        throw ERRORS.InternalError(undefined, 'Could not create transaction')
      }

      savepoint = usingSavepoint ? nextSavepointName() : undefined

      if (savepoint) {
        await createSavepoint(tnx, savepoint)
        savepointEstablished = true
      }

      if (needsNewTransaction || differentScopes) {
        await this.connection.setScope(tnx)
      }

      const result = await fn(tnx, abortSignal)

      if (needsNewTransaction) {
        await tnx.commit()
      } else if (savepoint) {
        // Keep scope restoration inside the savepoint. If it fails, rolling back
        // the nested unit is preferable to leaking elevated scope into the parent transaction.
        await this.options.parentConnection?.setScope(tnx)
        await tnx.query(`RELEASE SAVEPOINT ${savepoint}`)
      }

      return result
    } catch (e) {
      if (savepointEstablished && savepoint && tnx && !tnx.isCompleted()) {
        try {
          await rollbackSavepoint(tnx, savepoint)
        } catch (rollbackError) {
          logSchema.warning(logger, '[StoragePgDB] Failed to rollback savepoint', {
            type: 'db',
            tenantId: this.tenantId,
            project: this.tenantId,
            reqId: this.reqId,
            sbReqId: this.sbReqId,
            error: rollbackError,
            metadata: JSON.stringify({
              queryName,
              savepoint,
            }),
          })
        }
      } else if (needsNewTransaction && tnx && !tnx.isCompleted()) {
        try {
          await tnx.rollback()
        } catch (rollbackError) {
          logSchema.warning(logger, '[StoragePgDB] Failed to rollback transaction', {
            type: 'db',
            tenantId: this.tenantId,
            project: this.tenantId,
            reqId: this.reqId,
            sbReqId: this.sbReqId,
            error: rollbackError,
            metadata: JSON.stringify({
              queryName,
              originalError: String(e),
            }),
          })
        }
      }
      throw mapPgErrorWithQueryName(e, queryName)
    } finally {
      try {
        if (!savepoint && differentScopes) {
          await this.restoreParentScopeSafely(queryName)
        }
      } finally {
        recordDuration()
      }
    }
  }

  private async restoreParentScopeSafely(queryName: string): Promise<void> {
    const parentConnection = this.options.parentConnection
    const parentTnx = this.options.parentTnx

    if (!parentConnection || !parentTnx || parentTnx.isCompleted()) {
      return
    }

    try {
      await parentConnection.setScope(parentTnx)
    } catch (error) {
      logSchema.error(logger, '[StoragePgDB] Failed to restore parent transaction scope', {
        type: 'db',
        tenantId: this.tenantId,
        project: this.tenantId,
        reqId: this.reqId,
        sbReqId: this.sbReqId,
        error,
        metadata: JSON.stringify({
          queryName,
          role: this.connection.role,
          parentRole: parentConnection.role,
          errorName: error instanceof Error ? error.name : undefined,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorCode: error instanceof Error ? (error as { code?: unknown }).code : undefined,
        }),
      })
    }
  }

  protected async runUnscopedQuery<T>(
    queryName: string,
    fn: (db: DatabaseExecutor, signal?: AbortSignal) => Promise<T>,
    options?: UnscopedQueryOptions
  ): Promise<T> {
    const startTime = performance.now()
    const requestAbortSignal = this.connection.getAbortSignal()
    const recordDuration = this.createDurationRecorder(queryName, startTime, requestAbortSignal)
    const timeoutMs = normalizeTimeoutMs(options?.timeoutMs)

    let controller: AbortController | undefined
    let timer: NodeJS.Timeout | undefined
    let onRequestAbort: (() => void) | undefined

    if (timeoutMs !== undefined) {
      controller = new AbortController()
      timer = setTimeout(abortFromTimer, timeoutMs, controller)
      timer.unref()

      if (requestAbortSignal?.aborted) {
        controller.abort()
      } else if (requestAbortSignal) {
        const timedController = controller
        onRequestAbort = () => timedController.abort()
        requestAbortSignal.addEventListener('abort', onRequestAbort, { once: true })
      }
    }

    try {
      return await fn(this.connection, controller?.signal ?? requestAbortSignal)
    } catch (e) {
      throw mapPgErrorWithQueryName(e, queryName)
    } finally {
      if (timer !== undefined) {
        clearTimeout(timer)
      }
      if (onRequestAbort) {
        requestAbortSignal?.removeEventListener('abort', onRequestAbort)
      }
      recordDuration()
    }
  }

  protected query<T extends QueryResultRow = QueryResultRow>(
    db: DatabaseExecutor,
    statement: string | DatabaseStatement,
    signal?: AbortSignal
  ) {
    return executeQuery<T>(db, statement, signal)
  }

  private async mutateLifecycleConfiguration(options: {
    bucketId: string
    queryName: string
    unchanged: (locked: LifecycleBucket) => boolean
    write: (unchanged?: LifecycleBucket) => DatabaseStatement
  }): Promise<LifecycleBucket> {
    if (!this.options.tnx) {
      return this.withTransaction((database) => database.mutateLifecycleConfiguration(options))
    }

    const { bucketId } = options
    await assertLifecycleSchemaReady(this, bucketId)

    const visible = await this.findBucketById(bucketId, 'id,type')
    assertStandardLifecycleBucket(visible)

    const serviceDatabase = this.asSuperUser()
    const locked = (await serviceDatabase.findBucketById(bucketId, LIFECYCLE_BUCKET_COLUMNS, {
      forUpdate: true,
    })) as LifecycleBucket
    const unchanged = options.unchanged(locked)
    // Equivalent PUTs, including reorders, retain the stored order and generation. Probe the exact
    // row we would persist, including the same generated UUID for changed PUTs.
    const statement = options.write(unchanged ? locked : undefined)
    await this.testLifecycleWritePermission(statement)

    if (unchanged) {
      return locked
    }

    const result = await serviceDatabase.runQuery(options.queryName, async (db, signal) =>
      serviceDatabase.query<LifecycleBucket>(db, statement, signal)
    )

    const bucket = result.rows[0]
    if (!bucket) throw ERRORS.NoSuchBucket(bucketId)
    return bucket
  }

  private createDurationRecorder(
    queryName: string,
    startTime: number,
    abortSignal?: AbortSignal
  ): () => void {
    const requestAbortedBeforeStart = Boolean(abortSignal?.aborted)

    return () => {
      const duration = (performance.now() - startTime) / 1000
      // This intentionally reads the signal after the query work settles. The
      // attributes describe request abort observation, not proof that PostgreSQL
      // cancelled this specific statement.
      const requestAbortedAtRecord = Boolean(abortSignal?.aborted)

      dbQueryPerformance.record(duration, {
        name: queryName,
        requestAborted: requestAbortedBeforeStart || requestAbortedAtRecord,
        requestAbortedBeforeStart,
        requestAbortedAfterStart: !requestAbortedBeforeStart && requestAbortedAtRecord,
      })
    }
  }

  private async testLifecycleWritePermission(statement: DatabaseStatement): Promise<void> {
    try {
      await this.testPermission(async (database) => {
        await database.runQuery('TestLifecycleWritePermission', async (db, signal) => {
          const result = await database.query(db, statement, signal)
          if (result.rowCount !== 1)
            throw ERRORS.AccessDenied('Bucket lifecycle update not permitted')
        })
      })
    } catch (error) {
      const cause = error instanceof StorageBackendError ? error.originalError : error
      // This AFTER-trigger rejection proves caller RLS passed. testPermission
      // has rolled back the probe; every other error must still deny the write.
      if (
        !(cause instanceof DatabaseError) ||
        cause.code !== 'PST01' ||
        cause.schema !== 'storage' ||
        cause.table !== 'buckets' ||
        cause.constraint !== 'protect_bucket_control_update_role'
      ) {
        throw error
      }
    }
  }
}

function normalizeTimeoutMs(timeoutMs: number | undefined): number | undefined {
  if (timeoutMs === undefined || !Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return undefined
  }

  return timeoutMs
}

// Static setTimeout callback taking the controller as an argument
// so arming the deadline allocates no closure.
function abortFromTimer(controller: AbortController): void {
  controller.abort()
}

function normalizeSortOrder(sortOrder?: string): 'ASC' | 'DESC' {
  return sortOrder?.toLowerCase() === 'desc' ? 'DESC' : 'ASC'
}

function buildInsert(data: Record<string, unknown>): {
  columns: string
  placeholders: string
  values: unknown[]
} {
  const columns: string[] = []
  const placeholders: string[] = []
  const values: unknown[] = []

  for (const column in data) {
    if (!Object.prototype.hasOwnProperty.call(data, column)) {
      continue
    }

    const value = data[column]
    if (value === undefined) {
      continue
    }

    values.push(value)
    columns.push(quoteIdentifier(column))
    placeholders.push(`$${values.length}`)
  }

  if (values.length === 0) {
    throw ERRORS.NoContentProvided()
  }

  return {
    columns: columns.join(', '),
    placeholders: placeholders.join(', '),
    values,
  }
}

function buildUpdate(data: Record<string, unknown>): {
  setClause: string
  values: unknown[]
} {
  const setClauses: string[] = []
  const values: unknown[] = []

  for (const column in data) {
    if (!Object.prototype.hasOwnProperty.call(data, column)) {
      continue
    }

    const value = data[column]
    if (value === undefined) {
      continue
    }

    values.push(value)
    setClauses.push(`${quoteIdentifier(column)} = $${values.length}`)
  }

  if (values.length === 0) {
    throw ERRORS.NoContentProvided()
  }

  return {
    setClause: setClauses.join(', '),
    values,
  }
}

function buildTupleValues(values: { name: string; version: string }[]): {
  placeholders: string
  values: string[]
} {
  const placeholders: string[] = []
  const queryValues: string[] = []

  for (let index = 0; index < values.length; index++) {
    const { name, version } = values[index]
    placeholders.push(`($${index * 2 + 2}, $${index * 2 + 3})`)
    queryValues.push(name, version)
  }

  return {
    placeholders: placeholders.join(', '),
    values: queryValues,
  }
}

function assertStandardLifecycleBucket(bucket: Bucket | LifecycleBucket): void {
  if (bucket.type !== 'STANDARD') {
    throw ERRORS.LifecycleRequiresStandardBucket()
  }
}

function lockClause(filters?: FindBucketFilters): string {
  if (filters?.forUpdate) {
    return 'FOR UPDATE'
  }

  if (filters?.forShare) {
    return 'FOR SHARE'
  }

  return ''
}

function objectLockClause(filters?: FindObjectFilters): string {
  const lock = filters?.forUpdate
    ? 'FOR UPDATE'
    : filters?.forShare
      ? 'FOR SHARE'
      : filters?.forKeyShare
        ? 'FOR KEY SHARE'
        : ''

  if (!lock) {
    return ''
  }

  return filters?.noWait ? `${lock} NOWAIT` : lock
}

function mapPgError(error: unknown, context?: string | PgErrorContext): unknown {
  if (error instanceof DatabaseError) {
    return DBError.fromDBError(error, context)
  }

  return error
}

function mapPgErrorWithQueryName(error: unknown, queryName: string): unknown {
  return ensurePgErrorQueryName(mapPgError(error), queryName)
}

function ensurePgErrorQueryName(error: unknown, queryName: string): unknown {
  if (!(error instanceof StorageBackendError) || !(error.originalError instanceof DatabaseError)) {
    return error
  }

  const metadata = error.metadata
  if (!metadata) {
    error.metadata = { queryName }
  } else if (metadata.queryName === undefined) {
    metadata.queryName = queryName
  }

  return error
}

function isPgLockTimeoutError(error: unknown): error is DatabaseError {
  return error instanceof DatabaseError && error.code === '55P03'
}

function nextSavepointName(): string {
  return quoteIdentifier(`storage_pg_query_${randomUUID().replace(/-/g, '_')}`)
}

async function createSavepoint(tnx: DatabaseTransaction, savepoint: string): Promise<void> {
  const query = `SAVEPOINT ${savepoint}`

  try {
    await tnx.query(query)
  } catch (error) {
    throw mapPgTransactionAbortedError(error, query)
  }
}

async function rollbackSavepoint(tnx: DatabaseTransaction, savepoint: string): Promise<void> {
  await tnx.query(`ROLLBACK TO SAVEPOINT ${savepoint}`)
  await tnx.query(`RELEASE SAVEPOINT ${savepoint}`)
}
