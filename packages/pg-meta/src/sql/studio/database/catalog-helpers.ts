import { ident, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

/**
 * Mirrors what the table list endpoints expose: the role owns the table or has
 * some privilege on it (or one of its columns).
 *
 * Pass `includeSelect: false` for triggers, which Studio lists through
 * information_schema.triggers — that view does not count SELECT.
 */
export const hasTableAccess = (
  oid: SafeSqlFragment,
  owner: SafeSqlFragment,
  { includeSelect = true }: { includeSelect?: boolean } = {}
) => {
  const tablePrivileges = includeSelect
    ? safeSql`'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'`
    : safeSql`'INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'`
  const columnPrivileges = includeSelect
    ? safeSql`'SELECT, INSERT, UPDATE, REFERENCES'`
    : safeSql`'INSERT, UPDATE, REFERENCES'`
  return safeSql`(
  pg_has_role(${owner}, 'USAGE')
  or has_table_privilege(${oid}, ${tablePrivileges})
  or has_any_column_privilege(${oid}, ${columnPrivileges})
)`
}

/** Decodes pg_trigger.tgtype, whose bits are documented in the catalog docs. */
export const triggerActivation = (tgtype: SafeSqlFragment) => safeSql`case
  when (${tgtype} & 2) <> 0 then 'BEFORE'
  when (${tgtype} & 64) <> 0 then 'INSTEAD OF'
  else 'AFTER'
end`

/** A trigger fires on one or more events, so this is an array rather than a case. */
export const triggerEvents = (tgtype: SafeSqlFragment) => safeSql`to_jsonb(
  array_remove(
    array[
      case when (${tgtype} & 4) <> 0 then 'INSERT' end,
      case when (${tgtype} & 16) <> 0 then 'UPDATE' end,
      case when (${tgtype} & 8) <> 0 then 'DELETE' end,
      case when (${tgtype} & 32) <> 0 then 'TRUNCATE' end
    ],
    null
  )
)`

const extensionMembersCte = (cteName: string, catalog: 'pg_proc' | 'pg_class') =>
  safeSql`${ident(cteName)} as materialized (
  select d.objid
  from pg_depend d
  where d.refclassid = 'pg_extension'::regclass
    and d.refobjid in (select e.oid from pg_extension e)
    and d.classid = ${literal(catalog)}::regclass
    and d.deptype = 'e'
)`

export const EXTENSION_FUNCTIONS_CTE = extensionMembersCte('extension_functions', 'pg_proc')

export const EXTENSION_RELATIONS_CTE = extensionMembersCte('extension_relations', 'pg_class')

export const isSecurityInvokerView = (reloptions: SafeSqlFragment) => safeSql`(
  lower(coalesce(${reloptions}::text, '{}'))::text[] && array[
    'security_invoker=1',
    'security_invoker=true',
    'security_invoker=yes',
    'security_invoker=on'
  ]
)`
