import { useMemo } from 'react'

import type { PermissionSelection, ResourceAccessMode } from '../AccessToken.permissions'
import {
  applySelectionToRoleContext,
  computeTokenRoleContext,
  type TokenAccessEvaluation,
} from '../AccessToken.roles'
import { useOrgAndProjectData } from './useOrgAndProjectData'
import { usePermissionsQuery } from '@/data/permissions/permissions-query'

interface UseTokenAccessEvaluationArgs {
  selection: PermissionSelection
  resourceAccess: ResourceAccessMode
  organizationSlugs: string[]
  projectRefs: string[]
  enabled?: boolean
}

/**
 * Evaluates a token's scope selection and bound resources against the current user's live access.
 * Advisory only — actual enforcement is the per-request intersection on the API side. While the
 * underlying queries load (or on self-hosted), the evaluation reports `status: 'unknown'` and
 * callers must show no warnings rather than flash false ones.
 *
 * Role resolution (the expensive part) is memoized separately from the selection, so toggling
 * permissions in the form only re-runs the cheap selection pass.
 */
export const useTokenAccessEvaluation = ({
  selection,
  resourceAccess,
  organizationSlugs,
  projectRefs,
  enabled = true,
}: UseTokenAccessEvaluationArgs): TokenAccessEvaluation => {
  const { data: permissions } = usePermissionsQuery({ enabled })
  const { organizations, projects, isLoadingOrgs, isLoadingProjects, hasMoreProjects } =
    useOrgAndProjectData({
      enabled,
    })

  // Org/project lists still loading, or the project list truncated at the first page: either way
  // resources the user *does* have access to would read as inaccessible, so report unknown
  // instead.
  const hasCompleteResourceLists = !isLoadingOrgs && !isLoadingProjects && !hasMoreProjects

  const context = useMemo(
    () =>
      computeTokenRoleContext({
        resourceAccess,
        organizationSlugs,
        projectRefs,
        permissions: hasCompleteResourceLists ? permissions : undefined,
        organizations,
        projects,
      }),
    [
      resourceAccess,
      organizationSlugs,
      projectRefs,
      permissions,
      organizations,
      projects,
      hasCompleteResourceLists,
    ]
  )

  return useMemo(() => applySelectionToRoleContext(context, selection), [context, selection])
}
