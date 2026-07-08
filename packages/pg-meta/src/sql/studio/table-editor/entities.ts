import { joinSqlFragments, literal, safeSql, type SafeSqlFragment } from '../../../pg-format'

export const getEntityTypesSQL = ({
  schemas,
  search,
  sort,
  filterTypes,
  limit,
  page,
}: {
  schemas: Array<string>
  search?: string
  sort: 'alphabetical' | 'grouped-alphabetical'
  filterTypes: Array<string>
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
        c.relrowsecurity as "rls_enabled"
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
            'rls_enabled', r.rls_enabled
          )
          order by ${outerOrderBy}
        ), '[]'::jsonb),
        'count', coalesce(min(r.count), 0)
      ) "data"
    from records r;
  `
}
