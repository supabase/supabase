import { at } from 'lodash-es'

/**
 * Resolves a dot/bracket path within a shared-data dataset. If the resolved
 * value is an object with `value`/`unit` fields, returns `${value} ${unit}`
 * (trimmed); otherwise returns the resolved primitive as-is.
 *
 * Pure: no `shared-data` import. Callers supply the dataset so this util can
 * be reused by the React `<SharedData>` component (Next.js bundle) and by the
 * build-time markdown-schema handler (tsx) without each having to navigate
 * `shared-data`'s ESM/CJS interop independently.
 */
export function resolveSharedDataPath(dataset: unknown, path: string): string | number | undefined {
  const selected = at(dataset as any, [path])[0]
  if (typeof selected === 'object' && selected !== null) {
    return `${(selected as any).value ?? ''} ${(selected as any).unit ?? ''}`.trim()
  }
  return selected
}

type LogSourceSchema = {
  name: string
  reference: string
  fields: { path: string; type: string }[]
}

const LOG_COLUMNS = new Map([
  ['id', 'String'],
  ['timestamp', 'DateTime64'],
  ['event_message', 'String'],
  ['severity_text', 'String'],
  ['source', 'String'],
])

/** One field mapping for the HTML reference and its Markdown export. */
export function getLogFieldReference(schemas: LogSourceSchema[]) {
  return schemas.map((schema) => {
    const fields = [...schema.fields]
    for (const [path, type] of LOG_COLUMNS) {
      if (!fields.some((field) => field.path === path)) fields.push({ path, type })
    }
    return {
      ...schema,
      fields: fields
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((field) => {
          const key = field.path
            .replace(/^metadata\./, '')
            .replace(/\\/g, '\\\\')
            .replace(/'/g, "''")
          return {
            ...field,
            queryField: LOG_COLUMNS.has(field.path) ? field.path : `log_attributes['${key}']`,
            queryType: LOG_COLUMNS.get(field.path) ?? 'String',
          }
        }),
    }
  })
}
