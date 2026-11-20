import { permissions } from '@supabase/shared-types'
import { useIsLoggedIn, useParams } from 'common'
import { useMemo } from 'react'

import { useSelectedOrganizationQuery } from './useSelectedOrganization'
import { useSelectedProjectQuery } from './useSelectedProject'
import { PermissionsV2Data, usePermissionsQueryV2 } from '@/data/permissions/permissions-query-v2'
import { IS_PLATFORM } from '@/lib/constants'

type ExtractIds<T> = {
  [K in keyof T]: {
    [P in keyof T[K]]: T[K][P] extends { id: infer I } ? I : never
  }
}

export const FGA_PERMISSIONS = Object.fromEntries(
  Object.entries(permissions.FgaPermissions).map(([group, permissions]) => [
    group,
    Object.fromEntries(Object.entries(permissions).map(([key, { id }]) => [key, id])),
  ])
) as ExtractIds<typeof permissions.FgaPermissions>

type DeepValue<T> = T extends object ? DeepValue<T[keyof T]> : T
export type FgaPermissions = DeepValue<typeof FGA_PERMISSIONS>

export type FgaRequirementGroups = readonly (readonly FgaPermissions[])[]

/**
 * Checks FGA permissions against the v2 permissions response.
 *
 * `permission` is a single permission, a list of permissions that are all required (one AND group),
 * or a list of such lists (OR-of-AND): the check passes if every permission in at least one group
 * is held. Empty input, including an empty group, never grants.
 *
 * Each permission is looked up in this order:
 * 1. explicit project scoped role entry for projectRef (if provided)
 * 2. org level permissions (org role applies to all projects in the org)
 */
export function doPermissionsCheckV2(
  data: PermissionsV2Data | undefined,
  permission: FgaPermissions | readonly FgaPermissions[] | FgaRequirementGroups,
  organizationSlug?: string,
  projectRef?: string | null
): boolean {
  if (!data) return false

  const org = data.organizations.find((o) => o.slug === organizationSlug)
  if (!org) return false

  let groups: FgaRequirementGroups
  if (typeof permission === 'string') {
    groups = [[permission]]
  } else if (permission.every((p): p is FgaPermissions => typeof p === 'string')) {
    groups = [permission]
  } else {
    groups = permission
  }

  const project = projectRef ? org.projects.find((p) => p.ref === projectRef) : undefined

  return groups.some(
    (group) =>
      group.length > 0 &&
      group.every((p) => (project?.permissions.includes(p) ?? false) || org.permissions.includes(p))
  )
}

/**
 * Resolves the organization and project an FGA check applies to.
 *
 * - `organizationSlug` defaults to the selected organization.
 * - `projectRef` defaults to the URL ref; `null` means an org-level check.
 * - `permissionsProjectRef` is the ref permissions are evaluated against. For the URL project it
 *   resolves branches to their parent, since FGA tuples are written against the parent project
 *   only. An explicit ref other than the URL ref is used as-is, without fetching its details.
 */
export function usePermissionScopeV2({
  organizationSlug: organizationSlugOverride,
  projectRef: projectRefOverride,
  enabled = true,
}: {
  organizationSlug?: string
  projectRef?: string | null
  enabled?: boolean
}) {
  const getOrganizationDataFromParamsSlug = organizationSlugOverride === undefined && enabled
  const {
    data: organizationData,
    isPending: isLoadingOrganization,
    isSuccess: isSuccessOrganization,
    error: organizationError,
  } = useSelectedOrganizationQuery({
    enabled: getOrganizationDataFromParamsSlug,
  })
  const organizationSlug =
    organizationSlugOverride === undefined ? organizationData?.slug : organizationSlugOverride

  const { ref: urlProjectRef } = useParams()
  const projectRef = projectRefOverride === undefined ? urlProjectRef : projectRefOverride

  const getProjectDataFromParamsRef = !!urlProjectRef && projectRef === urlProjectRef && enabled
  const {
    data: projectData,
    isPending: isLoadingProject,
    isSuccess: isSuccessProject,
    error: projectError,
  } = useSelectedProjectQuery({
    enabled: getProjectDataFromParamsRef,
  })

  // branch projects resolve to their base project ref, since FGA tuples
  // are written against the base project only
  const permissionsProjectRef =
    projectRef === urlProjectRef && !!urlProjectRef ? projectData?.parentRef : projectRef

  const isLoading =
    (getOrganizationDataFromParamsSlug && isLoadingOrganization) ||
    (getProjectDataFromParamsRef && isLoadingProject)
  const isSuccess =
    (!getOrganizationDataFromParamsSlug || isSuccessOrganization) &&
    (!getProjectDataFromParamsRef || isSuccessProject)
  const error =
    (getOrganizationDataFromParamsSlug ? organizationError : null) ??
    (getProjectDataFromParamsRef ? projectError : null)

  return {
    organizationSlug,
    projectRef,
    permissionsProjectRef,
    isLoading,
    isSuccess,
    error,
  }
}

