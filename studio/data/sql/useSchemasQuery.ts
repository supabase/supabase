import { UseQueryOptions } from '@tanstack/react-query'
import {
  ExecuteQueryData,
  useExecuteQueryPrefetch,
  useExecuteQueryQuery,
} from './useExecuteQueryQuery'

export const SCHEMAS_QUERY = /* SQL */ `
SELECT nspname as name
FROM pg_namespace
WHERE
  nspname not in ('information_schema', 'pg_catalog', 'pg_toast')
  AND nspname not like 'pg_temp_%'
  AND nspname not like 'pg_toast_temp_%'
  AND has_schema_privilege(oid, 'CREATE, USAGE')
ORDER BY nspname;
`

export type SchemasVariables = {
  projectRef?: string
  connectionString?: string
}

export type SchemasData = ExecuteQueryData
export type SchemasError = unknown

export const useSchemasQuery = <TData = SchemasData>(
  { projectRef, connectionString }: SchemasVariables,
  options: UseQueryOptions<SchemasData, SchemasError, TData> = {}
) => useExecuteQueryQuery({ projectRef, connectionString, sql: SCHEMAS_QUERY }, options)

export const useSchemasPrefetch = ({ projectRef, connectionString }: SchemasVariables) => {
  return useExecuteQueryPrefetch({ projectRef, connectionString, sql: SCHEMAS_QUERY })
}
