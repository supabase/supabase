import { ERRORS } from '@internal/errors'
import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import type { S3Router } from '../router'

const BucketLifecycleInput = {
  Params: {
    type: 'object',
    properties: {
      Bucket: { type: 'string' },
    },
    required: ['Bucket'],
  },
  Querystring: {
    type: 'object',
    properties: {
      lifecycle: { type: 'string' },
    },
    required: ['lifecycle'],
  },
} as const

const PutBucketLifecycleInput = {
  ...BucketLifecycleInput,
  Body: {
    type: 'object',
    properties: {
      LifecycleConfiguration: {
        type: 'object',
        properties: {
          Rule: {
            type: 'array',
            items: { type: 'object', additionalProperties: true },
          },
        },
        required: ['Rule'],
        additionalProperties: true,
      },
    },
    required: ['LifecycleConfiguration'],
    additionalProperties: true,
  },
} as const

async function rejectIcebergLifecycle(): Promise<never> {
  throw ERRORS.LifecycleRequiresStandardBucket()
}

export default function BucketLifecycle(s3Router: S3Router) {
  const path = '/:Bucket?lifecycle'
  const getOptions = {
    schema: BucketLifecycleInput,
    operation: ROUTE_OPERATIONS.S3_GET_BUCKET_LIFECYCLE,
  }
  const putOptions = {
    schema: PutBucketLifecycleInput,
    operation: ROUTE_OPERATIONS.S3_PUT_BUCKET_LIFECYCLE,
  }
  const deleteOptions = {
    schema: BucketLifecycleInput,
    operation: ROUTE_OPERATIONS.S3_DELETE_BUCKET_LIFECYCLE,
  }

  s3Router.get(path, getOptions, (req, ctx) => {
    const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)
    return s3Protocol.getBucketLifecycle(req.Params.Bucket)
  })
  s3Router.get(path, { ...getOptions, type: 'iceberg' }, rejectIcebergLifecycle)

  s3Router.put(path, putOptions, (req, ctx) => {
    const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)
    return s3Protocol.putBucketLifecycle(req.Params.Bucket, req.Body)
  })
  s3Router.put(path, { ...putOptions, type: 'iceberg' }, rejectIcebergLifecycle)

  s3Router.delete(path, deleteOptions, (req, ctx) => {
    const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)
    return s3Protocol.deleteBucketLifecycle(req.Params.Bucket)
  })
  s3Router.delete(path, { ...deleteOptions, type: 'iceberg' }, rejectIcebergLifecycle)
}
