import { logConstants } from 'shared-data'

export type LogFieldSchema = (typeof logConstants.schemas)[number]
type LogField = LogFieldSchema['fields'][number]

const OTEL_BASE_FIELDS: LogField[] = [
  { path: 'id', type: 'string' },
  { path: 'timestamp', type: 'datetime' },
  { path: 'event_message', type: 'string' },
  { path: 'severity_text', type: 'string' },
  { path: 'source', type: 'string' },
]

const OTEL_COLUMN_PATHS = new Set(OTEL_BASE_FIELDS.map(({ path }) => path))

const toOtelAttributeKey = (path: string) => path.replace(/^metadata\./, '')

const toLogAttributePath = (key: string) =>
  `log_attributes['${key.replace(/\\/g, '\\\\').replace(/'/g, "''")}']`

const toOtelFieldSchema = (schema: LogFieldSchema): LogFieldSchema => ({
  ...schema,
  fields: [
    ...OTEL_BASE_FIELDS,
    ...schema.fields
      .filter((field) => !OTEL_COLUMN_PATHS.has(field.path))
      .map((field) => ({
        path: toLogAttributePath(toOtelAttributeKey(field.path)),
        type: field.type,
      })),
  ],
})

export const toOtelFieldSchemas = (schemas: LogFieldSchema[]): LogFieldSchema[] =>
  schemas.map(toOtelFieldSchema)

export function otelFieldsFromKeys(keys: string[]): LogFieldSchema['fields'] {
  const attributeFields = keys
    .filter((key) => !OTEL_COLUMN_PATHS.has(key))
    .map((key) => ({ path: toLogAttributePath(key), type: 'string' as const }))
  return [...OTEL_BASE_FIELDS, ...attributeFields]
}
