export const deleteSuccessResponseSchema = {
  type: 'object',
  properties: {
    message: { type: 'string', examples: ['Successfully deleted'] },
  },
  required: ['message'],
} as const
