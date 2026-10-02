import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const GetBucketLocationInput = {
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
      location: { type: 'string' },
    },
    required: ['location'],
  },
} as const

const GetBucketVersioningInput = {
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
      versioning: { type: 'string' },
    },
    required: ['versioning'],
  },
} as const

export default function GetBucket(s3Router: S3Router) {
  s3Router.get(
    '/:Bucket?location',
    { schema: GetBucketLocationInput, operation: ROUTE_OPERATIONS.S3_GET_BUCKET_LOCATION },
    async (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)
      await ctx.storage.findBucket(req.Params.Bucket)

      return s3Protocol.getBucketLocation()
    }
  )

  s3Router.get(
    '/:Bucket?versioning',
    { schema: GetBucketVersioningInput, operation: ROUTE_OPERATIONS.S3_GET_BUCKET_VERSIONING },
    async (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)
      await ctx.storage.findBucket(req.Params.Bucket)

      return s3Protocol.getBucketVersioning()
    }
  )
}
