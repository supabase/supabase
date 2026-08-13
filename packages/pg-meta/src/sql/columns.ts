import { literal, safeSql, type SafeSqlFragment } from '../pg-format'

// The privilege gate that decides whether a column is visible to the connected role.
// A column the role can neither read, write, nor reference -- and whose owner role it
// is not a member of -- is dropped from the result entirely rather than flagged, so a
// caller sees a short column list with no indication that anything is missing.
// `getInaccessibleColumnsSql` below answers "what did that drop?", and shares this
// fragment so the two can't drift apart.
const COLUMN_VISIBILITY_PREDICATE = safeSql`(
    pg_has_role(c.relowner, 'USAGE')
    OR has_column_privilege(
      c.oid,
      a.attnum,
      'SELECT, INSERT, UPDATE, REFERENCES'
    )
  )`

// Columns of the underlying pg_class scan that callers are allowed to filter
// on. The map owns the actual aliased reference (`c.oid` etc.), so callers
// never need to know the internal aliases — they just pick a key.
const COLUMNS_FILTER_COLUMNS = {
  oid: safeSql`c.oid`,
} as const

export type ColumnsFilterColumn = keyof typeof COLUMNS_FILTER_COLUMNS

export type ColumnsFilter = {
  column: ColumnsFilterColumn
  // Everything to the right of the column reference — e.g.
  //   safeSql`IN (SELECT oid FROM page)`  or  safeSql`= ${literal(123)}`
  predicate: SafeSqlFragment
}

// `filter`, if provided, is appended to the WHERE clause as
// `AND <column-ref> <predicate>`.
export const getColumnsSql = ({ filter }: { filter?: ColumnsFilter } = {}): SafeSqlFragment => {
  const filterClause = filter
    ? safeSql`AND ${COLUMNS_FILTER_COLUMNS[filter.column]} ${filter.predicate}`
    : safeSql``

  return /* SQL */ safeSql`
-- Adapted from information_schema.columns

SELECT
  c.oid :: int8 AS table_id,
  nc.nspname AS schema,
  c.relname AS table,
  (c.oid || '.' || a.attnum) AS id,
  a.attnum AS ordinal_position,
  a.attname AS name,
  CASE
    WHEN a.atthasdef THEN pg_get_expr(ad.adbin, ad.adrelid)
    ELSE NULL
  END AS default_value,
  CASE
    WHEN t.typtype = 'd' THEN CASE
      WHEN bt.typelem <> 0 :: oid
      AND bt.typlen = -1 THEN 'ARRAY'
      WHEN nbt.nspname = 'pg_catalog' THEN format_type(t.typbasetype, NULL)
      ELSE 'USER-DEFINED'
    END
    ELSE CASE
      WHEN t.typelem <> 0 :: oid
      AND t.typlen = -1 THEN 'ARRAY'
      WHEN nt.nspname = 'pg_catalog' THEN format_type(a.atttypid, NULL)
      ELSE 'USER-DEFINED'
    END
  END AS data_type,
  COALESCE(bt.typname, t.typname) AS format,
  COALESCE(nbt.nspname, nt.nspname) AS format_schema,
  a.attidentity IN ('a', 'd') AS is_identity,
  CASE
    a.attidentity
    WHEN 'a' THEN 'ALWAYS'
    WHEN 'd' THEN 'BY DEFAULT'
    ELSE NULL
  END AS identity_generation,
  a.attgenerated IN ('s') AS is_generated,
  NOT (
    a.attnotnull
    OR t.typtype = 'd' AND t.typnotnull
  ) AS is_nullable,
  (
    c.relkind IN ('r', 'p')
    OR c.relkind IN ('v', 'f') AND pg_column_is_updatable(c.oid, a.attnum, FALSE)
  ) AS is_updatable,
  uniques.table_id IS NOT NULL AS is_unique,
  check_constraints.definition AS "check",
  array_to_json(
    array(
      SELECT
        enumlabel
      FROM
        pg_catalog.pg_enum enums
      WHERE
        enums.enumtypid = coalesce(bt.oid, t.oid)
        OR enums.enumtypid = coalesce(bt.typelem, t.typelem)
      ORDER BY
        enums.enumsortorder
    )
  ) AS enums,
  col_description(c.oid, a.attnum) AS comment
FROM
  pg_attribute a
  LEFT JOIN pg_attrdef ad ON a.attrelid = ad.adrelid
  AND a.attnum = ad.adnum
  JOIN (
    pg_class c
    JOIN pg_namespace nc ON c.relnamespace = nc.oid
  ) ON a.attrelid = c.oid
  JOIN (
    pg_type t
    JOIN pg_namespace nt ON t.typnamespace = nt.oid
  ) ON a.atttypid = t.oid
  LEFT JOIN (
    pg_type bt
    JOIN pg_namespace nbt ON bt.typnamespace = nbt.oid
  ) ON t.typtype = 'd'
  AND t.typbasetype = bt.oid
  LEFT JOIN (
    SELECT DISTINCT ON (table_id, ordinal_position)
      conrelid AS table_id,
      conkey[1] AS ordinal_position
    FROM pg_catalog.pg_constraint
    WHERE contype = 'u' AND cardinality(conkey) = 1
  ) AS uniques ON uniques.table_id = c.oid AND uniques.ordinal_position = a.attnum
  LEFT JOIN (
    -- We only select the first column check
    SELECT DISTINCT ON (table_id, ordinal_position)
      conrelid AS table_id,
      conkey[1] AS ordinal_position,
      substring(
        pg_get_constraintdef(pg_constraint.oid, true),
        8,
        length(pg_get_constraintdef(pg_constraint.oid, true)) - 8
      ) AS "definition"
    FROM pg_constraint
    WHERE contype = 'c' AND cardinality(conkey) = 1
    ORDER BY table_id, ordinal_position, oid asc
  ) AS check_constraints ON check_constraints.table_id = c.oid AND check_constraints.ordinal_position = a.attnum
WHERE
  NOT pg_is_other_temp_schema(nc.oid)
  AND a.attnum > 0
  AND NOT a.attisdropped
  AND (c.relkind IN ('r', 'v', 'm', 'f', 'p'))
  AND ${COLUMN_VISIBILITY_PREDICATE}
  ${filterClause}
`
}

export const COLUMNS_SQL = getColumnsSql()

/**
 * The complement of the privilege filter in `getColumnsSql`: the columns of one
 * relation that exist in the catalog but that column introspection omits because the
 * connected role holds none of SELECT/INSERT/UPDATE/REFERENCES on them and does not
 * belong to the relation's owner role.
 *
 * `pg_attribute` itself carries no privilege restriction, so this stays accurate for
 * exactly the roles that can't see the columns it reports.
 */
export const getInaccessibleColumnsSql = ({
  schema,
  table,
}: {
  schema: string
  table: string
}): SafeSqlFragment => safeSql`
SELECT
  a.attname AS name,
  a.attnum AS ordinal_position
FROM
  pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace nc ON nc.oid = c.relnamespace
WHERE
  nc.nspname = ${literal(schema)}
  AND c.relname = ${literal(table)}
  AND NOT pg_is_other_temp_schema(nc.oid)
  AND a.attnum > 0
  AND NOT a.attisdropped
  AND (c.relkind IN ('r', 'v', 'm', 'f', 'p'))
  AND NOT ${COLUMN_VISIBILITY_PREDICATE}
ORDER BY
  a.attnum
`
