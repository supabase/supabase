import { Readable } from 'node:stream'
import {
  AbortMultipartUploadCommand,
  CompleteMultipartUploadCommand,
  CopyObjectCommand,
  CreateMultipartUploadCommand,
  DeleteObjectCommand,
  DeleteObjectsCommand,
  DeleteObjectsCommandOutput,
  GetObjectCommand,
  GetObjectCommandInput,
  HeadObjectCommand,
  ListObjectsV2Command,
  ListPartsCommand,
  PutObjectCommand,
  S3Client,
  S3ClientConfig,
  UploadPartCommand,
  UploadPartCopyCommand,
} from '@aws-sdk/client-s3'
import { Progress, Upload } from '@aws-sdk/lib-storage'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { ERRORS, ErrorCode, isS3Error, StorageBackendError } from '@internal/errors'
import { createAgent, InstrumentedAgent } from '@internal/http'
import { monitorStream } from '@internal/streams'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { BackupObjectInfo, ObjectBackup } from '@storage/backend/s3/backup'
import { MAX_KEYS_PER_S3_DELETE } from '@storage/limits'
import { getConfig } from '../../../config'
import {
  BrowserCacheHeaders,
  CopyObjectOptions,
  DeleteObjectDetailedResult,
  HeadObjectOptions,
  ObjectMetadata,
  ObjectResponse,
  StorageBackendAdapter,
  UploadPart,
  withOptionalVersion,
} from './../adapter'

const {
  storageS3UploadPartSize,
  storageS3UploadQueueSize,
  tracingFeatures,
  storageS3MaxSockets,
  tracingEnabled,
  storageS3RequestChecksumCalculation,
  storageS3ResponseChecksumValidation,
} = getConfig()

export const MAX_PUT_OBJECT_SIZE = 5 * 1024 * 1024 * 1024 // 5GB
const MISSING_OBJECT_CONFIRMATION_TIMEOUT_MS = 5000

export interface S3ClientOptions {
  endpoint?: string
  privateAssetEndpoint?: string
  region?: string
  forcePathStyle?: boolean
  accessKey?: string
  secretKey?: string
  role?: string
  httpAgent?: InstrumentedAgent
  socketTimeout?: number
}

function encodeCopySource(bucket: string, key: string, version?: string | null) {
  return encodeURIComponent(`${bucket}/${withOptionalVersion(key, version)}`)
}

/**
 * S3Backend
 * Interacts with a s3-compatible file system with this S3Adapter
 */
export class S3Backend implements StorageBackendAdapter {
  client: S3Client
  private privateAssetClient: S3Client
  agent: InstrumentedAgent

  constructor(options: S3ClientOptions) {
    this.agent =
      options.httpAgent ??
      createAgent('s3_default', {
        maxSockets: storageS3MaxSockets,
      })

    if (this.agent.httpsAgent && tracingEnabled) {
      this.agent.monitor()
    }

    // Default client for API operations
    this.client = this.createS3Client({
      ...options,
      name: 's3_default',
      httpAgent: this.agent,
    })

    this.privateAssetClient = options.privateAssetEndpoint
      ? this.createS3Client({
          ...options,
          endpoint: options.privateAssetEndpoint,
          name: 's3_private_asset',
          httpAgent: this.agent,
        })
      : this.client
  }

  /**
   * Gets an object body and metadata
   * @param bucketName
   * @param key
   * @param version
   * @param headers
   * @param signal
   */
  async getObject(
    bucketName: string,
    key: string,
    version: string | null | undefined,
    headers?: BrowserCacheHeaders,
    signal?: AbortSignal
  ): Promise<ObjectResponse> {
    const input: GetObjectCommandInput = {
      Bucket: bucketName,
      IfMatch: headers?.ifMatch,
      IfNoneMatch: headers?.ifNoneMatch,
      Key: withOptionalVersion(key, version),
      Range: headers?.range,
    }
    if (headers?.ifModifiedSince) {
      input.IfModifiedSince = new Date(headers.ifModifiedSince)
    }
    if (headers?.ifUnmodifiedSince) {
      input.IfUnmodifiedSince = new Date(headers.ifUnmodifiedSince)
    }
    const command = new GetObjectCommand(input)
    const data = await this.client.send(command, {
      abortSignal: signal,
    })

    return {
      metadata: {
        cacheControl: data.CacheControl || 'no-cache',
        mimetype: data.ContentType || 'application/octet-stream',
        eTag: data.ETag || '',
        lastModified: data.LastModified,
        contentRange: data.ContentRange,
        contentLength: data.ContentLength || 0,
        size: data.ContentLength || 0,
        httpStatusCode: data.$metadata.httpStatusCode || 200,
      },
      httpStatusCode: data.$metadata.httpStatusCode || 200,
      body: data.Body,
    }
  }

