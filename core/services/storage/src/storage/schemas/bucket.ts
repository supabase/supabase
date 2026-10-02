import { FromSchema } from 'json-schema-to-ts'

export const bucketSchema = {
  $id: 'bucketSchema',
  type: 'object',
  properties: {
    id: { type: 'string' },
    name: { type: 'string' },
    owner: { type: 'string' },
    owner_id: { type: 'string' },
    public: { type: 'boolean' },
    type: { type: 'string', enum: ['STANDARD', 'ANALYTICS'] },
    file_size_limit: { type: ['integer', 'null'] },
    allowed_mime_types: { type: ['array', 'null'], items: { type: 'string' } },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
  },
  required: ['id', 'name'],
  additionalProperties: false,
  examples: [
    {
      id: 'bucket2',
      name: 'bucket2',
      public: false,
      file_size_limit: 1000000,
      allowed_mime_types: ['image/png', 'image/jpeg'],
      owner: '4d56e902-f0a0-4662-8448-a4d9e643c142',
      created_at: '2021-02-17T04:43:32.770206+00:00',
      updated_at: '2021-02-17T04:43:32.770206+00:00',
    },
  ],
} as const

export type Bucket = FromSchema<typeof bucketSchema>
export type IcebergCatalog = Pick<Bucket, 'id' | 'name' | 'created_at' | 'updated_at'> & {
  deleted_at: Date | null
}
export type VectorBucket = Pick<Bucket, 'id' | 'created_at' | 'updated_at'> & { created_at: Date }
