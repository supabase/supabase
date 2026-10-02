import { SIGNED_URL_SCOPE_UPLOAD } from '@internal/auth'
import type { TenantConnection } from '@internal/database'
import { ERRORS, isRenderableError } from '@internal/errors'
import { logSchema, RequestLogContext } from '@internal/monitoring'
import { UploadId } from '@storage/protocols/tus'
import { Storage } from '@storage/storage'
import { Uploader } from '@storage/uploader'
import { validateMimeType } from '@storage/validators/mime-type'
import { DataStore, Metadata, Upload } from '@tus/server'
import { randomUUID } from 'crypto'
import type { FastifyBaseLogger } from 'fastify'
import http from 'http'
import type { ServerRequest as Request } from 'srvx'

import { getConfig } from '../../../config'

const { storageS3Bucket, tusPath, requestAllowXForwardedPrefix, storagePublicUrl } = getConfig()
const parsedPublicUrl = storagePublicUrl ? new URL(storagePublicUrl) : undefined
const reExtractFileID = /([^/]+)\/?$/

export const SIGNED_URL_SUFFIX = '/sign'

/**
 * Validates that the request object exists and returns it
 * @throws {Error} If the request object is missing
 */
function getNodeRequest(rawReq: Request): MultiPartRequest {
  const req = rawReq.runtime?.node?.req as MultiPartRequest

  if (!req) {
    throw ERRORS.InternalError(undefined, 'Request object is missing')
  }

  return req
}

function getNodeResponse(rawReq: Request) {
  const res = rawReq.runtime?.node?.res
  if (!res) {
    throw ERRORS.InternalError(undefined, 'Response object is missing')
  }
  return res
}

export type MultiPartRequest = http.IncomingMessage & {
  executionError?: Error
  log: FastifyBaseLogger
  upload: RequestLogContext & {
    tenantId: string
    storage: Storage
    db: TenantConnection
    owner?: string
    isUpsert: boolean
    resources?: string[]
  }
}

type TusError = { status_code: number; body: string }

function getTusError(error: { render(): { statusCode: string; message: string } }): TusError {
  const renderedError = error.render()
  return {
    status_code: parseInt(renderedError.statusCode, 10),
    body: renderedError.message,
  }
}

/**
 * Runs on every TUS incoming request
 */
