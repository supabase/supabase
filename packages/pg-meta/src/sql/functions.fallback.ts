/**
 * TEMPORARY. Delete once Spark (turso) runs `functions.list`, which fails there on `array_fill`.
 *
 * Reads `pg_proc` and builds the argument list in TypeScript. turso lacks
 * `pg_get_function_identity_arguments` and `pg_get_functiondef`: identity arguments and complete
 * statements read as empty there. Spark refuses `CREATE FUNCTION`, so it lists none.
 */
import { optionalRows, toBool, toInt, toText, type CatalogQuery } from '../catalog-fallback'
import { DEFAULT_SYSTEM_SCHEMAS } from '../constants'
import { filterByList } from '../helpers'
import { joinSqlFragments, literal, safeSql } from '../pg-format'

const MODES: Record<string, string> = { i: 'in', o: 'out', b: 'inout', v: 'variadic' }
const KINDS: Record<string, string> = {
  f: 'function',
  p: 'procedure',
  a: 'aggregate',
  w: 'window',
}
const BEHAVIORS: Record<string, string> = { i: 'IMMUTABLE', s: 'STABLE', v: 'VOLATILE' }

const texts = (value: unknown) => (Array.isArray(value) ? value.map(String) : null)

/** Fallback for `functions.list`. */
export async function listFunctionsFallback(
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
    select p.oid::int8 as id, n.nspname as schema, p.proname as name, l.lanname as language,
      p.prokind as kind, p.prosrc as source, p.proargmodes::text[] as arg_modes,
      p.proargnames as arg_names, p.proallargtypes::text[] as all_arg_types,
      p.proargtypes::text as arg_types, p.pronargs as nargs, p.pronargdefaults as ndefaults,
      pg_get_function_arguments(p.oid) as argument_types, p.prorettype::int8 as return_type_id,
      pg_get_function_result(p.oid) as return_type, rt.typrelid::int8 as return_relid,
      p.proretset as retset, p.provolatile as volatility, p.prosecdef as security_definer,
      p.proconfig as config
    from pg_catalog.pg_proc p
    left join pg_catalog.pg_namespace n on n.oid = p.pronamespace
    left join pg_catalog.pg_language l on l.oid = p.prolang
    left join pg_catalog.pg_type rt on rt.oid = p.prorettype
    where p.prokind in ('f', 'p') ${filter ? safeSql`and n.nspname ${filter}` : safeSql``}
    ${limit ? safeSql`limit ${literal(limit)}` : safeSql``}
    ${offset ? safeSql`offset ${literal(offset)}` : safeSql``}`)
  const ids = rows.map((row) => toInt(row.id))
  const definitions =
    ids.length === 0
      ? []
      : await optionalRows(
          query(safeSql`
            select p.oid::int8 as id, pg_get_function_identity_arguments(p.oid) as identity,
              case when l.lanname = 'internal' then null else pg_get_functiondef(p.oid) end as statement
            from pg_catalog.pg_proc p
            left join pg_catalog.pg_language l on l.oid = p.prolang
            where p.oid in (${joinSqlFragments(ids.map(literal), ', ')})`)
        )
  const definitionOf = new Map(definitions.map((row) => [toInt(row.id), row]))

  return rows.map((row) => {
    const id = toInt(row.id)
    const internal = row.language === 'internal'
    const types =
      texts(row.all_arg_types) ??
      String(row.arg_types ?? '')
        .split(' ')
        .filter(Boolean)
    const modes = texts(row.arg_modes) ?? types.map(() => 'i')
    const names = texts(row.arg_names) ?? types.map(() => '')
    const nargs = toInt(row.nargs)
    const firstDefault = nargs - toInt(row.ndefaults)
    const config = texts(row.config)
    return {
      id,
      schema: String(row.schema),
      name: String(row.name),
      language: String(row.language),
      type: KINDS[String(row.kind)] ?? 'unknown',
      definition: internal ? '' : String(row.source ?? ''),
      complete_statement: internal
        ? String(row.source ?? '')
        : String(definitionOf.get(id)?.statement ?? ''),
      args: types.map((type, index) => ({
        mode: MODES[modes[index]] ?? 'table',
        name: names[index] ?? '',
        type_id: Number(type),
        has_default: index < nargs && index >= firstDefault,
      })),
      argument_types: toText(row.argument_types),
      identity_argument_types: String(definitionOf.get(id)?.identity ?? ''),
      return_type_id: toInt(row.return_type_id),
      return_type: toText(row.return_type),
      return_type_relation_id: toInt(row.return_relid) === 0 ? null : toInt(row.return_relid),
      is_set_returning_function: toBool(row.retset),
      behavior: BEHAVIORS[String(row.volatility)],
      security_definer: toBool(row.security_definer),
      config_params: config
        ? Object.fromEntries(config.map((entry) => entry.split('=').slice(0, 2)))
        : null,
    }
  })
}
