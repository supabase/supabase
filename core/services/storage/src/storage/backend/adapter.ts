import { isS3Error, StorageBackendError } from '@internal/errors'
import { Readable } from 'stream'
import { getConfig } from '../../config'

/**
 * Browser cache headers
 */
export interface BrowserCacheHeaders {
  ifMatch?: string
  ifModifiedSince?: string
  ifNoneMatch?: string
  ifUnmodifiedSince?: string
  range?: string
}

/**
 * Representation of a file object Response
 */
export type ObjectResponse = {
  metadata: ObjectMetadata
  httpStatusCode: number
  body?: ReadableStream<unknown> | Readable | Blob | Buffer
}

/**
 * Representation of the object metadata
 */
export type ObjectMetadata = {
  cacheControl: string
  contentLength: number
  size: number
  mimetype: string
  lastModified?: Date
  eTag: string
  contentRange?: string
  httpStatusCode?: number
  xRobotsTag?: string
}

export type UploadPart = {
  Version?: string
  ETag?: string
  PartNumber?: number
  ChecksumCRC32?: string
  ChecksumCRC32C?: string
  ChecksumSHA1?: string
  ChecksumSHA256?: string
}

export type CopyObjectOptions = {
  copyMetadata?: boolean
}

export type HeadObjectOptions = {
  /** Confirm ambiguous absence with an extra backend request. Defaults to false. */
  confirmMissing?: boolean
}

export interface DeleteObjectDetailedResult {
  key: string
  // DELETED also covers an already-absent key. UNKNOWN may have been deleted.
  outcome: 'DELETED' | 'FAILED' | 'UNKNOWN'
  error?: {
    code?: string
    message?: string
    httpStatusCode?: number
  }
}

/**
 * A generic storage Adapter to interact with files
 */
export abstract class StorageBackendAdapter {
  client: unknown
  constructor() {
    this.client = null
  }

  async list(
    bucket: string,
    options?: {
      prefix?: string
      delimiter?: string
      nextToken?: string
      startAfter?: string
      beforeDate?: Date
    }
  ): Promise<{ keys: { name: string; size: number }[]; nextToken?: string }> {
    throw new Error('list not implemented')
  }

  /**
   * Gets an object body and metadata
   * @param bucketName
   * @param key
   * @param headers
   */
  async getObject(
    bucketName: string,
    key: string,
    version: string | null | undefined,
    headers?: BrowserCacheHeaders,
    signal?: AbortSignal
  ): Promise<ObjectResponse> {
    throw new Error('getObject not implemented')
  }

  /**
   * Uploads and store an object
   * @param bucketName
   * @param key
   * @param body
   * @param contentType
   * @param cacheControl
   */
  async uploadObject(
    bucketName: string,
    key: string,
    version: string | null | undefined,
    body: NodeJS.ReadableStream,
    contentType: string,
    cacheControl: string,
    signal?: AbortSignal,
    contentLength?: number
  ): Promise<ObjectMetadata> {
    throw new Error('uploadObject not implemented')
  }

  /**
   * Deletes an object
   * @param bucket
   * @param key
   * @param version
   */
  async deleteObject(
    bucket: string,
    key: string,
    version: string | null | undefined
  ): Promise<void> {
    throw new Error('deleteObject not implemented')
  }

  /**
   * Copies an existing object to the given location
   * @param bucket
   * @param source
   * @param version
   * @param destination
   * @param destinationVersion
   * @param metadata
   * @param conditions
   */
  async copyObject(
    bucket: string,
    source: string,
    version: string | null | undefined,
    destination: string,
    destinationVersion: string | null | undefined,
    metadata?: { cacheControl?: string; mimetype?: string },
    conditions?: {
      ifMatch?: string
      ifNoneMatch?: string
      ifModifiedSince?: Date
      ifUnmodifiedSince?: Date
    },
    options?: CopyObjectOptions
  ): Promise<Pick<ObjectMetadata, 'httpStatusCode' | 'eTag' | 'lastModified'>> {
    throw new Error('copyObject not implemented')
  }

