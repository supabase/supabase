import {
  AbortMultipartUploadCommandInput,
  CompleteMultipartUploadCommandInput,
  CopyObjectCommandInput,
  CreateMultipartUploadCommandInput,
  DeleteObjectCommandInput,
  DeleteObjectsCommandInput,
  GetObjectCommandInput,
  GetObjectTaggingCommandInput,
  HeadObjectCommandInput,
  ListMultipartUploadsCommandInput,
  ListObjectsCommandInput,
  ListObjectsV2CommandInput,
  ListObjectsV2Output,
  ListPartsCommandInput,
  PutObjectCommandInput,
  UploadPartCommandInput,
  UploadPartCopyCommandInput,
} from '@aws-sdk/client-s3'
import { decrypt, encrypt } from '@internal/auth'
import { ERRORS, ErrorCode, isS3Error, isStorageError } from '@internal/errors'
import { isValidHeader } from '@internal/http/header'
import { logger, logSchema } from '@internal/monitoring'
import { PassThrough, Readable } from 'stream'
import stream from 'stream/promises'
import { getConfig } from '../../../config'
import type { ObjectResponse } from '../../backend'
import {
  assertLifecycleApiEnabled,
  assertLifecycleWriteReady,
  LifecycleConfigurationValidationError,
  lifecycleConfigurationToS3,
  normalizeS3LifecycleConfiguration,
} from '../../lifecycle'
import { getFileSizeLimit, mustBeValidBucketName, mustBeValidKey } from '../../limits'
import { parseCopySourceRangeHeader } from '../../range'
import { S3MultipartUpload } from '../../schemas'
import { Storage } from '../../storage'
import { Uploader } from '../../uploader'
import { validateMimeType } from '../../validators/mime-type'
import { ByteLimitTransformStream } from './byte-limit-stream'
import { encodeRFC3986URIComponent } from './signature-v4'

const { storageS3Region, storageS3Bucket } = getConfig()

function encodeListResponseValue(value: string | undefined, encodingType: string | undefined) {
  return value !== undefined && encodingType === 'url' ? encodeRFC3986URIComponent(value) : value
}

function assertMultipartUploadIdentity(
  upload: Pick<S3MultipartUpload, 'bucket_id' | 'key'>,
  bucket: string | undefined,
  key: string | undefined,
  uploadId: string
) {
  if (upload.bucket_id !== bucket || upload.key !== key) {
    throw ERRORS.NoSuchUpload(uploadId)
  }
}

export function assertPartsAscending(parts: { PartNumber?: number }[]) {
  for (let i = 1; i < parts.length; i++) {
    if ((parts[i].PartNumber ?? 0) <= (parts[i - 1].PartNumber ?? 0)) {
      throw ERRORS.InvalidPartOrder()
    }
  }
}

function withLifecycleErrorMapping<T>(fn: () => T): T {
  try {
    return fn()
  } catch (error) {
    if (error instanceof LifecycleConfigurationValidationError) {
      if (error.category === 'INVALID_ARGUMENT') throw ERRORS.InvalidArgument(error.message, error)
      if (error.category === 'INVALID_REQUEST') throw ERRORS.InvalidRequest(error.message, error)
      throw ERRORS.MalformedXML(error.message, error)
    }
    throw error
  }
}

export const MAX_PART_SIZE = 5 * 1024 * 1024 * 1024 // 5GB

/**
 * Decodes a single URL-encoded segment of the x-amz-copy-source header.
 *
 * Object keys never contain "%", so a malformed escape cannot match a stored
 * object. Keep the raw segment so the request fails as not found instead of
 * throwing a URIError.
 */
function decodeCopySourceSegment(segment: string) {
  try {
    return decodeURIComponent(segment)
  } catch {
    return segment
  }
}

/**
 * Splits the x-amz-copy-source header into its source bucket and source key.
 *
 * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html
 * Decode before splitting the bucket from the key because the bucket separator
 * can also be encoded. Decode each segment separately to preserve the fallback
 * for malformed escapes without preventing valid segments from being decoded.
 */
export function parseCopySource(copySource: string) {
  const decodedPath = copySource.split('/').map(decodeCopySourceSegment).join('/')
  const path = decodedPath.startsWith('/') ? decodedPath.slice(1) : decodedPath
  const separator = path.indexOf('/')

  return {
    bucket: separator < 0 ? path : path.slice(0, separator),
    key: separator < 0 ? '' : path.slice(separator + 1),
  }
}

export class S3ProtocolHandler {
  constructor(
    protected readonly storage: Storage,
    protected readonly tenantId: string,
    protected readonly owner?: string
  ) {}

  /**
   * Returns the versioning state of a bucket.
   * default: versioning is suspended
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketVersioning.html
   */
  async getBucketVersioning() {
    return {
      responseBody: {
        VersioningConfiguration: {
          Status: 'Suspended',
          MfaDelete: 'Disabled',
        },
      },
    }
  }

  async getBucketLifecycle(bucketId: string) {
    assertLifecycleApiEnabled(bucketId)
    const configuration = await this.storage.getBucketLifecycle(bucketId)
    if (!configuration) {
      throw ERRORS.NoSuchLifecycleConfiguration(bucketId)
    }

    return {
      responseBody: lifecycleConfigurationToS3(configuration),
    }
  }

  async putBucketLifecycle(bucketId: string, input: unknown) {
    await assertLifecycleWriteReady(this.storage.db, bucketId)
    await this.storage.putBucketLifecycle(
      bucketId,
      withLifecycleErrorMapping(() => normalizeS3LifecycleConfiguration(input))
    )
    return { statusCode: 200 }
  }

  async deleteBucketLifecycle(bucketId: string) {
    assertLifecycleApiEnabled(bucketId)
    await this.storage.deleteBucketLifecycle(bucketId)
    return { statusCode: 204 }
  }