export async function onIncomingRequest(rawReq: Request, id: string, datastore: DataStore) {
  const req = getNodeRequest(rawReq)
  const res = getNodeResponse(rawReq)

  const disposeConnection = () => {
    // A response can close without finishing when the client disconnects after
    // the request body has completed. Remove both listeners so finish + close
    // cannot retain the callback or dispose the request lease twice.
    res.off('finish', disposeConnection)
    res.off('close', disposeConnection)
    req.upload.db.dispose()
  }
  res.once('finish', disposeConnection)
  res.once('close', disposeConnection)

  const uploadID = UploadId.fromString(id)

  req.upload.resources = [`${uploadID.bucket}/${uploadID.objectName}`]

  // Handle signed url requests
  if (req.url?.startsWith(`/upload/resumable/sign`)) {
    const signature = req.headers['x-signature']
    if (!signature || (signature && typeof signature !== 'string')) {
      throw ERRORS.InvalidSignature('Missing x-signature header')
    }

    const payload = await req.upload.storage
      .from(uploadID.bucket)
      .verifyObjectSignature(signature, uploadID.objectName, SIGNED_URL_SCOPE_UPLOAD)

    req.upload.owner = payload.owner
    req.upload.isUpsert = payload.upsert
    return
  }

  // Options and HEAD request don't need to be authorized
  if (rawReq.method === 'OPTIONS' || req.method === 'HEAD') {
    return
  }

  // All other requests need to be authorized if they have permission to upload
  const isUpsert = req.upload.isUpsert
  const uploader = new Uploader(
    req.upload.storage.backend,
    req.upload.storage.db,
    req.upload.storage.location
  )

  let contentType: string | undefined
  let contentLength: number | undefined
  let rawMetadata: string | null | undefined

  if (req.method === 'POST') {
    const uploadMetadataHeader = req.headers['upload-metadata']
    if (uploadMetadataHeader && typeof uploadMetadataHeader === 'string') {
      try {
        const parsedMetadata = Metadata.parse(uploadMetadataHeader)
        contentType = parsedMetadata?.contentType ?? undefined
        rawMetadata = parsedMetadata?.metadata
      } catch (e) {
        logSchema.warning(req.log, 'Failed to parse upload metadata', {
          type: 'tus',
          tenantId: req.upload.tenantId,
          project: req.upload.tenantId,
          reqId: req.upload.reqId,
          sbReqId: req.upload.sbReqId,
          error: e,
        })
        throw ERRORS.InvalidParameter('upload-metadata', {
          error: e as Error,
          message: 'Invalid Upload-Metadata header',
        })
      }
    }
    const uploadLength = req.headers['upload-length']
    contentLength = uploadLength ? Number(uploadLength) : undefined
  } else {
    const upload = await datastore.getUpload(id)
    contentType = upload.metadata?.contentType ?? undefined
    contentLength = upload.size ?? undefined
    rawMetadata = upload.metadata?.metadata
  }

  let customMd: Record<string, string> | undefined
  if (rawMetadata) {
    try {
      customMd = JSON.parse(rawMetadata)
    } catch (e) {
      logSchema.warning(req.log, 'Failed to parse user metadata', {
        type: 'tus',
        tenantId: req.upload.tenantId,
        project: req.upload.tenantId,
        reqId: req.upload.reqId,
        sbReqId: req.upload.sbReqId,
        error: ERRORS.InvalidRequest('Failed to parse metadata', e as Error),
      })
    }
  }

  await uploader.canUpload({
    owner: req.upload.owner,
    bucketId: uploadID.bucket,
    objectName: uploadID.objectName,
    isUpsert,
    userMetadata: customMd,
    metadata: {
      mimetype: contentType,
      contentLength,
    },
  })
}

/**
 * Generate URL for TUS upload, it encodes the uploadID to base64url
 */
export function generateUrl(
  rawReq: Request,
  { proto, host, path, id }: { proto: string; host: string; path: string; id: string }
) {
  const req = getNodeRequest(rawReq)

  if (!req.url) {
    throw ERRORS.InvalidParameter('url')
  }

  if (parsedPublicUrl) {
    proto = parsedPublicUrl.protocol.replace(':', '')
    host = parsedPublicUrl.host
  }

  // Force https in production. This overrides both forwarded headers and
  // STORAGE_PUBLIC_URL - production deployments must use HTTPS.
  proto = process.env.NODE_ENV === 'production' ? 'https' : proto

  let basePath = path

  const forwardedPath = req.headers['x-forwarded-prefix']
  if (requestAllowXForwardedPrefix && typeof forwardedPath === 'string') {
    // Remove trailing slash from forwardedPath to avoid double slashes
    basePath = forwardedPath.replace(/\/+$/, '') + path
  }

  const isSigned = req.url?.endsWith(SIGNED_URL_SUFFIX)
  const fullPath = isSigned ? `${basePath}${SIGNED_URL_SUFFIX}` : basePath

  if (!parsedPublicUrl && req.headers['x-forwarded-host']) {
    const port = req.headers['x-forwarded-port']

    if (typeof port === 'string' && port && !['443', '80'].includes(port)) {
      if (!host.includes(':')) {
        host += `:${req.headers['x-forwarded-port']}`
      } else {
        host = host.replace(/:\d+$/, `:${req.headers['x-forwarded-port']}`)
      }
    }
  }

  // remove the tenant-id from the url, since we'll be using the tenant-id from the request
  id = id.split('/').slice(1).join('/')
  id = Buffer.from(id, 'utf-8').toString('base64url')
  return `${proto}://${host}${fullPath}/${id}`
}

