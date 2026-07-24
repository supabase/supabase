import type { SupabaseClient } from '@supabase/supabase-js'

import type {
  IntrospectedColumn,
  IntrospectedTable,
} from '@/registry/default/platform/platform-kit-nextjs/lib/adapter/introspection-types'

/**
 * Introspect a database over PostgREST — no Management API, no arbitrary SQL.
 *
 * PostgREST serves an OpenAPI 2.0 (Swagger) document at the REST root that
 * describes every exposed table/view, its columns (type, format, default,
 * enum, nullability) and marks primary/foreign keys in each column's
 * `description`. We parse that into the normalized `IntrospectedTable` shape.
 *
 * Limitations vs pg-meta: only API-exposed schemas are visible (typically
 * `public`), and RLS state / generated-column flags are not reported (left
 * null / false). Acceptable for the table + row-editor surface.
 */
export async function introspectViaPostgrest(
  supabase: SupabaseClient
): Promise<IntrospectedTable[]> {
  // `rest.url` / `rest.fetch` are protected on the client but present at
  // runtime. supabase-js injects the apikey + Authorization via a custom fetch
  // wrapper (not static headers), so reuse that fetch and also set the apikey
  // explicitly from the client's key for good measure.
  const rest = (supabase as any).rest
  const restUrl: string = rest?.url
  const restFetch: typeof fetch = rest?.fetch ?? fetch
  const key: string | undefined = (supabase as any).supabaseKey

  if (!restUrl) {
    throw new Error('Could not resolve the PostgREST URL from the Supabase client.')
  }

  const headers: Record<string, string> = { ...(rest?.headers ?? {}) }
  if (key) {
    headers.apikey = key
    headers.Authorization = `Bearer ${key}`
  }

  const response = await restFetch(`${restUrl}/`, { headers })
  if (!response.ok) {
    throw new Error(`Failed to load the PostgREST schema (${response.status}).`)
  }

  const spec = await response.json()
  const definitions: Record<string, any> = spec?.definitions ?? {}

  const tables: IntrospectedTable[] = Object.entries(definitions).map(([tableName, def]) => {
    const properties: Record<string, any> = def?.properties ?? {}
    const required: string[] = Array.isArray(def?.required) ? def.required : []

    const columns: IntrospectedColumn[] = Object.entries(properties).map(([name, prop]) => {
      const enums: string[] = Array.isArray(prop?.enum) ? prop.enum : []
      const defaultValue = prop?.default ?? null
      const rawFormat: string = prop?.format ?? prop?.type ?? 'text'

      let data_type: string
      if (prop?.type === 'array') {
        data_type = 'ARRAY'
      } else if (enums.length > 0) {
        data_type = 'USER-DEFINED'
      } else {
        data_type = rawFormat
      }

      const isIdentity =
        typeof defaultValue === 'string' &&
        (defaultValue.includes('nextval(') || defaultValue.toUpperCase().includes('GENERATED'))

      return {
        name,
        data_type,
        format: rawFormat,
        // PostgREST marks a column `required` when it is NOT NULL without a
        // default; treat everything else as nullable (best-effort).
        is_nullable: !required.includes(name),
        is_identity: isIdentity,
        is_generated: false,
        is_updatable: !isIdentity,
        default_value: defaultValue,
        enums,
        comment: null,
      }
    })

    const primary_keys = Object.entries(properties)
      .filter(([, prop]) => {
        const description: string = prop?.description ?? ''
        return description.includes('<pk/>') || /primary key/i.test(description)
      })
      .map(([name]) => ({ name }))

    return {
      id: tableName,
      schema: 'public',
      name: tableName,
      columns,
      primary_keys,
      live_rows_estimate: null,
      rls_enabled: null,
      comment: null,
    }
  })

  return tables.sort((a, b) => a.name.localeCompare(b.name))
}
