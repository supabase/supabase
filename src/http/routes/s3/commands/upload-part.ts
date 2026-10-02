import { ByteLimitTransformStream } from '@storage/protocols/s3/byte-limit-stream'
import { MAX_PART_SIZE, S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { PassThrough, Readable } from 'stream'
import { pipeline } from 'stream/promises'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const UploadPartInput = {
  summary: 'Upload Part',
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
      partNumber: { type: 'integer', minimum: 1, maximum: 10000, finite: true },
    },
    required: ['uploadId', 'partNumber'],
  },
  Headers: {
    type: 'object',
    properties: {
      host: { type: 'string' },
      'x-amz-content-sha256': { type: 'string' },
      'x-amz-decoded-content-length': { type: 'integer', finite: true },
      'x-amz-date': { type: 'string' },
      'content-type': { type: 'string' },
      'content-length': { type: 'integer', finite: true },
    },
  },
} as const

export default function UploadPart(s3Router: S3Router) {
  s3Router.put(
    '/:Bucket/*?uploadId&partNumber',
    {
      type: 'iceberg',
      schema: UploadPartInput,
      operation: ROUTE_OPERATIONS.S3_UPLOAD_PART,
      disableContentTypeParser: true,
    },
    async (req, ctx) => {
      const icebergBucketName = ctx.req.internalIcebergBucketName

      const passThrough = new PassThrough()
      passThrough.on('error', () => {})

      ctx.req.raw.pipe(passThrough)
      ctx.req.raw.on('error', (err) => {
        passThrough.destroy(err)
      })

      if (ctx.req.streamingSignatureV4) {
        return pipeline(
          passThrough,
          ctx.req.streamingSignatureV4,
          new ByteLimitTransformStream(MAX_PART_SIZE), // 5GB max part size
          async (body) => {
            const part = await ctx.req.storage.backend.uploadPart(
              icebergBucketName!,
              req.Params['*'],
              '',
              req.Querystring.uploadId,
              req.Querystring.partNumber,
              body as Readable,
              req.Headers?.['x-amz-decoded-content-length'] || req.Headers?.['content-length'],
              ctx.signals.body
            )

            return {
              headers: {
                etag: part.ETag || '',
                'Access-Control-Expose-Headers': 'etag',
              },
            }
          }
        )
      }

      const part = await ctx.req.storage.backend.uploadPart(
        icebergBucketName!,
        req.Params['*'],
        '',
        req.Querystring.uploadId,
        req.Querystring.partNumber,
        passThrough as Readable,
        req.Headers?.['content-length'],
        ctx.signals.body
      )

      return {
        headers: {
          etag: part.ETag || '',
          'Access-Control-Expose-Headers': 'etag',
        },
      }
    }
  )

  s3Router.put(
    '/:Bucket/*?uploadId&partNumber',
    {
      schema: UploadPartInput,
      operation: ROUTE_OPERATIONS.S3_UPLOAD_PART,
      disableContentTypeParser: true,
    },
    (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      if (ctx.req.streamingSignatureV4) {
        const passThrough = new PassThrough()
        passThrough.on('error', () => {})
        ctx.req.raw.pipe(passThrough)
        ctx.req.raw.on('error', (err) => {
          passThrough.destroy(err)
        })

        return pipeline(
          passThrough,
          ctx.req.streamingSignatureV4,
          new ByteLimitTransformStream(MAX_PART_SIZE),
          async (body) => {
            return s3Protocol.uploadPart(
              {
                Body: body as Readable,
                UploadId: req.Querystring?.uploadId,
                Bucket: req.Params.Bucket,
                Key: req.Params['*'],
                ContentLength: req.Headers?.['x-amz-decoded-content-length'],
                PartNumber: req.Querystring?.partNumber,
              },
              { signal: ctx.req.signals.body.signal }
            )
          }
        )
      }

      return s3Protocol.uploadPart(
        {
          Body: ctx.req.raw,
          UploadId: req.Querystring?.uploadId,
          Bucket: req.Params.Bucket,
          Key: req.Params['*'],
          PartNumber: req.Querystring?.partNumber,
          ContentLength: req.Headers?.['content-length'],
        },
        { signal: ctx.req.signals.body.signal }
      )
    }
  )
}
