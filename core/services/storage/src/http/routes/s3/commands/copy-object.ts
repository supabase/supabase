import { MetadataDirective } from '@aws-sdk/client-s3'
import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const CopyObjectInput = {
  summary: 'Copy Object',
  Params: {
    type: 'object',
    properties: {
      Bucket: { type: 'string' },
      '*': { type: 'string' },
    },
    required: ['Bucket', '*'],
  },
  Headers: {
    type: 'object',
    properties: {
      'x-amz-copy-source': { type: 'string' },
      'x-amz-copy-source-if-match': { type: 'string' },
      'x-amz-copy-source-if-modified-since': { type: 'string' },
      'x-amz-copy-source-if-none-match': { type: 'string' },
      'x-amz-copy-source-if-unmodified-since': { type: 'string' },
      'x-amz-metadata-directive': { type: 'string' },
      'content-encoding': { type: 'string' },
      'content-type': { type: 'string' },
      'cache-control': { type: 'string' },
      expires: { type: 'string' },
    },
    required: ['x-amz-copy-source'],
  },
} as const

export default function CopyObject(s3Router: S3Router) {
  s3Router.put(
    '/:Bucket/*|x-amz-copy-source',
    { schema: CopyObjectInput, operation: ROUTE_OPERATIONS.S3_COPY_OBJECT },
    (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)
      const metadata = s3Protocol.parseMetadataHeaders(req.Headers)

      return s3Protocol.copyObject({
        Bucket: req.Params.Bucket,
        Key: req.Params['*'],
        CopySource: req.Headers['x-amz-copy-source'],
        ContentType: req.Headers['content-type'],
        CacheControl: req.Headers['cache-control'],
        Metadata: metadata,
        MetadataDirective: req.Headers['x-amz-metadata-directive'] as MetadataDirective | undefined,
        Expires: req.Headers.expires ? new Date(req.Headers.expires) : undefined,
        ContentEncoding: req.Headers['content-encoding'],
        CopySourceIfMatch: req.Headers['x-amz-copy-source-if-match'],
        CopySourceIfModifiedSince: req.Headers['x-amz-copy-source-if-modified-since']
          ? new Date(req.Headers['x-amz-copy-source-if-modified-since'])
          : undefined,
        CopySourceIfNoneMatch: req.Headers['x-amz-copy-source-if-none-match'],
        CopySourceIfUnmodifiedSince: req.Headers['x-amz-copy-source-if-unmodified-since']
          ? new Date(req.Headers['x-amz-copy-source-if-unmodified-since'])
          : undefined,
      })
    }
  )
}
