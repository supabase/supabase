export const transformationOptionsSchema = {
  type: 'object',
  properties: {
    height: { type: 'integer', finite: true, examples: [100], minimum: 0 },
    width: { type: 'integer', finite: true, examples: [100], minimum: 0 },
    resize: { type: 'string', enum: ['cover', 'contain', 'fill'] },
    format: { type: 'string', enum: ['origin', 'avif', 'webp'] },
    quality: { type: 'integer', finite: true, minimum: 20, maximum: 100 },
    gravity: {
      type: 'string',
      enum: ['no', 'so', 'ea', 'we', 'noea', 'nowe', 'soea', 'sowe', 'ce', 'sm', 'fp'],
      description:
        'Image gravity. Focal-point gravity (fp) requires both x_offset and y_offset in the 0-1 range.',
    },
    x_offset: {
      type: 'number',
      finite: true,
      examples: [0.1, 100],
      description:
        'Horizontal gravity offset. For directional gravity, values < 1 are relative and values >= 1 are absolute pixels. For focal-point gravity, must be between 0 and 1.',
    },
    y_offset: {
      type: 'number',
      finite: true,
      examples: [0.1, -100],
      description:
        'Vertical gravity offset. For directional gravity, values < 1 are relative and values >= 1 are absolute pixels. For focal-point gravity, must be between 0 and 1.',
    },
  },
  if: {
    type: 'object',
    properties: { gravity: { const: 'fp' } },
    required: ['gravity'],
  },
  // biome-ignore lint/suspicious/noThenProperty: part of the JSON schema spec
  then: {
    required: ['x_offset', 'y_offset'],
    properties: {
      x_offset: { type: 'number', minimum: 0, maximum: 1 },
      y_offset: { type: 'number', minimum: 0, maximum: 1 },
    },
  },
} as const
