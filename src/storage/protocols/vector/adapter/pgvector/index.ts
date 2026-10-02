import { createHash, randomUUID } from 'node:crypto'
import {
  CreateIndexCommandInput,
  CreateIndexCommandOutput,
  DeleteIndexCommandInput,
  DeleteIndexCommandOutput,
  DeleteVectorsInput,
  DeleteVectorsOutput,
  DistanceMetric,
  GetVectorsCommandInput,
  GetVectorsCommandOutput,
  ListVectorsInput,
  ListVectorsOutput,
  PutVectorsInput,
  PutVectorsOutput,
  QueryVectorsInput,
  QueryVectorsOutput,
} from '@aws-sdk/client-s3vectors'
import {
  type DatabaseExecutor,
  type DatabaseTransaction,
  type DatabaseTransactionalExecutor,
  isDatabaseTransaction,
  PgTenantConnection,
  quoteIdentifier,
} from '@internal/database'
import { ERRORS } from '@internal/errors'
import type { DocumentType } from '@smithy/types'
import {
  MAX_DELETE_VECTOR_KEYS,
  MAX_GET_VECTOR_KEYS,
  MAX_LIST_RESULTS,
  MAX_PGVECTOR_QUERY_TOP_K,
  MAX_SEGMENT_COUNT,
  validatePutVectors,
  validateVectorKeys,
} from '../../limits'
import { paginateNPlusOne } from '../../pagination'
import { VectorStore } from '../s3-vector'
import { handlePgVectorError } from './errors'
import { S3VectorFilter, translateFilter } from './filter'
import { metricCache } from './metric-cache'

type PgVectorTableCapabilityKind = 'bridged-hnsw' | 'standard' | 'unknown'
interface PgVectorTableCapability {
  kind: PgVectorTableCapabilityKind
  requiresManualUpsert: boolean
  requiresExactQueryScan: boolean
}
const STANDARD_TABLE_CAPABILITY: PgVectorTableCapability = {
  kind: 'standard',
  requiresManualUpsert: false,
  requiresExactQueryScan: false,
}
const BRIDGED_HNSW_TABLE_CAPABILITY: PgVectorTableCapability = {
  kind: 'bridged-hnsw',
  requiresManualUpsert: true,
  requiresExactQueryScan: true,
}
const UNKNOWN_TABLE_CAPABILITY: PgVectorTableCapability = {
  kind: 'unknown',
  requiresManualUpsert: false,
  requiresExactQueryScan: true,
}
const tableCapabilityCaches = new WeakMap<object, Map<string, Promise<PgVectorTableCapability>>>()
const metricLookupCaches = new WeakMap<object, Map<string, Promise<DistanceMetric>>>()
const metricCacheScopeIds = new WeakMap<object, number>()
let nextMetricCacheScopeId = 1

function metricLookupCache(db: object): Map<string, Promise<DistanceMetric>> {
  let cache = metricLookupCaches.get(db)
  if (!cache) {
    cache = new Map()
    metricLookupCaches.set(db, cache)
  }
  return cache
}

function metricCacheScopeId(db: object): number {
  let id = metricCacheScopeIds.get(db)
  if (id === undefined) {
    id = nextMetricCacheScopeId++
    metricCacheScopeIds.set(db, id)
  }
  return id
}

function metricCacheKey(db: object, bucket: string, index: string): string {
  return `${metricCacheScopeId(db)}\x00${bucket}\x00${index}`
}

function metricLookupKey(bucket: string, index: string): string {
  return `${bucket}\x00${index}`
}

const SCHEMA = 'storage_vectors'
const MAX_DIMENSIONS = 4_000
const DEFAULT_HNSW_EF_SEARCH = 40

// Manual OrioleDB upserts can still deadlock under concurrent writers.
const MANUAL_UPSERT_MAX_ATTEMPTS = 3

function validatePositiveInt(name: string, value: number, max: number): number {
  if (!Number.isInteger(value) || value < 1 || value > max) {
    throw ERRORS.InvalidParameter(name, {
      message: `${name} must be an integer in [1, ${max}], got: ${value}`,
    })
  }
  return value
}

function isRetryableWriteConflict(error: unknown): boolean {
  const code = (error as { code?: unknown })?.code
  return code === '40P01' || code === '40001'
}

