import { PostgresColumn, PostgresPrimaryKey, PostgresRelationship } from '@supabase/postgres-meta'
import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

export const getTableSql = ({ id }: { id?: string }) => {
  if (!id) {
    throw new Error('id is required')
  }

  const sql = /* SQL */ `
    with columns as (
      select
        c.oid::int8 as "table_id",
        nc.nspname as "schema",
        c.relname as "table",
        (c.oid || '.' || a.attnum) as "id",
        a.attnum as "ordinal_position",
        a.attname as "name",
        case
          when a.atthasdef then pg_get_expr(ad.adbin, ad.adrelid)
          else NULL
        end as default_value,
        case
          when t.typtype = 'd' then case
            when bt.typelem <> 0::oid
            and bt.typlen = -1 then 'ARRAY'
            when nbt.nspname = 'pg_catalog' then format_type(t.typbasetype, NULL)
            else 'USER-DEFINED'
          end
          else case
            when t.typelem <> 0 :: oid
            AND t.typlen = -1 then 'ARRAY'
            when nt.nspname = 'pg_catalog' then format_type(a.atttypid, NULL)
            else 'USER-DEFINED'
          end
        end as data_type,
        coalesce(bt.typname, t.typname) as format,
        a.attidentity in ('a', 'd') as is_identity,
        case
          a.attidentity
          when 'a' then 'ALWAYS'
          when 'd' then 'BY DEFAULT'
          else NULL
        end as identity_generation,
        a.attgenerated in ('s') as is_generated,
        not (
          a.attnotnull
          or t.typtype = 'd' and t.typnotnull
        ) as is_nullable,
        (
          c.relkind in ('r', 'p')
          or c.relkind in ('v', 'f') and pg_column_is_updatable(c.oid, a.attnum, false)
        ) as is_updatable,
        uniques.table_id is not null as is_unique,
        array_to_json(
          array(
            select
              enumlabel
            from
              pg_catalog.pg_enum enums
            where
              enums.enumtypid = coalesce(bt.oid, t.oid)
              or enums.enumtypid = coalesce(bt.typelem, t.typelem)
            order by
              enums.enumsortorder
          )
        ) as enums,
        col_description(c.oid, a.attnum) as comment
      from
        pg_attribute a
        left join pg_attrdef ad on a.attrelid = ad.adrelid
        and a.attnum = ad.adnum
        join (
          pg_class c
          join pg_namespace nc on c.relnamespace = nc.oid
        ) on a.attrelid = c.oid
        join (
          pg_type t
          join pg_namespace nt on t.typnamespace = nt.oid
        ) on a.atttypid = t.oid
        left join (
          pg_type bt
          join pg_namespace nbt on bt.typnamespace = nbt.oid
        ) on t.typtype = 'd'
        and t.typbasetype = bt.oid
        left join (
          select
            conrelid AS table_id,
            conkey[1] AS ordinal_position
          from pg_catalog.pg_constraint
          where contype = 'u' and cardinality(conkey) = 1
        ) as uniques on uniques.table_id = c.oid and uniques.ordinal_position = a.attnum
      where
        not pg_is_other_temp_schema(nc.oid)
        and a.attnum > 0
        and not a.attisdropped
        and (c.relkind in ('r', 'v', 'f', 'p'))
        and (
          pg_has_role(c.relowner, 'USAGE')
          or has_column_privilege(
            c.oid,
            a.attnum,
            'SELECT, INSERT, UPDATE, REFERENCES'
          )
        )
        and c.oid = '${id}'::int8
    ), tables as (
      select
          c.oid::int8 AS "id",
          nc.nspname AS "schema",
          c.relname AS "name",
          case c.relkind
            when 'r' then 'table'
            when 'v' then 'view'
            when 'm' then 'materialized_view'
            when 'f' then 'foreign_table'
            when 'p' then 'partitioned_table'
          end as "type",
          obj_description(c.oid) AS "comment",
          c.relrowsecurity AS "rls_enabled",
          c.relforcerowsecurity AS "rls_forced"
        from
          pg_namespace nc
          join pg_class c on nc.oid = c.relnamespace
        where
          c.relkind in ('r', 'v', 'm', 'f', 'p')
          and not pg_is_other_temp_schema(nc.oid)
          and (
            pg_has_role(c.relowner, 'USAGE')
            or has_table_privilege(
              c.oid,
              'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
            )
            or has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
          )
          and c.oid = '${id}'::int8
    ), primary_keys as (
      select
        n.nspname as "schema",
        c.relname as "table_name",
        a.attname as "name",
        c.oid::int8 as "table_id"
      from
        pg_index i,
        pg_class c,
        pg_attribute a,
        pg_namespace n
      where
        i.indrelid = c.oid
        and c.relnamespace = n.oid
        and a.attrelid = c.oid
        and a.attnum = ANY (i.indkey)
        and i.indisprimary
        and c.oid = '${id}'::int8
    ), relationships as (
      select
        c.oid::int8 as "id",
        c.conname as "constraint_name",
        nsa.nspname as "source_schema",
        csa.relname as "source_table_name",
        sa.attname as "source_column_name",
        nta.nspname as "target_table_schema",
        cta.relname as "target_table_name",
        ta.attname as "target_column_nam"
      from
        pg_constraint c
        join (
          pg_attribute sa
          join pg_class csa on sa.attrelid = csa.oid
          join pg_namespace nsa on csa.relnamespace = nsa.oid
        ) on sa.attrelid = c.conrelid
        and sa.attnum = any(c.conkey)
        join (
          pg_attribute ta
          join pg_class cta on ta.attrelid = cta.oid
          join pg_namespace nta on cta.relnamespace = nta.oid
        ) on ta.attrelid = c.confrelid
        and ta.attnum = any(c.confkey)
      where
        c.contype = 'f'
    )
    select
      t.*,
      coalesce(c.columns, '[]'::jsonb) as columns,
      coalesce(p.primary_keys, '[]'::jsonb) as primary_keys,
      coalesce(r.relationships, '[]'::jsonb) as relationships
    from tables t
    left join (
      select c.table_id as table_id, jsonb_agg(c) as columns from columns c
      group by c.table_id
    ) c on c.table_id = t.id
    left join (
      select p.table_id as table_id, jsonb_agg(p) as primary_keys from primary_keys p
      group by p.table_id
    ) p on p.table_id = t.id
    left join (
      select
        r.source_schema,
        r.source_table_name,
        r.target_table_schema,
        r.target_table_name,
        jsonb_agg(r) as relationships
      from relationships r
      group by
        r.source_schema,
        r.source_table_name,
        r.target_table_schema,
        r.target_table_name
    ) r on (r.source_schema = t.schema AND r.source_table_name = t.name) or (r.target_table_schema = t.schema and r.target_table_name = t.name);
  `

  return sql
}

export type Table = {
  id: number
  name: string
  schema: string
  type: 'table' | 'view' | 'materialized_view' | 'foreign_table' | 'partitioned_table'
  comment: string | null
  rls_enabled: boolean
  rls_forced: boolean
  columns: PostgresColumn[]
  primary_keys: PostgresPrimaryKey[]
  relationships: PostgresRelationship[]
}

export type TableResponse = Table

export type TableVariables = {
  projectRef?: string
  connectionString?: string
  id?: string
}

export type TableData = TableResponse
export type TableError = unknown

export const useTableQuery = <TData extends TableData = TableData>(
  { projectRef, connectionString, id }: TableVariables,
  { enabled = true, ...options }: UseQueryOptions<ExecuteSqlData, TableError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: id ? getTableSql({ id }) : '',
      queryKey: ['tables', id],
    },
    {
      enabled: enabled && typeof id !== 'undefined',
      select: (data) => data.result?.[0],
      ...options,
    }
  )

export const useTablePrefetch = ({ projectRef, connectionString, id }: TableVariables) => {
  return useExecuteSqlPrefetch({
    projectRef,
    connectionString,
    sql: getTableSql({ id }),
    queryKey: ['tables', id],
  })
}
