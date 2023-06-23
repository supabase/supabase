import jsonLogic from 'json-logic-js'

import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { IS_PLATFORM } from 'lib/constants'
import { useSelectedOrganization } from './useSelectedOrganization'
import { Permission } from 'types'

const toRegexpString = (actionOrResource: string) =>
  `^${actionOrResource.replace('.', '\\.').replace('%', '.*')}$`

export function useCheckPermissions(
  action: string,
  resource: string,
  data?: object,
  // [Joshen] Pass the variables if you want to avoid hooks in this
  // e.g If you want to use useCheckPermissions in a loop like organization settings
  organizationId?: number,
  permissions?: Permission[]
) {
  const permissionsResult = usePermissionsQuery({
    enabled: permissions === undefined,
  })

  const allPermissions = permissions === undefined ? permissionsResult.data : permissions

  const organizationResult = useSelectedOrganization({
    enabled: organizationId === undefined,
  })

  const organization = organizationId === undefined ? organizationResult : { id: organizationId }
  const orgId = organization?.id

  if (!IS_PLATFORM) return true

  return (allPermissions ?? [])
    .filter(
      (permission) =>
        permission.organization_id === orgId &&
        permission.actions.some((act) => (action ? action.match(toRegexpString(act)) : null)) &&
        permission.resources.some((res) => resource.match(toRegexpString(res)))
    )
    .some(
      ({ condition }: { condition: jsonLogic.RulesLogic }) =>
        condition === null || jsonLogic.apply(condition, { resource_name: resource, ...data })
    )
}

/**
 * @deprecated use useCheckPermissions instead
 */
export const checkPermissions = useCheckPermissions