  /**
   * Deletes multiple objects
   * @param bucket
   * @param prefixes
   */
  async deleteObjects(bucket: string, prefixes: string[]): Promise<void> {
    throw new Error('deleteObjects not implemented')
  }

  /** Returns one deletion outcome per requested key, in request order. */
  async deleteObjectsDetailed(
    bucket: string,
    keys: string[]
  ): Promise<DeleteObjectDetailedResult[]> {
    throw new Error('deleteObjectsDetailed not implemented')
  }

  /**
   * Returns metadata information of a specific object
   * @param bucket
   * @param key
   * @param version
   */
  async headObject(
    bucket: string,
    key: string,
    version: string | null | undefined,
    options?: HeadObjectOptions
  ): Promise<ObjectMetadata> {
    throw new Error('headObject not implemented')
  }

  /**
   * Returns a private url that can only be accessed internally by the system
   * @param bucket
   * @param key
   * @param version
   */
  async privateAssetUrl(
    bucket: string,
    key: string,
    version: string | null | undefined
  ): Promise<string> {
    throw new Error('privateAssetUrl not implemented')
  }

  async createMultiPartUpload(
    bucketName: string,
    key: string,
    version: string | null | undefined,
    contentType: string,
    cacheControl: string,
    metadata?: Record<string, string>
  ): Promise<string | undefined> {
    throw new Error('not implemented')
  }

  async uploadPart(
    bucketName: string,
    key: string,
    version: string,
    uploadId: string,
    partNumber: number,
    body?: string | Uint8Array | Buffer | Readable,
    length?: number,
    signal?: AbortSignal
  ): Promise<{ ETag?: string }> {
    throw new Error('not implemented')
  }

  async completeMultipartUpload(
    bucketName: string,
    key: string,
    uploadId: string,
    version: string,
    parts: UploadPart[],
    opts?: { removePrefix?: boolean }
  ): Promise<
    Omit<UploadPart, 'PartNumber'> & {
      location?: string
      bucket?: string
      version: string
    }
  > {
    throw new Error('not implemented')
  }

  async abortMultipartUpload(
    bucketName: string,
    key: string,
    uploadId: string,
    version?: string | null
  ): Promise<void> {
    throw new Error('not implemented')
  }

  async uploadPartCopy(
    storageS3Bucket: string,
    key: string,
    version: string,
    UploadId: string,
    PartNumber: number,
    sourceKey: string,
    sourceKeyVersion?: string | null,
    bytes?: { fromByte: number; toByte: number }
  ): Promise<{ eTag?: string; lastModified?: Date }> {
    throw new Error('not implemented')
  }

  close(): void {
    // do nothing
  }
}

const { tusUseFileVersionSeparator } = getConfig()

export const PATH_SEPARATOR = '/'
export const FILE_VERSION_SEPARATOR = '-$v-'
export const SEPARATOR = tusUseFileVersionSeparator ? FILE_VERSION_SEPARATOR : PATH_SEPARATOR

export function withOptionalVersion(key: string, version?: string | null): string {
  return version ? `${key}${SEPARATOR}${version}` : key
}

export function splitOptionalVersion(key: string): { key: string; version: string | null } {
  const separatorIndex = key.lastIndexOf(SEPARATOR)
  const version = separatorIndex < 0 ? '' : key.slice(separatorIndex + SEPARATOR.length)
  if (version === '') return { key, version: null }

  return { key: key.slice(0, separatorIndex), version }
}

export function isMissingBackendObject(error: unknown): boolean {
  if (error instanceof StorageBackendError) {
    const cause = error.getOriginalError()
    return isS3Error(cause) && cause.name === 'NoSuchKey' && cause.$metadata.httpStatusCode === 404
  }
  return (error as NodeJS.ErrnoException | undefined)?.code === 'ENOENT'
}
