import { ERRORS, StorageBackendError } from '@internal/errors'
import { logger, logSchema } from '@internal/monitoring'
import { recordUploadStarted, recordUploadSuccess } from '@internal/monitoring/metrics'
import { StorageObjectLocator } from '@storage/locator'
import { randomUUID } from 'crypto'
import { FastifyRequest } from 'fastify'
import { PassThrough, Readable } from 'stream'
import { getConfig } from '../config'
import { ObjectMetadata, StorageBackendAdapter } from './backend'
import { Database } from './database'
import { ObjectAdminDelete, ObjectCreatedPostEvent, ObjectCreatedPutEvent } from './events'
import { getFileSizeLimit, isEmptyFolder } from './limits'
import { validateMimeType } from './validators/mime-type'
import { validateXRobotsTag } from './validators/x-robots-tag'

const { storageS3Bucket, uploadFileSizeLimitStandard } = getConfig()

type UploadType = 'standard' | 's3' | 'resumable'

interface FileUpload {
  body: Readable
  mimeType: string
  cacheControl: string
  contentLength?: number
  declaredContentLength?: number
  isTruncated: () => boolean
  xRobotsTag?: string
}

export interface UploadRequest {
  bucketId: string
  objectName: string
  file: FileUpload
  userMetadata?: Record<string, unknown>
  owner?: string
  isUpsert?: boolean
  uploadType: UploadType
  signal?: AbortSignal
}

export type CanUploadMetadata = Partial<Pick<ObjectMetadata, 'mimetype' | 'contentLength'>> &
  Record<string, unknown>

export interface CanUploadOptions {
  bucketId: string
  objectName: string
  owner: string | undefined
  isUpsert: boolean | undefined
  userMetadata: Record<string, unknown> | undefined
  metadata: CanUploadMetadata | undefined
}

const MAX_CUSTOM_METADATA_SIZE = 1024 * 1024
const CLOSE_CONNECTION_ON_ERROR = Symbol('closeConnectionOnError')

type UploadBodyProxy = PassThrough & {
  [CLOSE_CONNECTION_ON_ERROR]?: boolean
}

type UploadBodySource = FastifyRequest['raw']

/**
 * Uploader
 * Handles the upload of a multi-part request or binary body
 */
export class Uploader {
  constructor(
    private readonly backend: StorageBackendAdapter,
    private readonly db: Database,
    private readonly location: StorageObjectLocator
  ) {}

  async canUpload(options: CanUploadOptions) {
    const shouldCreateObject = !options.isUpsert

    if (shouldCreateObject) {
      await this.db.testPermission((db) => {
        return db.createObject({
          bucket_id: options.bucketId,
          name: options.objectName,
          version: '1',
          owner: options.owner,
          metadata: options.metadata,
          user_metadata: options.userMetadata,
        })
      })
    } else {
      await this.db.testPermission((db) => {
        return db.upsertObject({
          bucket_id: options.bucketId,
          name: options.objectName,
          version: '1',
          owner: options.owner,
          metadata: options.metadata,
          user_metadata: options.userMetadata,
        })
      })
    }
  }

  /**
   * Returns the upload version for the incoming file.
   * We check RLS policies before proceeding
   * @param options
   */
  async prepareUpload(options: CanUploadOptions & { uploadType: UploadType }) {
    await this.canUpload(options)
    recordUploadStarted(options.uploadType)

    return randomUUID()
  }