function isBridgedHnswUpsertError(error: unknown): boolean {
  const parts = [
    (error as { message?: unknown })?.message,
    (error as { detail?: unknown })?.detail,
  ].filter((part): part is string => typeof part === 'string')

  return parts.some((part) => part.includes('unexpected self-updated tuple'))
}

function validateListSegment(input: ListVectorsInput):
  | {
      segmentCount: number
      segmentIndex: number
    }
  | undefined {
  const hasSegmentCount = input.segmentCount !== undefined
  const hasSegmentIndex = input.segmentIndex !== undefined

  if (hasSegmentCount !== hasSegmentIndex) {
    throw ERRORS.InvalidParameter('segmentCount/segmentIndex', {
      message: 'segmentCount and segmentIndex must be provided together',
    })
  }

  if (!hasSegmentCount) {
    return undefined
  }

  const segmentCount = validatePositiveInt('segmentCount', input.segmentCount!, MAX_SEGMENT_COUNT)
  const segmentIndex = input.segmentIndex!
  if (!Number.isInteger(segmentIndex) || segmentIndex < 0 || segmentIndex >= segmentCount) {
    throw ERRORS.InvalidParameter('segmentIndex', {
      message: `segmentIndex must be an integer in [0, ${segmentCount - 1}], got: ${segmentIndex}`,
    })
  }

  return { segmentCount, segmentIndex }
}

function tableCapabilityCache(db: object): Map<string, Promise<PgVectorTableCapability>> {
  let cache = tableCapabilityCaches.get(db)
  if (!cache) {
    cache = new Map()
    tableCapabilityCaches.set(db, cache)
  }
  return cache
}

function tableCapabilityCacheKey(db: DatabaseExecutor): object {
  return databaseCacheScope(db)
}

function databaseCacheScope(db: DatabaseExecutor): object {
  return (db as DatabaseExecutor & { getCacheScope?: () => object }).getCacheScope?.() ?? db
}

function capabilityForAccessMethod(accessMethod: unknown): PgVectorTableCapability {
  if (typeof accessMethod !== 'string') {
    return UNKNOWN_TABLE_CAPABILITY
  }

  return accessMethod === 'orioledb' ? BRIDGED_HNSW_TABLE_CAPABILITY : STANDARD_TABLE_CAPABILITY
}

function forgetTableCapability(db: object, table: string): void {
  tableCapabilityCaches.get(db)?.delete(table)
}

async function resolveTableCapability(
  db: DatabaseExecutor,
  table: string,
  cacheKey: object = tableCapabilityCacheKey(db)
): Promise<PgVectorTableCapability> {
  const cache = tableCapabilityCache(cacheKey)
  let capability = cache.get(table)
  if (capability) {
    return capability
  }

  const capabilityProbe: Promise<PgVectorTableCapability> = db
    .query<{ amname: string | null }>({
      text: `
        SELECT am.amname
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        JOIN pg_am am ON am.oid = c.relam
        WHERE n.nspname = $1
          AND c.relname = $2
        LIMIT 1
      `,
      values: [SCHEMA, table],
    })
    .then((result: { rows?: Array<Record<string, unknown>> }) => {
      if (result.rows?.[0]?.amname === undefined && cache.get(table) === capabilityProbe) {
        cache.delete(table)
      }
      return capabilityForAccessMethod(result.rows?.[0]?.amname)
    })
    .catch(() => {
      // Do not cache probe failures. Query paths treat unknown tables as
      // exact-scan for correctness, and the next request can retry.
      if (cache.get(table) === capabilityProbe) {
        cache.delete(table)
      }
      return UNKNOWN_TABLE_CAPABILITY
    })
  cache.set(table, capabilityProbe)

  return capabilityProbe
}

export type PgExecutorResolver =
  | DatabaseTransactionalExecutor
  | DatabaseTransaction
  | {
      resolve: () => DatabaseTransactionalExecutor | DatabaseTransaction
      root?: () => DatabaseTransactionalExecutor | DatabaseTransaction
    }

function isPgExecutorProvider(r: PgExecutorResolver): r is {
  resolve: () => DatabaseTransactionalExecutor | DatabaseTransaction
  root?: () => DatabaseTransactionalExecutor | DatabaseTransaction
} {
  return 'resolve' in r && typeof r.resolve === 'function'
}

