export const fileSizeLimitSchema = {
  anyOf: [
    { type: 'integer', finite: true, examples: [1000], nullable: true, minimum: 0 },
    {
      type: 'string',
      pattern: '^[0-9]+(?:\\.[0-9]+)?(?:[gG][bB]|[mM][bB]|[kK][bB]|[bB])$',
      examples: ['100MB'],
      nullable: true,
    },
  ],
} as const
