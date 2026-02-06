import { useMemo } from 'react'

import {
  parseDbSchemaString,
  useProjectPostgrestConfigQuery,
} from 'data/config/project-postgrest-config-query'

type UseIsSchemaExposedParams = {
  projectRef?: string
  schemaName?: string
}

type UseIsSchemaExposedOptions = {
  enabled?: boolean
}

export type UseIsSchemaExposedReturn =
  | {
      status: 'pending'
      data: undefined
      isPending: true
      isError: false
      isSuccess: false
    }
  | {
      status: 'error'
      data: undefined
      isPending: false
      isError: true
      isSuccess: false
    }
  | {
      status: 'success'
      data: boolean
      isPending: false
      isError: false
      isSuccess: true
    }

export const useIsSchemaExposed = (
  { projectRef, schemaName }: UseIsSchemaExposedParams,
  { enabled = true }: UseIsSchemaExposedOptions = {}
): UseIsSchemaExposedReturn => {
  const shouldQueryConfig = enabled && !!projectRef && !!schemaName
  const {
    data: dbSchemaString,
    isPending: isConfigPending,
    isError: isConfigError,
  } = useProjectPostgrestConfigQuery(
    { projectRef },
    { enabled: shouldQueryConfig, select: ({ db_schema }) => db_schema }
  )

  const exposedSchemas = useMemo(() => {
    if (!dbSchemaString) return []
    return parseDbSchemaString(dbSchemaString)
  }, [dbSchemaString])

  if (!shouldQueryConfig || isConfigPending) {
    return { status: 'pending', data: undefined, isPending: true, isError: false, isSuccess: false }
  }

  if (isConfigError) {
    return { status: 'error', data: undefined, isPending: false, isError: true, isSuccess: false }
  }

  return {
    status: 'success',
    data: exposedSchemas.includes(schemaName),
    isPending: false,
    isError: false,
    isSuccess: true,
  }
}