  /**
   * Returns the Region the bucket resides in
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetBucketLocation.html
   */
  async getBucketLocation() {
    return {
      responseBody: {
        LocationConstraint: storageS3Region ?? '',
      },
    }
  }

  /**
   * Returns a list of all buckets owned by the authenticated sender of the request
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListBuckets.html
   */
  async listBuckets() {
    const buckets = await this.storage.listBuckets('name,created_at')

    return {
      responseBody: {
        ListAllMyBucketsResult: {
          Buckets: {
            Bucket: buckets.map((bucket) => ({
              Name: bucket.name,
              CreationDate: bucket.created_at
                ? new Date(bucket.created_at || '').toISOString()
                : undefined,
            })),
          },
        },
      },
    }
  }

  /**
   * Creates a new S3 bucket.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateBucket.html
   *
   * @param Bucket
   * @param isPublic
   */
  async createBucket(Bucket: string, isPublic: boolean) {
    mustBeValidBucketName(Bucket || '')

    await this.storage.createBucket({
      name: Bucket,
      id: Bucket,
      public: isPublic,
      owner: this.owner,
    })

    return {
      headers: {
        Location: `/${Bucket}`,
      },
    }
  }

  /**
   * Deletes the S3 bucket. All objects in the bucket must be deleted before the bucket itself can be deleted.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteBucket.html
   *
   * @param name
   */
  async deleteBucket(name: string) {
    try {
      await this.storage.deleteBucket(name)
    } catch (e) {
      if (isStorageError(ErrorCode.ResourceNotEmpty, e)) {
        throw ERRORS.S3BucketNotEmpty(name, e)
      }
      throw e
    }

    return {
      statusCode: 204,
    }
  }

  /**
   * You can use this operation to determine if a bucket exists and if you have permission to access it. The action returns a 200 OK if the bucket exists and you have permission to access it.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadBucket.html
   *
   * @param name
   */
  async headBucket(name: string) {
    await this.storage.findBucket(name)
    return {
      statusCode: 200,
      headers: {
        'x-amz-bucket-region': storageS3Region,
      },
    }
  }

  /**
   * Returns some or all (up to 1,000) of the objects in a bucket.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjects.html
   * @param command
   */
  async listObjects(command: ListObjectsCommandInput) {
    const list = await this.listObjectsV2({
      Bucket: command.Bucket,
      Delimiter: command.Delimiter,
      EncodingType: command.EncodingType,
      MaxKeys: command.MaxKeys,
      Prefix: command.Prefix,
      StartAfter: command.Marker,
      cursorV1: true,
    })

    const v2Result = list.responseBody.ListBucketResult

    return {
      responseBody: {
        ListBucketResult: {
          Name: v2Result.Name,
          Prefix: v2Result.Prefix,
          Delimiter: v2Result.Delimiter,
          Marker: v2Result.StartAfter,
          ...(v2Result.IsTruncated && v2Result.NextContinuationToken && command.Delimiter
            ? { NextMarker: v2Result.NextContinuationToken }
            : {}),
          MaxKeys: v2Result.MaxKeys,
          IsTruncated: v2Result.IsTruncated,
          Contents: v2Result.Contents,
          CommonPrefixes: v2Result.CommonPrefixes,
          EncodingType: v2Result.EncodingType,
        },
      },
    }
  }

