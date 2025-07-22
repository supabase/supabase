import { uniq } from 'lodash'
import { useMemo } from 'react'

import {
  WRAPPER_HANDLERS,
  WRAPPERS,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import {
  formatWrapperTables,
  wrapperMetaComparator,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { QUEUES_SCHEMA } from 'data/database-queues/database-queues-toggle-postgrest-mutation'
import { useFDWsQuery } from 'data/fdw/fdws-query'

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
  excludeSchemas = [],
}: { excludeSchemas?: string[] } = {}) => {
  // Stabilize the excludeSchemas array to prevent unnecessary re-computations
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableExcludeSchemas = useMemo(() => excludeSchemas, [JSON.stringify(excludeSchemas)])

  const result = useIcebergFdwSchemasQuery()

  const schemas = useMemo<{ name: string; type: 'fdw' | 'internal' }[]>(() => {
    const internalSchemas = INTERNAL_SCHEMAS.map((s) => ({ name: s, type: 'internal' as const }))
    const fdwSchemas = result.data?.map((s) => ({ name: s, type: 'fdw' as const }))

    const schemas = uniq([...internalSchemas, ...fdwSchemas])
    return schemas.filter((schema) => !stableexcludeSchemas.includes(schema.name))
  }, [result.data, stableexcludeSchemas])

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
  | { isSchemaLocked: true; reason: 'fdw' | 'internal' } => {
  const { data: schemas } = useProtectedSchemas({ excludeSchemas: excludedSchemas })

  const foundSchema = schemas.find((s) => s.name === schema)

  if (foundSchema) {
    return {
      isSchemaLocked: true,
      reason: foundSchema.type,
    }
  }
  return { isSchemaLocked: false, reason: undefined }
}
