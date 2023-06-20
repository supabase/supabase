import jsonLogic from 'json-logic-js'

import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { IS_PLATFORM } from 'lib/constants'
import { useSelectedOrganization } from './useSelectedOrganization'

const toRegexpString = (actionOrResource: string) =>
  `^${actionOrResource.replace('.', '\\.').replace('%', '.*')}$`

export function useCheckPermissions(
  action: string,
  resource: string,
  data?: object,
  organizationId?: number
) {
  const { data: permissions } = usePermissionsQuery({
    enabled: IS_PLATFORM,
  })
  const organization = useSelectedOrganization()

  if (!IS_PLATFORM) return true

  const orgId = organizationId ?? organization?.id

  return (permissions ?? [])
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
