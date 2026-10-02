import { DELETE_OBJECTS_LIMIT_DESCRIPTION, enforceDeleteObjectsLimit } from '@storage/limits'
import { S3ProtocolHandler } from '@storage/protocols/s3/s3-handler'
import { getConfig } from '../../../../config'
import { ROUTE_OPERATIONS } from '../../operations'
import { S3Router } from '../router'

const DeleteObjectInput = {
  summary: 'Delete Object',
  Params: {
    type: 'object',
    properties: {
      Bucket: { type: 'string' },
      '*': { type: 'string' },
    },
    required: ['Bucket', '*'],
  },
  Querystring: {},
} as const

const DeleteObjectsInput = {
  summary: 'Delete Objects',
  Params: {
    type: 'object',
    properties: {
      Bucket: { type: 'string' },
    },
    required: ['Bucket'],
  },
  Body: {
    type: 'object',
    properties: {
      Delete: {
        type: 'object',
        properties: {
          Object: {
            type: 'array',
            description: DELETE_OBJECTS_LIMIT_DESCRIPTION,
            items: {
              type: 'object',
              properties: {
                Key: { type: 'string' },
              },
              required: ['Key'],
            },
          },
          Quiet: { type: 'boolean' },
        },
        required: ['Object'],
      },
    },
    required: ['Delete'],
  },
  Querystring: {
    type: 'object',
    properties: {
      delete: { type: 'string' },
    },
    required: ['delete'],
  },
} as const

const { icebergS3DeleteEnabled } = getConfig()

export default function DeleteObject(s3Router: S3Router) {
  // Delete multiple objects
  s3Router.post(
    '/:Bucket?delete',
    { schema: DeleteObjectsInput, operation: ROUTE_OPERATIONS.S3_DELETE_OBJECTS },
    async (req, ctx) => {
      await enforceDeleteObjectsLimit(ctx.tenantId, req.Body.Delete.Object.length)

      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      return s3Protocol.deleteObjects({
        Bucket: req.Params.Bucket,
        Delete: {
          Objects: req.Body.Delete.Object,
          Quiet: req.Body.Delete.Quiet,
        },
      })
    }
  )

  // Delete single object
  s3Router.delete(
    '/:Bucket/*',
    { schema: DeleteObjectInput, operation: ROUTE_OPERATIONS.S3_DELETE_OBJECT },
    (req, ctx) => {
      const s3Protocol = new S3ProtocolHandler(ctx.storage, ctx.tenantId, ctx.owner)

      return s3Protocol.deleteObject({
        Bucket: req.Params.Bucket,
        Key: req.Params['*'],
      })
    }
  )

  // Delete single object
  if (icebergS3DeleteEnabled) {
    s3Router.delete(
      '/:Bucket/*',
      { type: 'iceberg', schema: DeleteObjectInput, operation: ROUTE_OPERATIONS.S3_DELETE_OBJECT },
      async (req, ctx) => {
        const internalBucketName = ctx.req.internalIcebergBucketName

        if (!internalBucketName) {
          throw new Error('Iceberg bucket name is required')
        }

        await ctx.req.storage.backend.deleteObject(internalBucketName, req.Params['*'], undefined)

        return {
          statusCode: 204,
        }
      }
    )
  }
}
