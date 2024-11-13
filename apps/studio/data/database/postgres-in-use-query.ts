import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

import { useTablesQuery } from 'data/tables/tables-query'
import { useSchemasQuery } from './schemas-query'

/**
 * Hook to determine if Postgres is being used in a project.
 * Postgres is considered "in use" if either:
 * 1. Custom schemas exist (schemas other than 'public')
 * 2. The public schema contains tables or views
 */
const DEFAULT_SCHEMAS = [
  'public',
  'graphql',
  'graphql_public',
  'vault',
  'pgsodium_masks',
  'pgsodium',
  'auth',
  'storage',
  'realtime',
  'extensions',
  'pgbouncer',
]

export const usePostgresInUse = () => {
  const { project } = useProjectContext()

  // Query for all schemas in the project
  const {
    data: schemas,
    isLoading: isLoadingSchemas,
    isError: isSchemasError,
    error: schemasError,
    isSuccess: isSchemasSuccess,
    refetch: refetchSchemas,
  } = useSchemasQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // Query for tables specifically in the public schema
  const {
    data: tables,
    isLoading: isLoadingTables,
    isError: isTablesError,
    error: tablesError,
    isSuccess: isTablesSuccess,
    refetch: refetchTables,
  } = useTablesQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
    schema: 'public',
  })

  console.log('Schemas:', schemas)
  console.log('Tables:', tables)

  // Debug what we're getting
  console.log('Tables query result:', {
    isLoadingTables,
    tableCount: tables?.length,
    firstFewTables: tables?.slice(0, 3),
  })

  // Check if any schemas exist other than 'public'
  const hasCustomSchemas = (schemas ?? []).some((schema) => !DEFAULT_SCHEMAS.includes(schema.name))

  // Check if the public schema has any tables or views
  const hasPublicSchemaObjects = (tables ?? []).length > 0

  return {
    // Computed values indicating Postgres usage
    isInUse: hasCustomSchemas || hasPublicSchemaObjects,
    hasCustomSchemas,
    hasPublicSchemaObjects,

    // Combined states from both queries
    isLoading: isLoadingSchemas || isLoadingTables,
    isError: isSchemasError || isTablesError,
    error: schemasError || tablesError,
    isSuccess: isSchemasSuccess && isTablesSuccess,

    // Individual query states
    schemas: {
      data: schemas,
      isLoading: isLoadingSchemas,
      isError: isSchemasError,
      error: schemasError,
      isSuccess: isSchemasSuccess,
      refetch: refetchSchemas,
    },
    tables: {
      data: tables,
      isLoading: isLoadingTables,
      isError: isTablesError,
      error: tablesError,
      isSuccess: isTablesSuccess,
      refetch: refetchTables,
    },
  }
}