function resolvePgExecutor(
  r: PgExecutorResolver
): DatabaseTransactionalExecutor | DatabaseTransaction {
  return isPgExecutorProvider(r) ? r.resolve() : r
}

function resolveRootPgExecutor(
  r: PgExecutorResolver
): DatabaseTransactionalExecutor | DatabaseTransaction {
  return isPgExecutorProvider(r) ? (r.root?.() ?? r.resolve()) : r
}

function hasRootPgResolver(r: PgExecutorResolver): boolean {
  return isPgExecutorProvider(r) && typeof r.root === 'function'
}

async function withPgTransaction<T>(
  db: DatabaseTransactionalExecutor | DatabaseTransaction,
  fn: (trx: DatabaseTransaction) => Promise<T>
): Promise<T> {
  if (isDatabaseTransaction(db)) {
    const savepoint = nextSavepointName()
    await db.query(`SAVEPOINT ${savepoint}`)
    try {
      const result = await fn(db)
      await db.query(`RELEASE SAVEPOINT ${savepoint}`)
      return result
    } catch (error) {
      await db.query(`ROLLBACK TO SAVEPOINT ${savepoint}`).catch(() => undefined)
      await db.query(`RELEASE SAVEPOINT ${savepoint}`).catch(() => undefined)
      throw error
    }
  }

  const trx = await db.beginTransaction()
  try {
    const result = await fn(trx)
    await trx.commit()
    return result
  } catch (error) {
    await trx.rollback().catch(() => undefined)
    throw error
  }
}

function tableName(vectorBucketName: string, indexName: string): string {
  // Combined logical key may exceed Postgres' 63-char identifier limit, so we
  // hash. SHA-256 truncated to 24 hex chars keeps the table name well within
  // the limit and unique enough for any reasonable dev dataset.
  const hash = createHash('sha256')
    .update(`${vectorBucketName}\x00${indexName}`)
    .digest('hex')
    .slice(0, 24)
  return `vector_${hash}`
}

function qualifiedTable(vectorBucketName: string, indexName: string): string {
  return qualifiedTableName(tableName(vectorBucketName, indexName))
}

function qualifiedTableName(table: string): string {
  return `${quoteIdentifier(SCHEMA)}.${quoteIdentifier(table)}`
}

function nextSavepointName(): string {
  return quoteIdentifier(`pgvector_store_${randomUUID().replace(/-/g, '_')}`)
}

function offsetPlaceholders(sql: string, offset: number): string {
  if (offset === 0) {
    return sql
  }

  return sql.replace(/\$(\d+)/g, (_, index) => `$${Number(index) + offset}`)
}

interface OpClassChoice {
  opClass: 'halfvec_cosine_ops' | 'halfvec_l2_ops'
  distanceOp: '<=>' | '<->'
  metric: DistanceMetric
}

function distanceChoice(metric: string | undefined): OpClassChoice {
  switch (metric) {
    case 'cosine':
      return { opClass: 'halfvec_cosine_ops', distanceOp: '<=>', metric: 'cosine' }
    case 'euclidean':
      return { opClass: 'halfvec_l2_ops', distanceOp: '<->', metric: 'euclidean' }
    default:
      throw ERRORS.InvalidParameter('distanceMetric', {
        message: `Unsupported distance metric for pgvector backend: ${metric}`,
      })
  }
}

function toVectorLiteral(values: number[]): string {
  return `[${values.join(',')}]`
}

type PgVectorMetadataPrimitive = string | boolean | number
type PgVectorMetadata = Record<string, PgVectorMetadataPrimitive | PgVectorMetadataPrimitive[]>

function validateMetadata(metadata: DocumentType | undefined, vectorKey: string): PgVectorMetadata {
  if (metadata === undefined) {
    return {}
  }

  const invalidMetadata = (message: string) =>
    ERRORS.InvalidParameter('vectors.metadata', {
      message: `Invalid metadata for vector "${vectorKey}": ${message}`,
    })

  if (metadata === null || Array.isArray(metadata) || typeof metadata !== 'object') {
    throw invalidMetadata('metadata must be an object')
  }

  const validatePrimitive = (value: unknown, fieldName: string): PgVectorMetadataPrimitive => {
    if (typeof value === 'string' || typeof value === 'boolean') {
      return value
    }

    if (typeof value === 'number' && Number.isFinite(value)) {
      return value
    }

    throw invalidMetadata(
      `metadata field "${fieldName}" must be a string, boolean, or finite number`
    )
  }

  const validated: PgVectorMetadata = {}
  for (const [key, value] of Object.entries(metadata)) {
    if (Array.isArray(value)) {
      validated[key] = value.map((item, index) => validatePrimitive(item, `${key}[${index}]`))
      continue
    }

    validated[key] = validatePrimitive(value, key)
  }

  return validated
}

