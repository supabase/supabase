export const errorSchema = {
  $id: 'errorSchema',
  type: 'object',
  properties: {
    statusCode: { type: 'string' },
    error: { type: 'string' },
    message: { type: 'string' },
    code: { type: 'string' },
  },
  required: ['statusCode', 'error', 'message', 'code'],
} as const

export const sharedErrorResponseSchemas = {
  '4xx': { $ref: 'errorSchema#', description: 'Error response' },
  '5xx': { $ref: 'errorSchema#', description: 'Error response' },
} as const
