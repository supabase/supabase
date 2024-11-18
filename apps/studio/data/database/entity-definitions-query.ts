import { useQuery, UseQueryOptions } from '@tanstack/react-query'
import { executeSql, ExecuteSqlError } from '../sql/execute-sql-query'
import { CREATE_PG_GET_TABLEDEF_SQL } from './database-query-constants'
import { databaseKeys } from './keys'

export const getEntityDefinitionsSql = ({
  schemas,
  limit = 100,
}: {
  schemas: string[]
  limit?: number
}) => {
  const sql = /* SQL */ `
${CREATE_PG_GET_TABLEDEF_SQL}

with records as (
  select
    c.oid::int8 as "id",
    case c.relkind
      when 'r' then pg_temp.pg_get_tabledef(
        concat(nc.nspname),
        concat(c.relname),
        false,
        'FKEYS_INTERNAL',
        'NO_TRIGGERS'
      )
      when 'v' then concat(
        'create view ', concat(nc.nspname, '.', c.relname), ' as',
        pg_get_viewdef(concat(nc.nspname, '.', c.relname), true)
      )
      when 'm' then concat(
        'create materialized view ', concat(nc.nspname, '.', c.relname), ' as',
        pg_get_viewdef(concat(nc.nspname, '.', c.relname), true)
      )
      when 'f' then concat('create foreign table ', nc.nspname, '.', c.relname, ' ( ... )')
      when 'p' then pg_temp.pg_get_tabledef(
        concat(nc.nspname),
        concat(c.relname),
        false,
        'FKEYS_INTERNAL',
        'NO_TRIGGERS'
      )
    end as "sql"
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
    and nc.nspname IN (${schemas.map((schema) => `'${schema}'`).join(', ')})
  order by c.relname asc
  limit ${limit}
  offset 0
)
select
  jsonb_build_object(
    'definitions', coalesce(jsonb_agg(
      jsonb_build_object(
        'id', r.id,
        'sql', r.sql
      )
    ), '[]'::jsonb)
  ) "data"
from records r;
  `.trim()

  return sql
}

export type EntityDefinitionsVariables = {
  limit?: number
  projectRef?: string
  connectionString?: string
  schemas: string[]
}

export async function getEntityDefinitions(
  { projectRef, connectionString, schemas, limit }: EntityDefinitionsVariables,
  signal?: AbortSignal
) {
  const sql = getEntityDefinitionsSql({ schemas, limit })
  const { result } = await executeSql(
    {
      projectRef,
      connectionString,
      sql,
      queryKey: ['entity-definitions', schemas],
    },
    signal
  )

  return result[0].data.definitions
}

type EntityDefinition = { id: number; sql: string }
export type EntityDefinitionsData = EntityDefinition[]
export type EntityDefinitionsError = ExecuteSqlError

export const useEntityDefinitionsQuery = <TData = EntityDefinitionsData>(
  { projectRef, connectionString, schemas, limit }: EntityDefinitionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<EntityDefinitionsData, EntityDefinitionsError, TData> = {}
) =>
  useQuery<EntityDefinitionsData, EntityDefinitionsError, TData>(
    databaseKeys.entityDefinitions(projectRef, schemas),
    ({ signal }) => getEntityDefinitions({ projectRef, connectionString, schemas, limit }, signal),
    {
      enabled: enabled && typeof projectRef !== 'undefined' && schemas.length > 0,
      ...options,
    }
  )
