import type { Branch } from '@/data/branches/branches-query'
import type { Organization } from '@/types'

export interface ProjectBranchSelectorState {
  selectedBranch: Branch | undefined
  isMainBranch: boolean
  branchDisplayName: string
  organizationHref: string
}

export function getProjectBranchSelectorState(params: {
  selectedBranch: Branch | undefined
  isBranchingEnabled: boolean
  selectedOrganization: Organization | undefined
}): ProjectBranchSelectorState {
  const { selectedBranch, isBranchingEnabled, selectedOrganization } = params

  const isMainBranch = !isBranchingEnabled || selectedBranch?.is_default === true
  const branchDisplayName = isBranchingEnabled ? (selectedBranch?.name ?? 'main') : 'main'
  const organizationHref = selectedOrganization?.slug
    ? `/org/${selectedOrganization.slug}`
    : '/organizations'

  return {
    selectedBranch,
    isMainBranch,
    branchDisplayName,
    organizationHref,
  }
}

export function getSelectedOrgInitial(orgName: string): string {
  return orgName.trim().charAt(0).toUpperCase()
}
