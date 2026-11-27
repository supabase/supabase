/**
 * TEMPORARY. Delete once Spark (turso) has `pg_get_functiondef`, which `getEventTriggersSql` needs.
 *
 * Function definitions read as null.
 */
import { toInt, toText, type CatalogQuery } from '../../../catalog-fallback'
import { safeSql } from '../../../pg-format'

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
      evt.evtenabled as enabled, evt.evttags as tags,
      proc.proname as function_name, namespace.nspname as function_schema, owner.rolname as owner
    from pg_catalog.pg_event_trigger evt
    left join pg_catalog.pg_proc proc on proc.oid = evt.evtfoid
    left join pg_catalog.pg_namespace namespace on namespace.oid = proc.pronamespace
    left join pg_catalog.pg_roles owner on owner.oid = evt.evtowner
    order by evt.evtname`)
  return rows.map((row) => ({
    oid: toInt(row.oid),
    name: String(row.name),
    event: String(row.event),
    enabled_mode: ENABLED_MODES[String(row.enabled)] ?? 'ORIGIN',
    tags: Array.isArray(row.tags) ? row.tags.map(String) : null,
    function_name: toText(row.function_name),
    function_schema: toText(row.function_schema),
    owner: toText(row.owner),
    // TEMPORARY: Spark has no pg_get_functiondef, so no definition; read it again once it does.
    function_definition: null,
  }))
}
