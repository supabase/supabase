import { AsyncLocalStorage } from 'node:async_hooks'
import { randomUUID } from 'node:crypto'
import { ListVectorBucketsInput } from '@aws-sdk/client-s3vectors'
import { wait } from '@internal/concurrency'
import {
  type DatabaseTransaction,
  type DatabaseTransactionalExecutor,
  isDatabaseTransaction,
  quoteIdentifier,
} from '@internal/database'
import { ERRORS } from '@internal/errors'
import { hashStringToInt } from '@internal/hashing'
import { logger, logSchema } from '@internal/monitoring'
import { escapeLike, mapPgTransactionAbortedError } from '@storage/database'
import { VectorBucket } from '@storage/schemas'
import { DatabaseError, QueryResultRow } from 'pg'
import {
  CreateVectorIndexParams,
  DBVectorIndex,
  ListBucketResult,
  ListIndexesInput,
  ListIndexesResult,
  VectorLockResourceType,
  VectorMetadataDB,
} from './metadata'

const vectorTransactionStorage = new AsyncLocalStorage<{
  root: DatabaseTransactionalExecutor | DatabaseTransaction
  transaction: DatabaseTransaction
}>()

export function createVectorTransactionPgResolver(db: DatabaseTransactionalExecutor): {
  resolve: () => DatabaseTransactionalExecutor | DatabaseTransaction
  root: () => DatabaseTransactionalExecutor | DatabaseTransaction
} {
  return {
    resolve: () => {
      const transaction = vectorTransactionStorage.getStore()
      return transaction?.root === db ? transaction.transaction : db
    },
    root: () => db,
  }
}

export class PgVectorMetadataDB implements VectorMetadataDB {
  constructor(
    protected readonly db: DatabaseTransactionalExecutor | DatabaseTransaction,
    private readonly rootDb: DatabaseTransactionalExecutor | DatabaseTransaction = db
  ) {}

  async withTransaction<T>(fn: (db: VectorMetadataDB) => Promise<T> | T): Promise<T> {
    const maxRetries = 3

    for (let attempt = 1; ; attempt++) {
      const transactionExists = isDatabaseTransaction(this.db)
      const trx = transactionExists ? this.db : await this.db.beginTransaction()
      const savepoint = transactionExists ? nextSavepointName() : undefined
      let savepointEstablished = false

      try {
        if (savepoint) {
          await createSavepoint(trx, savepoint)
          savepointEstablished = true
        }

        const runCallback = () => fn(new PgVectorMetadataDB(trx, this.rootDb))
        const result = await vectorTransactionStorage.run(
          { root: this.rootDb, transaction: trx },
          runCallback
        )

        if (savepoint) {
          await trx.query(`RELEASE SAVEPOINT ${savepoint}`)
        } else {
          await trx.commit()
        }

        return result
      } catch (error) {
        if (savepointEstablished && savepoint) {
          try {
            await rollbackSavepoint(trx, savepoint)
          } catch (rollbackError) {
            logSchema.warning(logger, '[PgVectorMetadataDB] Failed to rollback savepoint', {
              type: 'db',
              error: rollbackError,
              metadata: JSON.stringify({ savepoint }),
            })
          }
        } else if (!savepoint) {
          try {
            await trx.rollback()
          } catch (rollbackError) {
            logSchema.warning(logger, '[PgVectorMetadataDB] Failed to rollback transaction', {
              type: 'db',
              error: rollbackError,
              metadata: JSON.stringify({ originalError: String(error) }),
            })
          }
        }

        if (
          !savepoint &&
          error instanceof DatabaseError &&
          error.code === '40001' &&
          attempt < maxRetries
        ) {
          await wait(20 * Math.pow(2, attempt - 1))
          continue
        }

        throw error
      }
    }
  }

  async lockResource(resourceType: VectorLockResourceType, resourceId: string): Promise<void> {
    const lockId = hashStringToInt(`vector:${resourceType}:${resourceId}`)
    await this.query('SELECT pg_advisory_xact_lock($1::bigint)', [lockId])
  }

  async countIndexes(bucketId: string): Promise<number> {
    const result = await this.query<{ count: string }>(
      `
        SELECT COUNT(id) AS count
        FROM storage.vector_indexes
        WHERE bucket_id = $1
      `,
      [bucketId]
    )

    return Number(result.rows[0]?.count ?? 0)
  }

  async countBuckets(): Promise<number> {
    const result = await this.query<{ count: string }>(`
      SELECT COUNT(id) AS count
      FROM storage.buckets_vectors
    `)

    return Number(result.rows[0]?.count ?? 0)
  }

  async listBuckets(param: ListVectorBucketsInput): Promise<ListBucketResult> {
    const maxResults = param.maxResults ? Math.min(param.maxResults, 500) : 500
    const conditions: string[] = []
    const values: unknown[] = []

    if (param.prefix) {
      values.push(`${escapeLike(param.prefix)}%`)
      conditions.push(`id LIKE $${values.length}`)
    }

    if (param.nextToken) {
      values.push(param.nextToken)
      conditions.push(`id > $${values.length}`)
    }

    values.push(maxResults + 1)

    const result = await this.query<VectorBucket>(
      `
        SELECT *
        FROM storage.buckets_vectors
        ${conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''}
        ORDER BY id ASC
        LIMIT $${values.length}
      `,
      values
    )

    const hasMore = result.rows.length > maxResults
    const buckets = result.rows.slice(0, maxResults)

    return {
      vectorBuckets: buckets,
      nextToken: hasMore ? buckets[buckets.length - 1].id : undefined,
    }
  }

