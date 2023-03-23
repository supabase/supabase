import { UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'
import { ENTITY_TYPE } from './entity-type-constants'

type EntityTypeArgs = {
  id?: number
}

export const entityTypeSqlQuery = ({ id }: EntityTypeArgs) => {
  const sql = /* SQL */ `
    select
      c.oid::int8 as "id",
      nc.nspname as "schema",
      c.relname as "name",
      c.relkind as "type",
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
      and c.oid = '${id}'
    limit 1;
  `

  return sql
}

export type Entity = {
  id: number
  schema: string
  name: string
  type: ENTITY_TYPE
  comment: string | null
}

export type EntityType = Entity | null

export type EntityTypeVariables = EntityTypeArgs & {
  projectRef?: string
  connectionString?: string
}

export type EntityTypeData = EntityType
export type EntityTypeError = unknown

export const useEntityTypeQuery = <TData extends EntityTypeData = EntityTypeData>(
  { projectRef, connectionString, id, ...args }: EntityTypeVariables,
  { enabled, ...options }: UseQueryOptions<ExecuteSqlData, EntityTypeError, TData> = {}
) =>
  useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: entityTypeSqlQuery({ id, ...args }),
      queryKey: ['entity-type', id],
    },
    {
      select(data) {
        return (data.result[0] ?? null) as TData
      },
      enabled:
        enabled && typeof projectRef !== 'undefined' && typeof id !== 'undefined' && !isNaN(id),
      ...options,
    }
  )

/**
 * useEntityTypePrefetch is used for prefetching table rows. For example, starting a query loading before a page is navigated to.
 *
 * @example
 * const prefetch = useEntityTypePrefetch()
 *
 * return (
 *   <Link onMouseEnter={() => prefetch({ ...args })}>
 *     Start loading on hover
 *   </Link>
 * )
 */
export const useEntityTypePrefetch = () => {
  const prefetch = useExecuteSqlPrefetch()

  return useCallback(
    ({ projectRef, connectionString, id, ...args }: EntityTypeVariables) =>
      prefetch({
        projectRef,
        connectionString,
        sql: entityTypeSqlQuery({ id, ...args }),
        queryKey: ['entity-type', id],
      }),
    [prefetch]
  )
}
