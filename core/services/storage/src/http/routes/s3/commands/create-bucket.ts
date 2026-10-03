import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const CreateBucketInput = {
  summary: 'Create Bucket',
  Params: {
    type: 'object',
    properties: {
      Bucket: { type: 'string' },
    },
    required: ['Bucket'],
  },
  Headers: {
    type: 'object',
    properties: {
      'x-amz-acl': { type: 'string' },
    },
  },
} as const

export default function CreateBucket(s3Router: S3Router) {
  s3Router.put(
    '/:Bucket',
    { schema: CreateBucketInput, operation: ROUTE_OPERATIONS.S3_CREATE_BUCKET },
    (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      return s3Protocol.createBucket(
        req.Params.Bucket,
        req.Headers?.['x-amz-acl'] === 'public-read'
      )
    }
  )
}
