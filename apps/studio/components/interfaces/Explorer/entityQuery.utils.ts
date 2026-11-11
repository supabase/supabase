import { ident, joinSqlFragments, safeSql, type SafeSqlFragment } from '@supabase/pg-meta'
import { Query } from '@supabase/pg-meta/src/query'
import {
  formatPatternMatchFilterValue,
  TEXT_TYPES,
} from '@supabase/pg-meta/src/query/table-row-query'
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
 * The columns an entity shows when it narrows them, such as `auth.users` leaving out password
 * hashes and tokens; undefined when it shows them all. Filters and sorts offer only these too.
 */
export const getEntityQueryColumns = (entity: Pick<QueryEntityBinding, 'schema' | 'name'>) =>
  ENTITY_QUERY_DEFINITIONS[`${entity.schema}.${entity.name}`]?.columns

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

/**
 * A table tab's filters and sorts, in the Table Editor's own shapes so its filter bar and sort
 * popover work on them unchanged.
 */
export const tableViewSchema = z.object({
  filters: z.array(
    z.object({
      column: z.union([z.string(), z.array(z.string())]),
      operator: z.enum(['=', '<>', '>', '<', '>=', '<=', '~~', '~~*', '!~~', '!~~*', 'in', 'is']),
      value: z.unknown(),
    })
  ),
  sorts: z.array(
    z.object({
      table: z.string(),
      column: z.string(),
      ascending: z.boolean().optional(),
      nullsFirst: z.boolean().optional(),
    })
  ),
})

export type TableView = z.infer<typeof tableViewSchema>

export const EMPTY_TABLE_VIEW: TableView = { filters: [], sorts: [] }

/**
 * The query a table tab runs: what `buildEntitySelectSql` opens it with, narrowed by the Table
 * Editor's filters and ordered by its sorts, built the way the Table Editor builds its own. It
 * is a plain select of the table, so its rows stay editable in the shared results grid and
 * opening it as a query hands over exactly what's on screen.
 */
export const buildTableViewSql = ({
  entity,
  tableView = EMPTY_TABLE_VIEW,
  columnFormats = {},
}: {
  entity: Pick<QueryEntityBinding, 'schema' | 'name'>
  tableView?: TableView
  /** Column formats by name, so an empty filter value on a non-text column means null. */
  columnFormats?: Record<string, string>
}): SafeSqlFragment => {
  const { filters, sorts } = tableView
  if (filters.length === 0 && sorts.length === 0) return buildEntitySelectSql(entity)

  const definition = ENTITY_QUERY_DEFINITIONS[`${entity.schema}.${entity.name}`] ?? {}
  let query = new Query().from(entity.name, entity.schema).select(
    definition.columns
      ? joinSqlFragments(
          definition.columns.map((column) => ident(column)),
          ', '
        )
      : undefined
  )

  for (const filter of filters) {
    const format = typeof filter.column === 'string' ? columnFormats[filter.column] : undefined
    const isTextColumn = format === undefined || TEXT_TYPES.some((type) => type === format)
    const value =
      !isTextColumn && filter.value === ''
        ? null
        : formatPatternMatchFilterValue(filter.value, filter.operator)
    query = query.filter(filter.column, filter.operator, value)
  }

  const orderBy =
    sorts.length > 0
      ? sorts
      : definition.orderBy
        ? [
            {
              table: entity.name,
              column: definition.orderBy.column,
              ascending: definition.orderBy.ascending,
              nullsFirst: false,
            },
          ]
        : []
  for (const sort of orderBy) {
    query = query.order(sort.table, sort.column, sort.ascending, sort.nullsFirst)
  }

  return query.toSql({ isCTE: false, isFinal: false })
}
