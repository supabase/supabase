import { UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

const getPrivilegesQuery = (params: { schema: string; table: string; role: string }) =>
  /* SQL */ `
  -- Column-specific privileges
  WITH column_privileges AS (
    SELECT
        attrelid AS table_oid,
        attname AS column_name,
        (aclexplode(attacl)).grantee AS grantee_id,
        (aclexplode(attacl)).privilege_type AS privilege_type
    FROM
        pg_attribute
  ),
  column_specific_privileges AS (
    SELECT
        ns.nspname AS schema_name,
        r.rolname AS role_name,
        tbl.relname AS entity_name,
        cols.column_name,
        tbl.relkind AS entity_type,
        cols.privilege_type,
        tbl.oid AS table_oid
    FROM
        column_privileges cols
    JOIN
        pg_catalog.pg_roles r ON r.oid = cols.grantee_id
    JOIN
        pg_catalog.pg_class tbl ON tbl.oid = cols.table_oid
    JOIN
        pg_catalog.pg_namespace ns ON ns.oid = tbl.relnamespace
  ),
  data AS (
    -- Non-column-specific privileges
    SELECT
        c.table_schema AS schema_name,
        r.grantee AS role_name,
        tbl.relname AS entity_name,
        tbl.relkind AS entity_type,
        c.column_name,
        r.privilege_type,
        false AS is_column_specific
    FROM
        information_schema.role_table_grants r
    JOIN
        information_schema.columns c ON c.table_schema = r.table_schema AND c.table_name = r.table_name
    JOIN
        pg_catalog.pg_class tbl ON tbl.oid = (quote_ident(c.table_schema) || '.' || quote_ident(r.table_name))::regclass

    -- Combine column-specific and non-column-specific privileges
    UNION ALL

    SELECT
        cs.schema_name,
        cs.role_name,
        cs.entity_name,
        cs.entity_type,
        cs.column_name,
        cs.privilege_type,
        true AS is_column_specific
    FROM
        column_specific_privileges cs
    ORDER BY
        role_name,
        schema_name,
        entity_name,
        column_name,
        privilege_type
    ),
    aggregated AS (
      SELECT
        schema_name,
        entity_name AS table_name,
        role_name,
        column_name,
        privilege_type,
        BOOL_OR(NOT is_column_specific) AS is_global,
        BOOL_OR(is_column_specific) AS is_column_specific
      FROM
        data
      GROUP BY
        schema_name,
        entity_name,
        role_name,
        column_name,
        privilege_type
  ),
  json_privileges AS (
    SELECT
      schema_name,
      table_name,
      role_name,
      privilege_type,
      jsonb_agg(jsonb_build_object('name', column_name, 'isGlobal', is_global, 'isColumnSpecific', is_column_specific)) AS columns
    FROM
      aggregated
    GROUP BY
      schema_name,
      table_name,
      role_name,
      privilege_type
  )
  SELECT
    jsonb_object_agg(privilege_type, columns) AS result_json
  FROM
    json_privileges
  WHERE
    schema_name = '${params.schema}'
    AND role_name = '${params.role}'
    AND table_name = '${params.table}';
`.trim()

export type PrivilegesVariables = {
  schema: string
  table: string
  role: string
  projectRef?: string
  connectionString?: string
}

export type PrivilegeColumn = {
  name: string
  isGlobal: boolean
  isColumnSpecific: boolean
}

export type PrivilegesDataResponse = {
  result: [{ result_json: PrivilegesData | null }]
}

export type PrivilegesData = Record<string, PrivilegeColumn[]>

export type PrivilegesError = unknown

export const getPrivilegesQueryKey = ({ schema, table, role }: PrivilegesVariables) => [
  'privileges',
  schema,
  table,
  role,
]

export const usePrivilegesQuery = <TData extends PrivilegesData = PrivilegesData>(
  { projectRef, connectionString, schema, table, role }: PrivilegesVariables,
  options: UseQueryOptions<ExecuteSqlData, PrivilegesError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: getPrivilegesQuery({ schema, table, role }),
      queryKey: getPrivilegesQueryKey({ schema, table, role }),
    },
    {
      select(data) {
        return data.result[0].result_json ?? {}
      },
      ...options,
    }
  )
}

export const usePrivilegesQueryPrefetch = () => {
  const prefetch = useExecuteSqlPrefetch()

  return useCallback(
    ({ projectRef, connectionString, schema, table, role }: PrivilegesVariables) =>
      prefetch({
        projectRef,
        connectionString,
        sql: getPrivilegesQuery({ schema, table, role }),
        queryKey: getPrivilegesQueryKey({ schema, table, role }),
      }),
    [prefetch]
  )
}
