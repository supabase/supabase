import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlVariables } from 'data/sql/execute-sql-query'
import { Entity } from './entity-type-query'
import { entityTypeKeys } from './keys'

export type EntityTypesVariables = {
  projectRef?: string
  schema?: string
  limit?: number
  page?: number
} & Pick<ExecuteSqlVariables, 'connectionString'>

export type EntityTypesResponse = {
  data: {
    entities: Entity[]
    count: number
  }
}

export async function getEntityTypes(
  { projectRef, connectionString, schema = 'public', limit = 100, page = 0 }: EntityTypesVariables,
  signal?: AbortSignal
) {
  const sql = /* SQL */ `
    with records as (
      select
        c.oid::int8 as "id",
        nc.nspname as "schema",
        c.relname as "name",
        case c.relkind
          when 'r' then 'table'
          when 'v' then 'view'
          when 'm' then 'materialized_view'
          when 'f' then 'foreign_table'
          when 'p' then 'partitioned_table'
        end as "type",
        obj_description(c.oid) as "comment",
        count(*) over() as "count"
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
        and nc.nspname = '${schema}'
      order by "name" asc
      limit ${limit}
      offset ${page * limit}
    )
    select
      jsonb_build_object(
        'entities', coalesce(jsonb_agg(
          jsonb_build_object(
            'id', r.id,
            'schema', r.schema,
            'name', r.name,
            'type', r.type,
            'comment', r.comment
          )
          order by r.name asc
        ), '[]'::jsonb),
        'count', coalesce(min(r.count), 0)
      ) "data"
    from records r;
  `

  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
    },
    signal
  )

  return result[0] as EntityTypesResponse
}

export type EntityTypesData = Awaited<ReturnType<typeof getEntityTypes>>
export type EntityTypesError = unknown

export const useEntityTypesQuery = <TData = EntityTypesData>(
  {
    projectRef,
    connectionString,
    schema = 'public',
    limit = 100,
  }: Omit<EntityTypesVariables, 'page'>,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<EntityTypesData, EntityTypesError, TData> = {}
) =>
  useInfiniteQuery<EntityTypesData, EntityTypesError, TData>(
    entityTypeKeys.list(projectRef),
    ({ signal, pageParam }) =>
      getEntityTypes({ projectRef, connectionString, schema, limit, page: pageParam }, signal),
    {
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof connectionString !== 'undefined',
      getNextPageParam(lastPage, pages) {
        const page = pages.length
        const currentTotalCount = page * limit
        const totalCount = lastPage.data.count

        if (currentTotalCount >= totalCount) {
          return undefined
        }

        return page
      },
      ...options,
    }
  )
