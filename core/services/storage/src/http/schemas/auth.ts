export const authSchema = {
  $id: 'authSchema',
  type: 'object',
  properties: {
    authorization: {
      type: 'string',
      examples: [
        'Bearer TEST_JWT_REDACTED',
      ],
    },
  },
  required: ['authorization'],
} as const
