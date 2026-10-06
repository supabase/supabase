// useCheckPermissionsV2.ts
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
export type ExistingFgaPermissions = DeepValue<typeof FGA_PERMISSIONS>
// TODO(Hieu): migrate to shared type when every permissions are available there
export type FgaPermissions = ExistingFgaPermissions | (string & {})

/**
 * Checks an FGA permission against the v2 permissions response.
 * Resolution order:
 * 1. explicit project scoped role entry for projectRef (if provided)
 * 2. org level permissions (org role applies to all projects in the org)
 */
export function doPermissionsCheckV2(
  data: PermissionsV2Data | undefined,
  permission: FgaPermissions | FgaPermissions[],
  organizationSlug?: string,
  projectRef?: string | null
): boolean {
  if (!data) return false

  const org = data.organizations.find((o) => o.slug === organizationSlug)
  if (!org) return false

  const required = Array.isArray(permission) ? permission : [permission]
  if (required.length === 0) return false // nothing requested: fail closed

  const project = projectRef ? org.projects.find((p) => p.ref === projectRef) : undefined

  return required.every(
    (p) => (project?.permissions.includes(p) ?? false) || org.permissions.includes(p)
  )
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
    projectRefOverride === undefined
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
