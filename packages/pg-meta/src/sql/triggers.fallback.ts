/**
 * TEMPORARY. Delete once Spark (turso) has `information_schema.triggers` and runs `triggers.list`,
 * which fails there on an open array slice.
 *
 * Decodes `pg_trigger` as `information_schema.triggers` does. Spark refuses `CREATE TRIGGER`, so it
 * lists none there.
 */
import { toInt, toText, type CatalogQuery } from '../catalog-fallback'
import { DEFAULT_SYSTEM_SCHEMAS } from '../constants'
import { filterByList } from '../helpers'
import { literal, safeSql } from '../pg-format'

const ENABLED_MODES: Record<string, string> = {
  D: 'DISABLED',
  O: 'ORIGIN',
  R: 'REPLICA',
  A: 'ALWAYS',
}

// `information_schema.triggers` lists these events only, one row each.
const EVENTS: Array<[number, string]> = [
  [4, 'INSERT'],
  [8, 'DELETE'],
  [16, 'UPDATE'],
]

/** `tgargs` as the arguments it holds: NUL-terminated strings. */
function triggerArgs(value: unknown, count: number): string[] {
  const bytes =
    value instanceof Uint8Array
      ? value
      : typeof value === 'string' && value.startsWith('\\x')
        ? Uint8Array.from(value.slice(2).match(/../g) ?? [], (hex) => parseInt(hex, 16))
        : new Uint8Array()
  return new TextDecoder().decode(bytes).split('\0').slice(0, count)
}

/** Fallback for `triggers.list`. */
export async function listTriggersFallback(
  query: CatalogQuery,
  {
    includeSystemSchemas = false,
    includedSchemas,
    excludedSchemas,
    limit,
    offset,
  }: {
    includeSystemSchemas?: boolean
    includedSchemas?: string[]
    excludedSchemas?: string[]
    limit?: number
    offset?: number
  } = {}
) {
  const filter = filterByList(
    includedSchemas,
    excludedSchemas,
    !includeSystemSchemas ? DEFAULT_SYSTEM_SCHEMAS : undefined
  )
  const rows = await query(safeSql`
    select t.oid::int8 as id, t.tgrelid::int8 as table_id, t.tgenabled as enabled, t.tgargs as args,
      t.tgnargs as nargs, t.tgname as name, c.relname as table, n.nspname as schema, t.tgtype as type,
      pg_get_triggerdef(t.oid) as definition, p.proname as function_name, pn.nspname as function_schema
    from pg_catalog.pg_trigger t
    join pg_catalog.pg_class c on c.oid = t.tgrelid
    join pg_catalog.pg_namespace n on n.oid = c.relnamespace
    join pg_catalog.pg_proc p on p.oid = t.tgfoid
    join pg_catalog.pg_namespace pn on pn.oid = p.pronamespace
    where not t.tgisinternal ${filter ? safeSql`and n.nspname ${filter}` : safeSql``}
    ${limit ? safeSql`limit ${literal(limit)}` : safeSql``}
    ${offset ? safeSql`offset ${literal(offset)}` : safeSql``}`)
  return rows.flatMap((row) => {
    const type = toInt(row.type)
    const events = EVENTS.filter(([bit]) => (type & bit) !== 0).map(([, event]) => event)
    if (events.length === 0) return []
    const condition =
      String(row.definition ?? '').match(/.{35,} WHEN \((.+)\) EXECUTE FUNCTION/s)?.[1] ?? null
    return [
      {
        id: toInt(row.id),
        table_id: toInt(row.table_id),
        enabled_mode: ENABLED_MODES[String(row.enabled)],
        function_args: triggerArgs(row.args, toInt(row.nargs)),
        name: String(row.name),
        table: String(row.table),
        schema: String(row.schema),
        condition: toText(condition),
        orientation: (type & 1) === 1 ? 'ROW' : 'STATEMENT',
        activation: (type & 66) === 2 ? 'BEFORE' : (type & 66) === 64 ? 'INSTEAD OF' : 'AFTER',
        events,
        function_name: String(row.function_name),
        function_schema: String(row.function_schema),
      },
    ]
  })
}
