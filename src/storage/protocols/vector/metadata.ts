import { ListVectorBucketsInput } from '@aws-sdk/client-s3vectors'
import { VectorBucket } from '@storage/schemas'
import { VectorIndex } from '@storage/schemas/vector'

export type DBVectorIndex = VectorIndex & { id: string; created_at: Date; updated_at: Date }
export type VectorLockResourceType = 'bucket' | 'index' | 'global'

export interface CreateVectorIndexParams {
  dataType: string
  dimension: number
  distanceMetric: string
  indexName: string
  metadataConfiguration?: {
    nonFilterableMetadataKeys?: string[]
  }
  vectorBucketName: string
}

export interface ListIndexesInput {
  bucketId: string
  maxResults?: number
  nextToken?: string | undefined
  prefix?: string | undefined
}

export interface ListIndexesResult {
  indexes: Pick<DBVectorIndex, 'name' | 'created_at' | 'bucket_id'>[]
  nextToken?: string
}

export interface ListBucketResult {
  vectorBuckets: VectorBucket[]
  nextToken?: string
}

export interface VectorMetadataDB {
  withTransaction<T>(fn: (db: VectorMetadataDB) => Promise<T> | T): Promise<T>

  lockResource(resourceType: VectorLockResourceType, resourceId: string): Promise<void>

  findVectorBucket(vectorBucketName: string): Promise<VectorBucket>
  createVectorBucket(bucketName: string): Promise<void>
  deleteVectorBucket(bucketName: string): Promise<void>
  listBuckets(param: ListVectorBucketsInput): Promise<ListBucketResult>
  countBuckets(): Promise<number>

  countIndexes(bucketId: string): Promise<number>
  createVectorIndex(data: CreateVectorIndexParams): Promise<DBVectorIndex>
  getIndex(bucketId: string, name: string): Promise<DBVectorIndex>
  listIndexes(command: ListIndexesInput): Promise<ListIndexesResult>
  deleteVectorIndex(bucketName: string, vectorIndexName: string): Promise<void>
  findVectorIndexForBucket(vectorBucketName: string, indexName: string): Promise<DBVectorIndex>
}