export class PgVectorStore implements VectorStore {
  readonly maxDimensions = MAX_DIMENSIONS
  readonly transactionalIndexOperations: boolean

  constructor(private readonly executor: PgExecutorResolver) {
    this.transactionalIndexOperations = hasRootPgResolver(executor)
  }

  private db(): DatabaseTransactionalExecutor | DatabaseTransaction {
    const db = resolvePgExecutor(this.executor)
    return db instanceof PgTenantConnection ? db.acquireExecutor() : db
  }

  private withTenantTransaction<T>(
    fn: (
      db: DatabaseTransactionalExecutor | DatabaseTransaction,
      ownsTransaction: boolean
    ) => Promise<T>
  ): Promise<T> {
    const db = resolvePgExecutor(this.executor)
    return db instanceof PgTenantConnection
      ? withPgTransaction(db, (trx) => fn(trx, true))
      : fn(db, false)
  }

  private rootDb(): DatabaseTransactionalExecutor | DatabaseTransaction {
    return resolveRootPgExecutor(this.executor)
  }

  private clearMetricLookup(
    db: DatabaseTransactionalExecutor | DatabaseTransaction,
    bucket: string,
    index: string
  ): string {
    const scope = databaseCacheScope(db)
    metricLookupCache(scope).delete(metricLookupKey(bucket, index))
    return metricCacheKey(scope, bucket, index)
  }

  async createVectorIndex(command: CreateIndexCommandInput): Promise<CreateIndexCommandOutput> {
    if (!command.indexName || !command.vectorBucketName) {
      throw ERRORS.MissingParameter('indexName/vectorBucketName')
    }
    if (command.dataType !== 'float32') {
      throw ERRORS.InvalidParameter('dataType', {
        message: `Unsupported data type for pgvector backend: ${command.dataType}`,
      })
    }
    const dimension = command.dimension
    // pgvector's HNSW halfvec operator classes (halfvec_cosine_ops,
    // halfvec_l2_ops) cap out at 4000 dimensions, which covers the most
    // common production embedding models (incl. OpenAI text-embedding-3-large
    // at 3072) and S3Vectors' own 4096 cap after trivial truncation. We
    // validate at create-index time so we fail loudly with a clear error
    // rather than later at INDEX-build time with an opaque pgvector error.
    if (!dimension || !Number.isInteger(dimension) || dimension < 1 || dimension > MAX_DIMENSIONS) {
      throw ERRORS.InvalidParameter('dimension', {
        message: `Invalid dimension for pgvector HNSW: ${dimension} (must be 1..${MAX_DIMENSIONS})`,
      })
    }

    const choice = distanceChoice(command.distanceMetric)
    const table = tableName(command.vectorBucketName, command.indexName)

    return handlePgVectorError(
      async () => {
        const db = resolvePgExecutor(this.executor)
        // Wrap DDL in a transaction so a failed CREATE INDEX (missing
        // opclass, permissions, transient error) rolls back the CREATE TABLE.
        // Otherwise the orphan table would block retries with "already exists".
        const transactionDb = await withPgTransaction(db, async (trx) => {
          // Postgres doesn't allow parameter binding inside type modifiers
          // like `halfvec(N)` — N must be a literal at parse time. We've
          // validated `dimension` is an integer in [1, 4_000] above, so
          // inlining is safe. halfvec stores each dimension as a 2-byte
          // float16; recall loss vs float32 is typically <0.5% on normalized
          // embeddings and index size/memory drop ~50%.
          await trx.query(`
            CREATE TABLE ${qualifiedTableName(table)}
            (
              key text PRIMARY KEY,
              embedding halfvec(${dimension}) NOT NULL,
              metadata jsonb NOT NULL DEFAULT '{}'::jsonb
            )
          `)
          await trx.query(`
            CREATE INDEX ${quoteIdentifier(`${table}_hnsw`)}
            ON ${qualifiedTableName(table)}
            USING hnsw (embedding ${choice.opClass})
          `)
          return trx
        })
        forgetTableCapability(tableCapabilityCacheKey(transactionDb), table)
        const rootDb = this.rootDb()
        if (rootDb !== db) {
          forgetTableCapability(tableCapabilityCacheKey(rootDb), table)
        }
        // Prime the metric cache so subsequent queryVectors don't need a
        // round-trip lookup to pick the right distance operator. The two
        // names are validated non-empty at the top of this method.
        const bucket = command.vectorBucketName as string
        const index = command.indexName as string
        const cacheKey = this.clearMetricLookup(transactionDb, bucket, index)
        metricCache.set(cacheKey, choice.metric)
        return { $metadata: {} } as CreateIndexCommandOutput
      },
      { type: 'vector-index', name: command.indexName }
    )
  }

