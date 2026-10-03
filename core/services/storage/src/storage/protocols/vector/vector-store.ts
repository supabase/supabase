import {
  CreateIndexInput,
  DeleteIndexInput,
  DeleteVectorsInput,
  DistanceMetric,
  GetIndexCommandInput,
  GetIndexOutput,
  GetVectorBucketInput,
  GetVectorsCommandInput,
  ListIndexesInput,
  ListVectorBucketsInput,
  ListVectorsInput,
  MetadataConfiguration,
  PutVectorsInput,
  QueryVectorsInput,
} from '@aws-sdk/client-s3vectors'
import { ERRORS } from '@internal/errors'
import { logger, logSchema } from '@internal/monitoring'
import { Sharder } from '@internal/sharding/sharder'
import { VectorStore } from './adapter/s3-vector'
import { isVectorResourceConflictError, isVectorResourceNotFoundError } from './errors'
import {
  MAX_DELETE_VECTOR_KEYS,
  MAX_GET_VECTOR_KEYS,
  validatePutVectors,
  validateVectorKeys,
} from './limits'
import { VectorMetadataDB } from './metadata'

interface VectorStoreConfig {
  tenantId: string
  maxBucketCount: number
  maxIndexCount: number
}

type VectorShardReservation = Awaited<ReturnType<Sharder['reserve']>>
type VectorIndexMetadata = Awaited<ReturnType<VectorMetadataDB['findVectorIndexForBucket']>>
type VectorShardResource = {
  kind: 'vector'
  tenantId: string
  bucketName: string
  logicalName: string
}

export const VECTOR_BUCKET_COUNT_LOCK = '__vector_bucket_count__'
const MAX_FILTERABLE_METADATA_BYTES = 2_048
const MAX_TOTAL_METADATA_BYTES = 40 * 1_024
const MAX_METADATA_KEYS = 50

function getNonFilterableMetadataKeys(metadataConfiguration: unknown): ReadonlySet<string> {
  if (
    typeof metadataConfiguration !== 'object' ||
    metadataConfiguration === null ||
    !('nonFilterableMetadataKeys' in metadataConfiguration)
  ) {
    return new Set()
  }

  const keys = (metadataConfiguration as { nonFilterableMetadataKeys?: unknown })
    .nonFilterableMetadataKeys
  if (!Array.isArray(keys)) {
    return new Set()
  }

  return new Set(keys.filter((key): key is string => typeof key === 'string'))
}

function isMetadataObject(metadata: unknown): metadata is Record<string, unknown> {
  if (typeof metadata !== 'object' || metadata === null || Array.isArray(metadata)) {
    return false
  }

  return true
}

function getJsonByteLength(metadata: Record<string, unknown>): number {
  return Buffer.byteLength(JSON.stringify(metadata), 'utf8')
}

function getFilterableMetadataByteLength(
  metadata: unknown,
  nonFilterableKeys: ReadonlySet<string>
): number {
  if (!isMetadataObject(metadata)) {
    return 0
  }

  const filterableMetadata = Object.fromEntries(
    Object.entries(metadata).filter(([key]) => !nonFilterableKeys.has(key))
  )
  return getJsonByteLength(filterableMetadata)
}

