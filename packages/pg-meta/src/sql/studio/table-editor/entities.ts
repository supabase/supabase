import { joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getEntityTypesSQL = ({
  schemas,
  search,
  sort,
  filterTypes,
  excludePartitions = false,
  parentId,
  limit,
  page,
}: {
  schemas: Array<string>
  search?: string
  sort: 'alphabetical' | 'grouped-alphabetical'
  filterTypes: Array<string>
  excludePartitions?: boolean
  parentId?: number
  limit: number
  page: number
}): SafeSqlFragment => {
  const innerOrderBy =
    sort === 'alphabetical' ? safeSql`c.relname asc` : safeSql`"type_sort" asc, c.relname asc`
  const outerOrderBy =
    sort === 'alphabetical' ? safeSql`r.name asc` : safeSql`r.type_sort asc, r.name asc`

  const typeList = joinSqlFragments(filterTypes.map(literal), ', ')
  const schemaList = joinSqlFragments(schemas.map(literal), ', ')
  const searchClause = search ? safeSql`and c.relname ilike ${literal(`%${search}%`)}` : safeSql``
  const partitionClause = excludePartitions ? safeSql`and not c.relispartition` : safeSql``

  const parentClause =
    parentId !== undefined
      ? safeSql`and c.oid in (select inhrelid from pg_inherits where inhparent = ${literal(parentId)}::oid)`
      : safeSql``

  return safeSql`
    with records as (
      select
        c.oid::int8 as "id",
        nc.nspname as "schema",
        c.relname as "name",
        c.relkind as "type",
        case c.relkind
          when 'r' then 1
          when 'v' then 2
          when 'm' then 3
          when 'f' then 4
          when 'p' then 5
        end as "type_sort",
        obj_description(c.oid) as "comment",
        count(*) over() as "count",
        c.relrowsecurity as "rls_enabled",
        -- Partitions are ordinary tables, so relkind alone can't single them out
        c.relispartition as "is_partition"
      from
        pg_namespace nc
        join pg_class c on nc.oid = c.relnamespace
      where
        c.relkind in (${typeList})
        and not pg_is_other_temp_schema(nc.oid)
        and (
          pg_has_role(c.relowner, 'USAGE')
          or has_table_privilege(
            c.oid,
            'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
          )
          or has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
        )
        and nc.nspname in (${schemaList})
        ${searchClause}
        ${partitionClause}
        ${parentClause}
      order by ${innerOrderBy}
      limit ${literal(limit)}
      offset ${literal(page * limit)}
    )
    select
      jsonb_build_object(
        'entities', coalesce(jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'schema', r.schema,
            'name', r.name,
            'type', r.type,
            'comment', r.comment,
            'rls_enabled', r.rls_enabled,
            'is_partition', r.is_partition
          )
          order by ${outerOrderBy}
        ), '[]'::jsonb),
        'count', coalesce(min(r.count), 0)
      ) "data"
    from records r;
  `
}

/** Counts nested partitions too; level 0 is the table itself */
export const getPartitionCountSQL = ({ id }: { id: number }): SafeSqlFragment => {
  return safeSql`
    select count(*)::int as "count"
    from pg_partition_tree(${literal(id)}::oid::regclass)
    where level > 0;
  `
}

/** Table name plus its parent partitioned table, if it is a partition */
export const getPartitionInfoSQL = ({ id }: { id: number }): SafeSqlFragment => {
  return safeSql`
    select
      c.relname as "name",
      (select i.inhparent::int8 from pg_inherits i where i.inhrelid = c.oid) as "parent_id"
    from pg_class c
    where c.oid = ${literal(id)}::oid;
  `
}

/** Finds entities by oid, including partitions that the entity list hides */
export const getEntitiesByIdsSQL = ({ ids }: { ids: Array<number> }): SafeSqlFragment => {
  const idList = joinSqlFragments(ids.map(literal), ', ')
  return safeSql`
    select
      c.oid::int8 as "id",
      nc.nspname as "schema",
      c.relname as "name",
      c.relkind as "type",
      obj_description(c.oid) as "comment",
      c.relrowsecurity as "rls_enabled",
      c.relispartition as "is_partition"
    from pg_class c
    join pg_namespace nc on nc.oid = c.relnamespace
    where c.oid in (${idList})
      and c.relkind in ('r', 'v', 'm', 'f', 'p');
  `
}
