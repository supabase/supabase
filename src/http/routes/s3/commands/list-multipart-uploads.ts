import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const ListMultipartUploadsInput = {
  summary: 'List Multipart Uploads',
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
      uploads: { type: 'string' },
      delimiter: { type: 'string' },
      'encoding-type': { type: 'string', enum: ['url'] },
      'max-uploads': { type: 'integer', minimum: 1, maximum: 1000, finite: true },
      'key-marker': { type: 'string' },
      'upload-id-marker': { type: 'string' },
      prefix: { type: 'string' },
    },
    required: ['uploads'],
  },
} as const

export default function ListMultipartUploads(s3Router: S3Router) {
  s3Router.get(
    '/:Bucket?uploads',
    { schema: ListMultipartUploadsInput, operation: ROUTE_OPERATIONS.S3_LIST_MULTIPART },
    async (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      return s3Protocol.listMultipartUploads({
        Bucket: req.Params.Bucket,
        Prefix: req.Querystring?.prefix || '',
        KeyMarker: req.Querystring?.['key-marker'],
        UploadIdMarker: req.Querystring?.['upload-id-marker'],
        EncodingType: req.Querystring?.['encoding-type'],
        MaxUploads: req.Querystring?.['max-uploads'],
        Delimiter: req.Querystring?.delimiter,
      })
    }
  )
}
