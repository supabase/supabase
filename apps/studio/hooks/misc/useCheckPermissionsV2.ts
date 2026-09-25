// useCheckPermissionsV2.ts
import { useIsLoggedIn, useParams } from 'common'
import { useMemo } from 'react'

import { useSelectedOrganizationQuery } from './useSelectedOrganization'
import { useSelectedProjectQuery } from './useSelectedProject'
import { usePermissionsQueryV2 } from '@/data/permissions/permissions-query-v2'
import { IS_PLATFORM } from '@/lib/constants'
import type { FgaPermission, PermissionV2 } from '@/types'

/**
 * Checks an FGA permission against the v2 permissions response.
 * Resolution order:
 * 1. explicit project scoped role entry for projectRef (if provided)
 * 2. org level permissions (org role applies to all projects in the org)
 */
export function doPermissionsCheckV2(
  data: PermissionV2 | undefined,
  permission: FgaPermission,
  organizationSlug?: string,
  projectRef?: string | null
): boolean {
  if (!data) return false

  const org = data.organizations.find((o) => o.slug === organizationSlug)
  if (!org) return false

  if (projectRef) {
    const project = org.projects.find((p) => p.ref === projectRef)
    if (project?.permissions.includes(permission)) return true
  }

  return org.permissions.includes(permission)
}

function useGetProjectPermissionsV2(
  permissionsOverride?: PermissionV2,
  organizationSlugOverride?: string,
  projectRefOverride?: string | null,
  enabled = true
) {
  const {
    data,
    isPending: isLoadingPermissions,
    isSuccess: isSuccessPermissions,
  } = usePermissionsQueryV2({
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

  // branch projects resolve to their base project ref, since FGA tuples
  // are written against the base project only
  const projectRef =
    projectRefOverride === null
      ? null
      : project?.parent_project_ref
        ? project.parent_project_ref
        : project?.ref

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

// Useful when you want to avoid layout changes while waiting for permissions to load
export function useAsyncCheckPermissionsV2(
  permission: FgaPermission,
  overrides?: {
    organizationSlug?: string
    projectRef?: string | null
    permissions?: PermissionV2
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
  } = useGetProjectPermissionsV2(permissions, organizationSlug, projectRef, isLoggedIn)

  const can = useMemo(() => {
    if (!IS_PLATFORM) return true
    if (!isLoggedIn) return false
    if (!isPermissionsSuccess || !allPermissions) return false

    return doPermissionsCheckV2(allPermissions, permission, _organizationSlug, _projectRef)
  }, [isLoggedIn, isPermissionsSuccess, allPermissions, permission, _organizationSlug, _projectRef])

  const isLoading = !IS_PLATFORM ? false : !isLoggedIn ? true : isPermissionsLoading
  const isSuccess = !IS_PLATFORM ? true : !isLoggedIn ? false : isPermissionsSuccess

  return { isLoading, isSuccess, can }
}
