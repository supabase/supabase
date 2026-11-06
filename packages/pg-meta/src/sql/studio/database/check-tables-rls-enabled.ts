import { joinSqlFragments, literal, safeSql, SafeSqlFragment } from '../../../pg-format'

export const getTablesRlsEnabledStatusSQL = ({
  tables,
}: {
  tables: { schema: string; table: string }[]
}): SafeSqlFragment => {
  const tableNames = joinSqlFragments(
    tables.map((x) => literal(`${x.schema}.${x.table}`)),
    ', '
  )

  return safeSql`
  SELECT
  n.nspname   AS schema,
  c.relname   AS table,
  c.relrowsecurity     AS rls_enabled
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE (n.nspname || '.' || c.relname) = ANY(
  ARRAY[${tableNames}]
);
`
}
