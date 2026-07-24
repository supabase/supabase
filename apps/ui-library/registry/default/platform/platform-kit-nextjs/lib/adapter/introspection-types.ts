/**
 * Normalized schema-introspection shapes consumed by the UI. Both the classic
 * Supabase adapter (PostgREST OpenAPI) and the supalite adapter
 * (`/_system/introspect`) map their native output into these types so the
 * components stay backend-agnostic.
 */

export interface IntrospectedColumn {
  name: string
  /** Postgres-style data type, e.g. 'text', 'integer', 'boolean', 'ARRAY', 'USER-DEFINED'. */
  data_type: string
  /** Underlying type name (udt); used for display. On supalite this mirrors `data_type`. */
  format: string
  is_nullable: boolean
  is_identity: boolean
  is_generated: boolean
  /** Whether the column can be written to (excludes generated/identity columns). */
  is_updatable: boolean
  default_value: any
  /** Enum members when the column is an enum type; empty otherwise. */
  enums: string[]
  comment: string | null
}

export interface IntrospectedTable {
  /** Stable identifier: pg oid (classic) or `${schema}.${name}` (supalite). */
  id: string | number
  schema: string
  name: string
  columns: IntrospectedColumn[]
  primary_keys: { name: string }[]
  /** Estimated live row count, or null when unavailable (render as "—"). */
  live_rows_estimate: number | null
  /** RLS state, or null when the backend does not expose it (hide RLS UI). */
  rls_enabled: boolean | null
  comment: string | null
}
