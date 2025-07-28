import { useIsLoggedIn, useParams } from 'common'
import jsonLogic from 'json-logic-js'

import { useOrganizationsQuery } from 'data/organizations/organizations-query'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { IS_PLATFORM } from 'lib/constants'
import type { Permission } from 'types'
import { useSelectedOrganizationQuery } from './useSelectedOrganization'
import { useSelectedProjectQuery } from './useSelectedProject'

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
  organizationSlug?: string,
  projectRef?: string
) {
  if (!permissions || !Array.isArray(permissions)) {
    return false
  }

  if (projectRef) {
    const projectPermissions = permissions.filter(
      (permission) =>
        permission.organization_slug === organizationSlug &&
        permission.actions.some((act) => (action ? action.match(toRegexpString(act)) : null)) &&
        permission.resources.some((res) => resource.match(toRegexpString(res))) &&
        permission.project_refs?.includes(projectRef)
    )
    if (projectPermissions.length > 0) {
      return doPermissionConditionCheck(projectPermissions, { resource_name: resource, ...data })
    }
  }

  const orgPermissions = permissions
    // filter out org-level permission
    .filter((permission) => !permission.project_refs || permission.project_refs.length === 0)
    .filter(
      (permission) =>
        permission.organization_slug === organizationSlug &&
        permission.actions.some((act) => (action ? action.match(toRegexpString(act)) : null)) &&
        permission.resources.some((res) => resource.match(toRegexpString(res)))
    )
  return doPermissionConditionCheck(orgPermissions, { resource_name: resource, ...data })
}

export function useGetPermissions(
  permissionsOverride?: Permission[],
  organizationSlugOverride?: string,
  enabled = true
) {
  return useGetProjectPermissions(permissionsOverride, organizationSlugOverride, undefined, enabled)
}

export function useGetProjectPermissions(
  permissionsOverride?: Permission[],
  organizationSlugOverride?: string,
  projectRefOverride?: string,
  enabled = true
) {
  const {
    data,
    isLoading: isLoadingPermissions,
    isSuccess: isSuccessPermissions,
  } = usePermissionsQuery({
    enabled: permissionsOverride === undefined && enabled,
  })
  const permissions = permissionsOverride === undefined ? data : permissionsOverride

  const organizationsQueryEnabled = organizationSlugOverride === undefined && enabled
  const {
    data: organizationData,
    isLoading: isLoadingOrganization,
    isSuccess: isSuccessOrganization,
  } = useSelectedOrganizationQuery({
    enabled: organizationsQueryEnabled,
  })
  const organization =
    organizationSlugOverride === undefined ? organizationData : { slug: organizationSlugOverride }
  const organizationSlug = organization?.slug

  const projectsQueryEnabled = projectRefOverride === undefined && enabled
  const {
    data: projectData,
    isLoading: isLoadingProject,
    isSuccess: isSuccessProject,
  } = useSelectedProjectQuery({
    enabled: projectsQueryEnabled,
  })
  const project =
    projectRefOverride === undefined || projectData?.parent_project_ref
      ? projectData
      : { ref: projectRefOverride, parent_project_ref: undefined }
  const projectRef = project?.parent_project_ref ? project.parent_project_ref : project?.ref

  const isLoading =
    isLoadingPermissions ||
    (organizationsQueryEnabled && isLoadingOrganization) ||
    (projectsQueryEnabled && isLoadingProject)
  const isSuccess =
    isSuccessPermissions &&
    (!organizationsQueryEnabled || isSuccessOrganization) &&
    (!projectsQueryEnabled || isSuccessProject)

  return {
    permissions,
    organizationSlug,
    projectRef,
    isLoading,
    isSuccess,
  }
}

export function useCheckPermissions(
  action: string,
  resource: string,
  data?: object,
  // [Joshen] Pass the variables if you want to avoid hooks in this
  // e.g If you want to use useCheckPermissions in a loop like organization settings
  organizationSlug?: string,
  permissions?: Permission[]
) {
  return useCheckProjectPermissions(action, resource, data, {
    organizationSlug,
    projectRef: undefined,
    permissions,
  })
}

export function useCheckProjectPermissions(
  action: string,
  resource: string,
  data?: object,
  overrides?: {
    organizationSlug?: string
    projectRef?: string
    permissions?: Permission[]
  }
) {
  const isLoggedIn = useIsLoggedIn()
  const { organizationSlug, projectRef, permissions } = overrides ?? {}

  const {
    permissions: allPermissions,
    organizationSlug: _organizationSlug,
    projectRef: _projectRef,
  } = useGetProjectPermissions(permissions, organizationSlug, projectRef, isLoggedIn)

  if (!isLoggedIn) return false
  if (!IS_PLATFORM) return true

  return doPermissionsCheck(allPermissions, action, resource, data, _organizationSlug, _projectRef)
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

// Useful when you want to avoid layout changes while waiting for permissions to load
export function useAsyncCheckProjectPermissions(
  action: string,
  resource: string,
  data?: object,
  overrides?: {
    organizationSlug?: string
    projectRef?: string
    permissions?: Permission[]
  }
) {
  const isLoggedIn = useIsLoggedIn()
  const { organizationSlug, projectRef, permissions } = overrides ?? {}

  const {
    permissions: allPermissions,
    organizationSlug: _organizationSlug,
    projectRef: _projectRef,
    isLoading: isPermissionsLoading,
    isSuccess: isPermissionsSuccess,
  } = useGetProjectPermissions(permissions, organizationSlug, projectRef, isLoggedIn)

  if (!isLoggedIn) {
    return {
      isLoading: true,
      isSuccess: false,
      can: false,
    }
  }
  if (!IS_PLATFORM) {
    return {
      isLoading: false,
      isSuccess: true,
      can: true,
    }
  }

  const can = doPermissionsCheck(
    allPermissions,
    action,
    resource,
    data,
    _organizationSlug,
    _projectRef
  )

  return {
    isLoading: isPermissionsLoading,
    isSuccess: isPermissionsSuccess,
    can,
  }
}
