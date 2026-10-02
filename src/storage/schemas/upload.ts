import { FromSchema } from 'json-schema-to-ts'
import { bucketSchema } from './bucket'

export const uploadSchema = {
  $id: 'uploadSchema',
  type: 'object',
  properties: {
    object_name: { type: 'string' },
    bucket_id: { type: 'string' },
    owner: { type: 'string' },
    version: { type: 'string' },
    upload_type: { type: 'string', enum: ['STANDARD', 'MULTIPART'] },
    id: { type: 'string' },
    updated_at: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    created_at: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    expires_at: { anyOf: [{ type: 'string' }, { type: 'null' }] },
    buckets: bucketSchema,
  },
  required: ['id', 'object_name', 'bucket_id'],
  additionalProperties: false,
} as const

export type UploadMetadata = FromSchema<typeof uploadSchema>
