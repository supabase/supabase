import { ERRORS } from '@internal/errors'
import { S3Backend } from '@storage/backend'
import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const ListPartsInput = {
  summary: 'List Parts',
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
      'max-parts': { type: 'integer', minimum: 1, maximum: 1000, finite: true },
      'part-number-marker': { type: 'string' },
    },
    required: ['uploadId'],
  },
} as const

export default function ListParts(s3Router: S3Router) {
  s3Router.get(
    '/:Bucket/*?uploadId',
    { type: 'iceberg', schema: ListPartsInput, operation: ROUTE_OPERATIONS.S3_LIST_PARTS },
    async (req, ctx) => {
      const backend = ctx.req.storage.backend

      if (!(backend instanceof S3Backend)) {
        throw ERRORS.NotSupported('only S3 driver is supported for this operation')
      }

      const icebergBucketName = ctx.req.internalIcebergBucketName
      const key = req.Params['*']
      const uploadId = req.Querystring.uploadId
      const maxParts = req.Querystring['max-parts']
      const marker = req.Querystring['part-number-marker']

      if (!icebergBucketName) {
        throw ERRORS.InvalidBucketName('Iceberg bucket name is required')
      }

      const result = await backend.listParts(icebergBucketName, key, uploadId, maxParts, marker)

      return {
        responseBody: {
          ListPartsResult: {
            Bucket: req.Params.Bucket,
            Key: key,
            UploadId: req.Querystring.uploadId,
            PartNumberMarker: marker,
            NextPartNumberMarker: result.nextPartNumberMarker,
            MaxParts: maxParts,
            IsTruncated: result.isTruncated,
            Part: result.parts,
          },
        },
      }
    }
  )

  s3Router.get(
    '/:Bucket/*?uploadId',
    { schema: ListPartsInput, operation: ROUTE_OPERATIONS.S3_LIST_PARTS },
    async (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      return s3Protocol.listParts({
        Bucket: req.Params.Bucket,
        Key: req.Params['*'],
        UploadId: req.Querystring.uploadId,
        MaxParts: req.Querystring['max-parts'],
        PartNumberMarker: req.Querystring['part-number-marker'],
      })
    }
  )
}