  async deleteVectorIndex(param: DeleteIndexCommandInput): Promise<DeleteIndexCommandOutput> {
    const bucket = param.vectorBucketName!
    const index = param.indexName!
    const table = tableName(bucket, index)
    return handlePgVectorError(
      async () => {
        const db = this.db()
        await db.query(`DROP TABLE IF EXISTS ${qualifiedTableName(table)}`)
        const capabilityScope = tableCapabilityCacheKey(db)
        const rootCapabilityScope = tableCapabilityCacheKey(this.rootDb())
        forgetTableCapability(capabilityScope, table)
        if (rootCapabilityScope !== capabilityScope) {
          forgetTableCapability(rootCapabilityScope, table)
        }
        const cacheKey = this.clearMetricLookup(db, bucket, index)
        metricCache.delete(cacheKey)
        return { $metadata: {} } as DeleteIndexCommandOutput
      },
      { type: 'vector-index', name: index }
    )
  }

  async putVectors(command: PutVectorsInput): Promise<PutVectorsOutput> {
    const bucket = command.vectorBucketName!
    const index = command.indexName!
    const vectors = validatePutVectors(command.vectors)

    return handlePgVectorError(
      async () => {
        const db = this.db()

        const rows = vectors.map((v) => {
          if (!v.key) throw ERRORS.MissingParameter('vector.key')
          if (!v.data || !v.data.float32) throw ERRORS.MissingParameter('vector.data.float32')
          return {
            key: v.key,
            embedding: toVectorLiteral(v.data.float32 as number[]),
            // Pass the object directly. `JSON.stringify(rows)` below serializes
            // it as a JSON object so jsonb_to_recordset parses `metadata` as a
            // JSONB object (not a JSONB string). Otherwise `metadata->>'key'`
            // returns NULL because the column would hold a quoted string.
            metadata: validateMetadata(v.metadata, v.key),
          }
        })
        const serializedRows = JSON.stringify([...rows].sort((a, b) => a.key.localeCompare(b.key)))
        const table = tableName(bucket, index)
        const qualified = qualifiedTableName(table)
        const capabilityCacheKey = tableCapabilityCacheKey(db)
        const capability = await resolveTableCapability(db, table, capabilityCacheKey)

        if (capability.requiresManualUpsert) {
          await this.withTenantTransaction((transactionDb) =>
            this.putVectorsManually(transactionDb, qualified, serializedRows)
          )
          return {} as PutVectorsOutput
        }

        try {
          await db.query({
            text: `
              INSERT INTO ${qualified} (key, embedding, metadata)
              SELECT key, embedding::halfvec, metadata
              FROM jsonb_to_recordset($1::jsonb)
                AS x(key text, embedding text, metadata jsonb)
              ON CONFLICT (key) DO UPDATE
                SET embedding = EXCLUDED.embedding,
                    metadata  = EXCLUDED.metadata
            `,
            values: [serializedRows],
          })
        } catch (e) {
          if (!isBridgedHnswUpsertError(e)) {
            throw e
          }

          forgetTableCapability(capabilityCacheKey, table)
          const refreshedCapability = await resolveTableCapability(db, table, capabilityCacheKey)
          if (!refreshedCapability.requiresManualUpsert) {
            throw e
          }

          await this.withTenantTransaction((transactionDb) =>
            this.putVectorsManually(transactionDb, qualified, serializedRows)
          )
        }

        return {} as PutVectorsOutput
      },
      { type: 'vectors', name: index }
    )
  }