function useGetProjectPermissionsV2(
  permissionsOverride?: PermissionsV2Data,
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

  const {
    organizationSlug,
    permissionsProjectRef: projectRef,
    isLoading: isLoadingScope,
    isSuccess: isSuccessScope,
  } = usePermissionScopeV2({
    organizationSlug: organizationSlugOverride,
    projectRef: projectRefOverride,
    enabled,
  })

  return {
    permissions,
    organizationSlug,
    projectRef,
    isLoading: isLoadingPermissions || isLoadingScope,
    isSuccess: isSuccessPermissions && isSuccessScope,
  }
}

export function useAsyncCheckPermissionsV2(
  permission: FgaPermissions | FgaPermissions[],
  overrides?: {
    organizationSlug?: string
    projectRef?: string | null
    permissions?: PermissionsV2Data
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

  // project scoped role wins over org role
  const role = useMemo<PermissionsV2Data['organizations'][number]['role'] | undefined>(() => {
    if (!allPermissions || !_organizationSlug) return undefined
    const org = allPermissions.organizations.find((o) => o.slug === _organizationSlug)
    if (!org) return undefined
    const project = _projectRef ? org.projects.find((p) => p.ref === _projectRef) : undefined
    return project?.role ?? org.role
  }, [allPermissions, _organizationSlug, _projectRef])

  const isLoading = !IS_PLATFORM ? false : !isLoggedIn ? true : isPermissionsLoading
  const isSuccess = !IS_PLATFORM ? true : !isLoggedIn ? false : isPermissionsSuccess

  return { isLoading, isSuccess, can, role }
}

export function useAsyncCheckUserContentPermissions(
  permission: 'project_snippets_read' | 'project_snippets_write',
  content:
    | {
        mode: 'create'
        type: 'report' | 'sql' | 'log_sql' | 'notebook'
      }
    | {
        mode: 'existing'
        type: 'report' | 'sql' | 'log_sql' | 'notebook'
        visibility: 'project' | 'user' | 'public' | 'org'
        ownerId: number
        subjectId?: number
      }
    | undefined,
  overrides?: {
    organizationSlug?: string
    projectRef?: string | null
    permissions?: PermissionsV2Data
  }
) {
  const { isLoading, isSuccess, can, role } = useAsyncCheckPermissionsV2(permission, overrides)
  const isResolved =
    content !== undefined && (content.mode === 'create' || content.subjectId !== undefined)
  const isAtLeastDeveloper =
    role !== undefined && ['developer', 'administrator', 'owner'].includes(role)
  const isRestrictedWrite = permission === 'project_snippets_write' && !isAtLeastDeveloper
  const isWritableBelowDeveloper = content !== undefined && ['sql'].includes(content.type)

  let passesContextCheck = false
  if (content === undefined) {
    // content not loaded yet
    passesContextCheck = false
  } else if (content.mode === 'create') {
    passesContextCheck = !isRestrictedWrite || isWritableBelowDeveloper
  } else {
    const isOwner = content.ownerId === content.subjectId
    const isUserVisibility = content.visibility === 'user'
    if (isRestrictedWrite) {
      passesContextCheck = isWritableBelowDeveloper && isOwner
    } else {
      passesContextCheck = !isUserVisibility || isOwner
    }
  }

  return {
    isLoading: isLoading || !isResolved,
    isSuccess: isSuccess && isResolved,
    can: can && passesContextCheck,
  }
}
