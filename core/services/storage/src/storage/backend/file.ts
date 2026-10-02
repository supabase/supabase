import type { Stats } from 'node:fs'
import fs from 'node:fs'
import * as fsp from 'node:fs/promises'
import { ERRORS, ErrorCode, StorageBackendError } from '@internal/errors'
import { ensureDir, ensureFile, pathExists, removePath } from '@internal/fs'
import { createHash, randomUUID } from 'crypto'
import * as xattr from 'fs-xattr'
import path from 'path'
import stream from 'stream'
import { promisify } from 'util'
import { getConfig } from '../../config'
import { parseRangeHeader } from '../range'
import {
  BrowserCacheHeaders,
  CopyObjectOptions,
  DeleteObjectDetailedResult,
  ObjectMetadata,
  ObjectResponse,
  StorageBackendAdapter,
  UploadPart,
  withOptionalVersion,
} from './adapter'
import { resolveSecureFilesystemPath } from './secure-path'

const pipeline = promisify(stream.pipeline)

interface FileMetadata {
  cacheControl?: string
  contentType?: string
}

function isMissingXattrError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException | undefined)?.code
  return code === 'ENODATA' || code === 'ENOATTR'
}

// file metadata attribute keys on different platforms
const METADATA_ATTR_KEYS = {
  darwin: {
    'cache-control': 'com.apple.metadata.supabase.cache-control',
    'content-type': 'com.apple.metadata.supabase.content-type',
    etag: 'com.apple.metadata.supabase.etag',
  },
  linux: {
    'cache-control': 'user.supabase.cache-control',
    'content-type': 'user.supabase.content-type',
    etag: 'user.supabase.etag',
  },
}

/**
 * FileBackend
 * Interacts with the file system with this FileBackend adapter
 */
export class FileBackend implements StorageBackendAdapter {
  client = null
  filePath: string
  etagAlgorithm: 'mtime' | 'md5'

  constructor() {
    const { storageFilePath, storageFileEtagAlgorithm } = getConfig()
    if (!storageFilePath) {
      throw new Error('FILE_STORAGE_BACKEND_PATH env variable not set')
    }
    this.filePath = path.isAbsolute(storageFilePath)
      ? storageFilePath
      : path.resolve(__dirname, '..', '..', '..', storageFilePath)
    this.etagAlgorithm = storageFileEtagAlgorithm
  }

  async list(
    bucket: string,
    options?: {
      prefix?: string
      delimiter?: string
      nextToken?: string
      startAfter?: string
    }
  ): Promise<{ keys: { name: string; size: number }[]; nextToken?: string }> {
    return Promise.resolve({ keys: [] })
  }