function validateMetadataLimits(
  vectors: PutVectorsInput['vectors'],
  metadataConfiguration: unknown
): void {
  const nonFilterableKeys = getNonFilterableMetadataKeys(metadataConfiguration)

  for (const vector of vectors ?? []) {
    if (isMetadataObject(vector.metadata)) {
      if (Object.keys(vector.metadata).length > MAX_METADATA_KEYS) {
        throw ERRORS.InvalidParameter('vectors.metadata', {
          message: `Invalid record for key '${vector.key ?? '<missing>'}': Metadata must have at most ${MAX_METADATA_KEYS} keys`,
        })
      }

      if (getJsonByteLength(vector.metadata) > MAX_TOTAL_METADATA_BYTES) {
        throw ERRORS.InvalidParameter('vectors.metadata', {
          message: `Invalid record for key '${vector.key ?? '<missing>'}': Total metadata must have at most ${MAX_TOTAL_METADATA_BYTES} bytes`,
        })
      }
    }

    if (
      getFilterableMetadataByteLength(vector.metadata, nonFilterableKeys) >
      MAX_FILTERABLE_METADATA_BYTES
    ) {
      throw ERRORS.InvalidParameter('vectors.metadata', {
        message: `Invalid record for key '${vector.key ?? '<missing>'}': Filterable metadata must have at most ${MAX_FILTERABLE_METADATA_BYTES} bytes`,
      })
    }
  }
}

function validateCreateIndexDimensionForStore(
  dimension: CreateIndexInput['dimension'],
  maxDimensions: number | undefined
): void {
  if (maxDimensions === undefined || dimension === undefined) {
    return
  }

  if (!Number.isInteger(dimension) || dimension < 1 || dimension > maxDimensions) {
    throw ERRORS.InvalidParameter('dimension', {
      message: `dimension must be an integer in [1, ${maxDimensions}] for this vector backend, got: ${dimension}`,
    })
  }
}

function collectFilterMetadataKeys(filter: unknown, keys = new Set<string>()): ReadonlySet<string> {
  if (typeof filter !== 'object' || filter === null || Array.isArray(filter)) {
    return keys
  }

  const record = filter as Record<string, unknown>
  for (const op of ['$and', '$or'] as const) {
    const children = record[op]
    if (Array.isArray(children)) {
      for (const child of children) {
        collectFilterMetadataKeys(child, keys)
      }
    }
  }

  for (const key of Object.keys(record)) {
    if (!key.startsWith('$')) {
      keys.add(key)
    }
  }

  return keys
}

function validateFilterableMetadataKeys(
  filter: QueryVectorsInput['filter'],
  metadataConfiguration: unknown
): void {
  if (!filter) {
    return
  }

  const nonFilterableKeys = getNonFilterableMetadataKeys(metadataConfiguration)
  if (nonFilterableKeys.size === 0) {
    return
  }

  for (const key of collectFilterMetadataKeys(filter)) {
    if (nonFilterableKeys.has(key)) {
      throw ERRORS.InvalidParameter('filter', {
        message: `Metadata key "${key}" is configured as non-filterable`,
      })
    }
  }
}

export class VectorStoreManager {
  constructor(
    protected readonly vectorStore: VectorStore,
    protected readonly db: VectorMetadataDB,
    protected readonly sharding: Sharder,
    protected readonly config: VectorStoreConfig
  ) {}

  protected getIndexName(name: string) {
    return `${this.config.tenantId}-${name}`
  }

  private physicalCreateIndexInput(command: CreateIndexInput, shardKey: string): CreateIndexInput {
    const input = {
      ...command,
      indexName: this.getIndexName(command.indexName!),
      vectorBucketName: shardKey,
    }

    if (
      input.metadataConfiguration?.nonFilterableMetadataKeys &&
      input.metadataConfiguration.nonFilterableMetadataKeys.length === 0
    ) {
      delete input.metadataConfiguration
    }

    return input
  }

  async createBucket(bucketName: string): Promise<void> {
    await this.db.withTransaction(async (tnx) => {
      await tnx.lockResource('global', VECTOR_BUCKET_COUNT_LOCK)

      const bucketCount = await tnx.countBuckets()
      if (bucketCount >= this.config.maxBucketCount) {
        try {
          await tnx.findVectorBucket(bucketName)
          throw ERRORS.S3VectorConflictException('vector bucket', bucketName)
        } catch (e) {
          if (!isVectorResourceNotFoundError(e)) {
            throw e
          }
        }

        throw ERRORS.S3VectorMaxBucketsExceeded(this.config.maxBucketCount)
      }

      await tnx.createVectorBucket(bucketName)
    })
  }

