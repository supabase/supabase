import { ERRORS } from '@internal/errors'
import { FastifyReply, FastifyRequest } from 'fastify'
import { mergeCacheControlDirectives } from './cache-control'
import { ImageRenderer, TransformOptions } from './image'
import { AssetMetadata, AssetResponse, Renderer, RenderOptions } from './renderer'

/**
 * HeadRenderer
 * is a special renderer that only outputs metadata information with an empty content
 */
export class HeadRenderer extends Renderer {
  async getAsset(request: FastifyRequest, options: RenderOptions): Promise<AssetResponse> {
    const { object } = options

    if (!object) {
      throw ERRORS.NoSuchKey(`${options.bucket}/${options.key}/${options.version}`)
    }

    const metadata = createAssetMetadata(object.metadata)

    return {
      metadata,
      transformations: ImageRenderer.applyTransformation(request.query as TransformOptions),
    }
  }

  protected handleCacheControl(
    request: FastifyRequest,
    response: FastifyReply,
    metadata: AssetMetadata
  ) {
    const etag = this.findEtagHeader(request)

    const cacheControl = [metadata.cacheControl]

    if (!etag) {
      this.setCacheControlHeader(response, cacheControl)
      return
    }

    const revalidationDirectives: string[] = []

    if (etag !== metadata.eTag) {
      revalidationDirectives.push('must-revalidate')
    } else if (this.sMaxAge > 0) {
      revalidationDirectives.push(`s-maxage=${this.sMaxAge}`)
    }

    this.setCacheControlHeader(
      response,
      mergeCacheControlDirectives(cacheControl, revalidationDirectives)
    )
  }
}

function createAssetMetadata(
  rawMetadata: Record<string, unknown> | null | undefined
): AssetMetadata {
  const metadata: AssetMetadata = {}
  const raw = rawMetadata ?? {}

  if (typeof raw.cacheControl === 'string') {
    metadata.cacheControl = raw.cacheControl
  }

  const contentLength = parseMetadataNumber(raw.contentLength)
  if (contentLength !== undefined) {
    metadata.contentLength = contentLength
  }

  if (typeof raw.contentRange === 'string') {
    metadata.contentRange = raw.contentRange
  }

  if (typeof raw.eTag === 'string') {
    metadata.eTag = raw.eTag
  }

  const httpStatusCode = parseMetadataNumber(raw.httpStatusCode)
  if (httpStatusCode !== undefined) {
    metadata.httpStatusCode = httpStatusCode
  }

  if (typeof raw.mimetype === 'string') {
    metadata.mimetype = raw.mimetype
  }

  const size = parseMetadataNumber(raw.size)
  if (size !== undefined) {
    metadata.size = size
  }

  if (typeof raw.xRobotsTag === 'string') {
    metadata.xRobotsTag = raw.xRobotsTag
  }

  if (
    typeof raw.lastModified === 'string' ||
    typeof raw.lastModified === 'number' ||
    raw.lastModified instanceof Date
  ) {
    const lastModified = new Date(raw.lastModified)
    if (!Number.isNaN(lastModified.getTime())) {
      metadata.lastModified = lastModified
    }
  }

  return metadata
}

function parseMetadataNumber(value: unknown) {
  if (typeof value === 'number' && Number.isSafeInteger(value)) {
    return value
  }

  if (typeof value === 'string' && /^\d+$/.test(value)) {
    const parsed = Number(value)
    if (Number.isSafeInteger(parsed)) {
      return parsed
    }
  }
}
