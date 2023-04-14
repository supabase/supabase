import { UseQueryOptions } from '@tanstack/react-query'
import { useCallback } from 'react'
import { ExecuteSqlData, useExecuteSqlPrefetch, useExecuteSqlQuery } from '../sql/execute-sql-query'

const sql = /* SQL */ `
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
      BOOL_AND(is_column_specific) AS is_column_specific,
      ARRAY_AGG(privilege_type) AS privileges
    FROM
      data
    GROUP BY
      schema_name,
      entity_name,
      role_name,
      column_name
  ),
  json_columns AS (
    SELECT
      schema_name,
      table_name,
      role_name,
      jsonb_agg(jsonb_build_object('name', column_name, 'isColumnSpecific', is_column_specific, 'privileges', privileges)) AS columns
    FROM
      aggregated
    GROUP BY
      schema_name,
      table_name,
      role_name
  ),
  json_tables AS (
    SELECT
      schema_name,
      role_name,
      jsonb_object_agg(table_name, columns) AS tables
    FROM
      json_columns
    GROUP BY
      schema_name,
      role_name
  ),
  json_roles AS (
    SELECT
      schema_name,
      jsonb_object_agg(role_name, tables) AS roles
    FROM
      json_tables
    GROUP BY
      schema_name
  )
  SELECT
    jsonb_object_agg(schema_name, roles) AS result_json
  FROM
    json_roles;
`.trim()

export type PrivilegesVariables = {
  projectRef?: string
  connectionString?: string
}

export type ColumnPrivileges = {
  name: string
  isColumnSpecific: boolean
  privileges: string[]
}

export type PrivilegesDataResponse = {
  result: [{ result_json: PrivilegesData }]
}

export type PrivilegesData = Record<string, Record<string, Record<string, ColumnPrivileges[]>>>

export type PrivilegesError = unknown

export const usePrivilegesQuery = <TData extends PrivilegesData = PrivilegesData>(
  { projectRef, connectionString }: PrivilegesVariables,
  options: UseQueryOptions<ExecuteSqlData, PrivilegesError, TData> = {}
) => {
  return useExecuteSqlQuery(
    {
      projectRef,
      connectionString,
      sql: sql,
      queryKey: ['privileges'],
    },
    {
      select(data) {
        return data.result[0].result_json
      },
      ...options,
    }
  )
}

export const usePrivilegesQueryPrefetch = () => {
  const prefetch = useExecuteSqlPrefetch()

  return useCallback(
    ({ projectRef, connectionString }: PrivilegesVariables) =>
      prefetch({
        projectRef,
        connectionString,
        sql: sql,
        queryKey: ['privileges'],
      }),
    [prefetch]
  )
}