  async deleteBucket(bucketName: string): Promise<void> {
    await this.db.withTransaction(async (tx) => {
      await tx.lockResource('bucket', bucketName)
      await tx.lockResource('global', VECTOR_BUCKET_COUNT_LOCK)

      const indexes = await tx.listIndexes({ bucketId: bucketName, maxResults: 1 })

      if (indexes.indexes.length > 0) {
        throw ERRORS.S3VectorBucketNotEmpty(bucketName)
      }

      await tx.deleteVectorBucket(bucketName)
    })
  }

  async getBucket(command: GetVectorBucketInput) {
    if (!command.vectorBucketName) {
      throw ERRORS.MissingParameter('vectorBucketName')
    }

    const vectorBucket = await this.db.findVectorBucket(command.vectorBucketName)

    return {
      vectorBucket: {
        vectorBucketName: vectorBucket.id,
        creationTime: vectorBucket.created_at
          ? Math.floor(vectorBucket.created_at.getTime() / 1000)
          : undefined,
      },
    }
  }

  async listBuckets(command: ListVectorBucketsInput) {
    const bucketResult = await this.db.listBuckets({
      maxResults: command.maxResults,
      nextToken: command.nextToken,
      prefix: command.prefix,
    })

    return {
      vectorBuckets: bucketResult.vectorBuckets.map((bucket) => ({
        vectorBucketName: bucket.id,
        creationTime: bucket.created_at
          ? Math.floor(bucket.created_at.getTime() / 1000)
          : undefined,
      })),
      nextToken: bucketResult.nextToken,
    }
  }

  // Store it in MultiTenantDB
  // Queue Job in the same transaction
  // Poll for job completion
  async createVectorIndex(command: CreateIndexInput): Promise<void> {
    if (!command.indexName) {
      throw ERRORS.MissingParameter('indexName')
    }

    if (!command.vectorBucketName) {
      throw ERRORS.MissingParameter('vectorBucketName')
    }

    validateCreateIndexDimensionForStore(command.dimension, this.vectorStore.maxDimensions)

    await this.db.findVectorBucket(command.vectorBucketName)

    const shardResource = {
      kind: 'vector' as const,
      bucketName: command.vectorBucketName,
      tenantId: this.config.tenantId,
      logicalName: command.indexName,
    }

    if (!this.vectorStore.transactionalIndexOperations) {
      return this.createVectorIndexWithNonTransactionalPhysicalCreate(command, shardResource)
    }

    let shardReservation: VectorShardReservation | undefined
    let physicalIndexNeedsCleanup = false
    let shardConfirmed = false

    try {
      await this.db.withTransaction(async (tx) => {
        await tx.lockResource('bucket', command.vectorBucketName!)
        await tx.findVectorBucket(command.vectorBucketName!)

        const indexCount = await tx.countIndexes(command.vectorBucketName!)

        if (indexCount >= this.config.maxIndexCount) {
          try {
            await tx.findVectorIndexForBucket(command.vectorBucketName!, command.indexName!)
            throw ERRORS.S3VectorConflictException('vector index', command.indexName!)
          } catch (e) {
            if (!isVectorResourceNotFoundError(e)) {
              throw e
            }
          }

          throw ERRORS.S3VectorMaxIndexesExceeded(this.config.maxIndexCount)
        }

        await tx.createVectorIndex({
          dataType: command.dataType!,
          dimension: command.dimension!,
          distanceMetric: command.distanceMetric!,
          indexName: command.indexName!,
          metadataConfiguration: command.metadataConfiguration,
          vectorBucketName: command.vectorBucketName!,
        })

        shardReservation = await this.sharding.reserve(shardResource)

        if (!shardReservation) {
          throw ERRORS.NoAvailableShard()
        }

        const reservation = shardReservation

        try {
          physicalIndexNeedsCleanup = true
          await this.vectorStore.createVectorIndex({
            ...this.physicalCreateIndexInput(command, reservation.shardKey),
          })

          await this.sharding.confirm(reservation.reservationId, shardResource)
          shardConfirmed = true
        } catch (e) {
          if (isVectorResourceConflictError(e)) {
            physicalIndexNeedsCleanup = false
            await this.sharding.confirm(reservation.reservationId, shardResource)
            shardConfirmed = true
            return
          }

          logSchema.error(logger, 'Vector index creation failed', {
            type: 'vector',
            error: e,
            project: this.config.tenantId,
          })

          throw e
        }
      })
    } catch (error) {
      logSchema.error(logger, 'Create vector index transaction failed', {
        type: 'vector',
        error,
        project: this.config.tenantId,
      })
      if (shardReservation) {
        await this.cleanupFailedVectorIndexCreate(
          command,
          shardReservation,
          physicalIndexNeedsCleanup,
          shardConfirmed,
          shardResource
        )
      }
      throw error
    }
  }

