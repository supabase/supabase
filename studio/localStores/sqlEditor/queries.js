const SchemasQuery = `
  SELECT nspname as name
    FROM pg_namespace
    WHERE
      nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
      AND nspname not like 'pg_temp_%'
      AND nspname not like 'pg_toast_temp_%'
      AND has_schema_privilege(oid, 'CREATE, USAGE')
    ORDER BY nspname;
`

const TableColumnsQuery = `
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
  GROUP BY schemaname, tablename, quoted_name, is_table;
`

const AllFunctionsQuery = `
  SELECT n.nspname as "schema",
    p.proname as "name",
    d.description,
    pg_catalog.pg_get_function_result(p.oid) as "result_type",
    pg_catalog.pg_get_function_arguments(p.oid) as "argument_types",
  CASE
    WHEN p.prokind = 'a' THEN 'agg'
    WHEN p.prokind = 'w' THEN 'window'
    WHEN p.prorettype = 'pg_catalog.trigger'::pg_catalog.regtype THEN 'trigger'
    ELSE 'normal'
    END as "type"
  FROM pg_catalog.pg_proc p
    LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
    LEFT JOIN pg_catalog.pg_description d ON p.oid = d.objoid
  WHERE n.nspname = 'public'
  ORDER BY 1, 2, 4;
`

export { SchemasQuery, TableColumnsQuery, AllFunctionsQuery }