  /**
   * Extracts file information from the request and upload the buffer
   * to the remote storage
   * @param request
   * @param options
   */
  async upload(request: UploadRequest) {
    const file = request.file
    const version = await this.prepareUpload({
      bucketId: request.bucketId,
      objectName: request.objectName,
      owner: request.owner,
      isUpsert: request.isUpsert,
      userMetadata: request.userMetadata,
      metadata: {
        mimetype: file.mimeType,
        contentLength: file.declaredContentLength ?? file.contentLength,
      },
      uploadType: request.uploadType,
    })

    try {
      const s3Key = this.location.getKeyLocation({
        tenantId: this.db.tenantId,
        bucketId: request.bucketId,
        objectName: request.objectName,
      })

      const objectMetadata = await this.backend.uploadObject(
        storageS3Bucket,
        s3Key,
        version,
        file.body,
        file.mimeType,
        file.cacheControl,
        request.signal,
        file.contentLength
      )

      if (request.file.xRobotsTag) {
        objectMetadata.xRobotsTag = request.file.xRobotsTag
      }

      if (file.isTruncated()) {
        throw ERRORS.EntityTooLarge()
      }

      return this.completeUpload({
        ...request,
        version,
        objectMetadata,
        userMetadata: { ...request.userMetadata },
      })
    } catch (e) {
      await ObjectAdminDelete.send({
        name: request.objectName,
        bucketId: request.bucketId,
        tenant: this.db.tenant(),
        version,
        reqId: this.db.reqId,
        sbReqId: this.db.sbReqId,
      })
      throw shouldCloseConnectionAfterResponse(file.body) ? withConnectionClose(e) : e
    }
  }

  /**
   * Completes the upload process by updating the object metadata
   * @param version
   * @param bucketId
   * @param objectName
   * @param owner
   * @param objectMetadata
   * @param uploadType
   * @param isUpsert
   * @param userMetadata
   */
  async completeUpload({
    version,
    bucketId,
    objectName,
    owner,
    objectMetadata,
    uploadType,
    isUpsert,
    userMetadata,
  }: Omit<UploadRequest, 'file'> & {
    objectMetadata: ObjectMetadata
    version: string
    emitEvent?: boolean
    userMetadata?: Record<string, unknown>
  }) {
    try {
      const db = this.db.asSuperUser()
      // Since we have finished uploading the file,
      // even if the request is aborted now, we want to complete the DB transaction
      const abController = new AbortController()
      db.connection.setAbortSignal(abController.signal)

      return await db.withTransaction(async (db) => {
        await db.waitObjectLock(bucketId, objectName, undefined, {
          timeout: 5000,
        })

        const currentObj = await db.findObject(bucketId, objectName, 'id, version, metadata', {
          forUpdate: true,
          dontErrorOnEmpty: true,
        })

        if (!isUpsert && currentObj && currentObj.version !== version) {
          throw ERRORS.KeyAlreadyExists(objectName)
        }

        const isNew = !currentObj

        // update object
        const newObject = await db.upsertObject({
          bucket_id: bucketId,
          name: objectName,
          metadata: objectMetadata,
          user_metadata: userMetadata,
          version,
          owner,
        })

        const events: Promise<unknown>[] = []

        // schedule the deletion of the previous file
        if (currentObj && currentObj.version !== version) {
          events.push(
            ObjectAdminDelete.send({
              name: objectName,
              bucketId,
              tenant: this.db.tenant(),
              version: currentObj.version,
              reqId: this.db.reqId,
              sbReqId: this.db.sbReqId,
            })
          )
        }

        const event = isUpsert && !isNew ? ObjectCreatedPutEvent : ObjectCreatedPostEvent

        events.push(
          event
            .sendWebhook({
              tenant: this.db.tenant(),
              name: objectName,
              version,
              bucketId,
              metadata: objectMetadata,
              reqId: this.db.reqId,
              sbReqId: this.db.sbReqId,
              uploadType,
            })
            .catch((e) => {
              logSchema.error(logger, 'Failed to send webhook', {
                type: 'event',
                error: e,
                project: this.db.tenantId,
                sbReqId: this.db.sbReqId,
                metadata: JSON.stringify({
                  name: objectName,
                  bucketId,
                  metadata: objectMetadata,
                  reqId: this.db.reqId,
                  uploadType,
                }),
              })
            })
        )

        await Promise.all(events)

        recordUploadSuccess(uploadType)

        return { obj: newObject, isNew, metadata: objectMetadata }
      })
    } catch (e) {
      await ObjectAdminDelete.send({
        name: objectName,
        bucketId,
        tenant: this.db.tenant(),
        version,
        reqId: this.db.reqId,
        sbReqId: this.db.sbReqId,
      })
      throw e
    }
  }
}