  private async createVectorIndexWithNonTransactionalPhysicalCreate(
    command: CreateIndexInput,
    shardResource: VectorShardResource
  ): Promise<void> {
    let shardReservation: VectorShardReservation | undefined
    let createdIndex: VectorIndexMetadata | undefined
    let physicalIndexNeedsCleanup = false
    let shardConfirmed = false

    try {
      await this.db.withTransaction(async (tx) => {
        await tx.lockResource('bucket', command.vectorBucketName!)
        await tx.findVectorBucket(command.vectorBucketName!)

        const indexCount = await tx.countIndexes(command.vectorBucketName!)

        if (indexCount >= this.config.maxIndexCount) {
          try {
            await tx.findVectorIndexForBucket(command.vectorBucketName!, command.indexName!)
            throw ERRORS.S3VectorConflictException('vector index', command.indexName!)
          } catch (e) {
            if (!isVectorResourceNotFoundError(e)) {
              throw e
            }
          }

          throw ERRORS.S3VectorMaxIndexesExceeded(this.config.maxIndexCount)
        }

        createdIndex = await tx.createVectorIndex({
          dataType: command.dataType!,
          dimension: command.dimension!,
          distanceMetric: command.distanceMetric!,
          indexName: command.indexName!,
          metadataConfiguration: command.metadataConfiguration,
          vectorBucketName: command.vectorBucketName!,
        })

        shardReservation = await this.sharding.reserve(shardResource)

        if (!shardReservation) {
          throw ERRORS.NoAvailableShard()
        }
      })

      const reservation = shardReservation
      if (!reservation) {
        throw ERRORS.NoAvailableShard()
      }

      try {
        physicalIndexNeedsCleanup = true
        await this.vectorStore.createVectorIndex(
          this.physicalCreateIndexInput(command, reservation.shardKey)
        )
      } catch (e) {
        if (isVectorResourceConflictError(e)) {
          physicalIndexNeedsCleanup = false
          await this.sharding.confirm(reservation.reservationId, shardResource)
          shardConfirmed = true
          return
        }

        logSchema.error(logger, 'Vector index creation failed', {
          type: 'vector',
          error: e,
          project: this.config.tenantId,
        })

        throw e
      }

      await this.sharding.confirm(reservation.reservationId, shardResource)
      shardConfirmed = true
    } catch (error) {
      logSchema.error(logger, 'Create vector index transaction failed', {
        type: 'vector',
        error,
        project: this.config.tenantId,
      })
      if (shardReservation) {
        await this.cleanupFailedCommittedVectorIndexCreate(
          command,
          shardReservation,
          physicalIndexNeedsCleanup,
          shardConfirmed,
          shardResource,
          createdIndex?.id
        )
      }
      throw error
    }
  }