  /**
   * Gets an object body and metadata
   * @param bucketName
   * @param key
   * @param version
   * @param headers
   */
  async getObject(
    bucketName: string,
    key: string,
    version: string | null | undefined,
    headers?: BrowserCacheHeaders
  ): Promise<ObjectResponse> {
    // 'Range: bytes=#######-######
    const file = this.resolveSecurePath(withOptionalVersion(`${bucketName}/${key}`, version))
    const data = await fsp.stat(file)
    const eTag = await this.etag(file, data)
    const fileSize = data.size
    const { cacheControl, mimetype } = await this.getFileMetadata(file)
    const lastModified = data.mtime

    // RFC 9110 13.1.4: If-Unmodified-Since is ignored when If-Match is present.
    const preconditionFailed =
      headers?.ifMatch !== undefined
        ? !matchesETag(headers.ifMatch, eTag)
        : headers?.ifUnmodifiedSince !== undefined &&
          toSeconds(lastModified) > toSeconds(new Date(headers.ifUnmodifiedSince))

    if (preconditionFailed) {
      throw StorageBackendError.withStatusCode(412, {
        error: 'PreconditionFailed',
        code: ErrorCode.PreconditionFailed,
        httpStatusCode: 412,
        message: 'PreconditionFailed',
      })
    }

    // RFC 9110 13.1.3: If-Modified-Since is ignored when If-None-Match is present.
    const notModified =
      (headers?.ifNoneMatch && matchesETag(headers.ifNoneMatch, eTag)) ||
      (headers?.ifNoneMatch === undefined &&
        headers?.ifModifiedSince &&
        toSeconds(lastModified) <= toSeconds(new Date(headers.ifModifiedSince)))

    if (notModified) {
      return {
        metadata: {
          cacheControl,
          mimetype,
          lastModified,
          httpStatusCode: 304,
          size: data.size,
          eTag,
          contentLength: 0,
        },
        body: undefined,
        httpStatusCode: 304,
      }
    }

    if (headers?.range) {
      const range = parseRangeHeader(headers.range, fileSize)
      const body = fs.createReadStream(file, { start: range.fromByte, end: range.toByte })

      return {
        metadata: {
          cacheControl,
          mimetype,
          lastModified,
          contentRange: `bytes ${range.fromByte}-${range.toByte}/${fileSize}`,
          httpStatusCode: 206,
          size: range.size,
          eTag,
          contentLength: range.size,
        },
        httpStatusCode: 206,
        body,
      }
    } else {
      const body = fs.createReadStream(file)
      return {
        metadata: {
          cacheControl,
          mimetype,
          lastModified,
          httpStatusCode: 200,
          size: data.size,
          eTag,
          contentLength: fileSize,
        },
        body,
        httpStatusCode: 200,
      }
    }
  }

  /**
   * Uploads and store an object
   * @param bucketName
   * @param key
   * @param version
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
    try {
      const file = this.resolveSecurePath(withOptionalVersion(`${bucketName}/${key}`, version))
      await ensureFile(file)
      const destFile = fs.createWriteStream(file)
      await pipeline(body, destFile)

      await this.setFileMetadata(file, {
        contentType: contentType || 'application/octet-stream',
        cacheControl: cacheControl || 'no-cache',
      })

      const metadata = await this.headObject(bucketName, key, version)

      return {
        ...metadata,
        httpStatusCode: 200,
      }
    } catch (err: unknown) {
      if (err instanceof StorageBackendError) {
        throw err
      }
      throw StorageBackendError.fromError(err)
    }
  }

  /**
   * Deletes an object from the file system
   * @param bucket
   * @param key
   * @param version
   */
  async deleteObject(
    bucket: string,
    key: string,
    version: string | null | undefined
  ): Promise<void> {
    try {
      const file = this.resolveSecurePath(withOptionalVersion(`${bucket}/${key}`, version))
      await removePath(file)

      // Clean up empty parent directories
      await this.cleanupEmptyDirectories(path.dirname(file))
    } catch (e) {
      if (e instanceof Error && 'code' in e && e.code === 'ENOENT') {
        return
      }
      throw e
    }
  }

  /**
   * Copies an existing object to the given location
   * @param bucket
   * @param source
   * @param version
   * @param destination
   * @param destinationVersion
   * @param metadata
   */
  async copyObject(
    bucket: string,
    source: string,
    version: string | null | undefined,
    destination: string,
    destinationVersion: string | null | undefined,
    metadata?: { cacheControl?: string; contentType?: string; mimetype?: string },
    conditions?: {
      ifMatch?: string
      ifNoneMatch?: string
      ifModifiedSince?: Date
      ifUnmodifiedSince?: Date
    },
    options?: CopyObjectOptions
  ): Promise<Pick<ObjectMetadata, 'httpStatusCode' | 'eTag' | 'lastModified'>> {
    const srcFile = this.resolveSecurePath(withOptionalVersion(`${bucket}/${source}`, version))
    const destFile = this.resolveSecurePath(
      withOptionalVersion(`${bucket}/${destination}`, destinationVersion)
    )

    // Only stat the source when a precondition is actually set (the S3 handler
    // always passes a conditions object) and only hash it for the etag
    // conditions: md5 etags read the whole file.
    if (conditions && Object.values(conditions).some((value) => value !== undefined)) {
      const srcStat = await fsp.stat(srcFile)
      const eTag =
        conditions.ifMatch !== undefined || conditions.ifNoneMatch !== undefined
          ? await this.etag(srcFile, srcStat)
          : ''
      assertCopySourcePreconditions(conditions, eTag, srcStat.mtime)
    }

    await ensureFile(destFile)
    await fsp.copyFile(srcFile, destFile)

    // Moves call backend copy without metadata; preserve source metadata for that path.
    const copyMetadata = options?.copyMetadata ?? !metadata
    const destinationMetadata = copyMetadata
      ? await this.getStoredFileMetadata(srcFile)
      : {
          cacheControl: metadata?.cacheControl,
          contentType: metadata?.contentType ?? metadata?.mimetype,
        }
    await this.setFileMetadata(destFile, destinationMetadata)

    const fileStat = await fsp.lstat(destFile)
    const eTag = await this.etag(destFile, fileStat)

    return {
      httpStatusCode: 200,
      lastModified: fileStat.mtime,
      eTag,
    }
  }

