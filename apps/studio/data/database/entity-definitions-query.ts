import { UseQueryOptions } from '@tanstack/react-query'
import { ExecuteSqlData, ExecuteSqlError, useExecuteSqlQuery } from '../sql/execute-sql-query'
import { CREATE_PG_GET_TABLEDEF_SQL } from './database-query-constants'
import { databaseKeys } from './keys'

export const getEntityDefinitionsQuery = (schemas: string[], limit = 100) => {
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
      when 'f' then pg_temp.pg_get_tabledef(
        concat(nc.nspname),
        concat(c.relname),
        false,
        'FKEYS_INTERNAL',
        'NO_TRIGGERS'
      )
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

type EntityDefinition = { id: number; sql: string }
export type EntityDefinitionsData = EntityDefinition[]
export type EntityDefinitionsError = ExecuteSqlError

export const useEntityDefinitionsQuery = <
  TData extends EntityDefinitionsData = EntityDefinitionsData,
>(
  { schemas, limit, projectRef, connectionString }: EntityDefinitionsVariables,
  {
    enabled = true,
    ...options
  }: UseQueryOptions<ExecuteSqlData, EntityDefinitionsError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getEntityDefinitionsQuery(schemas, limit),
      queryKey: databaseKeys.entityDefinitions(projectRef, schemas),
    },
    {
      select(data) {
        return data.result[0].data.definitions
      },
      enabled: enabled && schemas.length > 0,
      ...options,
    }
  )
}
