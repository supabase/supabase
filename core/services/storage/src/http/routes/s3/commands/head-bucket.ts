import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const HeadBucketInput = {
  summary: 'Head Bucket',
  tags: ['s3'],
  Params: {
    type: 'object',
    properties: {
      Bucket: { type: 'string' },
    },
    required: ['Bucket'],
  },
} as const

export default function HeadBucket(s3Router: S3Router) {
  s3Router.head(
    '/:Bucket',
    { schema: HeadBucketInput, operation: ROUTE_OPERATIONS.S3_HEAD_BUCKET },
    async (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      return s3Protocol.headBucket(req.Params.Bucket)
    }
  )
}
