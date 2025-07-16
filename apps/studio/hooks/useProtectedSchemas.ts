import {
  WRAPPER_HANDLERS,
  WRAPPERS,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import {
  formatWrapperTables,
  wrapperMetaComparator,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { uniq } from 'lodash'
import { useMemo } from 'react'

import { QUEUES_SCHEMA } from 'data/database-queues/database-queues-toggle-postgrest-mutation'

/**
 * A list of system schemas that users should not interact with
 */
export const INTERNAL_SCHEMAS = [
  'auth',
  'cron',
  'extensions',
  'information_schema',
  'net',
  'pgsodium',
  'pgsodium_masks',
  'pgbouncer',
  'pgtle',
  'realtime',
  'storage',
  'supabase_functions',
  'supabase_migrations',
  'vault',
  'graphql',
  'graphql_public',
  QUEUES_SCHEMA,
]

/**
 * Get the list of schemas used by IcebergFDWs
 */
const useIcebergFdwSchemasQuery = () => {
  const { project } = useProjectContext()
  const result = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const schemas = useMemo(() => {
    const icebergFDWs = result.data
      ?.filter((wrapper) =>
        wrapperMetaComparator(
          { handlerName: WRAPPER_HANDLERS.ICEBERG, server: { options: [] } },
          wrapper
        )
      )
      .filter((fdw) => fdw.name.endsWith('_fdw'))

    const icebergWrapperMeta = WRAPPERS.find((wrapper) => wrapper.name === 'iceberg_wrapper')

    const wrapperTables =
      icebergFDWs?.map((fdw) => formatWrapperTables(fdw, icebergWrapperMeta)).flat() ?? []

    return uniq([...wrapperTables?.map((t) => t.schema_name)])
  }, [result.data])

  return { ...result, data: schemas }
}

/**
 * Returns a list of schemas that are protected by Supabase (internal schemas or schemas used by Iceberg FDWs).
 */
export const useProtectedSchemas = ({
  withoutSchemas = [],
}: { withoutSchemas?: string[] } = {}) => {
  // Stabilize the withoutSchemas array to prevent unnecessary re-computations
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableWithoutSchemas = useMemo(() => withoutSchemas, [JSON.stringify(withoutSchemas)])

  const result = useIcebergFdwSchemasQuery()

  const schemas = useMemo(() => {
    const schemas = uniq([...INTERNAL_SCHEMAS, ...result.data])
    return schemas.filter((schema) => !stableWithoutSchemas.includes(schema))
  }, [result.data, stableWithoutSchemas])

  return { ...result, data: schemas }
}

/**
 * Returns whether a given schema is protected by Supabase (internal schema or schema used by Iceberg FDWs).
 */
export const useIsProtectedSchema = ({
  schema,
  excludedSchemas = [],
}: {
  schema: string
  excludedSchemas?: string[]
}):
  | { isSchemaLocked: false; reason: undefined }
  | { isSchemaLocked: true; reason: 'FDW' | 'Internal' } => {
  const { data: fdwSchemas } = useIcebergFdwSchemasQuery()

  const isInternalSchema = INTERNAL_SCHEMAS.filter((s) => !excludedSchemas.includes(s)).includes(
    schema
  )
  const isFdwSchema = fdwSchemas?.includes(schema)

  if (isInternalSchema || isFdwSchema) {
    return {
      isSchemaLocked: true,
      reason: isFdwSchema ? 'FDW' : 'Internal',
    }
  }
  return { isSchemaLocked: false, reason: undefined }
}
