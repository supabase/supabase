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
] as const

export type ColumnType = (typeof COLUMN_TYPES)[number]

interface AdditionalColumnField {
  name: 'precision' | 'scale' | 'length'
  type: 'number'
}

export const COLUMN_TYPE_FIELDS: Partial<Record<ColumnType, AdditionalColumnField[]>> = {
  decimal: [
    { name: 'precision', type: 'number' },
    { name: 'scale', type: 'number' },
  ],
  fixed: [{ name: 'length', type: 'number' }],
}
