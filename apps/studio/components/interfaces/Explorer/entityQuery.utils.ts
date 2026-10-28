import { ident, joinSqlFragments, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { z } from 'zod'

import { ENTITY_TYPE } from '@/data/entity-types/entity-type-constants'

/**
 * The database entity a query was opened from. A query opened this way is an ordinary
 * editable query — the binding records only where it came from, which is what lets its tab
 * show the entity's icon and lets closing it skip the discard prompt. Row editing is
 * determined from the executed query rather than this potentially stale binding.
 */
export const queryEntityBindingSchema = z.object({
  schema: z.string(),
  name: z.string(),
  type: z.nativeEnum(ENTITY_TYPE),
})

export type QueryEntityBinding = z.infer<typeof queryEntityBindingSchema>

/**
 * Deterministic draft id for an entity, so clicking the same table twice returns to the one
 * tab — and to whatever the user had edited in it — rather than stacking up new drafts.
 * Both parts are percent-encoded, which escapes the separator, so no pair of identifiers
 * can produce the same id. The `entity:` prefix keeps these out of the uuid namespace that
 * ad-hoc queries use.
 */
export const entityQueryId = ({ schema, name }: Pick<QueryEntityBinding, 'schema' | 'name'>) =>
  `entity:${encodeURIComponent(schema)}:${encodeURIComponent(name)}`

type EntityQueryDefinition = {
  /** Columns to read instead of `*` — for keeping secrets off screen. */
  columns?: readonly string[]
  /** Order rows arrive in, when the table has an obvious one. */
  orderBy?: { column: string; ascending: boolean }
}

/**
 * Entities that open with more than `select *`. `auth.users` reads only the columns the
 * Users page shows — the rest include password hashes and one-time tokens — newest first, as
 * the Users page lists them. Narrowing it further is ordinary SQL in the editor.
 */
const ENTITY_QUERY_DEFINITIONS: Record<string, EntityQueryDefinition> = {
  'auth.users': {
    columns: [
      'id',
      'email',
      'phone',
      'created_at',
      'last_sign_in_at',
      'email_confirmed_at',
      'phone_confirmed_at',
      'banned_until',
      'is_anonymous',
      'is_sso_user',
      'raw_app_meta_data',
      'raw_user_meta_data',
    ],
    orderBy: { column: 'created_at', ascending: false },
  },
}

/**
 * The query an entity opens with. Regenerated rather than stored, so it stays reproducible.
 * For a table with no definition it is exactly `select * from schema.name`.
 */
export const buildEntitySelectSql = (
  entity: Pick<QueryEntityBinding, 'schema' | 'name'>
): SafeSqlFragment => {
  const definition = ENTITY_QUERY_DEFINITIONS[`${entity.schema}.${entity.name}`] ?? {}
  const columns = definition.columns
    ? joinSqlFragments(
        definition.columns.map((column) => ident(column)),
        ', '
      )
    : safeSql`*`
  const orderBy = definition.orderBy
    ? safeSql` order by ${ident(definition.orderBy.column)} ${definition.orderBy.ascending ? safeSql`asc` : safeSql`desc`} nulls last`
    : safeSql``

  return safeSql`select ${columns} from ${ident(entity.schema)}.${ident(entity.name)}${orderBy}`
}