  /**
   * Deletes multiple objects
   * @param bucket
   * @param prefixes
   */
  async deleteObjects(bucket: string, prefixes: string[]): Promise<void> {
    const results = await this.deleteObjectPaths(bucket, prefixes)
    const failure = results.find((result) => result.status === 'rejected')
    if (failure?.status === 'rejected') throw failure.reason
  }

  async deleteObjectsDetailed(
    bucket: string,
    keys: string[]
  ): Promise<DeleteObjectDetailedResult[]> {
    const results = await this.deleteObjectPaths(bucket, keys)
    return results.map((result, index): DeleteObjectDetailedResult => {
      if (result.status === 'fulfilled') {
        return { key: keys[index], outcome: 'DELETED' }
      }
      // Recursive removal can reject after deleting part of a directory.
      return {
        key: keys[index],
        outcome: 'UNKNOWN',
        error: {
          code: (result.reason as NodeJS.ErrnoException | undefined)?.code,
          message: result.reason instanceof Error ? result.reason.message : String(result.reason),
        },
      }
    })
  }

  private async deleteObjectPaths(bucket: string, keys: string[]) {
    const paths = keys.map((key) => this.resolveSecurePath(`${bucket}/${key}`))
    const results = await Promise.allSettled(paths.map((filePath) => removePath(filePath)))

    const parentDirs = new Set<string>()
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') parentDirs.add(path.dirname(paths[index]))
    })

    // Clean up empty directories
    for (const dir of parentDirs) {
      try {
        await this.cleanupEmptyDirectories(dir)
      } catch {
        // Ignore cleanup errors to not affect the main deletion operation
      }
    }

    return results
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
    version: string | null | undefined
  ): Promise<ObjectMetadata> {
    const file = this.resolveSecurePath(withOptionalVersion(`${bucket}/${key}`, version))

    const data = await fsp.stat(file)
    const { cacheControl, mimetype } = await this.getFileMetadata(file)
    const lastModified = data.mtime
    const eTag = await this.etag(file, data)

    return {
      httpStatusCode: 200,
      size: data.size,
      cacheControl,
      mimetype,
      eTag,
      lastModified,
      contentLength: data.size,
    }
  }

  async createMultiPartUpload(
    bucketName: string,
    key: string,
    version: string | null | undefined,
    contentType: string,
    cacheControl: string
  ): Promise<string | undefined> {
    const uploadId = randomUUID()
    const multiPartFolder = this.resolveSecurePath(
      path.join('multiparts', uploadId, bucketName, withOptionalVersion(key, version))
    )
    const multipartFile = this.resolveSecurePath(
      path.join(
        'multiparts',
        uploadId,
        bucketName,
        withOptionalVersion(key, version),
        'metadata.json'
      )
    )
    await ensureDir(multiPartFolder)
    await fsp.writeFile(multipartFile, JSON.stringify({ contentType, cacheControl }))

    return uploadId
  }

  async uploadPart(
    bucketName: string,
    key: string,
    version: string,
    uploadId: string,
    partNumber: number,
    body: stream.Readable
  ): Promise<{ ETag?: string }> {
    const partPath = this.resolveSecurePath(
      path.join(
        'multiparts',
        uploadId,
        bucketName,
        withOptionalVersion(key, version),
        `part-${partNumber}`
      )
    )

    const writeStream = fs.createWriteStream(partPath)

    await pipeline(body, writeStream)

    const etag = await this.computeMd5(partPath)

    const platform = process.platform === 'darwin' ? 'darwin' : 'linux'
    await this.setMetadataAttr(partPath, METADATA_ATTR_KEYS[platform]['etag'], etag)

    return { ETag: etag }
  }

  async completeMultipartUpload(
    bucketName: string,
    key: string,
    uploadId: string,
    version: string,
    parts: UploadPart[]
  ): Promise<
    Omit<UploadPart, 'PartNumber'> & {
      location?: string
      bucket?: string
      version: string
    }
  > {
    const orderedParts = [...parts].sort((a, b) => (a.PartNumber ?? 0) - (b.PartNumber ?? 0))
    const partsByEtags = orderedParts.map(async (part) => {
      const partFilePath = this.resolveSecurePath(
        path.join(
          'multiparts',
          uploadId,
          bucketName,
          withOptionalVersion(key, version),
          `part-${part.PartNumber}`
        )
      )
      const partExists = await pathExists(partFilePath)

      if (partExists) {
        const platform = process.platform === 'darwin' ? 'darwin' : 'linux'
        const etag = await this.getMetadataAttr(partFilePath, METADATA_ATTR_KEYS[platform]['etag'])
        if (etag === part.ETag) {
          return partFilePath
        }
        throw ERRORS.InvalidChecksum(`Invalid ETag for part ${part.PartNumber}`)
      }

      throw ERRORS.MissingPart(part.PartNumber || 0, uploadId)
    })

    const finalParts = await Promise.all(partsByEtags)

    const multipartStream = this.mergePartStreams(finalParts)
    const metadataContent = await fsp.readFile(
      this.resolveSecurePath(
        path.join(
          'multiparts',
          uploadId,
          bucketName,
          withOptionalVersion(key, version),
          'metadata.json'
        )
      ),
      'utf-8'
    )

    const metadata = JSON.parse(metadataContent)

    const uploaded = await this.uploadObject(
      bucketName,
      key,
      version,
      multipartStream,
      metadata.contentType,
      metadata.cacheControl
    )

    removePath(this.resolveSecurePath(path.join('multiparts', uploadId))).catch(() => {
      // no-op
    })

    return {
      version,
      ETag: uploaded.eTag,
      bucket: bucketName,
      location: `${bucketName}/${key}`,
    }
  }

  async abortMultipartUpload(
    bucketName: string,
    key: string,
    uploadId: string,
    version?: string | null
  ): Promise<void> {
    const multiPartFolder = this.resolveSecurePath(path.join('multiparts', uploadId))

    await removePath(multiPartFolder)

    // Clean up empty parent directories
    try {
      await this.cleanupEmptyDirectories(path.dirname(multiPartFolder))
    } catch {
      // Ignore cleanup errors
    }
  }

  async uploadPartCopy(
    storageS3Bucket: string,
    key: string,
    version: string,
    UploadId: string,
    PartNumber: number,
    sourceKey: string,
    sourceVersion?: string | null,
    rangeBytes?: { fromByte: number; toByte: number }
  ): Promise<{ eTag?: string; lastModified?: Date }> {
    const partFilePath = this.resolveSecurePath(
      path.join(
        'multiparts',
        UploadId,
        storageS3Bucket,
        withOptionalVersion(key, version),
        `part-${PartNumber}`
      )
    )
    const sourceFilePath = this.resolveSecurePath(
      `${storageS3Bucket}/${withOptionalVersion(sourceKey, sourceVersion)}`
    )

    const platform = process.platform === 'darwin' ? 'darwin' : 'linux'

    const readStreamOptions = rangeBytes
      ? { start: rangeBytes.fromByte, end: rangeBytes.toByte }
      : {}
    const partStream = fs.createReadStream(sourceFilePath, readStreamOptions)

    const writePart = fs.createWriteStream(partFilePath)
    await pipeline(partStream, writePart)

    const etag = await this.computeMd5(partFilePath)
    await this.setMetadataAttr(partFilePath, METADATA_ATTR_KEYS[platform]['etag'], etag)

    const fileStat = await fsp.lstat(partFilePath)

    return {
      eTag: etag,
      lastModified: fileStat.mtime,
    }
  }

  private mergePartStreams(partPaths: string[]): stream.Readable {
    return stream.Readable.from(this.iteratePartChunks(partPaths))
  }

  private async *iteratePartChunks(partPaths: string[]): AsyncGenerator<Buffer> {
    for (const partPath of partPaths) {
      const partStream = fs.createReadStream(partPath)
      for await (const chunk of partStream) {
        yield chunk as Buffer
      }
    }
  }

  private async computeMd5(filePath: string): Promise<string> {
    const hash = createHash('md5')
    const readStream = fs.createReadStream(filePath)

    for await (const chunk of readStream) {
      hash.update(chunk)
    }

    return hash.digest('hex')
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
    return 'local:///' + this.resolveSecurePath(withOptionalVersion(`${bucket}/${key}`, version))
  }

  async setFileMetadata(file: string, { contentType, cacheControl }: FileMetadata) {
    const platform = process.platform === 'darwin' ? 'darwin' : 'linux'
    await Promise.all([
      this.setOrRemoveMetadataAttr(
        file,
        METADATA_ATTR_KEYS[platform]['cache-control'],
        cacheControl
      ),
      this.setOrRemoveMetadataAttr(file, METADATA_ATTR_KEYS[platform]['content-type'], contentType),
    ])
  }

  close() {
    // no-op
  }

  protected async getFileMetadata(file: string) {
    const { cacheControl, contentType } = await this.getStoredFileMetadata(file)
    return {
      cacheControl: cacheControl || 'no-cache',
      mimetype: contentType || 'application/octet-stream',
    }
  }

  protected async getStoredFileMetadata(file: string): Promise<FileMetadata> {
    const platform = process.platform === 'darwin' ? 'darwin' : 'linux'
    const [cacheControl, contentType] = await Promise.all([
      this.getMetadataAttr(file, METADATA_ATTR_KEYS[platform]['cache-control']),
      this.getMetadataAttr(file, METADATA_ATTR_KEYS[platform]['content-type']),
    ])

    return { cacheControl, contentType }
  }

  protected async getMetadataAttr(file: string, attribute: string): Promise<string | undefined> {
    try {
      // fs-xattr's async path leaks about 0.5 kB per call (fs-xattr#47, reported
      // for this backend in #1349). The sync path does not leak and the reads
      // are small, so it is used until an upstream release ships the fix.
      const value = xattr.getAttributeSync(file, attribute)
      return value?.toString() ?? undefined
    } catch (error) {
      if (isMissingXattrError(error)) {
        return undefined
      }
      throw error
    }
  }

  protected async setMetadataAttr(file: string, attribute: string, value: string): Promise<void> {
    // see getMetadataAttr: sync xattr calls until fs-xattr ships a fixed release
    xattr.setAttributeSync(file, attribute, value)
  }

  protected async setOrRemoveMetadataAttr(
    file: string,
    attribute: string,
    value: string | undefined
  ): Promise<void> {
    if (value !== undefined) {
      await this.setMetadataAttr(file, attribute, value)
      return
    }

    try {
      xattr.removeAttributeSync(file, attribute)
    } catch (error) {
      if (!isMissingXattrError(error)) {
        throw error
      }
    }
  }

  /**
   * Recursively removes empty directories up to the storage root
   * @param dirPath The directory path to start cleanup from
   */
  protected async cleanupEmptyDirectories(dirPath: string): Promise<void> {
    try {
      const relativePath = path.relative(this.filePath, dirPath)
      const isOutsideStorageRoot =
        relativePath === '..' ||
        relativePath.startsWith(`..${path.sep}`) ||
        path.isAbsolute(relativePath)

      // Do not remove the storage root or directories outside it.
      if (relativePath === '' || isOutsideStorageRoot) {
        return
      }

      try {
        // Atomically removes an empty directory and fails if a concurrent upload repopulated it.
        await fsp.rmdir(dirPath)
      } catch (error) {
        // If another cleanup removed this directory, its parents may still need cleanup.
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          return
        }
      }

      // Recursively check the parent after this directory was removed or was already absent.
      const parentDir = path.dirname(dirPath)
      await this.cleanupEmptyDirectories(parentDir)
    } catch {
      // Ignore errors during cleanup to not affect main operations
      // Could be permission issues, concurrent access, directory not empty due to race conditions, etc.
      // Optional: Log for debugging purposes (uncomment if needed)
      // console.debug('Directory cleanup failed:', dirPath, e.message)
    }
  }

  /**
   * Securely resolves a path within the storage directory, preventing path traversal attacks
   * @param relativePath The relative path to resolve
   * @throws {StorageBackendError} If the resolved path escapes the storage directory
   */
  private resolveSecurePath(relativePath: string): string {
    return resolveSecureFilesystemPath(this.filePath, relativePath)
  }

  private async etag(file: string, stats: Stats): Promise<string> {
    if (this.etagAlgorithm === 'md5') {
      const checksum = await this.computeMd5(file)
      return `"${checksum}"`
    } else if (this.etagAlgorithm === 'mtime') {
      return `"${stats.mtimeMs.toString(16)}-${stats.size.toString(16)}"`
    }
    throw new Error('FILE_STORAGE_ETAG_ALGORITHM env variable must be either "mtime" or "md5"')
  }
}

