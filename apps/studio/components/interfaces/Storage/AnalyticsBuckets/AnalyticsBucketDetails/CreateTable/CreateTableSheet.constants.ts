export const NEW_NAMESPACE_MARKER = 'new-namespace'

export const COLUMN_TYPES = [
  'boolean',
  'int',
  'long',
  'float',
  'double',
  'string',
  'timestamp',
  'date',
  'time',
  'timestamptz',
  'uuid',
  'binary',
  'decimal',
  'fixed',
]

export const COLUMN_TYPE_FIELDS = {
  decimal: [
    { name: 'precision', type: 'number' },
    { name: 'scale', type: 'number' },
  ],
  fixed: [{ name: 'length', type: 'number' }],
}
