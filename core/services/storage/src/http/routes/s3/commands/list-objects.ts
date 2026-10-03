import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const ListObjectsV2Input = {
  summary: 'List Objects V2',
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
      'list-type': { type: 'string', enum: ['2'] },
      delimiter: { type: 'string' },
      'encoding-type': { type: 'string', enum: ['url'] },
      'max-keys': { type: 'integer', minimum: 0, finite: true },
      prefix: { type: 'string' },
      'continuation-token': { type: 'string' },
      'start-after': { type: 'string' },
    },
    required: ['list-type'],
  },
} as const

const ListObjectsInput = {
  summary: 'List Objects',
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
      delimiter: { type: 'string' },
      'encoding-type': { type: 'string', enum: ['url'] },
      'max-keys': { type: 'integer', minimum: 0, finite: true },
      prefix: { type: 'string' },
      marker: { type: 'string' },
    },
  },
} as const

export default function ListObjects(s3Router: S3Router) {
  s3Router.get(
    '/:Bucket?list-type=2',
    { schema: ListObjectsV2Input, operation: ROUTE_OPERATIONS.S3_LIST_OBJECT },
    async (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      return s3Protocol.listObjectsV2({
        Bucket: req.Params.Bucket,
        Prefix: req.Querystring?.prefix || '',
        ContinuationToken: req.Querystring?.['continuation-token'],
        StartAfter: req.Querystring?.['start-after'],
        EncodingType: req.Querystring?.['encoding-type'],
        MaxKeys: req.Querystring?.['max-keys'],
        Delimiter: req.Querystring?.delimiter,
      })
    }
  )

  s3Router.get(
    '/:Bucket',
    { schema: ListObjectsInput, operation: ROUTE_OPERATIONS.S3_LIST_OBJECT },
    async (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      return s3Protocol.listObjects({
        Bucket: req.Params.Bucket,
        Prefix: req.Querystring?.prefix || '',
        Marker: req.Querystring?.['marker'],
        EncodingType: req.Querystring?.['encoding-type'],
        MaxKeys: req.Querystring?.['max-keys'],
        Delimiter: req.Querystring?.delimiter,
      })
    }
  )
}
