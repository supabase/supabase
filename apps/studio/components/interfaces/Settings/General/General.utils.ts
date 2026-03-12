import type {
  OrganizationRole,
  OrganizationRolesResponse,
} from 'data/organization-members/organization-roles-query'
import type { OrganizationMember } from 'data/organizations/organization-members-query'

export interface ProjectAccessMember {
  id: string
  displayName?: string
  email: string
  role?: string
}

interface SummarizeProjectAccessParams {
  organizationMembers: OrganizationMember[]
  roles: OrganizationRolesResponse | undefined
  projectRef?: string
  hasLimitedVisibility: boolean
  currentUserId?: string
  maxVisibleMembers?: number
}

export interface ProjectAccessSummary {
  projectMembers: ProjectAccessMember[]
  visibleMembers: ProjectAccessMember[]
  hiddenMembersCount: number
  projectMemberCount: number
  organizationMemberCount: number
  shouldShowOrgComparison: boolean
  hasOrganizationWideAccess: boolean
}

const getRoleDisplayName = (roleName: string | undefined) => {
  if (!roleName) return undefined
  return roleName.split('_')[0]
}

const roleAppliesToProject = (role: OrganizationRole | undefined, projectRef?: string) => {
  if (!role) return false
  if (role.projects.length === 0) return true
  if (!projectRef) return false
  return role.projects.some((project) => project.ref === projectRef)
}

export const summarizeProjectAccess = ({
  organizationMembers,
  roles,
  projectRef,
  hasLimitedVisibility,
  currentUserId,
  maxVisibleMembers = 12,
}: SummarizeProjectAccessParams): ProjectAccessSummary => {
  const allRoles = [...(roles?.org_scoped_roles ?? []), ...(roles?.project_scoped_roles ?? [])]
  const rolesById = new Map(allRoles.map((role) => [role.id, role]))

  const normalizedMembers = organizationMembers.filter(
    (member) => !member.invited_id && typeof member.gotrue_id === 'string' && !!member.primary_email
  )

  const membersWithProjectAccess = normalizedMembers
    .filter((member) =>
      member.role_ids.some((roleId) => roleAppliesToProject(rolesById.get(roleId), projectRef))
    )
    .sort((a, b) => {
      const isCurrentUserA = !!currentUserId && a.gotrue_id === currentUserId
      const isCurrentUserB = !!currentUserId && b.gotrue_id === currentUserId

      if (isCurrentUserA && !isCurrentUserB) return -1
      if (!isCurrentUserA && isCurrentUserB) return 1
      return (a.primary_email ?? '').localeCompare(b.primary_email ?? '')
    })

  const projectMembers = membersWithProjectAccess.map((member) => {
    const matchingRoleNames = member.role_ids
      .map((roleId) => rolesById.get(roleId))
      .filter((role) => roleAppliesToProject(role, projectRef))
      .map((role) => getRoleDisplayName(role?.name))
      .filter((name): name is string => typeof name === 'string' && name.length > 0)

    const uniqueRoleNames = [...new Set(matchingRoleNames)]
    const hasDisplayName =
      typeof member.username === 'string' &&
      typeof member.primary_email === 'string' &&
      member.username !== member.primary_email

    return {
      id: member.gotrue_id as string,
      displayName: hasDisplayName ? member.username : undefined,
      email: member.primary_email as string,
      role: uniqueRoleNames.length > 0 ? uniqueRoleNames.join(', ') : undefined,
    }
  })

  const projectMemberCount = projectMembers.length
  const organizationMemberCount = normalizedMembers.length
  const shouldShowOrgComparison = !hasLimitedVisibility && organizationMemberCount > 0
  const hasOrganizationWideAccess =
    shouldShowOrgComparison && projectMemberCount === organizationMemberCount

  return {
    projectMembers,
    visibleMembers: projectMembers.slice(0, maxVisibleMembers),
    hiddenMembersCount: Math.max(projectMemberCount - maxVisibleMembers, 0),
    projectMemberCount,
    organizationMemberCount,
    shouldShowOrgComparison,
    hasOrganizationWideAccess,
  }
}