function getKnownRequestContentLength(request: FastifyRequest): number | undefined {
  // Only authenticated aws-chunked S3 requests get a verified decoded length.
  const decodedContentLengthHeader = request.streamingSignatureV4
    ? request.headers['x-amz-decoded-content-length']
    : undefined
  const contentLengthHeader = decodedContentLengthHeader ?? request.headers['content-length']
  const contentLength = Number(contentLengthHeader)

  if (!Number.isFinite(contentLength) || contentLength < 0) {
    return undefined
  }

  return contentLength
}

function createUploadBodyProxy(body: UploadBodySource) {
  const proxy = new PassThrough() as UploadBodyProxy
  let bodyEnded = false
  const destroy = proxy.destroy.bind(proxy)

  proxy.destroy = ((error?: Error) => {
    if (error) {
      proxy[CLOSE_CONNECTION_ON_ERROR] = true
    }

    return destroy(error)
  }) as typeof proxy.destroy

  const onBodyError = (err: Error) => {
    if (!proxy.destroyed) {
      proxy.destroy(err)
    }
  }

  const onBodyEnd = () => {
    bodyEnded = true
  }

  const onBodyClose = () => {
    if (!bodyEnded && !body.readableEnded && !proxy.destroyed) {
      proxy.destroy(new Error('Request stream closed before upload could complete'))
    }
  }

  const onProxyError = () => {
    body.unpipe(proxy)
  }

  const cleanup = () => {
    body.unpipe(proxy)
    body.off('aborted', onBodyClose)
    body.off('close', onBodyClose)
    body.off('end', onBodyEnd)
    body.off('error', onBodyError)
    proxy.off('error', onProxyError)
    proxy.off('close', cleanup)
  }

  body.on('aborted', onBodyClose)
  body.on('close', onBodyClose)
  body.on('end', onBodyEnd)
  body.on('error', onBodyError)
  proxy.on('error', onProxyError)
  proxy.on('close', cleanup)
  body.pipe(proxy)

  return proxy
}

function shouldCloseConnectionAfterResponse(body: Readable) {
  return Boolean((body as UploadBodyProxy)[CLOSE_CONNECTION_ON_ERROR])
}

function withConnectionClose(error: unknown) {
  if (error instanceof StorageBackendError) {
    return error.withConnectionClose()
  }

  return StorageBackendError.fromError(error).withConnectionClose()
}

/**
 * Extracts the file information from the request
 * @param request
 * @param options
 */
export async function fileUploadFromRequest(
  request: FastifyRequest,
  options: {
    fileSizeLimit?: number | null
    allowedMimeTypes?: string[]
    objectName: string
  }
): Promise<
  FileUpload & {
    mimeType: string
    maxFileSize: number
    userMetadata: Record<string, unknown> | undefined
    contentLength: number | undefined
    declaredContentLength: number | undefined
  }
