import { useIsLoggedIn, useParams } from 'common'
import jsonLogic from 'json-logic-js'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { IS_PLATFORM } from 'lib/constants'
import type { Permission } from 'types'
import { useSelectedOrganization } from './useSelectedOrganization'
import { useSelectedProject } from './useSelectedProject'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'

const toRegexpString = (actionOrResource: string) =>
  `^${actionOrResource.replace('.', '\\.').replace('%', '.*')}$`

function doPermissionConditionCheck(permissions: Permission[], data?: object) {
  const isRestricted = permissions
    .filter((permission) => permission.restrictive)
    .some(
      ({ condition }: { condition: jsonLogic.RulesLogic }) =>
        condition === null || jsonLogic.apply(condition, data)
    )
  if (isRestricted) return false

  return permissions
    .filter((permission) => !permission.restrictive)
    .some(
      ({ condition }: { condition: jsonLogic.RulesLogic }) =>
        condition === null || jsonLogic.apply(condition, data)
    )
}

export function doPermissionsCheck(
  permissions: Permission[] | undefined,
  action: string,
  resource: string,
  data?: object,
  organizationId?: number,
  projectId?: number
) {
  if (!permissions || !Array.isArray(permissions)) {
    return false
  }

  if (projectId) {
    const projectPermissions = permissions.filter(
      (permission) =>
        permission.organization_id === organizationId &&
        permission.actions.some((act) => (action ? action.match(toRegexpString(act)) : null)) &&
        permission.resources.some((res) => resource.match(toRegexpString(res))) &&
        permission.project_ids?.includes(projectId)
    )
    if (projectPermissions.length > 0) {
      return doPermissionConditionCheck(projectPermissions, { resource_name: resource, ...data })
    }
  }

  const orgPermissions = permissions
    // filter out org-level permission
    .filter((permission) => !permission.project_ids || permission.project_ids.length === 0)
    .filter(
      (permission) =>
        permission.organization_id === organizationId &&
        permission.actions.some((act) => (action ? action.match(toRegexpString(act)) : null)) &&
        permission.resources.some((res) => resource.match(toRegexpString(res)))
    )
  return doPermissionConditionCheck(orgPermissions, { resource_name: resource, ...data })
}

export function useGetPermissions(
  permissionsOverride?: Permission[],
  organizationIdOverride?: number,
  enabled = true
) {
  return useGetProjectPermissions(permissionsOverride, organizationIdOverride, undefined, enabled)
}

export function useGetProjectPermissions(
  permissionsOverride?: Permission[],
  organizationIdOverride?: number,
  projectIdOverride?: number,
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

  const projectResult = useSelectedProject({
    enabled: projectIdOverride === undefined && enabled,
  })

  const project = projectIdOverride === undefined ? projectResult : { id: projectIdOverride }
  const projectId = project?.id

  return {
    permissions,
    organizationId,
    projectId,
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
  return useCheckProjectPermissions(action, resource, data, {
    organizationId,
    projectId: undefined,
    permissions,
  })
}

export function useCheckProjectPermissions(
  action: string,
  resource: string,
  data?: object,
  overrides?: {
    organizationId?: number
    projectId?: number
    permissions?: Permission[]
  }
) {
  const isLoggedIn = useIsLoggedIn()
  const { organizationId, projectId, permissions } = overrides ?? {}

  const {
    permissions: allPermissions,
    organizationId: orgId,
    projectId: _projectId,
  } = useGetProjectPermissions(permissions, organizationId, projectId, isLoggedIn)

  if (!isLoggedIn) return false
  if (!IS_PLATFORM) return true

  return doPermissionsCheck(allPermissions, action, resource, data, orgId, _projectId)
}

export function usePermissionsLoaded() {
  const isLoggedIn = useIsLoggedIn()
  const { isFetched: isPermissionsFetched } = usePermissionsQuery({ enabled: isLoggedIn })
  const { isFetched: isOrganizationsFetched } = useOrganizationsQuery({ enabled: isLoggedIn })

  const { ref } = useParams()
  const { isFetched: isProjectDetailFetched } = useProjectDetailQuery(
    { ref },
    { enabled: !!ref && isLoggedIn }
  )

  if (!IS_PLATFORM) return true

  if (ref) {
    return isLoggedIn && isPermissionsFetched && isOrganizationsFetched && isProjectDetailFetched
  }

  return isLoggedIn && isPermissionsFetched && isOrganizationsFetched
}