/**
 * Evaluates the x-amz-copy-source-if-* preconditions the way S3 CopyObject does,
 * so the file backend rejects a copy with 412 in the same cases as the S3 backend:
 * if-match takes precedence over if-unmodified-since, and if-none-match takes
 * precedence over if-modified-since. Invalid dates are ignored (RFC 9110 13.1).
 */
function assertCopySourcePreconditions(
  conditions: {
    ifMatch?: string
    ifNoneMatch?: string
    ifModifiedSince?: Date
    ifUnmodifiedSince?: Date
  },
  eTag: string,
  lastModified: Date
) {
  let failed = false

  if (conditions.ifMatch !== undefined) {
    failed = !matchesETag(conditions.ifMatch, eTag)
  } else if (conditions.ifUnmodifiedSince) {
    failed = toSeconds(lastModified) > toSeconds(conditions.ifUnmodifiedSince)
  }

  if (!failed && conditions.ifNoneMatch !== undefined) {
    failed = matchesETag(conditions.ifNoneMatch, eTag)
  } else if (!failed && conditions.ifModifiedSince) {
    failed = toSeconds(lastModified) <= toSeconds(conditions.ifModifiedSince)
  }

  if (failed) {
    throw StorageBackendError.withStatusCode(412, {
      error: 'PreconditionFailed',
      code: ErrorCode.PreconditionFailed,
      httpStatusCode: 412,
      message: 'PreconditionFailed',
    })
  }
}

// HTTP dates have one-second precision, invalid is false.
function toSeconds(date: Date) {
  return Math.floor(date.getTime() / 1000)
}

function unquoteETag(value: string) {
  return value
    .trim()
    .replace(/^W\//, '')
    .replace(/^"(.*)"$/, '$1')
}

function matchesETag(condition: string, eTag: string) {
  const target = unquoteETag(eTag)

  // RFC 9110 8.8.3: commas are valid inside a quoted entity-tag
  // so split on commas outside quotes only.
  return (condition.match(/(?:"[^"]*"|[^,])+/g) ?? []).some((candidate) => {
    const value = candidate.trim()
    return value === '*' || unquoteETag(value) === target
  })
}