  protected async cleanupFailedVectorIndexCreate(
    command: CreateIndexInput,
    shardReservation: VectorShardReservation,
    physicalIndexNeedsCleanup: boolean,
    shardConfirmed: boolean,
    shardResource: VectorShardResource
  ) {
    const cleanupErrors: unknown[] = []
    const runCleanup = async (cleanup: () => Promise<unknown>) => {
      try {
        await cleanup()
      } catch (error) {
        cleanupErrors.push(error)
      }
    }

    await runCleanup(() =>
      this.db.withTransaction(async (tx) => {
        await tx.lockResource('bucket', command.vectorBucketName!)

        if (await this.findVectorIndexMetadata(tx, command.vectorBucketName!, command.indexName!)) {
          if (!shardConfirmed) {
            await this.sharding.cancel(shardReservation.reservationId)
          }
          return
        }

        // Keep cleanup serial so the shard slot is not reusable before physical teardown finishes.
        if (physicalIndexNeedsCleanup) {
          await this.deletePhysicalVectorIndexIfExists(
            shardReservation.shardKey,
            this.getIndexName(command.indexName!)
          )
        }

        await this.sharding.freeByResource(shardReservation.shardId, shardResource)

        if (!shardConfirmed) {
          await this.sharding.cancel(shardReservation.reservationId)
        }
      })
    )

    if (cleanupErrors.length > 0) {
      logSchema.error(logger, 'Vector index creation cleanup failed', {
        type: 'vector',
        error: cleanupErrors,
        project: this.config.tenantId,
      })
    }
  }

  protected async cleanupFailedCommittedVectorIndexCreate(
    command: CreateIndexInput,
    shardReservation: VectorShardReservation,
    physicalIndexNeedsCleanup: boolean,
    shardConfirmed: boolean,
    shardResource: VectorShardResource,
    createdIndexId: string | undefined
  ) {
    const cleanupErrors: unknown[] = []
    const runCleanup = async (cleanup: () => Promise<unknown>) => {
      try {
        await cleanup()
      } catch (error) {
        cleanupErrors.push(error)
      }
    }

    await runCleanup(() =>
      this.db.withTransaction(async (tx) => {
        await tx.lockResource('bucket', command.vectorBucketName!)

        const currentIndex = await this.findVectorIndexMetadata(
          tx,
          command.vectorBucketName!,
          command.indexName!
        )
        if (currentIndex) {
          if (createdIndexId && currentIndex.id !== createdIndexId) {
            if (!shardConfirmed) {
              await this.sharding.cancel(shardReservation.reservationId)
            }
            return
          }

          await tx.deleteVectorIndex(command.vectorBucketName!, command.indexName!)
        }

        // Keep cleanup serial so the shard slot is not reusable before physical teardown finishes.
        if (physicalIndexNeedsCleanup) {
          await this.deletePhysicalVectorIndexIfExists(
            shardReservation.shardKey,
            this.getIndexName(command.indexName!)
          )
        }

        await this.sharding.freeByResource(shardReservation.shardId, shardResource)

        if (!shardConfirmed) {
          await this.sharding.cancel(shardReservation.reservationId)
        }
      })
    )

    if (cleanupErrors.length > 0) {
      logSchema.error(logger, 'Vector index creation cleanup failed', {
        type: 'vector',
        error: cleanupErrors,
        project: this.config.tenantId,
      })
    }
  }

  private async deletePhysicalVectorIndexIfExists(
    vectorBucketName: string,
    indexName: string
  ): Promise<void> {
    try {
      await this.vectorStore.deleteVectorIndex({
        vectorBucketName,
        indexName,
      })
    } catch (e) {
      if (!isVectorResourceNotFoundError(e)) {
        throw e
      }
    }
  }

