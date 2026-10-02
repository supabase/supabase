import { ERRORS } from '@internal/errors'
import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const HeadObjectInput = {
  summary: 'Head Object',
  tags: ['s3'],
  Params: {
    type: 'object',
    properties: {
      Bucket: { type: 'string' },
      '*': { type: 'string' },
    },
    required: ['Bucket', '*'],
  },
} as const

export default function HeadObject(s3Router: S3Router) {
  s3Router.head(
    '/:Bucket/*',
    { type: 'iceberg', schema: HeadObjectInput, operation: ROUTE_OPERATIONS.S3_HEAD_OBJECT },
    (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      const icebergBucket = ctx.req.internalIcebergBucketName

      if (!icebergBucket) {
        throw ERRORS.InvalidParameter('Iceberg bucket not found in request context')
      }

      return s3Protocol.headObject({
        Bucket: icebergBucket,
        Key: req.Params['*'],
      })
    }
  )

  s3Router.head(
    '/:Bucket/*',
    { schema: HeadObjectInput, operation: ROUTE_OPERATIONS.S3_HEAD_OBJECT },
    (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      return s3Protocol.dbHeadObject({
        Bucket: req.Params.Bucket,
        Key: req.Params['*'],
      })
    }
  )
}
