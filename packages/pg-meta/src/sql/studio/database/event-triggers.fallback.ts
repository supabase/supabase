/**
 * TEMPORARY. Delete once Spark (turso) has `pg_get_functiondef`, which `getEventTriggersSql` needs.
 *
 * Function definitions read as null without it.
 */
import { optionalRows, toInt, toText, type CatalogQuery } from '../../../catalog-fallback'
import { joinSqlFragments, literal, safeSql } from '../../../pg-format'

type EnabledMode = 'ORIGIN' | 'ALWAYS' | 'REPLICA' | 'DISABLED'

const ENABLED_MODES: Record<string, EnabledMode> = {
  O: 'ORIGIN',
  A: 'ALWAYS',
  R: 'REPLICA',
  D: 'DISABLED',
}

/** Fallback for `getEventTriggersSql`. */
export async function getEventTriggersFallback(query: CatalogQuery) {
  const rows = await query(safeSql`
    select evt.oid::int8 as oid, evt.evtname as name, evt.evtevent as event,
      evt.evtenabled as enabled, evt.evttags as tags, proc.oid::int8 as function_id,
      proc.proname as function_name, namespace.nspname as function_schema, owner.rolname as owner
    from pg_catalog.pg_event_trigger evt
    left join pg_catalog.pg_proc proc on proc.oid = evt.evtfoid
    left join pg_catalog.pg_namespace namespace on namespace.oid = proc.pronamespace
    left join pg_catalog.pg_roles owner on owner.oid = evt.evtowner
    order by evt.evtname`)
  const functionIds = rows.flatMap((row) =>
    row.function_id == null ? [] : [toInt(row.function_id)]
  )
  const definitions =
    functionIds.length === 0
      ? []
      : await optionalRows(
          query(safeSql`
            select p.oid::int8 as id, pg_get_functiondef(p.oid) as definition
            from pg_catalog.pg_proc p
            where p.oid in (${joinSqlFragments(functionIds.map(literal), ', ')})`)
        )
  const definitionOf = new Map(definitions.map((row) => [toInt(row.id), toText(row.definition)]))
  return rows.map((row) => ({
    oid: toInt(row.oid),
    name: String(row.name),
    event: String(row.event),
    enabled_mode: ENABLED_MODES[String(row.enabled)] ?? 'ORIGIN',
    tags: Array.isArray(row.tags) ? row.tags.map(String) : null,
    function_name: toText(row.function_name),
    function_schema: toText(row.function_schema),
    owner: toText(row.owner),
    function_definition:
      row.function_id == null ? null : (definitionOf.get(toInt(row.function_id)) ?? null),
  }))
}
