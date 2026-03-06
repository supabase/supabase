import type { OrganizationMember } from 'data/organizations/organization-members-query'
import type { ProjectMember } from 'data/projects/project-members-query'

interface SummarizeProjectAccessParams {
  projectMembers: ProjectMember[]
  organizationMembers: OrganizationMember[]
  isSuccessOrganizationMembers: boolean
  maxVisibleMembers?: number
}

export interface ProjectAccessSummary {
  uniqueProjectMembers: ProjectMember[]
  projectMemberCount: number
  organizationMemberCount: number
  canCompareWithOrganizationMembers: boolean
  hasOrganizationWideAccess: boolean
}

interface ViewerProjectMembersParams {
  uniqueProjectMembers: ProjectMember[]
  organizationMembers: OrganizationMember[]
  hasLimitedVisibility: boolean
  maxVisibleMembers?: number
}

export interface ViewerProjectMembersSummary {
  viewerVisibleProjectMembers: ProjectMember[]
  viewerVisibleMembers: ProjectMember[]
  viewerVisibleProjectMemberCount: number
  viewerHiddenMembersCount: number
}

export const summarizeProjectAccess = ({
  projectMembers,
  organizationMembers,
  isSuccessOrganizationMembers,
  maxVisibleMembers = 12,
}: SummarizeProjectAccessParams): ProjectAccessSummary => {
  const uniqueMembersMap = new Map<string, ProjectMember>()
  projectMembers.forEach((member) => {
    uniqueMembersMap.set(member.user_id, member)
  })

  const uniqueProjectMembers = Array.from(uniqueMembersMap.values()).sort((a, b) =>
    a.primary_email.localeCompare(b.primary_email)
  )

  const organizationMemberIds = new Set(
    organizationMembers
      .filter((member) => !member.invited_id)
      .map((member) => member.gotrue_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  )

  const projectMemberCount = uniqueProjectMembers.length
  const organizationMemberCount = organizationMemberIds.size
  const canCompareWithOrganizationMembers =
    isSuccessOrganizationMembers && organizationMemberCount > 0
  const hasOrganizationWideAccess =
    canCompareWithOrganizationMembers &&
    projectMemberCount === organizationMemberCount &&
    uniqueProjectMembers.every((member) => organizationMemberIds.has(member.user_id))

  return {
    uniqueProjectMembers,
    projectMemberCount,
    organizationMemberCount,
    canCompareWithOrganizationMembers,
    hasOrganizationWideAccess,
  }
}

export const summarizeViewerProjectMembers = ({
  uniqueProjectMembers,
  organizationMembers,
  hasLimitedVisibility,
  maxVisibleMembers = 12,
}: ViewerProjectMembersParams): ViewerProjectMembersSummary => {
  const visibleOrganizationMemberIds = new Set(
    organizationMembers
      .filter((member) => !member.invited_id)
      .map((member) => member.gotrue_id)
      .filter((id): id is string => typeof id === 'string' && id.length > 0)
  )

  const viewerVisibleProjectMembers = hasLimitedVisibility
    ? uniqueProjectMembers.filter((member) => visibleOrganizationMemberIds.has(member.user_id))
    : uniqueProjectMembers

  const viewerVisibleProjectMemberCount = viewerVisibleProjectMembers.length
  const viewerVisibleMembers = viewerVisibleProjectMembers.slice(0, maxVisibleMembers)
  const viewerHiddenMembersCount = Math.max(
    viewerVisibleProjectMemberCount - viewerVisibleMembers.length,
    0
  )

  return {
    viewerVisibleProjectMembers,
    viewerVisibleMembers,
    viewerVisibleProjectMemberCount,
    viewerHiddenMembersCount,
  }
}
