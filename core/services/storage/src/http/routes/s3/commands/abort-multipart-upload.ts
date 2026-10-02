import { ERRORS } from '@internal/errors'
import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const AbortMultiPartUploadInput = {
  summary: 'Abort MultiPart Upload',
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
      uploadId: { type: 'string' },
    },
    required: ['uploadId'],
  },
} as const

export default function AbortMultiPartUpload(s3Router: S3Router) {
  s3Router.delete(
    '/:Bucket/*?uploadId',
    {
      type: 'iceberg',
      schema: AbortMultiPartUploadInput,
      operation: ROUTE_OPERATIONS.S3_ABORT_MULTIPART,
    },
    async (req, ctx) => {
      const icebergBucketName = ctx.req.internalIcebergBucketName

      if (!icebergBucketName) {
        throw ERRORS.InvalidParameter('internalIcebergBucketName')
      }

      await ctx.storage.backend.abortMultipartUpload(
        icebergBucketName,
        req.Params['*'],
        req.Querystring.uploadId
      )

      return {}
    }
  )

  s3Router.delete(
    '/:Bucket/*?uploadId',
    { schema: AbortMultiPartUploadInput, operation: ROUTE_OPERATIONS.S3_ABORT_MULTIPART },
    (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      return s3Protocol.abortMultipartUpload({
        Bucket: req.Params.Bucket,
        Key: req.Params['*'],
        UploadId: req.Querystring.uploadId,
      })
    }
  )
}
