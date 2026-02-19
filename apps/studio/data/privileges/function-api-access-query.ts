import { useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'

import {
  functionPrivilegesQueryOptions,
  type FunctionPrivilegesData,
  type FunctionPrivilegesError,
} from './function-privileges-query'
import type { ConnectionVars } from '@/data/common.types'
import { useIsSchemaExposed } from '@/hooks/misc/useIsSchemaExposed'
import type { Prettify } from '@/lib/type-helpers'
import type { UseCustomQueryOptions } from '@/types'

// The contents of this array are never used, so any will allow
// it to be used anywhere an array of any type is required.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const STABLE_EMPTY_ARRAY: any[] = []
const STABLE_EMPTY_OBJECT = Object.freeze({})

// Function-specific roles (includes service_role unlike tables)
export const FUNCTION_API_ACCESS_ROLES = ['anon', 'authenticated', 'service_role'] as const
export type FunctionApiAccessRole = (typeof FUNCTION_API_ACCESS_ROLES)[number]

export type FunctionApiPrivilegesByRole = Record<FunctionApiAccessRole, boolean>

const DEFAULT_PRIVILEGES: FunctionApiPrivilegesByRole = {
  anon: false,
  authenticated: false,
  service_role: false,
}

const getApiPrivilegesByRole = (
  privileges: FunctionPrivilegesData[number]['privileges']
): FunctionApiPrivilegesByRole => {
  const privilegesByRole: FunctionApiPrivilegesByRole = { ...DEFAULT_PRIVILEGES }

  privileges.forEach((privilege) => {
    const { grantee, privilege_type } = privilege
    if (privilege_type !== 'EXECUTE') return

    if (grantee === 'public') {
      FUNCTION_API_ACCESS_ROLES.forEach((role) => {
        privilegesByRole[role] = true
      })
    }

    if (grantee === 'anon' || grantee === 'authenticated' || grantee === 'service_role') {
      privilegesByRole[grantee] = true
    }
  })

  return privilegesByRole
}

const mapPrivilegesByFunctionId = (
  data: FunctionPrivilegesData | undefined,
  schemaName: string,
  functionIds: Set<number>
): Record<number, FunctionApiPrivilegesByRole> => {
  if (!data) return {}

  const result: Record<number, FunctionApiPrivilegesByRole> = {}

  data.forEach((entry) => {
    if (entry.schema !== schemaName) return
    if (!functionIds.has(entry.function_id)) return
    result[entry.function_id] = getApiPrivilegesByRole(entry.privileges)
  })

  return result
}

export type UseFunctionApiAccessQueryParams = Prettify<
  ConnectionVars & {
    schemaName: string
    functionIds: number[]
  }
>

export type FunctionApiAccessData =
  | {
      apiAccessType: 'access'
      privileges: FunctionApiPrivilegesByRole
    }
  | {
      apiAccessType: 'none'
    }
  | {
      apiAccessType: 'exposed-schema-no-grants'
    }

export type FunctionApiAccessMap = Prettify<Record<number, FunctionApiAccessData>>

export type UseFunctionApiAccessQueryReturn =
  | {
      data: FunctionApiAccessMap
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

export const useFunctionApiAccessQuery = (
  {
    projectRef,
    connectionString,
    schemaName,
    functionIds = STABLE_EMPTY_ARRAY,
  }: UseFunctionApiAccessQueryParams,
  {
    enabled = true,
    ...options
  }: Omit<UseCustomQueryOptions<FunctionPrivilegesData, FunctionPrivilegesError>, 'enabled'> & {
    enabled?: boolean
  } = {}
): UseFunctionApiAccessQueryReturn => {
  const uniqueFunctionIds = useMemo(() => {
    return new Set(functionIds.filter((id) => typeof id === 'number' && id > 0))
  }, [functionIds])
  const hasFunctions = uniqueFunctionIds.size > 0

  const schemaExposureStatus = useIsSchemaExposed({ projectRef, schemaName }, { enabled })
  const isSchemaExposed = schemaExposureStatus.isSuccess && schemaExposureStatus.data === true

  const enablePrivilegesQuery = enabled && hasFunctions
  const privilegeStatus = useQuery({
    ...functionPrivilegesQueryOptions(
      { projectRef, connectionString },
      { enabled: enablePrivilegesQuery }
    ),
    ...options,
  })

  const result: UseFunctionApiAccessQueryReturn = useMemo(() => {
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

    if (!hasFunctions) {
      return {
        data: STABLE_EMPTY_OBJECT,
        status: 'success',
        isSuccess: true,
        isPending: false,
        isError: false,
      }
    }

    const resultData: FunctionApiAccessMap = {}
    const functionPrivilegesById = isSchemaExposed
      ? mapPrivilegesByFunctionId(privilegeStatus.data, schemaName, uniqueFunctionIds)
      : {}

    uniqueFunctionIds.forEach((functionId) => {
      if (!isSchemaExposed) {
        resultData[functionId] = { apiAccessType: 'none' }
        return
      }

      const functionPrivileges = functionPrivilegesById[functionId] ?? { ...DEFAULT_PRIVILEGES }
      const hasAnyPrivileges =
        functionPrivileges.anon || functionPrivileges.authenticated || functionPrivileges.service_role

      resultData[functionId] = hasAnyPrivileges
        ? {
            apiAccessType: 'access',
            privileges: functionPrivileges,
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
    hasFunctions,
    schemaExposureStatus.status,
    isSchemaExposed,
    privilegeStatus.isPending,
    privilegeStatus.isError,
    privilegeStatus.data,
    schemaName,
    uniqueFunctionIds,
  ])

  return result
}
