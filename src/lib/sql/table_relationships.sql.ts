import type { SQLQueryPropsWithSchemaFilter } from './common.js'

export const TABLE_RELATIONSHIPS_SQL = (props: SQLQueryPropsWithSchemaFilter) => /* SQL */ `
-- Adapted from
-- https://github.com/PostgREST/postgrest/blob/f9f0f79fa914ac00c11fbf7f4c558e14821e67e2/src/PostgREST/SchemaCache.hs#L722
WITH
pks_uniques_cols AS (
  SELECT
    connamespace,
    conrelid,
    jsonb_agg(column_info.cols) as cols
  FROM pg_constraint
  JOIN lateral (
    SELECT array_agg(cols.attname order by cols.attnum) as cols
    FROM ( select unnest(conkey) as col) _
    JOIN pg_attribute cols on cols.attrelid = conrelid and cols.attnum = col
  ) column_info ON TRUE
  WHERE
    contype IN ('p', 'u') and
    connamespace::regnamespace::text <> 'pg_catalog'
    ${props.schemaFilter ? `and connamespace::regnamespace::text ${props.schemaFilter}` : ''}
  GROUP BY connamespace, conrelid
)
SELECT
  traint.conname AS foreign_key_name,
  ns1.nspname AS schema,
  tab.relname AS relation,
  column_info.cols AS columns,
  ns2.nspname AS referenced_schema,
  other.relname AS referenced_relation,
  column_info.refs AS referenced_columns,
  (column_info.cols IN (SELECT * FROM jsonb_array_elements(pks_uqs.cols))) AS is_one_to_one
FROM pg_constraint traint
JOIN LATERAL (
  SELECT
    jsonb_agg(cols.attname order by ord) AS cols,
    jsonb_agg(refs.attname order by ord) AS refs
  FROM unnest(traint.conkey, traint.confkey) WITH ORDINALITY AS _(col, ref, ord)
  JOIN pg_attribute cols ON cols.attrelid = traint.conrelid AND cols.attnum = col
  JOIN pg_attribute refs ON refs.attrelid = traint.confrelid AND refs.attnum = ref
  WHERE ${props.schemaFilter ? `traint.connamespace::regnamespace::text ${props.schemaFilter}` : 'true'}
) AS column_info ON TRUE
JOIN pg_namespace ns1 ON ns1.oid = traint.connamespace
JOIN pg_class tab ON tab.oid = traint.conrelid
JOIN pg_class other ON other.oid = traint.confrelid
JOIN pg_namespace ns2 ON ns2.oid = other.relnamespace
LEFT JOIN pks_uniques_cols pks_uqs ON pks_uqs.connamespace = traint.connamespace AND pks_uqs.conrelid = traint.conrelid
WHERE traint.contype = 'f'
AND traint.conparentid = 0
${props.schemaFilter ? `and ns1.nspname ${props.schemaFilter}` : ''}
`
