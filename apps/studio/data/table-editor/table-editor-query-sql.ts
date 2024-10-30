import minify from 'pg-minify'

export function getTableEditorSql(id?: number) {
  if (!id) return ''

  return minify(/* SQL */ `
    with entity as (
      select
        c.oid::int8 as "id",
        nc.nspname as "schema",
        c.relname as "name",
        c.relkind as "type",
        obj_description(c.oid) as "comment",
        count(*) over () as "count"
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
        and c.oid = ${id}
      limit
        1
    ),
    encrypted_columns as (
      select
        column_name as name
      from
        information_schema.columns
      where
        table_schema = (
          select
            e.schema
          from
            entity e
        )
        and table_name = concat(
          'decrypted_',
          (
            select
              e.name
            from
              entity e
          )
        )
        and column_name like 'decrypted_%'
    ),
    table_info as (
      select
        c.oid::int8 as id,
        nc.nspname as schema,
        c.relname as name,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced,
        case
          when c.relreplident = 'd' then 'DEFAULT'
          when c.relreplident = 'i' then 'INDEX'
          when c.relreplident = 'f' then 'FULL'
          else 'NOTHING'
        end as replica_identity,
        pg_total_relation_size(format('%I.%I', nc.nspname, c.relname))::int8 as bytes,
        pg_size_pretty(
          pg_total_relation_size(format('%I.%I', nc.nspname, c.relname))
        ) as size,
        pg_stat_get_live_tuples (c.oid) as live_rows_estimate,
        pg_stat_get_dead_tuples (c.oid) as dead_rows_estimate,
        obj_description(c.oid) as
      comment,
      coalesce(pk.primary_keys, '[]') as primary_keys,
      coalesce(
        jsonb_agg(relationships) filter (
          where
            relationships is not null
        ),
        '[]'
      ) as relationships
      from
        pg_namespace nc
        join pg_class c on nc.oid = c.relnamespace
        left join (
          select
            table_id,
            jsonb_agg(_pk.*) as primary_keys
          from
            (
              select
                n.nspname as schema,
                c.relname as table_name,
                a.attname as name,
                c.oid::int8 as table_id
              from
                pg_index i,
                pg_class c,
                pg_attribute a,
                pg_namespace n
              where
                i.indrelid = c.oid
                and c.relnamespace = n.oid
                and a.attrelid = c.oid
                and a.attnum = any (i.indkey)
                and i.indisprimary
            ) as _pk
          group by
            table_id
        ) as pk on pk.table_id = c.oid
        left join (
          select
            c.oid::int8 as id,
            c.conname as constraint_name,
            c.confdeltype as deletion_action,
            c.confupdtype as update_action,
            nsa.nspname as source_schema,
            csa.relname as source_table_name,
            sa.attname as source_column_name,
            nta.nspname as target_table_schema,
            cta.relname as target_table_name,
            ta.attname as target_column_name
          from
            pg_constraint c
            join (
              pg_attribute sa
              join pg_class csa on sa.attrelid = csa.oid
              join pg_namespace nsa on csa.relnamespace = nsa.oid
            ) on sa.attrelid = c.conrelid
            and sa.attnum = any (c.conkey)
            join (
              pg_attribute ta
              join pg_class cta on ta.attrelid = cta.oid
              join pg_namespace nta on cta.relnamespace = nta.oid
            ) on ta.attrelid = c.confrelid
            and ta.attnum = any (c.confkey)
          where
            c.contype = 'f'
        ) as relationships on (
          relationships.source_schema = nc.nspname
          and relationships.source_table_name = c.relname
        )
        or (
          relationships.target_table_schema = nc.nspname
          and relationships.target_table_name = c.relname
        )
      where
        c.relkind in ('r', 'p')
        and not pg_is_other_temp_schema(nc.oid)
        and (
          pg_has_role(c.relowner, 'USAGE')
          or has_table_privilege(
            c.oid,
            'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
          )
          or has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
        )
        and c.oid = ${id}
      group by
        c.oid,
        c.relname,
        c.relrowsecurity,
        c.relforcerowsecurity,
        c.relreplident,
        nc.nspname,
        pk.primary_keys
    ),
    view_info as (
      select
        c.oid::int8 as id,
        n.nspname as schema,
        c.relname as name,
        -- See definition of information_schema.views
        (pg_relation_is_updatable (c.oid, false) & 20) = 20 as is_updatable,
        obj_description(c.oid) as
      comment
      from
        pg_class c
        join pg_namespace n on n.oid = c.relnamespace
      where
        c.relkind = 'v'
        and c.oid = ${id}
    ),
    materialized_view_info as (
      select
        c.oid::int8 as id,
        n.nspname as schema,
        c.relname as name,
        c.relispopulated as is_populated,
        obj_description(c.oid) as
      comment
      from
        pg_class c
        join pg_namespace n on n.oid = c.relnamespace
      where
        c.relkind = 'm'
        and c.oid = ${id}
    ),
    foreign_table_info as (
      select
        c.oid::int8 as id,
        n.nspname as schema,
        c.relname as name,
        obj_description(c.oid) as
      comment
      from
        pg_class c
        join pg_namespace n on n.oid = c.relnamespace
      where
        c.relkind = 'f'
    ),
    column_info as (
      select
        c.oid::int8 as table_id,
        nc.nspname as schema,
        c.relname as table,
        (c.oid || '.' || a.attnum) as id,
        a.attnum as ordinal_position,
        a.attname as name,
        case
          when a.atthasdef then pg_get_expr(ad.adbin, ad.adrelid)
          else null
        end as default_value,
        case
          when t.typtype = 'd' then case
            when bt.typelem <> 0::oid
            and bt.typlen = -1 then 'ARRAY'
            when nbt.nspname = 'pg_catalog' then format_type(t.typbasetype, null)
            else 'USER-DEFINED'
          end
          else case
            when t.typelem <> 0::oid
            and t.typlen = -1 then 'ARRAY'
            when nt.nspname = 'pg_catalog' then format_type(a.atttypid, null)
            else 'USER-DEFINED'
          end
        end as data_type,
        coalesce(bt.typname, t.typname) as format,
        a.attidentity in ('a', 'd') as is_identity,
        case a.attidentity
          when 'a' then 'ALWAYS'
          when 'd' then 'BY DEFAULT'
          else null
        end as identity_generation,
        a.attgenerated in ('s') as is_generated,
        not (
          a.attnotnull
          or t.typtype = 'd'
          and t.typnotnull
        ) as is_nullable,
        (
          c.relkind in ('r', 'p')
          or c.relkind in ('v', 'f')
          and pg_column_is_updatable (c.oid, a.attnum, false)
        ) as is_updatable,
        uniques.table_id is not null as is_unique,
        check_constraints.definition as "check",
        array_to_json(
          array (
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
        col_description(c.oid, a.attnum) as
      comment
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
          select distinct
            on (table_id, ordinal_position) conrelid as table_id,
            conkey[1] as ordinal_position
          from
            pg_catalog.pg_constraint
          where
            contype = 'u'
            and cardinality(conkey) = 1
        ) as uniques on uniques.table_id = c.oid
        and uniques.ordinal_position = a.attnum
        left join (
          -- We only select the first column check
          select distinct
            on (table_id, ordinal_position) conrelid as table_id,
            conkey[1] as ordinal_position,
            substring(
              pg_get_constraintdef(pg_constraint.oid, true),
              8,
              length(pg_get_constraintdef(pg_constraint.oid, true)) - 8
            ) as "definition"
          from
            pg_constraint
          where
            contype = 'c'
            and cardinality(conkey) = 1
          order by
            table_id,
            ordinal_position,
            oid asc
        ) as check_constraints on check_constraints.table_id = c.oid
        and check_constraints.ordinal_position = a.attnum
      where
        not pg_is_other_temp_schema(nc.oid)
        and a.attnum > 0
        and not a.attisdropped
        and (c.relkind in ('r', 'v', 'm', 'f', 'p'))
        and (
          pg_has_role(c.relowner, 'USAGE')
          or has_column_privilege(
            c.oid,
            a.attnum,
            'SELECT, INSERT, UPDATE, REFERENCES'
          )
        )
        and c.oid = ${id}
    )
    select
      (select to_jsonb(entity.*) from entity) as "entity",
      (select jsonb_agg(encrypted_columns.*) from encrypted_columns) as "encrypted_columns",
      (select to_jsonb(table_info.*) from table_info) as "table_info",
      (select to_jsonb(view_info.*) from view_info) as "view_info",
      (select to_jsonb(materialized_view_info.*) from materialized_view_info) as "materialized_view_info",
      (select to_jsonb(foreign_table_info.*) from foreign_table_info) as "foreign_table_info",
      (select jsonb_agg(column_info.*) from column_info) as "column_info"
  `)
}
