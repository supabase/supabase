import jsonLogic from 'json-logic-js'
import { useMemo } from 'react'

import { useIsLoggedIn, useParams } from 'common'
import { usePermissionsQuery } from 'data/permissions/permissions-query'
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

function useGetProjectPermissions(
  permissionsOverride?: Permission[],
  organizationSlugOverride?: string,
  projectRefOverride?: string,
  enabled = true
) {
  const {
    data,
    isPending: isLoadingPermissions,
    isSuccess: isSuccessPermissions,
  } = usePermissionsQuery({
    enabled: permissionsOverride === undefined && enabled,
  })
  const permissions = permissionsOverride === undefined ? data : permissionsOverride

  const getOrganizationDataFromParamsSlug = organizationSlugOverride === undefined && enabled
  const {
    data: organizationData,
    isPending: isLoadingOrganization,
    isSuccess: isSuccessOrganization,
  } = useSelectedOrganizationQuery({
    enabled: getOrganizationDataFromParamsSlug,
  })
  const organization =
    organizationSlugOverride === undefined ? organizationData : { slug: organizationSlugOverride }
  const organizationSlug = organization?.slug

  const { ref: urlProjectRef } = useParams()
  const getProjectDataFromParamsRef = !!urlProjectRef && projectRefOverride === undefined && enabled
  const {
    data: projectData,
    isPending: isLoadingProject,
    isSuccess: isSuccessProject,
  } = useSelectedProjectQuery({
    enabled: getProjectDataFromParamsRef,
  })
  const project =
    projectRefOverride === undefined || projectData?.parent_project_ref
      ? projectData
      : { ref: projectRefOverride, parent_project_ref: undefined }

  const projectRef = project?.parent_project_ref ? project.parent_project_ref : project?.ref

  const isLoading =
    isLoadingPermissions ||
    (getOrganizationDataFromParamsSlug && isLoadingOrganization) ||
    (getProjectDataFromParamsRef && isLoadingProject)
  const isSuccess =
    isSuccessPermissions &&
    (!getOrganizationDataFromParamsSlug || isSuccessOrganization) &&
    (!getProjectDataFromParamsRef || isSuccessProject)

  return {
    permissions,
    organizationSlug,
    projectRef,
    isLoading,
    isSuccess,
  }
}

/** [Joshen] To be renamed to be useAsyncCheckPermissions, more generic as it covers both org and project perms */
// Useful when you want to avoid layout changes while waiting for permissions to load
export function useAsyncCheckPermissions(
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

  const can = useMemo(() => {
    if (!IS_PLATFORM) return true
    if (!isLoggedIn) return false
    if (!isPermissionsSuccess || !allPermissions) return false

    return doPermissionsCheck(
      allPermissions,
      action,
      resource,
      data,
      _organizationSlug,
      _projectRef
    )
  }, [
    isLoggedIn,
    isPermissionsSuccess,
    allPermissions,
    action,
    resource,
    data,
    _organizationSlug,
    _projectRef,
  ])

  // Derive loading/success consistently from the same branches
  const isLoading = !IS_PLATFORM ? false : !isLoggedIn ? true : isPermissionsLoading

  const isSuccess = !IS_PLATFORM ? true : !isLoggedIn ? false : isPermissionsSuccess

  return { isLoading, isSuccess, can }
}

export { useAsyncCheckPermissions as useCheckPermissions }