import {
  attachPoolErrorHandler,
  getTenantConfig,
  multitenantPgExecutor,
  PgPoolExecutor,
} from '@internal/database'
import { deriveVectorDatabaseUrl } from '@internal/database/vector-store-url'
import { ERRORS } from '@internal/errors'
import { logger, logSchema } from '@internal/monitoring'
import {
  BucketScopedSingleShard,
  PgShardStoreFactory,
  ShardCatalog,
  Sharder,
  SingleShard,
} from '@internal/sharding'
import {
  createS3VectorClient,
  createVectorTransactionPgResolver,
  PgVectorMetadataDB,
  PgVectorStore,
  S3Vector,
  VectorStore,
  VectorStoreManager,
} from '@storage/protocols/vector'
import { FastifyInstance } from 'fastify'
import fastifyPlugin from 'fastify-plugin'
import { Pool as PgPool } from 'pg'
import { getConfig } from '../../config'

declare module 'fastify' {
  interface FastifyRequest {
    s3Vector: VectorStoreManager
  }
}

export const s3vector = fastifyPlugin(async function (fastify: FastifyInstance) {
  const config = getConfig()
  const {
    vectorBucketProvider,
    vectorDatabaseCreate,
    vectorDatabaseURL,
    vectorS3Buckets,
    isMultitenant,
    databaseApplicationName,
  } = config

  let s3Adapter: S3Vector | undefined
  if (vectorBucketProvider === 's3' && vectorS3Buckets.length > 0) {
    s3Adapter = new S3Vector(createS3VectorClient())
  }

  // pgvector + single-tenant: VECTOR_DATABASE_URL is the maintenance URL the
  // migration runner used to CREATE DATABASE; the runtime pool targets the
  // derived `storage_vectors` database on the same server. When
  // VECTOR_DATABASE_CREATE=false, the runtime pool targets VECTOR_DATABASE_URL
  // directly.
  let stPgVectorAdapter: PgVectorStore | undefined
  let stPgVectorPool: PgPool | undefined
  if (vectorBucketProvider === 'pgvector' && !isMultitenant && vectorDatabaseURL) {
    const connectionString = vectorDatabaseCreate
      ? deriveVectorDatabaseUrl(vectorDatabaseURL)
      : vectorDatabaseURL
    stPgVectorPool = attachPoolErrorHandler(
      new PgPool({
        connectionString,
        application_name: databaseApplicationName,
        min: 0,
        max: 10,
      }),
      (error) => {
        logSchema.warning(logger, '[Vector] Idle pgvector client error', {
          type: 'db',
          error,
        })
      }
    )
    stPgVectorAdapter = new PgVectorStore(new PgPoolExecutor(stPgVectorPool))
    fastify.addHook('onClose', async () => {
      await stPgVectorPool?.end()
    })
  }

  const featureEnabled =
    (vectorBucketProvider === 's3' && Boolean(s3Adapter)) ||
    (vectorBucketProvider === 'pgvector' && (isMultitenant || Boolean(stPgVectorAdapter)))

  fastify.addHook('preHandler', async (req) => {
    if (!featureEnabled) {
      throw ERRORS.FeatureNotEnabled('vector', 'Vector service not configured')
    }

    const { vectorMaxBucketsCount, vectorMaxIndexesCount } = config

    let maxBucketCount = vectorMaxBucketsCount
    let maxIndexCount = vectorMaxIndexesCount

    if (isMultitenant) {
      const { features } = await getTenantConfig(req.tenantId)
      maxBucketCount = features?.vectorBuckets?.maxBuckets || vectorMaxBucketsCount
      maxIndexCount = features?.vectorBuckets?.maxIndexes || vectorMaxIndexesCount
    }

    const store = new PgVectorMetadataDB(req.db)

    let adapter: VectorStore
    if (vectorBucketProvider === 'pgvector') {
      adapter = isMultitenant
        ? new PgVectorStore(createVectorTransactionPgResolver(req.db))
        : stPgVectorAdapter!
    } else {
      adapter = s3Adapter!
    }

    let shard: Sharder
    if (vectorBucketProvider === 'pgvector') {
      shard = new BucketScopedSingleShard({
        keyPrefix: 'pgvector__',
        capacity: Number.MAX_SAFE_INTEGER,
      })
    } else if (isMultitenant) {
      shard = new ShardCatalog(new PgShardStoreFactory(multitenantPgExecutor))
    } else {
      shard = new SingleShard({
        shardKey: vectorS3Buckets[0],
        capacity: 10000,
      })
    }

    req.s3Vector = new VectorStoreManager(adapter, store, shard, {
      tenantId: req.tenantId,
      maxBucketCount,
      maxIndexCount,
    })
  })
})