  async findVectorIndexForBucket(
    vectorBucketName: string,
    indexName: string
  ): Promise<DBVectorIndex> {
    const index = await this.getIndexByBucketAndName(vectorBucketName, indexName)

    if (!index) {
      throw ERRORS.S3VectorNotFoundException('vector index', indexName)
    }

    return index
  }

  async findVectorBucket(vectorBucketName: string): Promise<VectorBucket> {
    const result = await this.query<VectorBucket>(
      `
        SELECT *
        FROM storage.buckets_vectors
        WHERE id = $1
        LIMIT 1
      `,
      [vectorBucketName]
    )
    const bucket = result.rows[0]

    if (!bucket) {
      throw ERRORS.S3VectorNotFoundException('vector bucket', vectorBucketName)
    }

    return bucket
  }

  async createVectorBucket(bucketName: string): Promise<void> {
    try {
      await this.query(
        `
          INSERT INTO storage.buckets_vectors (id)
          VALUES ($1)
        `,
        [bucketName]
      )
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw ERRORS.S3VectorConflictException('vector bucket', bucketName)
      }

      throw e
    }
  }

  async listIndexes(command: ListIndexesInput): Promise<ListIndexesResult> {
    const maxResults = command.maxResults ? Math.min(command.maxResults, 500) : 500
    const conditions = ['bucket_id = $1']
    const values: unknown[] = [command.bucketId]

    if (command.prefix) {
      values.push(`${escapeLike(command.prefix)}%`)
      conditions.push(`name LIKE $${values.length}`)
    }

    if (command.nextToken) {
      values.push(command.nextToken)
      conditions.push(`name > $${values.length}`)
    }

    values.push(maxResults + 1)

    const result = await this.query<Pick<DBVectorIndex, 'name' | 'created_at' | 'bucket_id'>>(
      `
        SELECT name, bucket_id, created_at
        FROM storage.vector_indexes
        WHERE ${conditions.join(' AND ')}
        ORDER BY name ASC
        LIMIT $${values.length}
      `,
      values
    )
    const hasMore = result.rows.length > maxResults
    const indexes = result.rows.slice(0, maxResults)

    return {
      indexes,
      nextToken: hasMore ? indexes[indexes.length - 1].name : undefined,
    }
  }

  async getIndex(bucketId: string, name: string): Promise<DBVectorIndex> {
    const index = await this.getIndexByBucketAndName(bucketId, name)

    if (!index) {
      throw ERRORS.S3VectorNotFoundException('vector index', name)
    }

    return index
  }

  async createVectorIndex(data: CreateVectorIndexParams): Promise<DBVectorIndex> {
    try {
      const result = await this.query<DBVectorIndex>(
        `
          INSERT INTO storage.vector_indexes (
            bucket_id,
            data_type,
            name,
            dimension,
            distance_metric,
            metadata_configuration
          )
          VALUES ($1, $2, $3, $4, $5, $6)
          RETURNING *
        `,
        [
          data.vectorBucketName,
          data.dataType,
          data.indexName,
          data.dimension,
          data.distanceMetric,
          data.metadataConfiguration ?? null,
        ]
      )

      const index = result.rows[0]

      if (!index) {
        throw ERRORS.DatabaseError(
          `Vector index insert returned no rows for index "${data.indexName}"`
        )
      }

      return index
    } catch (e) {
      if (isUniqueViolation(e)) {
        throw ERRORS.S3VectorConflictException('vector index', data.indexName)
      }

      throw e
    }
  }

  async deleteVectorIndex(bucketName: string, vectorIndexName: string): Promise<void> {
    await this.query(
      `
        DELETE FROM storage.vector_indexes
        WHERE bucket_id = $1
          AND name = $2
      `,
      [bucketName, vectorIndexName]
    )
  }

  async deleteVectorBucket(bucketName: string): Promise<void> {
    await this.query(
      `
        DELETE FROM storage.buckets_vectors
        WHERE id = $1
      `,
      [bucketName]
    )
  }

  private async getIndexByBucketAndName(
    bucketId: string,
    name: string
  ): Promise<DBVectorIndex | undefined> {
    const result = await this.query<DBVectorIndex>(
      `
        SELECT *
        FROM storage.vector_indexes
        WHERE bucket_id = $1
          AND name = $2
        LIMIT 1
      `,
      [bucketId, name]
    )

    return result.rows[0]
  }

  private query<T extends QueryResultRow = QueryResultRow>(text: string, values?: unknown[]) {
    return this.db.query<T>({
      text,
      values,
    })
  }
}

function isUniqueViolation(error: unknown): boolean {
  return error instanceof DatabaseError && error.code === '23505'
}

function nextSavepointName(): string {
  return quoteIdentifier(`vector_metadata_transaction_${randomUUID().replace(/-/g, '_')}`)
}

async function createSavepoint(trx: DatabaseTransaction, savepoint: string): Promise<void> {
  const query = `SAVEPOINT ${savepoint}`

  try {
    await trx.query(query)
  } catch (error) {
    throw mapPgTransactionAbortedError(error, query)
  }
}

async function rollbackSavepoint(tnx: DatabaseTransaction, savepoint: string): Promise<void> {
  await tnx.query(`ROLLBACK TO SAVEPOINT ${savepoint}`)
  await tnx.query(`RELEASE SAVEPOINT ${savepoint}`)
}
