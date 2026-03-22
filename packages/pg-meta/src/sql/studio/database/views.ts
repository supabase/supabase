export const getViewDefinitionSql = ({ id }: { id: number }) => {
  if (!id) {
    throw new Error('id is required')
  }

  const sql = /* SQL */ `
    with table_info as (
      select
        n.nspname::text as schema,
        c.relname::text as name,
        c.reloptions,
        to_regclass(concat('"', n.nspname, '"."', c.relname, '"')) as regclass
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where c.oid = ${id}
    )
    select
      pg_get_viewdef(t.regclass, true) as definition,
      case
        when t.reloptions is not null and array_length(t.reloptions, 1) > 0
        then array_to_string(t.reloptions, ', ')
        else null
      end as view_options
    from table_info t
  `.trim()

  return sql
}
