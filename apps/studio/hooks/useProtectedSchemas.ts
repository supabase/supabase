import {
  SUPABASE_TARGET_SCHEMA_OPTION,
  WRAPPERS,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.constants'
import {
  convertKVStringArrayToJson,
  wrapperMetaComparator,
} from 'components/interfaces/Integrations/Wrappers/Wrappers.utils'
import { useFDWsQuery } from 'data/fdw/fdws-query'
import { uniq, uniqBy } from 'lodash'
import { useMemo } from 'react'

import { useSelectedProjectQuery } from './misc/useSelectedProject'
import { QUEUES_SCHEMA } from '@/data/database-queues/database-queues-toggle-postgrest-mutation'

/**
 * A list of system schemas that users should not interact with
 */
export const INTERNAL_SCHEMAS = [
  'auth',
  'cron',
  'etl',
  'extensions',
  'information_schema',
  'net',
  'pgsodium',
  'pgsodium_masks',
  'pgbouncer',
  'pgtle',
  'pgmq',
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

    const fdwSchemas = icebergFDWs.map((fdw) => {
      const schemaOption =
        convertKVStringArrayToJson(fdw.server_options ?? [])['supabase_target_schema'] ?? ''

      const schemas = uniq(schemaOption.split(',').filter(Boolean))

      return {
        serverName: fdw.server_name,
        type: fdw.handler.replace('_fdw_handler', ''),
        schemas,
      }
    })

    return fdwSchemas
  }, [result.data, FDWsWithSchemas])

  return { ...result, data: schemas }
}

type ProtectedSchema = {
  name: string
  type: 'fdw' | 'internal'
  fdwType?: string
  serverName?: string
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

  const schemas = useMemo<ProtectedSchema[]>(() => {
    const internalSchemas = INTERNAL_SCHEMAS.map((s) => ({ name: s, type: 'internal' as const }))
    const fdwSchemas = result.data?.flatMap((s) =>
      s.schemas.map((schema) => ({
        name: schema,
        type: 'fdw' as const,
        fdwType: s.type,
        serverName: s.serverName,
      }))
    )

    const schemas = uniqBy([...internalSchemas, ...fdwSchemas], (s) => s.name)
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
  | { isSchemaLocked: false; reason: undefined; fdwType: undefined }
  | { isSchemaLocked: true; reason: 'internal' | 'fdw'; fdwType: string | undefined } => {
  const { data: schemas } = useProtectedSchemas({ excludeSchemas: excludedSchemas })

  const foundSchema = schemas.find((s) => s.name === schema)

  if (foundSchema) {
    return {
      isSchemaLocked: true,
      reason: foundSchema.type,
      fdwType: foundSchema.fdwType,
    }
  }
  return { isSchemaLocked: false, reason: undefined, fdwType: undefined }
}
