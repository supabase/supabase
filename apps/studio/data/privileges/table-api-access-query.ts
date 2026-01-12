import { useMemo } from 'react'

import type { ConnectionVars } from 'data/common.types'
import { useIsSchemaExposed } from 'hooks/misc/useIsSchemaExposed'
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

export type DataApiAccessType = 'none' | 'exposed-schema-no-grants' | 'access'

export type TableApiAccessData =
  | {
      apiAccessType: 'access'
      privileges: ApiPrivilegesByRole
    }
  | {
      apiAccessType: 'none' | 'exposed-schema-no-grants'
    }

export type TableApiAccessMap = Prettify<Record<string, TableApiAccessData>>

export type UseTableApiAccessQueryReturn =
  | {
      data: TableApiAccessMap
      status: 'success'
      isSuccess: true
      isPending: false
      isError: false
    }
  | {
      data: undefined
      status: 'pending'
      isSuccess: false
      isPending: true
      isError: false
    }
  | {
      data: undefined
      status: 'error'
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
  const uniqueTableNames = useMemo(() => {
    return new Set(
      tableNames.filter((tableName) => typeof tableName === 'string' && tableName.length > 0)
    )
  }, [tableNames])
  const hasTables = uniqueTableNames.size > 0

  const schemaExposureStatus = useIsSchemaExposed({ projectRef, schemaName }, { enabled })
  const isSchemaExposed = schemaExposureStatus.isSuccess && schemaExposureStatus.data === true

  const enablePrivilegesQuery = enabled && hasTables
  const privilegeStatus = useTablePrivilegesQuery(
    { projectRef, connectionString },
    { enabled: enablePrivilegesQuery, ...options }
  )

  const result: UseTableApiAccessQueryReturn = useMemo(() => {
    const isPending =
      !enabled ||
      schemaExposureStatus.status === 'pending' ||
      (enablePrivilegesQuery && privilegeStatus.isPending)
    if (isPending) {
      return {
        data: undefined,
        status: 'pending',
        isSuccess: false,
        isPending: true,
        isError: false,
      }
    }

    const isError =
      schemaExposureStatus.status === 'error' || (enablePrivilegesQuery && privilegeStatus.isError)
    if (isError) {
      return {
        data: undefined,
        status: 'error',
        isSuccess: false,
        isPending: false,
        isError: true,
      }
    }

    if (!hasTables) {
      return {
        data: STABLE_EMPTY_OBJECT,
        status: 'success',
        isSuccess: true,
        isPending: false,
        isError: false,
      }
    }

    const resultData: TableApiAccessMap = {}
    const tablePrivilegesByName = isSchemaExposed
      ? mapPrivilegesByTableName(privilegeStatus.data, schemaName, uniqueTableNames)
      : {}

    uniqueTableNames.forEach((tableName) => {
      if (!isSchemaExposed) {
        resultData[tableName] = { apiAccessType: 'none' }
        return
      }

      const tablePrivileges = tablePrivilegesByName[tableName] ?? { anon: [], authenticated: [] }
      const hasAnonOrAuthenticatedPrivileges =
        tablePrivileges.anon.length > 0 || tablePrivileges.authenticated.length > 0

      resultData[tableName] = hasAnonOrAuthenticatedPrivileges
        ? {
            apiAccessType: 'access',
            privileges: tablePrivileges,
          }
        : { apiAccessType: 'exposed-schema-no-grants' }
    })

    return {
      data: resultData,
      status: 'success',
      isSuccess: true,
      isPending: false,
      isError: false,
    }
  }, [
    enabled,
    enablePrivilegesQuery,
    hasTables,
    schemaExposureStatus.status,
    isSchemaExposed,
    privilegeStatus.isPending,
    privilegeStatus.isError,
    privilegeStatus.data,
    schemaName,
    uniqueTableNames,
  ])

  return result
}