  private async putVectorsManually(
    db: DatabaseTransactionalExecutor | DatabaseTransaction,
    table: string,
    serializedRows: string
  ): Promise<void> {
    // OrioleDB supports pgvector HNSW indexes through index bridging, but its
    // bridged HNSW path can reject ON CONFLICT DO UPDATE with "unexpected
    // self-updated tuple". Plain UPDATE, INSERT, and DO NOTHING work, so this
    // fallback preserves upsert semantics without that conflict action.
    for (let attempt = 1; attempt <= MANUAL_UPSERT_MAX_ATTEMPTS; attempt += 1) {
      try {
        await withPgTransaction(db, async (trx) => {
          await trx.query({
            text: `
              WITH input AS (
                SELECT key, embedding::halfvec AS embedding, metadata
                FROM jsonb_to_recordset($1::jsonb)
                  AS x(key text, embedding text, metadata jsonb)
              )
              UPDATE ${table} AS target
                 SET embedding = input.embedding,
                     metadata = input.metadata
                FROM input
               WHERE target.key = input.key
            `,
            values: [serializedRows],
          })

          await trx.query({
            text: `
              INSERT INTO ${table} (key, embedding, metadata)
              SELECT key, embedding::halfvec, metadata
                FROM jsonb_to_recordset($1::jsonb)
                  AS x(key text, embedding text, metadata jsonb)
              ON CONFLICT (key) DO NOTHING
            `,
            values: [serializedRows],
          })

          // Close the READ COMMITTED race where two writers both miss the first
          // UPDATE for a new key, one INSERT wins, and the other INSERT does
          // nothing. The final UPDATE applies the later writer's payload without
          // using ON CONFLICT DO UPDATE, which OrioleDB bridged HNSW can reject.
          await trx.query({
            text: `
              WITH input AS (
                SELECT key, embedding::halfvec AS embedding, metadata
                FROM jsonb_to_recordset($1::jsonb)
                  AS x(key text, embedding text, metadata jsonb)
              )
              UPDATE ${table} AS target
                 SET embedding = input.embedding,
                     metadata = input.metadata
                FROM input
               WHERE target.key = input.key
            `,
            values: [serializedRows],
          })
        })
        return
      } catch (error) {
        if (attempt === MANUAL_UPSERT_MAX_ATTEMPTS || !isRetryableWriteConflict(error)) {
          throw error
        }
      }
    }
  }

  private async queryVectorsRaw(
    db: DatabaseTransactionalExecutor | DatabaseTransaction,
    table: string,
    sql: string,
    params: unknown[],
    topK: number,
    ownsTransaction = false
  ): Promise<{ rows: unknown[] }> {
    const capability = await resolveTableCapability(db, table, tableCapabilityCacheKey(db))

    const runQuery = async (trx: DatabaseTransaction): Promise<{ rows: unknown[] }> => {
      if (!capability.requiresExactQueryScan) {
        await trx.query({
          text: `SELECT set_config('hnsw.ef_search', $1, true)`,
          values: [String(Math.max(topK, DEFAULT_HNSW_EF_SEARCH))],
        })
        return trx.query({ text: sql, values: params })
      }

      // The same OrioleDB bridged HNSW path that rejects ON CONFLICT DO UPDATE
      // can also miss rows inserted after the index was created. Use exact scan
      // semantics for pools where we have observed that path.
      await trx.query(`
        SELECT set_config('enable_indexscan', 'off', true),
               set_config('enable_bitmapscan', 'off', true)
      `)
      return trx.query({ text: sql, values: params })
    }

    return ownsTransaction && isDatabaseTransaction(db)
      ? runQuery(db)
      : withPgTransaction(db, runQuery)
  }

