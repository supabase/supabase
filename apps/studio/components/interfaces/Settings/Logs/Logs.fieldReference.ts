import { logConstants } from 'shared-data'

export type LogFieldSchema = (typeof logConstants.schemas)[number]
type LogField = LogFieldSchema['fields'][number]

// OTEL keeps everything in one `logs` table; these columns are real, every other
// source field lives in the log_attributes map.
const OTEL_BASE_FIELDS: LogField[] = [
  { path: 'id', type: 'string' },
  { path: 'timestamp', type: 'datetime' },
  { path: 'event_message', type: 'string' },
  { path: 'severity_text', type: 'string' },
  { path: 'source', type: 'string' },
]

const OTEL_COLUMN_PATHS = new Set(['id', 'timestamp', 'event_message'])

// BigQuery field paths nest under `metadata`; the OTEL map keys drop that root.
const toOtelAttributeKey = (path: string) => path.replace(/^metadata\./, '')

// Recasts a BigQuery source schema onto the OTEL logs schema: real columns stay,
// everything else becomes a log_attributes['key'] lookup.
const toOtelFieldSchema = (schema: LogFieldSchema): LogFieldSchema => ({
  ...schema,
  fields: [
    ...OTEL_BASE_FIELDS,
    ...schema.fields
      .filter((field) => !OTEL_COLUMN_PATHS.has(field.path))
      .map((field) => ({
        path: `log_attributes['${toOtelAttributeKey(field.path)}']`,
        type: field.type,
      })),
  ],
})

export const toOtelFieldSchemas = (schemas: LogFieldSchema[]): LogFieldSchema[] =>
  schemas.map(toOtelFieldSchema)
