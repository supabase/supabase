import type { SQLQueryPropsWithSchemaFilter } from './common.js'

export const VIEWS_KEY_DEPENDENCIES_SQL = (props: SQLQueryPropsWithSchemaFilter) => /* SQL */ `
-- Adapted from
-- https://github.com/PostgREST/postgrest/blob/f9f0f79fa914ac00c11fbf7f4c558e14821e67e2/src/PostgREST/SchemaCache.hs#L820
with recursive
pks_fks as (
  -- pk + fk referencing col
  select
    contype::text as contype,
    conname,
    array_length(conkey, 1) as ncol,
    conrelid as resorigtbl,
    col as resorigcol,
    ord
  from pg_constraint
  left join lateral unnest(conkey) with ordinality as _(col, ord) on true
  where contype IN ('p', 'f')
  union
  -- fk referenced col
  select
    concat(contype, '_ref') as contype,
    conname,
    array_length(confkey, 1) as ncol,
    confrelid,
    col,
    ord
  from pg_constraint
  left join lateral unnest(confkey) with ordinality as _(col, ord) on true
  where contype='f'
  ${props.schemaFilter ? `and connamespace::regnamespace::text ${props.schemaFilter}` : ''}
),
views as (
  select
    c.oid       as view_id,
    n.nspname   as view_schema,
    c.relname   as view_name,
    r.ev_action as view_definition
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  join pg_rewrite r on r.ev_class = c.oid
  where c.relkind in ('v', 'm') 
    ${props.schemaFilter ? `and n.nspname ${props.schemaFilter}` : ''}
),
transform_json as (
  select
    view_id, view_schema, view_name,
    -- the following formatting is without indentation on purpose
    -- to allow simple diffs, with less whitespace noise
    replace(
      replace(
      replace(
      replace(
      replace(
      replace(
      replace(
      regexp_replace(
      replace(
      replace(
      replace(
      replace(
      replace(
      replace(
      replace(
      replace(
      replace(
      replace(
      replace(
        view_definition::text,
      -- This conversion to json is heavily optimized for performance.
      -- The general idea is to use as few regexp_replace() calls as possible.
      -- Simple replace() is a lot faster, so we jump through some hoops
      -- to be able to use regexp_replace() only once.
      -- This has been tested against a huge schema with 250+ different views.
      -- The unit tests do NOT reflect all possible inputs. Be careful when changing this!
      -- -----------------------------------------------
      -- pattern           | replacement         | flags
      -- -----------------------------------------------
      -- <> in pg_node_tree is the same as null in JSON, but due to very poor performance of json_typeof
      -- we need to make this an empty array here to prevent json_array_elements from throwing an error
      -- when the targetList is null.
      -- We'll need to put it first, to make the node protection below work for node lists that start with
      -- null: (<> ..., too. This is the case for coldefexprs, when the first column does not have a default value.
         '<>'              , '()'
      -- , is not part of the pg_node_tree format, but used in the regex.
      -- This removes all , that might be part of column names.
      ), ','               , ''
      -- The same applies for { and }, although those are used a lot in pg_node_tree.
      -- We remove the escaped ones, which might be part of column names again.
      ), E'\\\\{'            , ''
      ), E'\\\\}'            , ''
      -- The fields we need are formatted as json manually to protect them from the regex.
      ), ' :targetList '   , ',"targetList":'
      ), ' :resno '        , ',"resno":'
      ), ' :resorigtbl '   , ',"resorigtbl":'
      ), ' :resorigcol '   , ',"resorigcol":'
      -- Make the regex also match the node type, e.g. \`{QUERY ...\`, to remove it in one pass.
      ), '{'               , '{ :'
      -- Protect node lists, which start with \`({\` or \`((\` from the greedy regex.
      -- The extra \`{\` is removed again later.
      ), '(('              , '{(('
      ), '({'              , '{({'
      -- This regex removes all unused fields to avoid the need to format all of them correctly.
      -- This leads to a smaller json result as well.
      -- Removal stops at \`,\` for used fields (see above) and \`}\` for the end of the current node.
      -- Nesting can't be parsed correctly with a regex, so we stop at \`{\` as well and
      -- add an empty key for the followig node.
      ), ' :[^}{,]+'       , ',"":'              , 'g'
      -- For performance, the regex also added those empty keys when hitting a \`,\` or \`}\`.
      -- Those are removed next.
      ), ',"":}'           , '}'
      ), ',"":,'           , ','
      -- This reverses the "node list protection" from above.
      ), '{('              , '('
      -- Every key above has been added with a \`,\` so far. The first key in an object doesn't need it.
      ), '{,'              , '{'
      -- pg_node_tree has \`()\` around lists, but JSON uses \`[]\`
      ), '('               , '['
      ), ')'               , ']'
      -- pg_node_tree has \` \` between list items, but JSON uses \`,\`
      ), ' '             , ','
    )::json as view_definition
  from views
),
target_entries as(
  select
    view_id, view_schema, view_name,
    json_array_elements(view_definition->0->'targetList') as entry
  from transform_json
),
results as(
  select
    view_id, view_schema, view_name,
    (entry->>'resno')::int as view_column,
    (entry->>'resorigtbl')::oid as resorigtbl,
    (entry->>'resorigcol')::int as resorigcol
  from target_entries
),
-- CYCLE detection according to PG docs: https://www.postgresql.org/docs/current/queries-with.html#QUERIES-WITH-CYCLE
-- Can be replaced with CYCLE clause once PG v13 is EOL.
recursion(view_id, view_schema, view_name, view_column, resorigtbl, resorigcol, is_cycle, path) as(
  select
    r.*,
    false,
    ARRAY[resorigtbl]
  from results r
  where ${props.schemaFilter ? `view_schema ${props.schemaFilter}` : 'true'}
  union all
  select
    view.view_id,
    view.view_schema,
    view.view_name,
    view.view_column,
    tab.resorigtbl,
    tab.resorigcol,
    tab.resorigtbl = ANY(path),
    path || tab.resorigtbl
  from recursion view
  join results tab on view.resorigtbl=tab.view_id and view.resorigcol=tab.view_column
  where not is_cycle
),
repeated_references as(
  select
    view_id,
    view_schema,
    view_name,
    resorigtbl,
    resorigcol,
    array_agg(attname) as view_columns
  from recursion
  join pg_attribute vcol on vcol.attrelid = view_id and vcol.attnum = view_column
  group by
    view_id,
    view_schema,
    view_name,
    resorigtbl,
    resorigcol
)
select
  sch.nspname as table_schema,
  tbl.relname as table_name,
  rep.view_schema,
  rep.view_name,
  pks_fks.conname as constraint_name,
  pks_fks.contype as constraint_type,
  jsonb_agg(
    jsonb_build_object('table_column', col.attname, 'view_columns', view_columns) order by pks_fks.ord
  ) as column_dependencies
from repeated_references rep
join pks_fks using (resorigtbl, resorigcol)
join pg_class tbl on tbl.oid = rep.resorigtbl
join pg_attribute col on col.attrelid = tbl.oid and col.attnum = rep.resorigcol
join pg_namespace sch on sch.oid = tbl.relnamespace
group by sch.nspname, tbl.relname,  rep.view_schema, rep.view_name, pks_fks.conname, pks_fks.contype, pks_fks.ncol
-- make sure we only return key for which all columns are referenced in the view - no partial PKs or FKs
having ncol = array_length(array_agg(row(col.attname, view_columns) order by pks_fks.ord), 1)
`
