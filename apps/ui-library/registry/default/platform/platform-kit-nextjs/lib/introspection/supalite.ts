import type {
  IntrospectedColumn,
  IntrospectedTable,
} from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/introspection-types'

// Minimal shape of supalite's `GET /_system/introspect` response. Only the
// fields we consume are typed; the endpoint returns more.
interface SupaliteTableInfo {
  name: string
  schema: string
  type: 'table' | 'view'
  rows: number
}
interface SupaliteColumnInfo {
  table: string
  name: string
  type: string
  nullable: boolean
  default_value: string | null
  is_primary_key: boolean
  schema: string
  ordinal_position: number
  is_identity: boolean
  is_generated?: boolean
  pg_type?: string
}
interface SupalitePrimaryKeyInfo {
  table: string
  columns: string[]
  schema: string
}
interface SupaliteCustomType {
  schema: string
  type: string
  kind: 'enum' | 'composite'
  values?: string[]
}
interface SupaliteCommentInfo {
  schema: string
  table: string
  column?: string
  text: string
}
export interface SupaliteIntrospectResult {
  tables: SupaliteTableInfo[]
  columns: SupaliteColumnInfo[]
  primary_keys: SupalitePrimaryKeyInfo[]
  custom_types: SupaliteCustomType[]
  comments?: SupaliteCommentInfo[]
}

/**
 * Map supalite's `/_system/introspect` payload into the normalized
 * `IntrospectedTable[]` the UI consumes. Only base tables are returned; RLS
 * state is unavailable and reported as null.
 */
export function mapIntrospectResult(
  result: SupaliteIntrospectResult,
  schemas?: string[]
): IntrospectedTable[] {
  const enumsByType = new Map<string, string[]>()
  for (const t of result.custom_types ?? []) {
    if (t.kind === 'enum' && t.values) {
      enumsByType.set(t.type, t.values)
      enumsByType.set(`${t.schema}.${t.type}`, t.values)
    }
  }

  const commentFor = (schema: string, table: string, column?: string): string | null => {
    const match = (result.comments ?? []).find(
      (c) => c.schema === schema && c.table === table && c.column === column
    )
    return match?.text ?? null
  }

  // supalite's default (SQLite) schema is the empty string; surface it as
  // `public` so the UI's default `['public']` filter and row operations match.
  const normalizeSchema = (schema: string) => (schema && schema.length > 0 ? schema : 'public')

  return result.tables
    .filter((t) => t.type === 'table')
    .filter((t) => !schemas || schemas.length === 0 || schemas.includes(normalizeSchema(t.schema)))
    .map((table) => {
      // Match columns/PKs on the original (raw) schema, output the normalized one.
      const cols = result.columns
        .filter((c) => c.table === table.name && c.schema === table.schema)
        .sort((a, b) => a.ordinal_position - b.ordinal_position)

      const columns: IntrospectedColumn[] = cols.map((c) => {
        const enums = enumsByType.get(c.pg_type ?? c.type) ?? enumsByType.get(c.type) ?? []
        const is_generated = c.is_generated ?? false
        // Prefer the Postgres type (pg_type) for accurate form field mapping
        // (e.g. `bool` stored as SQLite `integer`).
        const pgType = c.pg_type ?? c.type
        return {
          name: c.name,
          data_type: enums.length > 0 ? 'USER-DEFINED' : pgType,
          format: pgType,
          is_nullable: c.nullable,
          is_identity: c.is_identity,
          is_generated,
          is_updatable: !is_generated && !c.is_identity,
          default_value: c.default_value,
          enums,
          comment: commentFor(table.schema, table.name, c.name),
        }
      })

      const pkRecord = result.primary_keys.find(
        (pk) => pk.table === table.name && pk.schema === table.schema
      )
      const primary_keys = pkRecord
        ? pkRecord.columns.map((name) => ({ name }))
        : cols.filter((c) => c.is_primary_key).map((c) => ({ name: c.name }))

      return {
        id: `${normalizeSchema(table.schema)}.${table.name}`,
        schema: normalizeSchema(table.schema),
        name: table.name,
        columns,
        primary_keys,
        // supalite returns -1 when the row count is unknown.
        live_rows_estimate: typeof table.rows === 'number' && table.rows >= 0 ? table.rows : null,
        rls_enabled: null,
        comment: commentFor(table.schema, table.name),
      }
    })
    .sort((a, b) => a.name.localeCompare(b.name))
}