  async getVectors(input: GetVectorsCommandInput): Promise<GetVectorsCommandOutput> {
    const bucket = input.vectorBucketName!
    const index = input.indexName!
    const keys = validateVectorKeys(input.keys, MAX_GET_VECTOR_KEYS)

    const wantData = input.returnData === true
    const wantMeta = input.returnMetadata === true

    return handlePgVectorError(
      async () => {
        const cols = ['key']
        if (wantData) cols.push('embedding::text AS embedding')
        if (wantMeta) cols.push('metadata')
        const sql = `SELECT ${cols.join(', ')} FROM ${qualifiedTable(bucket, index)} WHERE key = ANY($1::text[])`
        const result = await this.db().query({ text: sql, values: [keys] })
        const rows = result.rows as Array<{
          key: string
          embedding?: string
          metadata?: DocumentType
        }>
        return {
          vectors: rows.map((r) => ({
            key: r.key,
            data:
              wantData && r.embedding ? { float32: parseVectorLiteral(r.embedding) } : undefined,
            metadata: wantMeta ? (r.metadata ?? {}) : undefined,
          })),
        } as GetVectorsCommandOutput
      },
      { type: 'vectors', name: index }
    )
  }

  async deleteVectors(input: DeleteVectorsInput): Promise<DeleteVectorsOutput> {
    const bucket = input.vectorBucketName!
    const index = input.indexName!
    const keys = validateVectorKeys(input.keys, MAX_DELETE_VECTOR_KEYS)

    return handlePgVectorError(
      async () => {
        await this.db().query({
          text: `DELETE FROM ${qualifiedTable(bucket, index)} WHERE key = ANY($1::text[])`,
          values: [keys],
        })
        return {} as DeleteVectorsOutput
      },
      { type: 'vectors', name: index }
    )
  }

  async queryVectors(input: QueryVectorsInput): Promise<QueryVectorsOutput> {
    const bucket = input.vectorBucketName!
    const index = input.indexName!
    if (input.nextToken !== undefined) {
      throw ERRORS.InvalidParameter('nextToken', {
        message: 'QueryVectors pagination is not supported by the pgvector backend',
      })
    }

    const queryVector = input.queryVector
    if (!queryVector || !queryVector.float32) {
      throw ERRORS.MissingParameter('queryVector.float32')
    }

    const wantMeta = input.returnMetadata === true
    const wantDistance = input.returnDistance === true
    const topK = validatePositiveInt('topK', input.topK ?? 10, MAX_PGVECTOR_QUERY_TOP_K)

    return handlePgVectorError(
      () =>
        this.withTenantTransaction(async (db, ownsTransaction) => {
          // The operator chosen for the distance expression AND for ORDER BY must
          // match the HNSW index's operator class — otherwise the index isn't
          // used and the returned distance is in the wrong metric. Resolve the
          // metric (cached after createVectorIndex) before assembling the query.
          const metric = await this.getOrLookupMetric(db, bucket, index)
          const distanceOp: '<=>' | '<->' = metric === 'euclidean' ? '<->' : '<=>'

          const cols: string[] = ['key']
          if (wantDistance) cols.push(`embedding ${distanceOp} $1::halfvec AS distance`)
          if (wantMeta) cols.push('metadata')

          const params: unknown[] = []
          if (wantDistance) params.push(toVectorLiteral(queryVector.float32 as number[]))

          let whereClause = ''
          if (input.filter) {
            const translated = translateFilter(input.filter as unknown as S3VectorFilter)
            whereClause = ' WHERE ' + offsetPlaceholders(translated.sql, params.length)
            params.push(...translated.params)
          }

          params.push(toVectorLiteral(queryVector.float32 as number[]))
          params.push(topK)

          const table = tableName(bucket, index)
          const orderVectorParam = params.length - 1
          const limitParam = params.length
          const sql = `SELECT ${cols.join(', ')}
                     FROM ${qualifiedTableName(table)}${whereClause}
                     ORDER BY embedding ${distanceOp} $${orderVectorParam}::halfvec ASC
                     LIMIT $${limitParam}`
          const result = await this.queryVectorsRaw(db, table, sql, params, topK, ownsTransaction)
          const rows = result.rows as Array<{
            key: string
            distance?: number
            metadata?: DocumentType
          }>

          return {
            vectors: rows.map((r) => ({
              key: r.key,
              distance: wantDistance ? r.distance : undefined,
              metadata: wantMeta ? (r.metadata ?? {}) : undefined,
            })),
            distanceMetric: metric,
          } as QueryVectorsOutput
        }),
      { type: 'vector-index', name: index }
    )
  }