  private async findVectorIndexMetadata(
    db: Pick<VectorMetadataDB, 'findVectorIndexForBucket'>,
    vectorBucketName: string,
    indexName: string
  ): Promise<VectorIndexMetadata | undefined> {
    try {
      return await db.findVectorIndexForBucket(vectorBucketName, indexName)
    } catch (e) {
      if (!isVectorResourceNotFoundError(e)) {
        throw e
      }
      return undefined
    }
  }

  async deleteIndex(command: DeleteIndexInput): Promise<void> {
    if (!command.indexName) {
      throw ERRORS.MissingParameter('indexName')
    }

    if (!command.vectorBucketName) {
      throw ERRORS.MissingParameter('vectorBucketName')
    }

    const vectorIndexName = this.getIndexName(command.indexName)
    const shardResource = {
      kind: 'vector' as const,
      tenantId: this.config.tenantId,
      logicalName: command.indexName,
      bucketName: command.vectorBucketName,
    }

    await this.db.withTransaction(async (tx) => {
      await tx.lockResource('bucket', command.vectorBucketName!)
      await tx.findVectorIndexForBucket(command.vectorBucketName!, command.indexName!)

      const shard = await this.sharding.findShardByResourceId(shardResource)

      if (!shard) {
        throw ERRORS.NoAvailableShard()
      }

      await tx.deleteVectorIndex(command.vectorBucketName!, command.indexName!)
      await this.deletePhysicalVectorIndexIfExists(shard.shard_key, vectorIndexName)
      await this.sharding.freeByResource(shard.id, shardResource)
    })
  }

  async getIndex(command: GetIndexCommandInput): Promise<GetIndexOutput> {
    if (!command.indexName) {
      throw ERRORS.MissingParameter('indexName')
    }

    if (!command.vectorBucketName) {
      throw ERRORS.MissingParameter('vectorBucketName')
    }

    const index = await this.db.getIndex(command.vectorBucketName, command.indexName)

    return {
      index: {
        indexName: index.name,
        dataType: index.data_type as 'float32',
        dimension: index.dimension,
        distanceMetric: index.distance_metric as DistanceMetric,
        metadataConfiguration: index.metadata_configuration as MetadataConfiguration,
        vectorBucketName: index.bucket_id,
        creationTime: index.created_at,
        indexArn: undefined,
      },
    }
  }

  async listIndexes(command: ListIndexesInput) {
    if (!command.vectorBucketName) {
      throw ERRORS.MissingParameter('vectorBucketName')
    }

    const result = await this.db.listIndexes({
      bucketId: command.vectorBucketName,
      maxResults: command.maxResults,
      nextToken: command.nextToken,
      prefix: command.prefix,
    })

    return {
      indexes: result.indexes.map((i) => ({
        indexName: i.name,
        vectorBucketName: i.bucket_id,
        creationTime: Math.floor(i.created_at.getTime() / 1000),
      })),
      nextToken: result.nextToken,
    }
  }

  async putVectors(command: PutVectorsInput) {
    if (!command.indexName) {
      throw ERRORS.MissingParameter('indexName')
    }

    if (!command.vectorBucketName) {
      throw ERRORS.MissingParameter('vectorBucketName')
    }

    const vectors = validatePutVectors(command.vectors)

    const [shard, index] = await Promise.all([
      this.sharding.findShardByResourceId({
        kind: 'vector',
        tenantId: this.config.tenantId,
        logicalName: command.indexName!,
        bucketName: command.vectorBucketName!,
      }),
      this.db.findVectorIndexForBucket(command.vectorBucketName, command.indexName),
    ])

    if (!shard) {
      throw ERRORS.NoAvailableShard()
    }

    validateMetadataLimits(vectors, index.metadata_configuration)

    const putVectorsInput = {
      ...command,
      vectors,
      vectorBucketName: shard.shard_key,
      indexName: this.getIndexName(command.indexName),
    }
    await this.vectorStore.putVectors(putVectorsInput)
  }