/**
 * Extract the uploadId from the request and decodes it from base64url
 */
export function getFileIdFromRequest(rawReq: Request) {
  const req = getNodeRequest(rawReq)

  const match = reExtractFileID.exec(req.url as string)

  if (!match || tusPath.includes(match[1])) {
    return
  }

  const idMatch = Buffer.from(match[1], 'base64url').toString('utf-8')
  return req.upload.tenantId + '/' + idMatch
}

/**
 * Generate the uploadId for the TUS upload
 * the URL structure is as follows:
 *
 * /tenant-id/bucket-name/object-name/version
 */
export function namingFunction(rawReq: Request, metadata?: Record<string, string | null>) {
  const req = getNodeRequest(rawReq)

  if (!req.url) {
    throw new Error('no url set')
  }

  if (!metadata) {
    throw ERRORS.MetadataRequired()
  }

  return new UploadId({
    tenant: req.upload.tenantId,
    bucket: metadata.bucketName || '',
    objectName: metadata.objectName || '',
    version: randomUUID(),
  }).toString()
}

/**
 * Runs before the upload URL is created
 */
export async function onCreate(
  rawReq: Request,
  upload: Upload
): Promise<{ metadata?: Upload['metadata'] }> {
  const uploadID = UploadId.fromString(upload.id)

  const req = getNodeRequest(rawReq)

  const storage = req.upload.storage

  const bucket = await storage
    .asSuperUser()
    .findBucket(uploadID.bucket, 'id, file_size_limit, allowed_mime_types')

  const metadata = {
    ...(upload.metadata ? upload.metadata : {}),
  }

  if (/^-?\d+$/.test(metadata.cacheControl || '')) {
    metadata.cacheControl = `max-age=${metadata.cacheControl}`
  } else {
    metadata.cacheControl = 'no-cache'
  }

  if (metadata?.contentType && bucket.allowed_mime_types?.length) {
    validateMimeType(metadata.contentType, bucket.allowed_mime_types)
  }

  return { metadata }
}

/**
 * Runs when the upload to the underline store is completed
 */
export async function onUploadFinish(rawReq: Request, upload: Upload) {
  const req = getNodeRequest(rawReq)

  const resourceId = UploadId.fromString(upload.id)

  try {
    const s3Key = req.upload.storage.location.getKeyLocation({
      tenantId: req.upload.tenantId,
      bucketId: resourceId.bucket,
      objectName: resourceId.objectName,
    })
    const metadata = await req.upload.storage.backend.headObject(
      storageS3Bucket,
      s3Key,
      resourceId.version
    )

    const uploader = new Uploader(
      req.upload.storage.backend,
      req.upload.storage.db,
      req.upload.storage.location
    )
    let customMd: undefined | Record<string, string> = undefined
    if (upload.metadata?.metadata) {
      try {
        customMd = JSON.parse(upload.metadata.metadata)
      } catch {
        // no-op
      }
    }

    await uploader.completeUpload({
      version: resourceId.version,
      bucketId: resourceId.bucket,
      objectName: resourceId.objectName,
      objectMetadata: metadata,
      isUpsert: req.upload.isUpsert,
      uploadType: 'resumable',
      owner: req.upload.owner,
      userMetadata: customMd,
    })

    return {
      headers: {
        'Tus-Complete': '1',
      },
    }
  } catch (e) {
    if (isRenderableError(e)) {
      throw Object.assign(e, getTusError(e))
    }
    throw e
  }
}

/**
 * Runs when there is an error on the TUS upload
 */
export function onResponseError(rawReq: Request, e: TusError | Error) {
  const req = getNodeRequest(rawReq)

  if (e instanceof Error) {
    req.executionError = e
  } else {
    req.executionError = ERRORS.TusError(e.body, e.status_code).withMetadata(e)
  }

  if (isRenderableError(e)) {
    return getTusError(e)
  }
}