  private async getOrLookupMetric(
    db: DatabaseTransactionalExecutor | DatabaseTransaction,
    bucket: string,
    index: string
  ): Promise<DistanceMetric> {
    const scope = databaseCacheScope(db)
    const cacheKey = metricCacheKey(scope, bucket, index)
    const cached = metricCache.get(cacheKey)
    if (cached) return cached

    const lookupKey = metricLookupKey(bucket, index)
    const lookups = metricLookupCache(scope)
    let lookup = lookups.get(lookupKey)
    if (!lookup) {
      lookup = this.lookupMetric(db, bucket, index)
      lookups.set(lookupKey, lookup)
    }

    try {
      const metric = await lookup
      if (lookups.get(lookupKey) === lookup) {
        lookups.delete(lookupKey)
        metricCache.set(cacheKey, metric)
      }
      return metric
    } catch {
      if (lookups.get(lookupKey) === lookup) {
        lookups.delete(lookupKey)
      }
      return 'cosine'
    }
  }

  async listVectors(input: ListVectorsInput): Promise<ListVectorsOutput> {
    const bucket = input.vectorBucketName!
    const index = input.indexName!
    const wantData = input.returnData === true
    const wantMeta = input.returnMetadata === true
    const maxResults = validatePositiveInt('maxResults', input.maxResults ?? 500, MAX_LIST_RESULTS)
    const cursor = input.nextToken
    const segment = validateListSegment(input)

    return handlePgVectorError(
      async () => {
        const cols = ['key']
        if (wantData) cols.push('embedding::text AS embedding')
        if (wantMeta) cols.push('metadata')

        const params: unknown[] = []
        const whereClauses: string[] = []
        if (cursor) {
          whereClauses.push(`key > $${params.length + 1}`)
          params.push(cursor)
        }
        if (segment) {
          whereClauses.push(
            `mod(abs(hashtext(key)::bigint), $${params.length + 1}::bigint) = $${params.length + 2}::bigint`
          )
          params.push(segment.segmentCount, segment.segmentIndex)
        }
        params.push(maxResults + 1)

        const whereClause = whereClauses.length > 0 ? ` WHERE ${whereClauses.join(' AND ')}` : ''
        const sql = `SELECT ${cols.join(', ')}
                     FROM ${qualifiedTable(bucket, index)}${whereClause}
                     ORDER BY key ASC
                     LIMIT $${params.length}`
        const result = await this.db().query({ text: sql, values: params })
        const rows = result.rows as Array<{
          key: string
          embedding?: string
          metadata?: DocumentType
        }>
        const { pageRows, nextToken } = paginateNPlusOne(rows, maxResults, (row) => row.key)
        return {
          vectors: pageRows.map((r) => ({
            key: r.key,
            data:
              wantData && r.embedding ? { float32: parseVectorLiteral(r.embedding) } : undefined,
            metadata: wantMeta ? (r.metadata ?? {}) : undefined,
          })),
          nextToken,
        } as ListVectorsOutput
      },
      { type: 'vector-index', name: index }
    )
  }

  private async lookupMetric(
    db: DatabaseTransactionalExecutor | DatabaseTransaction,
    bucket: string,
    index: string
  ): Promise<DistanceMetric> {
    const table = tableName(bucket, index)
    const result = await db.query({
      text: `
          SELECT am.amname, opc.opcname
          FROM pg_index i
          JOIN pg_class ic ON ic.oid = i.indexrelid
          JOIN pg_class tc ON tc.oid = i.indrelid
          JOIN pg_namespace n ON n.oid = tc.relnamespace
          JOIN pg_am am ON am.oid = ic.relam
          JOIN pg_opclass opc ON opc.oid = ANY(i.indclass)
          WHERE n.nspname = $1
            AND tc.relname = $2
            AND am.amname = 'hnsw'
          LIMIT 1
        `,
      values: [SCHEMA, table],
    })
    const op = result.rows?.[0]?.opcname as string | undefined
    if (op === 'halfvec_l2_ops') return 'euclidean'
    return 'cosine'
  }
}

function parseVectorLiteral(literal: string): number[] {
  // pgvector returns vectors as e.g. "[1,2,3]"
  if (!literal.startsWith('[') || !literal.endsWith(']')) return []
  return literal
    .slice(1, -1)
    .split(',')
    .map((s) => Number(s.trim()))
    .filter((n) => Number.isFinite(n))
}
