import { useMemo } from 'react'

import type { ConnectionVars } from 'data/common.types'
import { useProjectPostgrestConfigQuery } from 'data/config/project-postgrest-config-query'
import { isApiAccessRole, isApiPrivilegeType, type ApiPrivilegesByRole } from 'lib/data-api-types'
import type { Prettify } from 'lib/type-helpers'
import type { UseCustomQueryOptions } from 'types'
import {
  useTablePrivilegesQuery,
  type TablePrivilegesData,
  type TablePrivilegesError,
} from './table-privileges-query'

// The contents of this array are never used, so any will allow
// it to be used anywhere an array of any type is required.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STABLE_EMPTY_ARRAY: any[] = []
const STABLE_EMPTY_OBJECT = {}

/**
 * Parses the exposed schema string returned from PostgREST config.
 *
 * @param schemaString - e.g., `public,graphql_public`
 */
const parseDbSchemaString = (schemaString: string): string[] => {
  return schemaString
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
}

const getApiPrivilegesByRole = (
  privileges: TablePrivilegesData[number]['privileges']
): ApiPrivilegesByRole => {
  const privilegesByRole: ApiPrivilegesByRole = {
    anon: [],
    authenticated: [],
  }

  privileges.forEach((privilege) => {
    const { grantee, privilege_type } = privilege
    if (isApiAccessRole(grantee) && isApiPrivilegeType(privilege_type)) {
      privilegesByRole[grantee].push(privilege_type)
    }
  })

  return privilegesByRole
}

const mapPrivilegesByTableName = (
  privileges: TablePrivilegesData | undefined,
  schemaName: string,
  tableNames: Set<string>
): Record<string, ApiPrivilegesByRole> => {
  if (!privileges) return {}

  const result: Record<string, ApiPrivilegesByRole> = {}

  privileges.forEach((entry) => {
    if (entry.schema !== schemaName) return
    if (!tableNames.has(entry.name)) return
    result[entry.name] = getApiPrivilegesByRole(entry.privileges)
  })

  return result
}

export type UseTableApiAccessQueryParams = Prettify<
  ConnectionVars & {
    schemaName: string
    tableNames: string[]
  }
>

export type TableApiAccessData =
  | {
      hasApiAccess: true
      privileges: ApiPrivilegesByRole
    }
  | {
      hasApiAccess: false
    }

export type TableApiAccessMap = Record<string, TableApiAccessData>

export type UseTableApiAccessQueryReturn =
  | {
      data: TableApiAccessMap
      isSuccess: true
      isPending: false
      isError: false
    }
  | {
      data: undefined
      isSuccess: false
      isPending: true
      isError: false
    }
  | {
      data: undefined
      isSuccess: false
      isPending: false
      isError: true
    }

export const useTableApiAccessQuery = (
  {
    projectRef,
    connectionString,
    schemaName,
    tableNames = STABLE_EMPTY_ARRAY,
  }: UseTableApiAccessQueryParams,
  {
    enabled = true,
    ...options
  }: { enabled?: boolean } & Omit<
    UseCustomQueryOptions<TablePrivilegesData, TablePrivilegesError>,
    'enabled'
  > = {}
): UseTableApiAccessQueryReturn => {
  const {
    data: dbSchemaString,
    isPending: isConfigPending,
    isError: isConfigError,
  } = useProjectPostgrestConfigQuery(
    { projectRef },
    { enabled, select: ({ db_schema }) => db_schema }
  )
  const exposedSchemas = useMemo((): string[] => {
    if (!dbSchemaString) return []
    return parseDbSchemaString(dbSchemaString)
  }, [dbSchemaString])

  const uniqueTableNames = useMemo(() => {
    return new Set(
      tableNames.filter((tableName) => typeof tableName === 'string' && tableName.length > 0)
    )
  }, [tableNames])
  const hasTables = uniqueTableNames.size > 0
  const isSchemaExposed = exposedSchemas.includes(schemaName)
  const enablePrivilegesQuery = enabled && isSchemaExposed && hasTables

  const {
    data: privileges,
    isPending: isPrivilegesPending,
    isError: isPrivilegesError,
  } = useTablePrivilegesQuery(
    { projectRef, connectionString },
    { enabled: enablePrivilegesQuery, ...options }
  )

  const result: UseTableApiAccessQueryReturn = useMemo(() => {
    const isPending = isConfigPending || (enablePrivilegesQuery && isPrivilegesPending)
    if (isPending) {
      return {
        data: undefined,
        isSuccess: false,
        isPending: true,
        isError: false,
      }
    }

    const isError = isConfigError || (enablePrivilegesQuery && isPrivilegesError)
    if (isError) {
      return {
        data: undefined,
        isSuccess: false,
        isPending: false,
        isError: true,
      }
    }

    if (!hasTables) {
      return {
        data: STABLE_EMPTY_OBJECT,
        isSuccess: true,
        isPending: false,
        isError: false,
      }
    }

    const resultData: TableApiAccessMap = {}
    const tablePrivilegesByName = isSchemaExposed
      ? mapPrivilegesByTableName(privileges, schemaName, uniqueTableNames)
      : {}

    uniqueTableNames.forEach((tableName) => {
      if (!isSchemaExposed) {
        resultData[tableName] = { hasApiAccess: false }
        return
      }

      const tablePrivileges = tablePrivilegesByName[tableName] ?? { anon: [], authenticated: [] }
      const hasAnonOrAuthenticatedPrivileges =
        tablePrivileges.anon.length > 0 || tablePrivileges.authenticated.length > 0

      resultData[tableName] = hasAnonOrAuthenticatedPrivileges
        ? {
            hasApiAccess: true,
            privileges: tablePrivileges,
          }
        : { hasApiAccess: false }
    })

    return {
      data: resultData,
      isSuccess: true,
      isPending: false,
      isError: false,
    }
  }, [
    enablePrivilegesQuery,
    hasTables,
    isConfigError,
    isConfigPending,
    isPrivilegesError,
    isPrivilegesPending,
    isSchemaExposed,
    privileges,
    schemaName,
    uniqueTableNames,
  ])

  return result
}