  /**
   * Uploads and store an object
   * Max 5GB
   * @param bucketName
   * @param key
   * @param version
   * @param body
   * @param contentType
   * @param cacheControl
   * @param signal
   * @param contentLength
   */
  async uploadObject(
    bucketName: string,
    key: string,
    version: string | null | undefined,
    body: Readable,
    contentType: string,
    cacheControl: string,
    signal?: AbortSignal,
    contentLength?: number
  ): Promise<ObjectMetadata> {
    if (signal?.aborted) {
      throw ERRORS.Aborted('Upload was aborted')
    }

    if (typeof contentLength !== 'number' || contentLength > MAX_PUT_OBJECT_SIZE) {
      // Use multipart when the length is unknown or exceeds S3's 5GB single-request limit.
      return this.bufferedMultipartUpload(
        bucketName,
        key,
        version,
        body,
        contentType,
        cacheControl,
        signal
      )
    }

    // Use PutObject directly when content-length is known and within S3's single-object limit (5GB).
    // This avoids the buffering overhead of the Upload class which buffers each part in memory.
    return this.putObject(
      bucketName,
      key,
      version,
      body,
      contentType,
      cacheControl,
      signal,
      contentLength
    )
  }

  protected async putObject(
    bucketName: string,
    key: string,
    version: string | null | undefined,
    body: Readable,
    contentType: string,
    cacheControl: string,
    signal: AbortSignal | undefined,
    contentLength: number
  ): Promise<ObjectMetadata> {
    const dataStream = tracingFeatures?.upload ? monitorStream(body) : body

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: withOptionalVersion(key, version),
      Body: dataStream,
      ContentType: contentType,
      CacheControl: cacheControl,
      ContentLength: contentLength,
    })

    try {
      const data = await this.client.send(command, {
        abortSignal: signal,
      })

      return {
        httpStatusCode: data.$metadata.httpStatusCode || 200,
        cacheControl,
        eTag: data.ETag || '',
        mimetype: contentType,
        contentLength,
        // PutObject does not return LastModified; keep the fast path single-request and use the local completion time.
        lastModified: new Date(),
        size: contentLength,
        contentRange: undefined,
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw ERRORS.AbortedTerminate('Upload was aborted', err)
      }
      throw StorageBackendError.fromError(err)
    }
  }

  protected async bufferedMultipartUpload(
    bucketName: string,
    key: string,
    version: string | null | undefined,
    body: Readable,
    contentType: string,
    cacheControl: string,
    signal?: AbortSignal
  ): Promise<ObjectMetadata> {
    const dataStream = tracingFeatures?.upload ? monitorStream(body) : body

    const upload = new Upload({
      client: this.client,
      partSize: storageS3UploadPartSize,
      queueSize: storageS3UploadQueueSize,
      params: {
        Bucket: bucketName,
        Key: withOptionalVersion(key, version),
        Body: dataStream,
        ContentType: contentType,
        CacheControl: cacheControl,
      },
    })

    signal?.addEventListener('abort', () => upload.abort(), { once: true })

    let hasUploadedBytes = false
    const progressHandler = (progress: Progress) => {
      if (!hasUploadedBytes && progress.loaded && progress.loaded > 0) {
        hasUploadedBytes = true
      }
      if (tracingFeatures?.upload) {
        dataStream.emit('s3_progress', JSON.stringify(progress))
      }
    }
    upload.on('httpUploadProgress', progressHandler)

    try {
      const data = await upload.done()

      upload.off('httpUploadProgress', progressHandler)

      const metadata: ObjectMetadata = hasUploadedBytes
        ? await this.headObject(bucketName, key, version)
        : {
            httpStatusCode: 200,
            cacheControl,
            eTag: data.ETag || '',
            mimetype: contentType,
            lastModified: new Date(),
            size: 0,
            contentLength: 0,
            contentRange: undefined,
          }

      return {
        httpStatusCode: data.$metadata.httpStatusCode || metadata.httpStatusCode,
        cacheControl,
        eTag: metadata.eTag,
        mimetype: metadata.mimetype,
        contentLength: metadata.contentLength,
        lastModified: metadata.lastModified,
        size: metadata.size,
        contentRange: metadata.contentRange,
      }
    } catch (err) {
      upload.off('httpUploadProgress', progressHandler)

      if (err instanceof Error && err.name === 'AbortError') {
        throw ERRORS.AbortedTerminate('Upload was aborted', err)
      }
      throw StorageBackendError.fromError(err)
    }
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
    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: withOptionalVersion(key, version),
    })
    await this.client.send(command)
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
    try {
      // Moves call backend copy without metadata; preserve source metadata for that path.
      const copyMetadata = options?.copyMetadata ?? !metadata
      const command = new CopyObjectCommand({
        Bucket: bucket,
        CopySource: encodeCopySource(bucket, source, version),
        Key: withOptionalVersion(destination, destinationVersion),
        CopySourceIfMatch: conditions?.ifMatch,
        CopySourceIfNoneMatch: conditions?.ifNoneMatch,
        CopySourceIfModifiedSince: conditions?.ifModifiedSince,
        CopySourceIfUnmodifiedSince: conditions?.ifUnmodifiedSince,
        ContentType: copyMetadata ? undefined : metadata?.mimetype,
        CacheControl: copyMetadata ? undefined : metadata?.cacheControl,
        MetadataDirective: copyMetadata ? 'COPY' : 'REPLACE',
      })
      const data = await this.client.send(command)
      return {
        httpStatusCode: data.$metadata.httpStatusCode || 200,
        eTag: data.CopyObjectResult?.ETag || '',
        lastModified: data.CopyObjectResult?.LastModified,
      }
    } catch (e) {
      const error = StorageBackendError.fromError(e)
      if (isS3Error(e) && e.name === 'PreconditionFailed') {
        error.code = ErrorCode.PreconditionFailed
      }
      throw error
    }
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
    try {
      const command = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: options?.prefix,
        Delimiter: options?.delimiter,
        ContinuationToken: options?.nextToken || undefined,
        StartAfter: options?.startAfter,
      })
      const data = await this.client.send(command)
      const keys: { name: string; size: number }[] = []

      for (const ele of data.Contents || []) {
        if (!ele.Key) {
          continue
        }

        if (options?.beforeDate && (!ele.LastModified || ele.LastModified >= options.beforeDate)) {
          continue
        }

        if (options?.prefix) {
          keys.push({
            // remove prefix and leading slash if present
            name: ele.Key.replace(options.prefix, '').replace(/^\//, ''),
            size: ele.Size as number,
          })
        } else {
          keys.push({ name: ele.Key, size: ele.Size as number })
        }
      }

      return {
        keys,
        nextToken: data.NextContinuationToken,
      }
    } catch (e) {
      throw StorageBackendError.fromError(e)
    }
  }

  /**
   * Deletes multiple objects
   * @param bucket
   * @param prefixes
   */
  async deleteObjects(bucket: string, prefixes: string[]): Promise<void> {
    try {
      const batches = await this.deleteObjectBatches(bucket, prefixes)
      const failure = batches.find(({ result }) => result.status === 'rejected')
      if (failure?.result.status === 'rejected') throw failure.result.reason
    } catch (error) {
      throw StorageBackendError.fromError(error)
    }
  }

  async deleteObjectsDetailed(
    bucket: string,
    keys: string[]
  ): Promise<DeleteObjectDetailedResult[]> {
    const batches = await this.deleteObjectBatches(bucket, keys)
    return batches.flatMap(({ keys: requested, result }) => {
      if (result.status === 'rejected') {
        const error = StorageBackendError.fromError(result.reason)
        return requested.map((key) => ({
          key,
          outcome: 'UNKNOWN' as const,
          error: {
            code: error.code,
            message: error.message,
            httpStatusCode: error.httpStatusCode,
          },
        }))
      }

      const deleted = new Set(
        (result.value.Deleted ?? []).flatMap((entry) =>
          typeof entry.Key === 'string' ? [entry.Key] : []
        )
      )
      const errors = new Map(
        (result.value.Errors ?? []).flatMap((entry) =>
          typeof entry.Key === 'string' ? [[entry.Key, entry] as const] : []
        )
      )
      return requested.map((key): DeleteObjectDetailedResult => {
        const error = errors.get(key)
        if (error && deleted.has(key)) {
          return {
            key,
            outcome: 'UNKNOWN',
            error: {
              message: 'S3 delete response contained conflicting results for this requested key',
            },
          }
        }
        if (error) {
          return {
            key,
            outcome: 'FAILED',
            error: { code: error.Code, message: error.Message },
          }
        }
        if (deleted.has(key)) return { key, outcome: 'DELETED' }
        return {
          key,
          outcome: 'UNKNOWN',
          error: { message: 'S3 delete response did not contain this requested key' },
        }
      })
    })
  }

  private async deleteObjectBatches(bucket: string, keys: string[]) {
    const requests: Array<{
      keys: string[]
      request: Promise<DeleteObjectsCommandOutput>
    }> = []
    for (let index = 0; index < keys.length; index += MAX_KEYS_PER_S3_DELETE) {
      const chunk = keys.slice(index, index + MAX_KEYS_PER_S3_DELETE)
      requests.push({
        keys: chunk,
        request: this.client.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: chunk.map((key) => ({ Key: key })), Quiet: false },
          })
        ),
      })
    }

    const results = await Promise.allSettled(requests.map(({ request }) => request))
    return results.map((result, index) => ({ keys: requests[index].keys, result }))
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
    try {
      const command = new HeadObjectCommand({
        Bucket: bucket,
        Key: withOptionalVersion(key, version),
      })
      const data = await this.client.send(command)
      return {
        cacheControl: data.CacheControl || 'no-cache',
        mimetype: data.ContentType || 'application/octet-stream',
        eTag: data.ETag || '',
        lastModified: data.LastModified,
        contentLength: data.ContentLength || 0,
        httpStatusCode: data.$metadata.httpStatusCode || 200,
        size: data.ContentLength || 0,
      }
    } catch (e) {
      if (
        options?.confirmMissing &&
        isS3Error(e) &&
        e.$metadata.httpStatusCode === 404 &&
        e.name !== 'NoSuchKey' &&
        e.name !== 'NoSuchBucket'
      ) {
        // HEAD has no error body. A missing bucket and a missing object can both
        // appear as NotFound, so destructive callers need GET's structured error.
        await this.confirmMissingObject(bucket, withOptionalVersion(key, version))
      }
      throw StorageBackendError.fromError(e)
    }
  }

  private async confirmMissingObject(bucket: string, key: string): Promise<void> {
    try {
      const response = await this.client.send(
        new GetObjectCommand({ Bucket: bucket, Key: key, Range: 'bytes=0-0' }),
        { abortSignal: AbortSignal.timeout(MISSING_OBJECT_CONFIRMATION_TIMEOUT_MS) }
      )
      if (response.Body instanceof Readable) response.Body.destroy()
      else if (response.Body instanceof ReadableStream) await response.Body.cancel()
    } catch (error) {
      if (
        isS3Error(error) &&
        error.$metadata.httpStatusCode === 404 &&
        (error.name === 'NoSuchKey' || error.name === 'NoSuchBucket')
      ) {
        throw StorageBackendError.fromError(error)
      }
      // Inconclusive confirmation leaves the original HEAD error intact.
    }
  }

  async listParts(
    bucket: string,
    key: string,
    uploadId?: string,
    maxParts?: number,
    marker?: string
  ) {
    try {
      const command = new ListPartsCommand({
        Bucket: bucket,
        Key: key,
        UploadId: uploadId,
        PartNumberMarker: marker,
        MaxParts: maxParts,
      })

      const result = await this.client.send(command)

      return {
        parts: result.Parts || [],
        nextPartNumberMarker: result.NextPartNumberMarker,
        isTruncated: result.IsTruncated || false,
        httpStatusCode: result.$metadata.httpStatusCode || 200,
      }
    } catch (e) {
      throw StorageBackendError.fromError(e)
    }
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
    const input: GetObjectCommandInput = {
      Bucket: bucket,
      Key: withOptionalVersion(key, version),
    }

    const command = new GetObjectCommand(input)
    return getSignedUrl(this.privateAssetClient, command, { expiresIn: 600 })
  }

  async createMultiPartUpload(
    bucketName: string,
    key: string,
    version: string | null | undefined,
    contentType: string,
    cacheControl: string,
    metadata?: Record<string, string>
  ) {
    const createMultiPart = new CreateMultipartUploadCommand({
      Bucket: bucketName,
      Key: withOptionalVersion(key, version),
      CacheControl: cacheControl,
      ContentType: contentType,
      Metadata: metadata
        ? {
            ...metadata,
            Version: version || '',
          }
        : undefined,
    })

    const resp = await this.client.send(createMultiPart)

    if (!resp.UploadId) {
      throw ERRORS.InvalidUploadId()
    }

    return resp.UploadId
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
  ) {
    try {
      const paralellUploadS3 = new UploadPartCommand({
        Bucket: bucketName,
        Key: withOptionalVersion(key, version),
        UploadId: uploadId,
        PartNumber: partNumber,
        Body: body,
        ContentLength: length,
      })

      const resp = await this.client.send(paralellUploadS3, {
        abortSignal: signal,
      })

      return {
        version,
        ETag: resp.ETag,
      }
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') {
        throw ERRORS.AbortedTerminate('Upload was aborted', e)
      }

      throw StorageBackendError.fromError(e)
    }
  }

  async completeMultipartUpload(
    bucketName: string,
    key: string,
    uploadId: string,
    version: string,
    parts: UploadPart[],
    opts?: { removePrefix?: boolean }
  ) {
    const keyParts = key.split('/')

    if (parts.length === 0) {
      const listPartsInput = new ListPartsCommand({
        Bucket: bucketName,
        Key: withOptionalVersion(key, version),
        UploadId: uploadId,
      })

      const partsResponse = await this.client.send(listPartsInput)
      parts = partsResponse.Parts || []
    }

    const completeUpload = new CompleteMultipartUploadCommand({
      Bucket: bucketName,
      Key: withOptionalVersion(key, version),
      UploadId: uploadId,
      MultipartUpload:
        parts.length === 0
          ? undefined
          : {
              Parts: parts,
            },
    })

    const response = await this.client.send(completeUpload)

    let location = key
    let bucket = bucketName

    if (opts?.removePrefix) {
      const locationParts = key.split('/')
      locationParts.shift() // tenant-id

      bucket = keyParts.shift() || ''
      location = keyParts.join('/')
    }

    return {
      version,
      location,
      bucket,
      ...response,
    }
  }

  async abortMultipartUpload(
    bucketName: string,
    key: string,
    uploadId: string,
    version?: string | null
  ): Promise<void> {
    const abortUpload = new AbortMultipartUploadCommand({
      Bucket: bucketName,
      Key: withOptionalVersion(key, version),
      UploadId: uploadId,
    })
    await this.client.send(abortUpload)
  }

  async uploadPartCopy(
    storageS3Bucket: string,
    key: string,
    version: string,
    UploadId: string,
    PartNumber: number,
    sourceKey: string,
    sourceKeyVersion?: string | null,
    bytesRange?: { fromByte: number; toByte: number }
  ) {
    const uploadPartCopy = new UploadPartCopyCommand({
      Bucket: storageS3Bucket,
      Key: withOptionalVersion(key, version),
      UploadId,
      PartNumber,
      CopySource: encodeCopySource(storageS3Bucket, sourceKey, sourceKeyVersion),
      CopySourceRange: bytesRange ? `bytes=${bytesRange.fromByte}-${bytesRange.toByte}` : undefined,
    })

    const part = await this.client.send(uploadPartCopy)

    return {
      eTag: part.CopyPartResult?.ETag,
      lastModified: part.CopyPartResult?.LastModified,
    }
  }

  async backup(backupInfo: BackupObjectInfo) {
    return new ObjectBackup(this.client, backupInfo).backup()
  }

  close() {
    this.agent.close()
  }

  protected createS3Client(options: S3ClientOptions & { name: string }) {
    const params: S3ClientConfig = {
      region: options.region,
      runtime: 'node',
      requestStreamBufferSize: 32 * 1024,
      requestHandler: new NodeHttpHandler({
        httpAgent: options.httpAgent?.httpAgent,
        httpsAgent: options.httpAgent?.httpsAgent,
        connectionTimeout: 5000,
        socketTimeout: options.socketTimeout,
      }),
    }
    if (options.endpoint) {
      params.endpoint = options.endpoint
    }
    if (options.forcePathStyle) {
      params.forcePathStyle = true
    }

    if (storageS3RequestChecksumCalculation) {
      params.requestChecksumCalculation = storageS3RequestChecksumCalculation
    }
    if (storageS3ResponseChecksumValidation) {
      params.responseChecksumValidation = storageS3ResponseChecksumValidation
    }
    const client = new S3Client(params)
    client.middlewareStack.remove('loggerMiddleware')
    return client
  }
}
