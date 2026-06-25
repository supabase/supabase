import type { OrgMemberJitGrantSummary } from '@/data/jit-db-access/use-org-jit-grants-query'
import type { OrganizationRolesData } from '@/data/organization-members/organization-roles-query'
import type { OrganizationMember } from '@/data/organizations/organization-members-query'

export function isTemporaryAccessGuestMember(
  member: OrganizationMember,
  roles: OrganizationRolesData | undefined
): boolean {
  const orgScopedRoles = roles?.org_scoped_roles ?? []
  const projectScopedRoles = roles?.project_scoped_roles ?? []

  for (const roleId of member.role_ids ?? []) {
    const projectRole = projectScopedRoles.find((role) => role.id === roleId)
    if (projectRole) {
      const baseRole = orgScopedRoles.find((role) => role.id === projectRole.base_role_id)
      if (baseRole?.name === 'Read-only') return true
    }

    const orgRole = orgScopedRoles.find((role) => role.id === roleId)
    if (orgRole?.name === 'Read-only') return true
  }

  return false
}

export function getMemberJitGrantSummary(
  member: OrganizationMember,
  grantsByUserId: Map<string, OrgMemberJitGrantSummary[]>
) {
  if (!member.gotrue_id) return null
  const grants = grantsByUserId.get(member.gotrue_id) ?? []
  if (grants.length === 0) return null

  const active = grants.reduce((sum, grant) => sum + grant.status.active, 0)
  const expired = grants.reduce((sum, grant) => sum + grant.status.expired, 0)

  return { grants, status: { active, expired, activeIp: 0, expiredIp: 0 } }
}
