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

type TableIdentifierById = {
  identifier: 'id'
  relationId: number
}
type TableIdentifierByName = {
  identifier: 'name'
  schemaName: string
  tableName: string
}
type TableIdentifier = TableIdentifierById | TableIdentifierByName

/**
 * Create a cache key from a table identifier
 */
const createTableIdentifierCacheKey = (tableIdentifier: TableIdentifier): string => {
  if (tableIdentifier.identifier === 'id') {
    return `id:${tableIdentifier.relationId}`
  } else {
    return `name:${tableIdentifier.schemaName}.${tableIdentifier.tableName}`
  }
}

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

type MapPrivilegesToApiAccessReturn = {
  privileges: ApiPrivilegesByRole
  foundSchemaName?: string
}

/**
 * Maps overall table privileges data as returned from database query to API
 * privileges for a specific table.
 */
const mapPrivilegesToApiAccess = (
  allPrivileges: TablePrivilegesData,
  tableIdentifier: TableIdentifier
): MapPrivilegesToApiAccessReturn => {
  const target = allPrivileges.find((entry) =>
    tableIdentifier.identifier === 'id'
      ? entry.relation_id === tableIdentifier.relationId
      : entry.schema === tableIdentifier.schemaName && entry.name === tableIdentifier.tableName
  )
  const privileges = target?.privileges ?? []

  const privilegesByRole: ApiPrivilegesByRole = {
    anon: [],
    authenticated: [],
  }

  privileges.forEach((privilege) => {
    const { grantee, privilege_type } = privilege
    if (isApiAccessRole(grantee)) {
      if (isApiPrivilegeType(privilege_type)) {
        privilegesByRole[grantee].push(privilege_type)
      }
    }
  })

  const result: MapPrivilegesToApiAccessReturn = { privileges: privilegesByRole }
  const foundSchemaName = target ? target.schema : undefined
  if (foundSchemaName) {
    result.foundSchemaName = foundSchemaName
  }

  return result
}

export type UseTableApiAccessQueryParams = Prettify<TableIdentifier & ConnectionVars>

export type TableApiAccessData =
  | {
      hasApiAccess: true
      privileges: ApiPrivilegesByRole
    }
  | {
      hasApiAccess: false
    }

export type UseTableApiAccessQueryReturn =
  | {
      data: TableApiAccessData
      isSuccess: true
      isPending: false
      isMissingSchemaData: false
      isError: false
    }
  | {
      data: undefined
      isSuccess: false
      isPending: true
      isMissingSchemaData: false
      isError: false
    }
  | {
      data: undefined
      isSuccess: false
      isPending: false
      isMissingSchemaData: true
      isError: false
    }
  | {
      data: undefined
      isSuccess: false
      isPending: false
      isMissingSchemaData: false
      isError: true
    }

export const useTableApiAccessQuery = (
  { projectRef, connectionString, ...tableIdentifier }: UseTableApiAccessQueryParams,
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
  const exposedSchemas = useMemo((): string[] | undefined => {
    if (!dbSchemaString) return undefined
    return parseDbSchemaString(dbSchemaString)
  }, [dbSchemaString])

  const isSchemaUnknown = tableIdentifier.identifier === 'id'
  const isKnownSchemaExposed =
    tableIdentifier.identifier === 'name' && exposedSchemas?.includes(tableIdentifier.schemaName)
  const enablePrivilegesQuery = enabled && (isSchemaUnknown || isKnownSchemaExposed)

  const {
    data: privileges,
    isPending: isPrivilegesPending,
    isError: isPrivilegesError,
  } = useTablePrivilegesQuery(
    { projectRef, connectionString },
    { enabled: enablePrivilegesQuery, ...options }
  )

  const derivedPrivilegeData = useMemo(() => {
    if (!privileges) return undefined
    return mapPrivilegesToApiAccess(privileges, tableIdentifier)
    // For reference stability purposes, we compute a stringified cache key
    // rather than keying on the tableIdentifier object directly.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [privileges, createTableIdentifierCacheKey(tableIdentifier)])

  const isPending = isConfigPending || (enablePrivilegesQuery && isPrivilegesPending)
  if (isPending) {
    return {
      data: undefined,
      isSuccess: false,
      isPending: true,
      isMissingSchemaData: false,
      isError: false,
    }
  }

  const isError = isConfigError || isPrivilegesError
  if (isError) {
    return {
      data: undefined,
      isSuccess: false,
      isPending: false,
      isMissingSchemaData: false,
      isError: true,
    }
  }

  const schema =
    tableIdentifier.identifier === 'name'
      ? tableIdentifier.schemaName
      : derivedPrivilegeData?.foundSchemaName
  if (!schema || !exposedSchemas) {
    return {
      data: undefined,
      isSuccess: false,
      isPending: false,
      isMissingSchemaData: true,
      isError: false,
    }
  }

  const isExposedSchema = exposedSchemas.includes(schema)
  const finalPrivileges = derivedPrivilegeData?.privileges ?? { anon: [], authenticated: [] }
  const hasAnonOrAuthenticatedPrivileges =
    finalPrivileges.anon.length > 0 || finalPrivileges.authenticated.length > 0

  const hasApiAccess = isExposedSchema && hasAnonOrAuthenticatedPrivileges
  const resultData: TableApiAccessData = hasApiAccess
    ? {
        hasApiAccess: true,
        privileges: finalPrivileges,
      }
    : {
        hasApiAccess: false,
      }

  return {
    data: resultData,
    isSuccess: true,
    isPending: false,
    isMissingSchemaData: false,
    isError: false,
  }
}
