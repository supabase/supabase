import { QueryClient, useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlVariables } from 'data/sql/execute-sql-query'
import { ENTITY_TYPE } from './entity-type-constants'
import { entityTypeKeys } from './keys'

export type EntityTypesVariables = {
  projectRef?: string
  schemas?: string[]
  search?: string
  limit?: number
  page?: number
  sort?: 'alphabetical' | 'grouped-alphabetical'
  filterTypes?: string[]
} & Pick<ExecuteSqlVariables, 'connectionString'>

export interface Entity {
  id: number
  schema: string
  name: string
  type: ENTITY_TYPE
  comment: string | null
  rls_enabled: boolean
}

export type EntityTypesResponse = {
  data: {
    entities: Entity[]
    count: number
  }
}

export async function getEntityTypes(
  {
    projectRef,
    connectionString,
    schemas = ['public'],
    search,
    limit = 100,
    page = 0,
    sort = 'alphabetical',
    filterTypes = Object.values(ENTITY_TYPE),
  }: EntityTypesVariables,
  signal?: AbortSignal
) {
  const innerOrderBy = sort === 'alphabetical' ? `c.relname asc` : `"type_sort" asc, c.relname asc`
  const outerOrderBy = sort === 'alphabetical' ? `r.name asc` : `r.type_sort asc, r.name asc`

  const sql = /* SQL */ `
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
        c.relkind in (${filterTypes.map((x) => `'${x}'`).join(', ')})
        and not pg_is_other_temp_schema(nc.oid)
        and (
          pg_has_role(c.relowner, 'USAGE')
          or has_table_privilege(
            c.oid,
            'SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER'
          )
          or has_any_column_privilege(c.oid, 'SELECT, INSERT, UPDATE, REFERENCES')
        )
        and nc.nspname in (${schemas.map((x) => `'${x}'`)})
        ${search ? `and c.relname ilike '%${search}%'` : ''}
      order by ${innerOrderBy}
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
            'comment', r.comment,
            'rls_enabled', r.rls_enabled
          )
          order by ${outerOrderBy}
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
      queryKey: ['entity-types', ...schemas, page],
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
    schemas = ['public'],
    search,
    limit = 100,
    sort,
    filterTypes,
  }: Omit<EntityTypesVariables, 'page'>,
  {
    enabled = true,
    ...options
  }: UseInfiniteQueryOptions<EntityTypesData, EntityTypesError, TData> = {}
) =>
  useInfiniteQuery<EntityTypesData, EntityTypesError, TData>(
    entityTypeKeys.list(projectRef, { schemas, search, sort, limit, filterTypes }),
    ({ signal, pageParam }) =>
      getEntityTypes(
        {
          projectRef,
          connectionString,
          schemas,
          search,
          limit,
          page: pageParam,
          sort,
          filterTypes,
        },
        signal
      ),
    {
      enabled: enabled && typeof projectRef !== 'undefined',
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

export function prefetchEntityTypes(
  client: QueryClient,
  {
    projectRef,
    connectionString,
    schemas = ['public'],
    search,
    limit = 100,
    sort,
    filterTypes,
  }: Omit<EntityTypesVariables, 'page'>
) {
  return client.prefetchInfiniteQuery(
    entityTypeKeys.list(projectRef, { schemas, search, sort, limit, filterTypes }),
    ({ signal, pageParam }) =>
      getEntityTypes(
        {
          projectRef,
          connectionString,
          schemas,
          search,
          limit,
          page: pageParam,
          sort,
          filterTypes,
        },
        signal
      )
  )
}
