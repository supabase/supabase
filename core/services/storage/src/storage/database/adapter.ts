import type { TenantConnection, TransactionOptions } from '@internal/database'
import { DBMigration } from '@internal/database/migrations'
import { ObjectMetadata } from '../backend'
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

export interface SearchObjectOption {
  search?: string
  sortBy?: {
    column?: string
    order?: string
  }
  limit?: number
  offset?: number
  noncurrentVersions?: 'exclude' | 'include' | 'only'
  deleteMarkers?: 'exclude' | 'include' | 'only'
  exactMatch?: boolean
}

export interface FindBucketFilters {
  isPublic?: boolean
  forUpdate?: boolean
  forShare?: boolean
  dontErrorOnEmpty?: boolean
}

export interface FindObjectFilters {
  forUpdate?: boolean
  forShare?: boolean
  forKeyShare?: boolean
  noWait?: boolean
  dontErrorOnEmpty?: boolean
}

export interface DatabaseOptions<TNX> {
  tenantId: string
  reqId?: string
  sbReqId?: string
  latestMigration?: keyof typeof DBMigration
  host: string
  tnx?: TNX
  parentTnx?: TNX
  parentConnection?: TenantConnection
}

export interface ListBucketOptions {
  limit?: number
  offset?: number
  sortColumn?: string
  sortOrder?: string
  search?: string
}

export interface ScannerS3Key {
  key: string
  size: number
}

export interface Database {
  tenantHost: string
  tenantId: string
  reqId?: string
  sbReqId?: string
  role?: string
  latestMigration?: keyof typeof DBMigration
  connection: TenantConnection

  tenant(): { ref: string; host: string }

  hasMigration(migration: keyof typeof DBMigration): Promise<boolean>

  asSuperUser(): Database

  withTransaction<T>(
    fn: (db: Database) => Promise<T>,
    transactionOptions?: TransactionOptions
  ): Promise<T>

  testPermission<T>(fn: (db: Database) => T | Promise<T>): Promise<Awaited<T>>

  createBucket(
    data: Pick<
      Bucket,
      'id' | 'name' | 'public' | 'owner' | 'file_size_limit' | 'allowed_mime_types'
    >
  ): Promise<Pick<Bucket, 'id'>>

  createAnalyticsBucket(data: Pick<Bucket, 'name'>): Promise<IcebergCatalog>

  findBucketById<Filters extends FindBucketFilters = FindObjectFilters>(
    bucketId: string,
    columns: string,
    filters?: Filters
  ): Promise<Filters['dontErrorOnEmpty'] extends true ? Bucket | undefined : Bucket>

  findLifecycleBucket(bucketId: string): Promise<LifecycleBucket>

  putLifecycleConfiguration(
    bucketId: string,
    configuration: BucketLifecycleConfiguration
  ): Promise<LifecycleBucket>

  deleteLifecycleConfiguration(bucketId: string): Promise<LifecycleBucket>

  countObjectsInBucket(bucketId: string, limit?: number): Promise<number>

  deleteBucket(bucketId: string | string[]): Promise<number>

  listObjects(
    bucketId: string,
    columns: string,
    limit: number,
    before?: Date,
    nextToken?: string
  ): Promise<Obj[]>

  listObjectsV2(
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
  ): Promise<ObjectListEntry[]>

  listMultipartUploads(
    bucketId: string,
    options?: {
      prefix?: string
      deltimeter?: string
      nextUploadToken?: string
      nextUploadKeyToken?: string
      maxKeys?: number
    }
  ): Promise<S3MultipartUpload[]>

  listBuckets(columns: string, options?: ListBucketOptions): Promise<Bucket[]>
  mustLockObject(bucketId: string, objectName: string, version?: string): Promise<boolean>

  waitObjectLock(
    bucketId: string,
    objectName: string,
    version?: string,
    opts?: { timeout?: number }
  ): Promise<boolean>

  updateBucket(
    bucketId: string,
    fields: Pick<Bucket, 'public' | 'file_size_limit' | 'allowed_mime_types'>
  ): Promise<{ previous: Pick<Bucket, 'public'> } | void>

  upsertObject(
    data: Pick<Obj, 'name' | 'owner' | 'bucket_id' | 'metadata' | 'version' | 'user_metadata'>
  ): Promise<Obj>

  updateObject(
    bucketId: string,
    name: string,
    data: Pick<Obj, 'owner' | 'metadata' | 'version' | 'name' | 'bucket_id' | 'user_metadata'>,
    currentVersion?: string
  ): Promise<Obj>
  createObject(
    data: Pick<Obj, 'name' | 'owner' | 'bucket_id' | 'metadata' | 'version' | 'user_metadata'>
  ): Promise<Obj>

  deleteObject(bucketId: string, objectName: string, version?: string): Promise<Obj | undefined>

  deleteObjects(bucketId: string, objectNames: string[], by: keyof Obj): Promise<Obj[]>

  deleteObjectVersions(
    bucketId: string,
    objectNames: { name: string; version: string }[]
  ): Promise<Obj[]>

  updateObjectOwner(bucketId: string, objectName: string, owner?: string): Promise<Obj>

  findObjects(bucketId: string, objectNames: string[], columns: string): Promise<Obj[]>

  findObjectVersions(
    bucketId: string,
    objectNames: { name: string; version: string }[],
    columns: string
  ): Promise<Obj[]>

  findObject<Filters extends FindObjectFilters = FindObjectFilters>(
    bucketId: string,
    objectName: string,
    columns: string,
    filters?: Filters,
    version?: string
  ): Promise<Filters['dontErrorOnEmpty'] extends true ? Obj | undefined : Obj>

  searchObjects(
    bucketId: string,
    prefix: string,
    options: SearchObjectOption
  ): Promise<ObjectListEntry[]>

  healthcheck(): Promise<void>

  destroyConnection(): void

  createMultipartUpload(
    uploadId: string,
    bucketId: string,
    objectName: string,
    version: string,
    signature: string,
    owner?: string,
    userMetadata?: Record<string, string | null>,
    metadata?: Partial<ObjectMetadata>
  ): Promise<S3MultipartUpload>

  findMultipartUpload(
    uploadId: string,
    columns: string,
    options?: { forUpdate?: boolean }
  ): Promise<S3MultipartUpload>

  updateMultipartUploadProgress(
    uploadId: string,
    progress: number,
    signature: string
  ): Promise<void>

  deleteMultipartUpload(uploadId: string): Promise<void>

  insertUploadPart(part: S3PartUpload): Promise<S3PartUpload>

  listParts(
    uploadId: string,
    options: { afterPart?: string; maxParts: number }
  ): Promise<S3PartUpload[]>

  deleteAnalyticsBucket(id: string, opts?: { soft: boolean }): Promise<IcebergCatalog>
  listAnalyticsBuckets(
    columns: string,
    options: ListBucketOptions | undefined
  ): Promise<IcebergCatalog[]>
  findAnalyticsBucketByName(name: string): Promise<IcebergCatalog>

  createS3KeysTempTable(tableName: string): Promise<void>
  dropS3KeysTempTable(tableName: string): Promise<void>
  listS3KeysFromTempTable(
    tableName: string,
    nextItem: string,
    limit: number
  ): Promise<ScannerS3Key[]>
  findS3KeysInTempTable(tableName: string, keys: string[]): Promise<Pick<ScannerS3Key, 'key'>[]>
  insertS3KeysIntoTempTable(tableName: string, keys: ScannerS3Key[]): Promise<void>
}
