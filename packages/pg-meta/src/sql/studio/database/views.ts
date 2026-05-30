import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getViewDefinitionSql = ({
  id,
  includeCreateStatement = false,
}: {
  id: number
  includeCreateStatement?: boolean
}): SafeSqlFragment => {
  if (!id) {
    throw new Error('id is required')
  }

  const definitionSql = includeCreateStatement
    ? safeSql`
      concat(
        case t.relkind
          when 'm' then 'create materialized view '
          else 'create view '
        end,
        quote_ident(t.schema),
        '.',
        quote_ident(t.name),
        case
          when t.reloptions is not null and array_length(t.reloptions, 1) > 0
            then ' with (' || array_to_string(t.reloptions, ', ') || ')'
          else ''
        end,
        E' as\n',
        pg_get_viewdef(t.regclass, true)
      )
    `
    : safeSql`pg_get_viewdef(t.regclass, true)`

  return safeSql`
    with table_info as (
      select
        c.relkind,
        n.nspname::text as schema,
        c.relname::text as name,
        c.reloptions,
        to_regclass(concat('"', n.nspname, '"."', c.relname, '"')) as regclass
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where c.oid = ${literal(id)}
    )
    select ${definitionSql} as definition
    from table_info t
  `
}
