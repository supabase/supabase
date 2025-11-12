import { uniq } from 'lodash'
import { useMemo } from 'react'

import {
  SUPABASE_TARGET_SCHEMA_OPTION,
  WRAPPERS,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import {
  convertKVStringArrayToJson,
  wrapperMetaComparator,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { QUEUES_SCHEMA } from 'data/database-queues/database-queues-toggle-postgrest-mutation'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { useSelectedProjectQuery } from './misc/useSelectedProject'

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
 * Get the list of schemas used by FDWs like Iceberg, S3 Vectors, etc.
 */
const useFdwSchemasQuery = () => {
  const { data: project } = useSelectedProjectQuery()
  const result = useFDWsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  // Find all wrappers that create a schema for their data.
  const FDWsWithSchemas = useMemo(
    () =>
      WRAPPERS.filter((wrapper) =>
        wrapper.server.options.some((option) => option.name === SUPABASE_TARGET_SCHEMA_OPTION.name)
      ),
    []
  )

  const schemas = useMemo(() => {
    const icebergFDWs =
      result.data?.filter((wrapper) =>
        FDWsWithSchemas.some((w) => wrapperMetaComparator(w, wrapper))
      ) ?? []

    const fdwSchemas = icebergFDWs
      .map((fdw) => convertKVStringArrayToJson(fdw.server_options))
      .map((options) => options['supabase_target_schema'])
      .flatMap((s) => s?.split(','))
      .filter(Boolean)

    return uniq(fdwSchemas)
  }, [result.data, FDWsWithSchemas])

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

  const result = useFdwSchemasQuery()

  const schemas = useMemo<{ name: string; type: 'fdw' | 'internal' }[]>(() => {
    const internalSchemas = INTERNAL_SCHEMAS.map((s) => ({ name: s, type: 'internal' as const }))
    const icebergFdwSchemas = result.data?.map((s) => ({ name: s, type: 'fdw' as const }))

    const schemas = uniq([...internalSchemas, ...icebergFdwSchemas])
    return schemas.filter((schema) => !stableExcludeSchemas.includes(schema.name))
  }, [result.data, stableExcludeSchemas])

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
