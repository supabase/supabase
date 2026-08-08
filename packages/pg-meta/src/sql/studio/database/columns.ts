import { joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

/**
 * Table/column listing for the SQL Editor intellisense and the Create Index panel.
 *
 * The legacy shape resolved `quote_ident(nspname) || '.' || quote_ident(relname)`
 * back to an OID on every catalog row (text-overload has_table_privilege /
 * has_column_privilege plus a ::regclass cast) and scanned pg_class twice via
 * `union all`. The scoped shape drives everything off c.oid, reads pg_class once,
 * and short-circuits the per-column privilege check when pg_attribute.attacl is
 * null -- on a bloated ~21k-relation catalog that is ~1.6x faster (131ms -> 80ms)
 * with 5.4x fewer buffer hits (479k -> 89k) and half the JSON payload.
 *
 * That NEW behavior is gated behind `scoped` (default false = legacy behavior) so
 * Studio can roll it out behind the pgMetaScopedIntrospection feature flag.
 * Equivalence between the two forms is enforced by execution-based tests in
 * test/sql/studio/table-columns.test.ts.
 *
 * The scoped form returns the same relation set as legacy and differs only in two
 * ways, both covered by those tests: it orders columns by attnum instead of
 * leaving it to the join, and it emits an empty column array where legacy emitted
 * `[null]`. Extending the relkind filter to partitioned ('p') and foreign ('f')
 * tables, which both forms currently omit, is deliberately left to a follow-up.
 *
 * The two branches are kept as complete, standalone templates (no interpolated
 * conditional fragments) so each rendered statement is easy to read and diff.
 */
export const getTableColumnsSql = ({
  table,
  schema,
  scoped = false,
}: {
  table?: string
  schema?: string
  scoped?: boolean
}): SafeSqlFragment => {
  if (!scoped) {
    const conditions: Array<SafeSqlFragment> = []
    if (table) {
      conditions.push(safeSql`tablename = ${literal(table)}`)
    }
    if (schema) {
      conditions.push(safeSql`schemaname = ${literal(schema)}`)
    }

    const whereClause =
      conditions.length > 0 ? safeSql`WHERE ${joinSqlFragments(conditions, ' AND ')}` : safeSql``

    // FROZEN legacy path: served while the pgMetaScopedIntrospection flag is off.
    // Do not edit -- it must keep matching production behavior until the flag
    // cleanup deletes it. The scoped branch below is the replacement.
    return safeSql`

  SELECT
    tbl.schemaname,
    tbl.tablename,
    tbl.quoted_name,
    tbl.is_table,
    json_agg(a) as columns
  FROM
    (
      SELECT
        n.nspname as schemaname,
        c.relname as tablename,
        (quote_ident(n.nspname) || '.' || quote_ident(c.relname)) as quoted_name,
        true as is_table
      FROM
        pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE
        c.relkind = 'r'
        AND n.nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
        AND n.nspname not like 'pg_temp_%'
        AND n.nspname not like 'pg_toast_temp_%'
        AND has_schema_privilege(n.oid, 'USAGE') = true
        AND has_table_privilege(quote_ident(n.nspname) || '.' || quote_ident(c.relname), 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') = true
      union all
      SELECT
        n.nspname as schemaname,
        c.relname as tablename,
        (quote_ident(n.nspname) || '.' || quote_ident(c.relname)) as quoted_name,
        false as is_table
      FROM
        pg_catalog.pg_class c
        JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
      WHERE
        c.relkind in ('v', 'm')
        AND n.nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
        AND n.nspname not like 'pg_temp_%'
        AND n.nspname not like 'pg_toast_temp_%'
        AND has_schema_privilege(n.oid, 'USAGE') = true
        AND has_table_privilege(quote_ident(n.nspname) || '.' || quote_ident(c.relname), 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER') = true
    ) as tbl
    LEFT JOIN (
      SELECT
        attrelid,
        attname,
        format_type(atttypid, atttypmod) as data_type,
        attnum,
        attisdropped
      FROM
        pg_attribute
    ) as a ON (
      a.attrelid = tbl.quoted_name::regclass
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND has_column_privilege(tbl.quoted_name, a.attname, 'SELECT, INSERT, UPDATE, REFERENCES')
    )
  ${whereClause}
  GROUP BY schemaname, tablename, quoted_name, is_table;
`
  }

  const conditions: Array<SafeSqlFragment> = []
  if (table) {
    conditions.push(safeSql`c.relname = ${literal(table)}`)
  }
  if (schema) {
    conditions.push(safeSql`n.nspname = ${literal(schema)}`)
  }

  // Filters go inside the scan rather than above the join, so a table/schema
  // lookup can use pg_class_relname_nsp_index instead of relying on qual pushdown.
  const filterClause =
    conditions.length > 0 ? safeSql`AND ${joinSqlFragments(conditions, ' AND ')}` : safeSql``

  // Privilege checks take OIDs, not quoted names: the text overloads re-resolve
  // schema.table to an OID on every catalog row, and ::regclass additionally
  // errors if a relation is dropped mid-scan. attacl is null for all but a
  // handful of columns, and when it is, column privileges come entirely from the
  // table ACL -- so the per-column check collapses to a per-table one.
  return safeSql`
  SELECT
    n.nspname AS schemaname,
    c.relname AS tablename,
    quote_ident(n.nspname) || '.' || quote_ident(c.relname) AS quoted_name,
    c.relkind = 'r' AS is_table,
    COALESCE(
      json_agg(
        json_build_object(
          'attname', a.attname,
          'data_type', format_type(a.atttypid, a.atttypmod)
        ) ORDER BY a.attnum
      ) FILTER (WHERE a.attname IS NOT NULL),
      '[]'::json
    ) AS columns
  FROM
    pg_catalog.pg_class c
    JOIN pg_catalog.pg_namespace n ON n.oid = c.relnamespace
    LEFT JOIN pg_catalog.pg_attribute a
      ON a.attrelid = c.oid
      AND a.attnum > 0
      AND NOT a.attisdropped
      AND CASE
            WHEN a.attacl IS NULL
              THEN has_table_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
            ELSE has_column_privilege(a.attrelid, a.attnum, 'SELECT, INSERT, UPDATE, REFERENCES')
          END
  WHERE
    c.relkind = ANY ('{r,v,m}'::"char"[])
    AND n.nspname NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
    AND n.nspname NOT LIKE 'pg_temp_%'
    AND n.nspname NOT LIKE 'pg_toast_temp_%'
    AND has_schema_privilege(n.oid, 'USAGE')
    AND has_table_privilege(c.oid, 'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER')
    ${filterClause}
  GROUP BY n.nspname, c.relname, c.oid, c.relkind;
`
}
