import { useIsLoggedIn } from 'common'
import jsonLogic from 'json-logic-js'

import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { IS_PLATFORM } from 'lib/constants'
import { Permission } from 'types'
import { useSelectedOrganization } from './useSelectedOrganization'

const toRegexpString = (actionOrResource: string) =>
  `^${actionOrResource.replace('.', '\\.').replace('%', '.*')}$`

export function doPermissionsCheck(
  permissions: Permission[] | undefined,
  action: string,
  resource: string,
  data?: object,
  organizationId?: number
) {
  if (!permissions || !Array.isArray(permissions)) {
    return false
  }

  return permissions
    .filter(
      (permission) =>
        permission.organization_id === organizationId &&
        permission.actions.some((act) => (action ? action.match(toRegexpString(act)) : null)) &&
        permission.resources.some((res) => resource.match(toRegexpString(res)))
    )
    .some(
      ({ condition }: { condition: jsonLogic.RulesLogic }) =>
        condition === null || jsonLogic.apply(condition, { resource_name: resource, ...data })
    )
}

export function useGetPermissions(
  permissionsOverride?: Permission[],
  organizationIdOverride?: number,
  enabled = true
) {
  const permissionsResult = usePermissionsQuery({
    enabled: permissionsOverride === undefined && enabled,
  })

  const permissions =
    permissionsOverride === undefined ? permissionsResult.data : permissionsOverride

  const organizationResult = useSelectedOrganization({
    enabled: organizationIdOverride === undefined && enabled,
  })

  const organization =
    organizationIdOverride === undefined ? organizationResult : { id: organizationIdOverride }
  const organizationId = organization?.id

  return {
    permissions,
    organizationId,
  }
}

export function useCheckPermissions(
  action: string,
  resource: string,
  data?: object,
  // [Joshen] Pass the variables if you want to avoid hooks in this
  // e.g If you want to use useCheckPermissions in a loop like organization settings
  organizationId?: number,
  permissions?: Permission[]
) {
  const isLoggedIn = useIsLoggedIn()

  const { permissions: allPermissions, organizationId: orgId } = useGetPermissions(
    permissions,
    organizationId,
    isLoggedIn
  )

  if (!isLoggedIn) return false
  if (!IS_PLATFORM) return true

  return doPermissionsCheck(allPermissions, action, resource, data, orgId)
}
