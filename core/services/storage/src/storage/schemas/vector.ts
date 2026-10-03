import { FromSchema } from 'json-schema-to-ts'

const vectorIndex = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    data_type: { type: 'string' },
    dimension: { type: 'number' },
    distance_metric: { type: 'string' },
    status: { type: 'string' },
    metadata_configuration: {
      type: 'object',
      properties: {
        nonFilterableMetadataKeys: {
          type: 'array',
          items: { type: 'string' },
        },
      },
    },
    bucket_id: { type: 'string' },
  },
  required: ['name', 'dimension', 'distance_metric', 'bucket_id'],
  additionalProperties: false,
} as const

export type VectorIndex = FromSchema<typeof vectorIndex>
