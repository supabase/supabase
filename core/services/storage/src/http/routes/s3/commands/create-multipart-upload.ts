import { ERRORS } from '@internal/errors'
import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const CreateMultiPartUploadInput = {
  summary: 'Create multipart upload',
  Params: {
    type: 'object',
    properties: {
      Bucket: { type: 'string' },
      '*': { type: 'string' },
    },
    required: ['Bucket', '*'],
  },
  Querystring: {
    type: 'object',
    properties: {
      uploads: { type: 'string' },
    },
    required: ['uploads'],
  },
  Headers: {
    type: 'object',
    additionalProperties: true,
    properties: {
      authorization: { type: 'string' },
      'content-type': { type: 'string' },
      'cache-control': { type: 'string' },
      'content-disposition': { type: 'string' },
      'content-encoding': { type: 'string' },
    },
  },
} as const

export default function CreateMultipartUpload(s3Router: S3Router) {
  s3Router.post(
    '/:Bucket/*?uploads',
    {
      type: 'iceberg',
      schema: CreateMultiPartUploadInput,
      allowEmptyJsonBody: true,
      operation: ROUTE_OPERATIONS.S3_CREATE_MULTIPART,
    },
    async (req, ctx) => {
      const icebergBucketName = ctx.req.internalIcebergBucketName

      if (!icebergBucketName) {
        throw ERRORS.InvalidBucketName('Iceberg bucket name is required')
      }

      const uploadId = await ctx.req.storage.backend.createMultiPartUpload(
        icebergBucketName,
        req.Params['*'],
        undefined,
        req.Headers?.['content-type'] || 'application/octet-stream',
        req.Headers?.['cache-control'] || 'no-cache'
      )

      return {
        responseBody: {
          InitiateMultipartUploadResult: {
            Bucket: `${req.Params.Bucket}`,
            Key: req.Params['*'],
            UploadId: uploadId,
          },
        },
      }
    }
  )

  s3Router.post(
    '/:Bucket/*?uploads',
    {
      schema: CreateMultiPartUploadInput,
      allowEmptyJsonBody: true,
      operation: ROUTE_OPERATIONS.S3_CREATE_MULTIPART,
    },
    (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      const metadata = s3Protocol.parseMetadataHeaders(req.Headers)

      return s3Protocol.createMultiPartUpload({
        Bucket: req.Params.Bucket,
        Key: req.Params['*'],
        ContentType: req.Headers?.['content-type'],
        CacheControl: req.Headers?.['cache-control'],
        ContentDisposition: req.Headers?.['content-disposition'],
        ContentEncoding: req.Headers?.['content-encoding'],
        Metadata: metadata || {},
      })
    }
  )
}