> {
  const contentType = request.headers['content-type']
  const xRobotsTag = request.headers['x-robots-tag'] as string | undefined

  if (xRobotsTag) {
    validateXRobotsTag(xRobotsTag)
  }

  let body: Readable
  let userMetadata: Record<string, unknown> | undefined
  let mimeType: string
  let isTruncated: () => boolean
  let fileContentLength: number | undefined
  let maxFileSize = 0

  // When is an empty folder we restrict it to 0 bytes
  if (!isEmptyFolder(options.objectName)) {
    maxFileSize = await getStandardMaxFileSizeLimit(request.tenantId, options?.fileSizeLimit)
  }

  let cacheControl: string
  if (contentType?.startsWith('multipart/form-data')) {
    try {
      const formData = await request.file({ limits: { fileSize: maxFileSize } })

      if (!formData) {
        throw ERRORS.NoContentProvided()
      }

      // https://github.com/fastify/fastify-multipart/issues/162
      /* @ts-expect-error: https://github.com/aws/aws-sdk-js-v3/issues/2085 */
      const cacheTime = formData.fields.cacheControl?.value

      const file = formData.file
      body = file
      // multipart/form-data content-length includes boundary overhead and cannot be trusted as file size,
      // so we intentionally leave fileContentLength undefined and let the backend stream via multipart upload.
      /* @ts-expect-error: https://github.com/aws/aws-sdk-js-v3/issues/2085 */
      const customMd = formData.fields.metadata?.value ?? formData.fields.userMetadata?.value
      /* @ts-expect-error: https://github.com/aws/aws-sdk-js-v3/issues/2085 */
      mimeType = formData.fields.contentType?.value || formData.mimetype
      cacheControl = cacheTime ? `max-age=${cacheTime}` : 'no-cache'
      // Store file reference to avoid capturing entire formData object in closure
      isTruncated = () => file.truncated

      if (
        options.allowedMimeTypes &&
        options.allowedMimeTypes.length > 0 &&
        !isEmptyFolder(options.objectName)
      ) {
        validateMimeType(mimeType, options.allowedMimeTypes)
      }

      if (typeof customMd === 'string') {
        if (Buffer.byteLength(customMd, 'utf8') > MAX_CUSTOM_METADATA_SIZE) {
          throw ERRORS.EntityTooLarge(undefined, 'user_metadata')
        }

        try {
          userMetadata = JSON.parse(customMd)
        } catch {
          // no-op
        }
      }
    } catch (e) {
      if (e instanceof StorageBackendError) {
        throw e
      }
      throw ERRORS.NoContentProvided(e as Error)
    }
  } else {
    // just assume it's a binary file
    if (!request.raw || request.raw.closed || request.raw.destroyed || request.raw.readableEnded) {
      throw ERRORS.NoContentProvided(new Error('Request stream closed before upload could begin'))
    }

    mimeType = request.headers['content-type'] || 'application/octet-stream'
    cacheControl = request.headers['cache-control'] ?? 'no-cache'

    if (
      options.allowedMimeTypes &&
      options.allowedMimeTypes.length > 0 &&
      !isEmptyFolder(options.objectName)
    ) {
      validateMimeType(mimeType, options.allowedMimeTypes)
    }

    const customMd = request.headers['x-metadata']

    if (typeof customMd === 'string') {
      userMetadata = parseUserMetadata(customMd)
    }

    fileContentLength = getKnownRequestContentLength(request)
    if (typeof fileContentLength === 'number' && fileContentLength > maxFileSize) {
      throw ERRORS.EntityTooLarge()
    }

    // Known-size binary uploads are rejected before
    // reaching the backend when they exceed the limit.
    // Unknown-size binary uploads do not have a later truncation signal.
    //
    // Keep the declared request size separate from the backend upload size:
    // request-backed uploads should continue using multipart upstream writes
    // instead of direct PutObject, even when the client sent Content-Length.
    isTruncated = () => false
    body = createUploadBodyProxy(request.raw)
    fileContentLength = undefined
  }

  // Capture the declared content-length for RLS metadata purposes.
  // Request-backed uploads never forward this value to the backend upload path.
  const declaredContentLength = getKnownRequestContentLength(request)

  // Detect if the request stream closed before we could pass it to the storage backend
  // Without this check, the storage backend (S3) would throw a 500 "Premature close" error
  // when attempting to read from the closed stream. We catch this early and return 400.
  if (!body || body.closed || body.destroyed || body.readableEnded) {
    throw ERRORS.NoContentProvided(new Error('Request stream closed before upload could begin'))
  }

  return {
    body,
    mimeType,
    cacheControl,
    contentLength: fileContentLength,
    declaredContentLength,
    isTruncated,
    userMetadata,
    maxFileSize,
    xRobotsTag,
  }
}

export function parseUserMetadata(metadata: string) {
  try {
    const json = Buffer.from(metadata, 'base64').toString('utf8')
    return JSON.parse(json) as Record<string, string>
  } catch {
    // no-op
    return undefined
  }
}

export async function getStandardMaxFileSizeLimit(
  tenantId: string,
  bucketSizeLimit?: number | null
) {
  let globalFileSizeLimit = await getFileSizeLimit(tenantId)

  if (typeof bucketSizeLimit === 'number') {
    globalFileSizeLimit = Math.min(bucketSizeLimit, globalFileSizeLimit)
  }

  if (uploadFileSizeLimitStandard && uploadFileSizeLimitStandard > 0) {
    globalFileSizeLimit = Math.min(uploadFileSizeLimitStandard, globalFileSizeLimit)
  }

  return globalFileSizeLimit
}
