import { ident, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getTableConstraintsSql = ({ id }: { id: number }): SafeSqlFragment => {
  return safeSql`
  with table_info as (
    select
      n.nspname::text as schema,
      c.relname::text as name,
      to_regclass(concat('"', n.nspname, '"."', c.relname, '"')) as regclass
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where c.oid = ${literal(id)}
)
select
    con.oid as id,
    con.conname as name,
    con.contype as type
from pg_catalog.pg_constraint con
inner join pg_catalog.pg_class rel
        on rel.oid = con.conrelid
inner join pg_catalog.pg_namespace nsp
        on nsp.oid = connamespace
inner join table_info ti
        on ti.schema = nsp.nspname
        and ti.name = rel.relname;
`
}

export const getDropConstraintSQL = ({
  schema,
  table,
  name,
}: {
  schema: string
  table: string
  name: string
}): SafeSqlFragment =>
  safeSql`ALTER TABLE ${ident(schema)}.${ident(table)} DROP CONSTRAINT ${ident(name)}`
