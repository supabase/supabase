import { ImageRenderer, TransformOptions } from '@storage/renderer/image'
import { Obj } from '@storage/schemas'
import { FastifyReply, FastifyRequest } from 'fastify'
import { HeadRenderer } from './head'
import { AssetResponse, RenderOptions } from './renderer'

/**
 * HeadRenderer
 * is a special renderer that only outputs metadata information with an empty content
 */
export class InfoRenderer extends HeadRenderer {
  async getAsset(request: FastifyRequest, options: RenderOptions): Promise<AssetResponse> {
    const headAsset = await super.getAsset(request, options)

    const obj = options.object as Obj

    return {
      ...headAsset,
      transformations: ImageRenderer.applyTransformation(request.query as TransformOptions),
      body: {
        id: obj.id,
        name: obj.name,
        version: obj.version,
        bucket_id: obj.bucket_id,
        size: headAsset.metadata.size ?? null,
        content_type: headAsset.metadata.mimetype ?? null,
        cache_control: headAsset.metadata.cacheControl ?? null,
        etag: headAsset.metadata.eTag ?? null,
        metadata: obj.user_metadata,
        last_modified: obj.updated_at,
        created_at: obj.created_at,
        archived_at: obj.archived_at,
        is_delete_marker: obj.is_delete_marker,
        is_versioned: obj.is_versioned,
      },
    }
  }

  protected setHeaders(
    request: FastifyRequest,
    response: FastifyReply,
    data: AssetResponse,
    options: RenderOptions
  ) {
    response
      .status(data.metadata.httpStatusCode ?? 200)
      .header('Content-Type', 'application/json')
      .header('ETag', data.metadata.eTag)

    this.setLastModifiedHeader(response, data.metadata.lastModified)
    this.setCacheControlHeader(response, [data.metadata.cacheControl])
    this.setContentLengthHeader(response, data.metadata.contentLength)

    if (data.transformations && data.transformations.length > 0) {
      response.header('X-Transformations', data.transformations.join(','))
    }
  }
}