  /**
   * List objects in a bucket, implements the ListObjectsV2Command
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html
   *
   * @param command
   */
  async listObjectsV2(command: ListObjectsV2CommandInput & { cursorV1?: boolean }) {
    if (!command.Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    await this.storage.asSuperUser().findBucket(command.Bucket)

    const continuationToken = command.ContinuationToken
    const startAfter = command.StartAfter
    const encodingType = command.EncodingType
    const delimiter = command.Delimiter
    const prefix = command.Prefix || ''
    const maxKeys = command.MaxKeys
    const bucket = command.Bucket

    const limit = Math.min(maxKeys ?? 1000, 1000)

    const results =
      limit === 0
        ? {
            folders: [],
            objects: [],
            hasNext: false,
            nextCursor: undefined,
            nextCursorKey: undefined,
          }
        : await this.storage.from(bucket).listObjectsV2({
            prefix,
            delimiter,
            maxKeys: limit,
            cursor: continuationToken,
            startAfter,
            s3Compatible: true,
          })

    const commonPrefixes: { Prefix: string }[] = []
    for (const object of results.folders) {
      commonPrefixes.push({
        Prefix: encodeListResponseValue(object.name, encodingType) as string,
      })
    }

    const contents: NonNullable<ListObjectsV2Output['Contents']> = []
    for (const o of results.objects) {
      contents.push({
        Key: encodeListResponseValue(o.name, encodingType),
        LastModified: (o.updated_at ? new Date(o.updated_at).toISOString() : undefined) as
          | Date
          | undefined,
        ETag: o.metadata?.eTag as string,
        Size: (o.metadata?.size as number) || 0,
        StorageClass: 'STANDARD' as const,
      })
    }

    const response: { ListBucketResult: ListObjectsV2Output } = {
      ListBucketResult: {
        Name: bucket,
        Prefix: encodeListResponseValue(prefix, encodingType),
        ContinuationToken: continuationToken,
        StartAfter: encodeListResponseValue(startAfter, encodingType),
        Contents: contents,
        IsTruncated: results.hasNext,
        MaxKeys: limit,
        Delimiter: encodeListResponseValue(delimiter, encodingType),
        EncodingType: encodingType,
        KeyCount: results.objects.length + results.folders.length,
        CommonPrefixes: commonPrefixes,
      },
    }

    if (results.nextCursor) {
      if (command.cursorV1) {
        response.ListBucketResult.NextContinuationToken = encodeListResponseValue(
          results.nextCursorKey,
          encodingType
        )
      } else {
        response.ListBucketResult.NextContinuationToken = results.nextCursor
      }
    }

    return {
      responseBody: response,
    }
  }

  /**
   * This operation lists in-progress multipart uploads in a bucket.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListMultipartUploads.html
   *
   * @param command
   */
  async listMultipartUploads(command: ListMultipartUploadsCommandInput) {
    if (!command.Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    const limit = command.MaxUploads ?? 1000
    if (!Number.isInteger(limit) || limit < 1 || limit > 1000) {
      throw ERRORS.InvalidParameter('MaxUploads')
    }

    await this.storage.asSuperUser().findBucket(command.Bucket)

    const keyContinuationToken = command.KeyMarker
    const uploadContinuationToken = command.UploadIdMarker

    const encodingType = command.EncodingType
    const delimiter = command.Delimiter
    const prefix = command.Prefix || ''
    const bucket = command.Bucket

    const multipartUploads = await this.storage.db.listMultipartUploads(bucket, {
      prefix,
      deltimeter: delimiter,
      maxKeys: limit + 1,
      nextUploadKeyToken: keyContinuationToken
        ? decodeContinuationToken(keyContinuationToken)
        : undefined,
      nextUploadToken: uploadContinuationToken
        ? decodeContinuationToken(uploadContinuationToken)
        : undefined,
    })

    let results: Partial<S3MultipartUpload & { isFolder: boolean }>[] = multipartUploads
    let prevPrefix = ''

    if (delimiter) {
      const delimitedResults: Partial<S3MultipartUpload & { isFolder: boolean }>[] = []
      for (const object of multipartUploads) {
        let idx = object.key.slice(prefix.length).indexOf(delimiter)

        if (idx >= 0) {
          idx = prefix.length + idx + delimiter.length
          const currPrefix = object.key.substring(0, idx)
          if (currPrefix === prevPrefix) {
            continue
          }
          prevPrefix = currPrefix
          delimitedResults.push({
            isFolder: true,
            id: object.id,
            key: currPrefix,
            bucket_id: bucket,
          })
          continue
        }

        delimitedResults.push(object)
      }
      results = delimitedResults
    }

    const isTruncated = results.length > limit
    const resultCount = isTruncated ? limit : results.length

    const commonPrefixes: { Prefix: string | undefined }[] = []
    const uploads: {
      Key: string | undefined
      Initiated: string | undefined
      UploadId: string | undefined
      StorageClass: 'STANDARD'
    }[] = []

    for (let index = 0; index < resultCount; index++) {
      const object = results[index]

      if (object.isFolder) {
        commonPrefixes.push({
          Prefix: encodeListResponseValue(object.key, encodingType),
        })
      } else {
        uploads.push({
          Key: encodeListResponseValue(object.key, encodingType),
          Initiated: object.created_at ? new Date(object.created_at).toISOString() : undefined,
          UploadId: object.id,
          StorageClass: 'STANDARD',
        })
      }
    }

    let keyNextContinuationToken: string | undefined
    let uploadNextContinuationToken: string | undefined

    if (isTruncated) {
      const lastItem = results[resultCount - 1]
      keyNextContinuationToken = encodeContinuationToken(lastItem.key!)
      uploadNextContinuationToken = encodeContinuationToken(lastItem.id!)
    }

    const response = {
      ListMultipartUploadsResult: {
        Bucket: bucket,
        Prefix: encodeListResponseValue(prefix, encodingType),
        KeyMarker: keyContinuationToken,
        UploadIdMarker: uploadContinuationToken,
        NextKeyMarker: keyNextContinuationToken,
        NextUploadIdMarker: uploadNextContinuationToken,
        Upload: uploads,
        IsTruncated: isTruncated,
        MaxUploads: limit,
        Delimiter: encodeListResponseValue(delimiter, encodingType),
        EncodingType: encodingType,
        CommonPrefixes: commonPrefixes,
      },
    }

    return {
      responseBody: response,
    }
  }

  /**
   * This action initiates a multipart upload and returns an upload ID
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CreateMultipartUpload.html
   *
   * @param command
   */
  async createMultiPartUpload(command: CreateMultipartUploadCommandInput) {
    const uploader = new Uploader(this.storage.backend, this.storage.db, this.storage.location)
    const { Bucket, Key } = command

    mustBeValidBucketName(Bucket)
    mustBeValidKey(Key)

    const bucket = await this.storage.asSuperUser().findBucket(Bucket, 'id,allowed_mime_types')

    if (command.ContentType && bucket.allowed_mime_types && bucket.allowed_mime_types.length > 0) {
      validateMimeType(command.ContentType, bucket.allowed_mime_types || [])
    }

    // Create Multi Part Upload
    const version = await uploader.prepareUpload({
      bucketId: command.Bucket as string,
      objectName: command.Key as string,
      isUpsert: true,
      owner: this.owner,
      userMetadata: command.Metadata,
      metadata: {
        mimetype: command.ContentType,
      },
      uploadType: 's3',
    })

    const uploadId = await this.storage.backend.createMultiPartUpload(
      storageS3Bucket,
      this.storage.location.getKeyLocation({
        bucketId: command.Bucket as string,
        objectName: command.Key as string,
        tenantId: this.tenantId,
      }),
      version,
      command.ContentType || '',
      command.CacheControl || ''
    )

    if (!uploadId) {
      throw ERRORS.InvalidUploadId(uploadId)
    }

    const signature = this.uploadSignature({ in_progress_size: 0 })
    await this.storage.db
      .asSuperUser()
      .createMultipartUpload(
        uploadId,
        Bucket,
        Key,
        version,
        signature,
        this.owner,
        command.Metadata,
        { mimetype: command.ContentType }
      )

    return {
      responseBody: {
        InitiateMultipartUploadResult: {
          Bucket: command.Bucket,
          Key: `${command.Key}`,
          UploadId: uploadId,
        },
      },
    }
  }

  /**
   * Completes a multipart upload by assembling previously uploaded parts.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CompleteMultipartUpload.html
   *
   * @param command
   */
  async completeMultiPartUpload(command: CompleteMultipartUploadCommandInput) {
    const uploader = new Uploader(this.storage.backend, this.storage.db, this.storage.location)
    const { Bucket, Key, UploadId } = command

    if (!UploadId) {
      throw ERRORS.InvalidUploadId()
    }

    const multiPartUpload = await this.storage.db
      .asSuperUser()
      .findMultipartUpload(UploadId, 'id,version,user_metadata,metadata,bucket_id,key')

    assertMultipartUploadIdentity(multiPartUpload, Bucket, Key, UploadId)

    await uploader.canUpload({
      bucketId: Bucket as string,
      objectName: Key as string,
      isUpsert: true,
      owner: this.owner,
      userMetadata: multiPartUpload.user_metadata || undefined,
      metadata: multiPartUpload.metadata || undefined,
    })

    const parts = command.MultipartUpload?.Parts || []

    assertPartsAscending(parts)

    if (parts.length === 0) {
      const allParts = await this.storage.db.asSuperUser().listParts(UploadId, {
        maxParts: 10000,
      })

      parts.push(
        ...allParts.map((part) => ({
          PartNumber: part.part_number,
          ETag: part.etag,
        }))
      )
    }

    const resp = await this.storage.backend.completeMultipartUpload(
      storageS3Bucket,
      this.storage.location.getKeyLocation({
        bucketId: Bucket as string,
        objectName: Key as string,
        tenantId: this.tenantId,
      }),
      UploadId as string,
      multiPartUpload.version,
      parts,
      { removePrefix: true }
    )

    const metadata = await this.storage.backend.headObject(
      storageS3Bucket,
      this.storage.location.getKeyLocation({
        bucketId: Bucket as string,
        objectName: Key as string,
        tenantId: this.tenantId,
      }),
      resp.version
    )

    await uploader.completeUpload({
      bucketId: Bucket as string,
      objectName: Key as string,
      version: resp.version,
      isUpsert: true,
      uploadType: 's3',
      objectMetadata: metadata,
      owner: this.owner,
      userMetadata: multiPartUpload.user_metadata || undefined,
    })

    await this.storage.db.asSuperUser().deleteMultipartUpload(UploadId)

    return {
      responseBody: {
        CompleteMultipartUploadResult: {
          Location: `${Bucket}/${Key}`,
          Bucket,
          Key,
          ChecksumCRC32: resp.ChecksumCRC32,
          ChecksumCRC32C: resp.ChecksumCRC32C,
          ChecksumSHA1: resp.ChecksumSHA1,
          ChecksumSHA256: resp.ChecksumSHA256,
          ETag: resp.ETag,
        },
      },
    }
  }

  /**
   * Uploads a part in a multipart upload.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_UploadPart.html
   * @param command
   * @param signal
   */
  async uploadPart(command: UploadPartCommandInput, { signal }: { signal?: AbortSignal }) {
    if (signal?.aborted) {
      throw ERRORS.AbortedTerminate('UploadPart aborted')
    }

    const { Bucket, PartNumber, UploadId, Key, Body, ContentLength } = command

    if (!UploadId) {
      throw ERRORS.InvalidUploadId()
    }

    if (!Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    if (typeof ContentLength === 'undefined') {
      throw ERRORS.MissingContentLength()
    }

    const multipartData = await this.storage.db
      .asSuperUser()
      .findMultipartUpload(UploadId, 'version,user_metadata,metadata,bucket_id,key')

    assertMultipartUploadIdentity(multipartData, Bucket, Key, UploadId)

    const bucket = await this.storage.asSuperUser().findBucket(Bucket, 'file_size_limit')
    const maxFileSize = await getFileSizeLimit(this.storage.db.tenantId, bucket?.file_size_limit)

    const uploader = new Uploader(this.storage.backend, this.storage.db, this.storage.location)

    await uploader.canUpload({
      bucketId: Bucket as string,
      objectName: Key as string,
      owner: this.owner,
      isUpsert: true,
      userMetadata: multipartData.user_metadata || undefined,
      metadata: multipartData.metadata || undefined,
    })

    const multipart = await this.shouldAllowPartUpload(UploadId, ContentLength, maxFileSize)

    if (signal?.aborted) {
      throw ERRORS.AbortedTerminate('UploadPart aborted')
    }

    const proxy = new PassThrough()

    if (Body instanceof Readable) {
      proxy.on('error', () => {
        Body.unpipe(proxy)
      })

      Body.on('error', (err) => {
        if (!proxy.closed) {
          proxy.destroy(err)
        }
      })
    }

    const body = Body instanceof Readable ? Body.pipe(proxy) : Readable.from(Body as Buffer)

    try {
      const uploadPart = await stream.pipeline(
        body,
        new ByteLimitTransformStream(ContentLength),
        async (stream) => {
          return this.storage.backend.uploadPart(
            storageS3Bucket,
            this.storage.location.getKeyLocation({
              bucketId: Bucket as string,
              objectName: Key as string,
              tenantId: this.tenantId,
            }),
            multipart.version,
            UploadId,
            PartNumber || 0,
            stream as Readable,
            ContentLength,
            signal
          )
        }
      )

      await this.storage.db.asSuperUser().insertUploadPart({
        upload_id: UploadId,
        version: multipart.version,
        part_number: PartNumber || 0,
        etag: uploadPart.ETag || '',
        key: Key as string,
        bucket_id: Bucket,
        owner_id: this.owner,
      })

      return {
        headers: {
          etag: uploadPart.ETag || '',
          'Access-Control-Expose-Headers': 'etag',
        },
      }
    } catch (e) {
      try {
        await this.storage.db.asSuperUser().withTransaction(async (db) => {
          const multipart = await db.findMultipartUpload(UploadId, 'in_progress_size', {
            forUpdate: true,
          })

          const diff = multipart.in_progress_size - ContentLength
          const signature = this.uploadSignature({ in_progress_size: diff })
          await db.updateMultipartUploadProgress(UploadId, diff, signature)
        })
      } catch (e) {
        logSchema.error(logger, 'Failed to update multipart upload progress', {
          type: 's3',
          error: e,
        })
      }

      if (e instanceof Error && e.name === 'AbortError') {
        throw ERRORS.AbortedTerminate('UploadPart aborted')
      }

      throw e
    }
  }

  /**
   * Adds an object to a bucket.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_PutObject.html
   *
   * @param command
   * @param options
   */
  async putObject(
    command: PutObjectCommandInput,
    options: {
      signal?: AbortSignal
      isTruncated: () => boolean
      declaredContentLength?: number
    }
  ) {
    const uploader = new Uploader(this.storage.backend, this.storage.db, this.storage.location)

    mustBeValidBucketName(command.Bucket)
    mustBeValidKey(command.Key)

    const upload = await uploader.upload({
      bucketId: command.Bucket as string,
      file: {
        body: command.Body as Readable,
        cacheControl: command.CacheControl!,
        mimeType: command.ContentType!,
        contentLength: command.ContentLength,
        declaredContentLength: options.declaredContentLength,
        isTruncated: options.isTruncated,
      },
      objectName: command.Key as string,
      userMetadata: command.Metadata,
      owner: this.owner,
      isUpsert: true,
      uploadType: 's3',
      signal: options.signal,
    })

    return {
      headers: {
        etag: upload.metadata.eTag,
      },
    }
  }

  /**
   * This operation aborts a multipart upload
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_AbortMultipartUpload.html
   *
   * @param command
   */
  async abortMultipartUpload(command: AbortMultipartUploadCommandInput) {
    const { Bucket, Key, UploadId } = command

    if (!UploadId) {
      throw ERRORS.InvalidUploadId()
    }

    if (!Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    if (!Key) {
      throw ERRORS.MissingParameter('Key')
    }

    const multipart = await this.storage.db
      .asSuperUser()
      .findMultipartUpload(UploadId, 'id,version,user_metadata,metadata,bucket_id,key')

    assertMultipartUploadIdentity(multipart, Bucket, Key, UploadId)

    const uploader = new Uploader(this.storage.backend, this.storage.db, this.storage.location)
    await uploader.canUpload({
      bucketId: Bucket,
      objectName: Key,
      owner: this.owner,
      isUpsert: true,
      userMetadata: multipart.user_metadata || undefined,
      metadata: multipart.metadata || undefined,
    })

    try {
      await this.storage.backend.abortMultipartUpload(
        storageS3Bucket,
        this.storage.location.getKeyLocation({
          bucketId: Bucket,
          objectName: Key,
          tenantId: this.tenantId,
        }),
        UploadId,
        multipart.version
      )
    } catch (e) {
      // gracefully continue if the upload part was already deleted/aborted on the S3 side
      // error.name: NoSuchUpload
      // error.message: The specified upload does not exist. The upload ID may be invalid, or the upload may have been aborted or completed.
      if (!isS3Error(e) || e.name !== 'NoSuchUpload') {
        throw e
      }
    }

    await this.storage.db.asSuperUser().deleteMultipartUpload(UploadId)

    return {}
  }

  async headObject(command: HeadObjectCommandInput) {
    const { Bucket, Key } = command

    if (!Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    if (!Key) {
      throw ERRORS.MissingParameter('Key')
    }

    const r = await this.storage.backend.headObject(Bucket, Key, undefined)

    return {
      headers: {
        'cache-control': r.cacheControl || '',
        'content-length': r.contentLength?.toString() || '0',
        'content-type': r.mimetype || '',
        etag: r.eTag || '',
        'last-modified': r.lastModified?.toUTCString() || '',
      },
    }
  }

  /**
   * The HEAD operation retrieves metadata from an object without returning the object itself. This operation is useful if you're interested only in an object's metadata.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_HeadObject.html
   *
   * @param command
   * @param opts
   */
  async dbHeadObject(command: HeadObjectCommandInput) {
    const { Bucket, Key } = command

    if (!Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    if (!Key) {
      throw ERRORS.MissingParameter('Key')
    }

    const object = await this.storage
      .from(Bucket)
      .findObject(Key, 'metadata,user_metadata,created_at,updated_at')

    if (!object) {
      throw ERRORS.NoSuchKey(Key)
    }

    let metadataHeaders: Record<string, unknown> = {}

    if (object.user_metadata) {
      metadataHeaders = toAwsMetadataHeaders(object.user_metadata)
    }

    return {
      headers: {
        'created-at': (object.created_at as string) || '',
        'cache-control': (object.metadata?.cacheControl as string) || '',
        expires: (object.metadata?.expires as string) || '',
        'content-length': String(object.metadata?.size ?? ''),
        'content-type': (object.metadata?.mimetype as string) || '',
        etag: (object.metadata?.eTag as string) || '',
        'last-modified': object.updated_at ? new Date(object.updated_at).toUTCString() || '' : '',
        ...metadataHeaders,
      },
    }
  }

  async getObjectTagging(command: GetObjectTaggingCommandInput) {
    const { Bucket, Key } = command

    if (!Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    if (!Key) {
      throw ERRORS.MissingParameter('Key')
    }

    const object = await this.storage.from(Bucket).findObject(Key, 'id')

    if (!object) {
      throw ERRORS.NoSuchKey(Key)
    }

    // TODO: implement tagging when supported
    return {
      responseBody: {
        Tagging: {
          TagSet: null,
        },
      },
    }
  }

  /**
   * Retrieves an object from Amazon S3.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_GetObject.html
   *
   * @param command
   * @param options
   */
  async getObject(
    command: GetObjectCommandInput,
    options?: { skipDbCheck?: boolean; signal?: AbortSignal }
  ) {
    const bucket = command.Bucket as string
    const key = command.Key as string

    let version: string | undefined
    let userMetadata: Record<string, unknown> | undefined | null

    if (!options?.skipDbCheck) {
      const object = await this.storage.from(bucket).findObject(key, 'version,user_metadata')
      version = object.version
      userMetadata = object.user_metadata
    }

    let response: ObjectResponse
    try {
      response = await this.storage.backend.getObject(
        this.storage.location.getRootLocation(),
        this.storage.location.getKeyLocation({
          bucketId: bucket,
          objectName: key,
          tenantId: this.tenantId,
        }),
        version,
        {
          ifMatch: command.IfMatch,
          ifModifiedSince: command.IfModifiedSince?.toISOString(),
          ifNoneMatch: command.IfNoneMatch,
          ifUnmodifiedSince: command.IfUnmodifiedSince?.toISOString(),
          range: command.Range,
        },
        options?.signal
      )
    } catch (error) {
      // The S3 SDK rejects on a 304; the file backend returns it as a value.
      if (isS3Error(error) && error.$metadata.httpStatusCode === 304) {
        const upstream = error.$response?.headers
        const headers: Record<string, string> = {
          'cache-control': upstream?.['cache-control'] || '',
          etag: upstream?.etag || '',
          'last-modified': upstream?.['last-modified'] || '',
        }
        return { headers, responseBody: undefined, statusCode: 304 }
      }
      throw error
    }

    let metadataHeaders: Record<string, unknown> = {}

    if (userMetadata) {
      metadataHeaders = toAwsMetadataHeaders(userMetadata)
    }

    const headers: Record<string, string> = {
      'cache-control': response.metadata.cacheControl,
      'content-length':
        (response.httpStatusCode === 304
          ? response.metadata.size
          : response.metadata.contentLength
        )?.toString() || '0',
      'content-range': response.metadata.contentRange?.toString() || '',
      'content-type': response.metadata.mimetype,
      etag: response.metadata.eTag,
      'last-modified': response.metadata.lastModified?.toUTCString() || '',
      ...metadataHeaders,
    }

    // Handle response header overrides
    if (
      command.ResponseContentDisposition &&
      isValidHeader('content-disposition', command.ResponseContentDisposition)
    ) {
      headers['content-disposition'] = command.ResponseContentDisposition
    }
    if (command.ResponseContentType && isValidHeader('content-type', command.ResponseContentType)) {
      headers['content-type'] = command.ResponseContentType
    }
    if (
      command.ResponseCacheControl &&
      isValidHeader('cache-control', command.ResponseCacheControl)
    ) {
      headers['cache-control'] = command.ResponseCacheControl
    }
    if (
      command.ResponseContentEncoding &&
      isValidHeader('content-encoding', command.ResponseContentEncoding)
    ) {
      headers['content-encoding'] = command.ResponseContentEncoding
    }
    if (
      command.ResponseContentLanguage &&
      isValidHeader('content-language', command.ResponseContentLanguage)
    ) {
      headers['content-language'] = command.ResponseContentLanguage
    }
    if (command.ResponseExpires) {
      headers['expires'] = command.ResponseExpires.toUTCString()
    }

    return {
      headers,
      responseBody: response.body,
      statusCode: response.httpStatusCode,
    }
  }

  /**
   * Removes an object from a bucket.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObject.html
   *
   * @param command
   */
  async deleteObject(command: DeleteObjectCommandInput) {
    const { Bucket, Key } = command

    if (!Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    if (!Key) {
      throw ERRORS.MissingParameter('Key')
    }

    try {
      await this.storage.from(Bucket).deleteObject(Key)
    } catch (e) {
      if (!isStorageError(ErrorCode.NoSuchKey, e)) {
        throw e
      }

      await this.storage.asSuperUser().findBucket(Bucket)
    }

    return {
      statusCode: 204,
    }
  }

  /**
   * This operation enables you to delete multiple objects from a bucket using a single HTTP request.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_DeleteObjects.html
   *
   * @param command
   */
  async deleteObjects(command: DeleteObjectsCommandInput) {
    const { Bucket, Delete } = command

    if (!Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    if (!Delete) {
      throw ERRORS.MissingParameter('Delete')
    }

    if (!Array.isArray(Delete.Objects)) {
      throw ERRORS.InvalidParameter('Objects')
    }

    if (Delete.Objects.length === 0) {
      await this.storage.asSuperUser().findBucket(Bucket)
      return { responseBody: { DeleteResult: { Deleted: [], Error: [] } } }
    }

    const requestedKeys: string[] = []
    for (const object of Delete.Objects) {
      if (object.Key !== undefined) {
        requestedKeys.push(object.Key || '')
      }
    }

    const deletedObjects = await this.storage.from(Bucket).deleteObjects(requestedKeys)
    const deletedNames = new Set<string>()
    for (const object of deletedObjects) {
      deletedNames.add(object.name)
    }

    const unresolvedKeys: string[] = []
    for (const key of requestedKeys) {
      if (!deletedNames.has(key)) {
        unresolvedKeys.push(key)
      }
    }

    const remainingObjects =
      unresolvedKeys.length > 0
        ? await this.storage.asSuperUser().from(Bucket).findObjects(unresolvedKeys, 'name')
        : []

    if (deletedObjects.length === 0 && remainingObjects.length === 0) {
      await this.storage.asSuperUser().findBucket(Bucket)
    }

    const remainingNames = new Set<string>()
    for (const object of remainingObjects) {
      remainingNames.add(object.name)
    }

    const deleted: { Key: string }[] = []
    const errors: { Key?: string; Code: string; Message: string }[] = []

    for (const object of Delete.Objects) {
      if (
        object.Key !== undefined &&
        (deletedNames.has(object.Key) || !remainingNames.has(object.Key))
      ) {
        deleted.push({ Key: object.Key })
      } else {
        errors.push({
          Key: object.Key,
          Code: 'AccessDenied',
          Message: 'Access Denied',
        })
      }
    }

    return {
      responseBody: {
        DeleteResult: {
          Deleted: Delete.Quiet ? [] : deleted,
          Error: errors,
        },
      },
    }
  }

  /**
   * Creates a copy of an object that is already stored in Amazon S3.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_CopyObject.html
   *
   * @param command
   */
  async copyObject(command: CopyObjectCommandInput) {
    const { Bucket, Key, CopySource } = command

    if (!Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    if (!Key) {
      throw ERRORS.MissingParameter('Key')
    }

    if (!CopySource) {
      throw ERRORS.MissingParameter('CopySource')
    }

    const { bucket: sourceBucket, key: sourceKey } = parseCopySource(CopySource)

    if (!sourceBucket) {
      throw ERRORS.InvalidBucketName('')
    }

    if (!sourceKey) {
      throw ERRORS.MissingParameter('CopySource')
    }

    if (!command.MetadataDirective) {
      // default metadata directive is copy
      command.MetadataDirective = 'COPY'
    }

    const copyResult = await this.storage.from(sourceBucket).copyObject({
      sourceKey,
      destinationBucket: Bucket,
      destinationKey: Key,
      owner: this.owner,
      upsert: true,
      conditions: {
        ifMatch: command.CopySourceIfMatch,
        ifNoneMatch: command.CopySourceIfNoneMatch,
        ifModifiedSince: command.CopySourceIfModifiedSince,
        ifUnmodifiedSince: command.CopySourceIfUnmodifiedSince,
      },
      metadata: {
        cacheControl: command.CacheControl,
        mimetype: command.ContentType,
      },
      userMetadata: command.Metadata,
      copyMetadata: command.MetadataDirective === 'COPY',
      uploadType: 's3',
    })

    return {
      responseBody: {
        CopyObjectResult: {
          ETag: copyResult.eTag,
          LastModified: copyResult.lastModified?.toISOString(),
        },
      },
    }
  }

  /**
   * Lists the parts that have been uploaded for a specific multipart upload.
   *
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListParts.html
   *
   * @param command
   */
  async listParts(command: ListPartsCommandInput) {
    if (!command.UploadId) {
      throw ERRORS.MissingParameter('UploadId')
    }

    const multipart = await this.storage.db
      .asSuperUser()
      .findMultipartUpload(command.UploadId, 'id,bucket_id,key')

    assertMultipartUploadIdentity(multipart, command.Bucket, command.Key, command.UploadId)

    const maxParts = Math.min(command.MaxParts || 1000, 1000)

    const result = await this.storage.db.listParts(command.UploadId, {
      afterPart: command.PartNumberMarker,
      maxParts: maxParts + 1,
    })

    const isTruncated = result.length > maxParts
    const resultCount = isTruncated ? maxParts : result.length
    const nextPartNumberMarker = isTruncated ? result[resultCount - 1].part_number : undefined

    const parts: {
      PartNumber: number
      LastModified: string | undefined
      ETag: string | undefined
    }[] = []
    for (let index = 0; index < resultCount; index++) {
      const part = result[index]
      parts.push({
        PartNumber: part.part_number,
        LastModified: part.created_at ? new Date(part.created_at).toISOString() : undefined,
        ETag: part.etag,
      })
    }

    return {
      responseBody: {
        ListPartsResult: {
          Bucket: command.Bucket,
          Key: command.Key,
          UploadId: command.UploadId,
          PartNumberMarker: command.PartNumberMarker,
          NextPartNumberMarker: nextPartNumberMarker,
          MaxParts: maxParts,
          IsTruncated: isTruncated,
          Part: parts,
        },
      },
    }
  }

  /**
   * Uploads a part by copying data from an existing object as data source. To specify the data source, you add the request header x-amz-copy-source in your request. To specify a byte range, you add the request header x-amz-copy-source-range in your request.
   * Reference: https://docs.aws.amazon.com/AmazonS3/latest/API/API_UploadPartCopy.html
   *
   * @param command UploadPartCopyCommandInput
   */
  async uploadPartCopy(command: UploadPartCopyCommandInput) {
    const { Bucket, Key, UploadId, PartNumber, CopySource, CopySourceRange } = command

    if (!UploadId) {
      throw ERRORS.MissingParameter('UploadId')
    }

    if (!Bucket) {
      throw ERRORS.MissingParameter('Bucket')
    }

    if (!Key) {
      throw ERRORS.MissingParameter('Key')
    }

    if (!PartNumber) {
      throw ERRORS.MissingParameter('PartNumber')
    }

    if (!CopySource) {
      throw ERRORS.MissingParameter('CopySource')
    }

    const { bucket: sourceBucketName, key: sourceKey } = parseCopySource(CopySource)

    if (!sourceBucketName) {
      throw ERRORS.NoSuchBucket('')
    }

    if (!sourceKey) {
      throw ERRORS.NoSuchKey('')
    }

    const multipartData = await this.storage.db
      .asSuperUser()
      .findMultipartUpload(UploadId, 'version,user_metadata,metadata,bucket_id,key')

    assertMultipartUploadIdentity(multipartData, Bucket, Key, UploadId)

    // Check if copy source exists
    const copySource = await this.storage.db.findObject(
      sourceBucketName,
      sourceKey,
      'id,name,version,metadata'
    )

    const sourceSize = Number(copySource.metadata?.size ?? 0)
    let copySize = sourceSize
    let rangeBytes: { fromByte: number; toByte: number } | undefined = undefined

    if (CopySourceRange) {
      const range = parseCopySourceRangeHeader(CopySourceRange, sourceSize)
      rangeBytes = range
      copySize = range.size
    }

    const uploader = new Uploader(this.storage.backend, this.storage.db, this.storage.location)

    const [destinationBucket] = await this.storage.db.asSuperUser().withTransaction(async (db) => {
      return Promise.all([
        db.findBucketById(Bucket, 'file_size_limit'),
        db.findBucketById(sourceBucketName, 'id'),
      ])
    })
    const maxFileSize = await getFileSizeLimit(
      this.storage.db.tenantId,
      destinationBucket?.file_size_limit
    )

    await uploader.canUpload({
      bucketId: Bucket,
      objectName: Key,
      owner: this.owner,
      isUpsert: true,
      userMetadata: multipartData.user_metadata || undefined,
      metadata: multipartData.metadata || undefined,
    })

    const multipart = await this.shouldAllowPartUpload(UploadId, Number(copySize), maxFileSize)

    const uploadPart = await this.storage.backend.uploadPartCopy(
      storageS3Bucket,
      this.storage.location.getKeyLocation({
        bucketId: Bucket,
        objectName: Key,
        tenantId: this.tenantId,
      }),
      multipart.version,
      UploadId,
      PartNumber,
      this.storage.location.getKeyLocation({
        bucketId: sourceBucketName,
        objectName: copySource.name,
        tenantId: this.tenantId,
      }),
      copySource.version,
      rangeBytes
    )

    await this.storage.db.asSuperUser().insertUploadPart({
      upload_id: UploadId,
      version: multipart.version,
      part_number: PartNumber,
      etag: uploadPart.eTag || '',
      key: Key as string,
      bucket_id: Bucket,
      owner_id: this.owner,
    })

    return {
      responseBody: {
        CopyPartResult: {
          ETag: uploadPart.eTag || '',
          LastModified: uploadPart.lastModified ? uploadPart.lastModified.toISOString() : undefined,
        },
      },
    }
  }

  parseMetadataHeaders(headers: Record<string, unknown>): Record<string, string> | undefined {
    let metadata: Record<string, string> | undefined
    const metadataPrefix = 'x-amz-meta-'

    for (const key in headers) {
      if (!key.startsWith(metadataPrefix)) {
        continue
      }

      if (!Object.prototype.hasOwnProperty.call(headers, key)) {
        continue
      }

      const value = headers[key]
      if (typeof value !== 'string') {
        continue
      }

      if (!metadata) {
        metadata = {}
      }

      metadata[key.slice(metadataPrefix.length)] = value
    }

    return metadata
  }

  protected uploadSignature({ in_progress_size }: { in_progress_size: number }) {
    return `${encrypt('progress:' + in_progress_size.toString())}`
  }

  protected decryptUploadSignature(signature: string) {
    const originalSignature = decrypt(signature)
    const [, value] = originalSignature.split(':')

    return {
      progress: parseInt(value, 10),
    }
  }

  protected async shouldAllowPartUpload(
    uploadId: string,
    contentLength: number,
    maxFileSize: number
  ) {
    return this.storage.db.asSuperUser().withTransaction(async (db) => {
      const multipart = await db.findMultipartUpload(
        uploadId,
        'in_progress_size,version,upload_signature,user_metadata,metadata',
        {
          forUpdate: true,
        }
      )

      const { progress } = this.decryptUploadSignature(multipart.upload_signature)

      if (progress !== multipart.in_progress_size) {
        throw ERRORS.InvalidUploadSignature()
      }

      const currentProgress = multipart.in_progress_size + contentLength

      if (currentProgress > maxFileSize) {
        throw ERRORS.EntityTooLarge()
      }

      const signature = this.uploadSignature({ in_progress_size: currentProgress })
      await db.updateMultipartUploadProgress(uploadId, currentProgress, signature)
      return multipart
    })
  }
}

function toAwsMetadataHeaders(records: Record<string, unknown>) {
  const metadataHeaders: Record<string, unknown> = {}
  let missingCount = 0

  for (const key in records) {
    if (!Object.prototype.hasOwnProperty.call(records, key)) {
      continue
    }

    if (key.length === 0) {
      missingCount++
      continue
    }

    const value = records[key]
    const headerName = 'x-amz-meta-' + key.toLowerCase()
    if (typeof value === 'string' && isUSASCII(value) && isValidHeader(headerName, value)) {
      metadataHeaders[headerName] = value
    } else {
      missingCount++
    }
  }

  if (missingCount > 0) {
    metadataHeaders['x-amz-missing-meta'] = missingCount
  }

  return metadataHeaders
}

function isUSASCII(str: string): boolean {
  for (let i = 0; i < str.length; i++) {
    if (str.charCodeAt(i) > 127) {
      return false
    }
  }
  return true
}

function encodeContinuationToken(name: string) {
  return Buffer.from(`l:${name}`).toString('base64')
}

function decodeContinuationToken(token: string) {
  const decoded = Buffer.from(token, 'base64').toString()

  if (!decoded.startsWith('l:')) {
    throw ERRORS.InvalidParameter('continuation token')
  }

  return decoded.slice(2)
}
