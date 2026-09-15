import { DEFAULT_SYSTEM_SCHEMAS } from '../../../constants'
import { coalesceRowsToArray, filterByList } from '../../../helpers'
import { literal, safeSql, type SafeSqlFragment } from '../../../pg-format'
import { getColumnsSql } from '../../columns'

// Cursor-paginated tables list ordered by c.oid (backed by pg_class_oid_index —
// unique, always present, indexed). Pagination is by `where c.oid > $afterOid`
// instead of OFFSET so deep pages stay O(limit) rather than O(offset + limit).
// Pass afterOid = 0 for the first page; subsequent pages pass the largest `id`
// returned by the previous page.
//
// Structure is deliberately not built on top of the existing `TABLES_SQL`
// constant: that query GROUPs over the whole catalog and joins relationships
// with an OR predicate that fans out across every (source, target) pair, so
// wrapping it as `select * from (TABLES_SQL) ... limit N` still pays the full
// cost before LIMIT applies. Here the `page` CTE picks the OIDs for the
// requested page first (cheap — pg_class index scan), and every enrichment CTE
// downstream is constrained to that small set.
export const getTablesPaginatedSql = ({
  schema,
  includeColumns = false,
  limit,
  afterOid,
  nameFilter,
}: {
  schema?: string
  includeColumns?: boolean
  limit: number
  afterOid: number
  nameFilter?: string
}): SafeSqlFragment => {
  const filter = filterByList(
    schema ? [schema] : undefined,
    undefined,
    schema ? undefined : DEFAULT_SYSTEM_SCHEMAS
  )
  const schemaFilter = filter ? safeSql`and nc.nspname ${filter}` : safeSql``
  const nameFilterClause =
    nameFilter && nameFilter.length > 0
      ? schema
        ? safeSql`and c.relname ilike ${literal(`%${escapeIlikeLiteral(nameFilter)}%`)}`
        : safeSql`and (
            c.relname ilike ${literal(`%${escapeIlikeLiteral(nameFilter)}%`)}
            or nc.nspname ilike ${literal(`%${escapeIlikeLiteral(nameFilter)}%`)}
            or (nc.nspname || '.' || c.relname) ilike ${literal(`%${escapeIlikeLiteral(nameFilter)}%`)}
          )`
      : safeSql``

  const columnsCte = includeColumns
    ? safeSql`, columns as (${getColumnsSql({
        filter: { column: 'oid', predicate: safeSql`in (select oid from page)` },
      })})`
    : safeSql``

  const columnsSelect = includeColumns
    ? safeSql`, ${coalesceRowsToArray('columns', safeSql`columns.table_id = tables.id`)}`
    : safeSql``

  return safeSql`
    with page as (
      select
        c.oid,
        c.relname,
        c.relrowsecurity,
        c.relforcerowsecurity,
        c.relreplident,
        nc.nspname as schema,
        -- Computed once here so the final select can reference it for both the
        -- raw byte count and pg_size_pretty without re-walking heap+toast+indexes.
        pg_total_relation_size(c.oid) as bytes_raw
      from pg_namespace nc
      join pg_class c on nc.oid = c.relnamespace
      where c.relkind in ('r', 'p')
        and not pg_is_other_temp_schema(nc.oid)
        and c.oid > ${literal(afterOid)}
        and (
          pg_has_role(c.relowner, 'USAGE')
          or has_table_privilege(
            c.oid,
            'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
          )
          or has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
        )
        ${schemaFilter}
        ${nameFilterClause}
      order by c.oid
      limit ${literal(limit)}
    ),
    page_primary_keys as (
      select
        c.oid::int8 as table_id,
        jsonb_agg(
          jsonb_build_object(
            'table_id', c.oid::int8,
            'schema', n.nspname,
            'table_name', c.relname,
            'name', a.attname
          )
          order by array_position(i.indkey, a.attnum)
        ) as primary_keys
      from pg_index i
      join pg_class c on i.indrelid = c.oid
      join pg_namespace n on c.relnamespace = n.oid
      join pg_attribute a on a.attrelid = c.oid and a.attnum = any(i.indkey)
      where i.indisprimary
        and c.oid in (select oid from page)
      group by c.oid
    ),
    -- Two-armed UNION ALL keyed by table_id so the downstream join is a plain
    -- equi-join (see tables CTE below). The previous shape used an OR across
    -- (source_oid, target_oid), which planners can't decompose into two index
    -- probes. The target-side arm skips self-referential FKs so they aren't
    -- emitted twice.
    page_relationships as (
      select
        csa.oid::int8 as table_id,
        c.oid::int8 as id,
        c.conname as constraint_name,
        nsa.nspname as source_schema,
        csa.relname as source_table_name,
        sa.attname as source_column_name,
        nta.nspname as target_table_schema,
        cta.relname as target_table_name,
        ta.attname as target_column_name
      from pg_constraint c
      join pg_class csa on csa.oid = c.conrelid
      join pg_namespace nsa on nsa.oid = csa.relnamespace
      -- Pair conkey/confkey by ordinal so composite FKs don't fan out into a
      -- cross-product of (source_col, target_col) rows.
      join lateral unnest(c.conkey, c.confkey) as fk(src_attnum, tgt_attnum) on true
      join pg_attribute sa on sa.attrelid = c.conrelid and sa.attnum = fk.src_attnum
      join pg_class cta on cta.oid = c.confrelid
      join pg_namespace nta on nta.oid = cta.relnamespace
      join pg_attribute ta on ta.attrelid = c.confrelid and ta.attnum = fk.tgt_attnum
      where c.contype = 'f'
        and csa.oid in (select oid from page)
      union all
      select
        cta.oid::int8 as table_id,
        c.oid::int8 as id,
        c.conname as constraint_name,
        nsa.nspname as source_schema,
        csa.relname as source_table_name,
        sa.attname as source_column_name,
        nta.nspname as target_table_schema,
        cta.relname as target_table_name,
        ta.attname as target_column_name
      from pg_constraint c
      join pg_class csa on csa.oid = c.conrelid
      join pg_namespace nsa on nsa.oid = csa.relnamespace
      join lateral unnest(c.conkey, c.confkey) as fk(src_attnum, tgt_attnum) on true
      join pg_attribute sa on sa.attrelid = c.conrelid and sa.attnum = fk.src_attnum
      join pg_class cta on cta.oid = c.confrelid
      join pg_namespace nta on nta.oid = cta.relnamespace
      join pg_attribute ta on ta.attrelid = c.confrelid and ta.attnum = fk.tgt_attnum
      where c.contype = 'f'
        and cta.oid in (select oid from page)
        and cta.oid <> csa.oid
    ),
    tables as (
      select
        p.oid::int8 as id,
        p.schema as schema,
        p.relname as name,
        p.relrowsecurity as rls_enabled,
        p.relforcerowsecurity as rls_forced,
        case
          when p.relreplident = 'd' then 'DEFAULT'
          when p.relreplident = 'i' then 'INDEX'
          when p.relreplident = 'f' then 'FULL'
          else 'NOTHING'
        end as replica_identity,
        p.bytes_raw::int8 as bytes,
        pg_size_pretty(p.bytes_raw) as size,
        pg_stat_get_live_tuples(p.oid) as live_rows_estimate,
        pg_stat_get_dead_tuples(p.oid) as dead_rows_estimate,
        obj_description(p.oid) as comment,
        coalesce(pk.primary_keys, '[]'::jsonb) as primary_keys,
        coalesce(
          jsonb_agg(
            jsonb_build_object(
              'id', r.id,
              'constraint_name', r.constraint_name,
              'source_schema', r.source_schema,
              'source_table_name', r.source_table_name,
              'source_column_name', r.source_column_name,
              'target_table_schema', r.target_table_schema,
              'target_table_name', r.target_table_name,
              'target_column_name', r.target_column_name
            )
          ) filter (where r.id is not null),
          '[]'::jsonb
        ) as relationships
      from page p
      left join page_primary_keys pk on pk.table_id = p.oid
      left join page_relationships r on r.table_id = p.oid
      group by
        p.oid,
        p.schema,
        p.relname,
        p.relrowsecurity,
        p.relforcerowsecurity,
        p.relreplident,
        p.bytes_raw,
        pk.primary_keys
    )${columnsCte}
    select tables.*${columnsSelect}
    from tables
    order by tables.id
  `
}

// Escape LIKE/ILIKE wildcards so user input is matched literally. ILIKE's
// default escape character is `\`, so we escape `\`, `%`, and `_` and let the
// pattern carry its own surrounding `%`s as wildcards.
const escapeIlikeLiteral = (value: string) => value.replace(/([\\%_])/g, '\\$1')