  async deleteVectors(command: DeleteVectorsInput) {
    if (!command.indexName) {
      throw ERRORS.MissingParameter('indexName')
    }

    if (!command.vectorBucketName) {
      throw ERRORS.MissingParameter('vectorBucketName')
    }

    validateVectorKeys(command.keys, MAX_DELETE_VECTOR_KEYS)

    const [shard] = await Promise.all([
      this.sharding.findShardByResourceId({
        kind: 'vector',
        tenantId: this.config.tenantId,
        logicalName: command.indexName!,
        bucketName: command.vectorBucketName!,
      }),
      this.db.findVectorIndexForBucket(command.vectorBucketName, command.indexName),
    ])

    if (!shard) {
      throw ERRORS.NoAvailableShard()
    }

    const deleteVectorsInput = {
      ...command,
      vectorBucketName: shard.shard_key,
      indexName: this.getIndexName(command.indexName),
    }

    return this.vectorStore.deleteVectors(deleteVectorsInput)
  }

  async listVectors(command: ListVectorsInput) {
    if (!command.indexName) {
      throw ERRORS.MissingParameter('indexName')
    }

    if (!command.vectorBucketName) {
      throw ERRORS.MissingParameter('vectorBucketName')
    }

    const [shard] = await Promise.all([
      this.sharding.findShardByResourceId({
        kind: 'vector',
        tenantId: this.config.tenantId,
        logicalName: command.indexName!,
        bucketName: command.vectorBucketName!,
      }),
      this.db.findVectorIndexForBucket(command.vectorBucketName, command.indexName),
    ])

    if (!shard) {
      throw ERRORS.NoAvailableShard()
    }

    const listVectorsInput = {
      ...command,
      vectorBucketName: shard.shard_key,
      indexName: this.getIndexName(command.indexName),
    }

    const result = await this.vectorStore.listVectors(listVectorsInput)

    return {
      vectors: result.vectors,
      nextToken: result.nextToken,
    }
  }

  async queryVectors(command: QueryVectorsInput) {
    if (!command.indexName) {
      throw ERRORS.MissingParameter('indexName')
    }

    if (!command.vectorBucketName) {
      throw ERRORS.MissingParameter('vectorBucketName')
    }

    const [shard, index] = await Promise.all([
      this.sharding.findShardByResourceId({
        kind: 'vector',
        tenantId: this.config.tenantId,
        logicalName: command.indexName!,
        bucketName: command.vectorBucketName!,
      }),
      this.db.findVectorIndexForBucket(command.vectorBucketName, command.indexName),
    ])

    if (!shard) {
      throw ERRORS.NoAvailableShard()
    }

    validateFilterableMetadataKeys(command.filter, index.metadata_configuration)

    const queryInput = {
      ...command,
      vectorBucketName: shard.shard_key,
      indexName: this.getIndexName(command.indexName),
    }
    return this.vectorStore.queryVectors(queryInput)
  }

  async getVectors(command: GetVectorsCommandInput) {
    if (!command.indexName) {
      throw ERRORS.MissingParameter('indexName')
    }

    if (!command.vectorBucketName) {
      throw ERRORS.MissingParameter('vectorBucketName')
    }

    validateVectorKeys(command.keys, MAX_GET_VECTOR_KEYS)

    const [shard] = await Promise.all([
      this.sharding.findShardByResourceId({
        kind: 'vector',
        tenantId: this.config.tenantId,
        logicalName: command.indexName!,
        bucketName: command.vectorBucketName!,
      }),
      this.db.findVectorIndexForBucket(command.vectorBucketName, command.indexName),
    ])

    if (!shard) {
      throw ERRORS.NoAvailableShard()
    }

    const getVectorsInput = {
      ...command,
      vectorBucketName: shard.shard_key,
      indexName: this.getIndexName(command.indexName),
    }

    const result = await this.vectorStore.getVectors(getVectorsInput)

    return {
      vectors: result.vectors,
    }
  }
}
