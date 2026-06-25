import dayjs from 'dayjs'

import { ALL_PROJECTS_ACCESS_SCOPE_LABEL } from './TeamAccessScope.utils'
import { EXTERNAL_COLLABORATOR_ROLE_NAME } from '@/components/interfaces/TemporaryAccess/TemporaryAccessInvite.utils'
import type { OrgMemberJitGrantSummary } from '@/data/jit-db-access/use-org-jit-grants-query'
import type {
  OrganizationRole,
  OrganizationRolesData,
} from '@/data/organization-members/organization-roles-query'
import type { OrganizationMember } from '@/data/organizations/organization-members-query'

const KNOWN_ORG_ROLE_NAMES = ['Owner', 'Administrator', 'Developer', 'Read-only'] as const

/** Internal project-scoped roles are named e.g. Read-only_<projectRef> — show the base role. */
export function resolveOrganizationRoleDisplayName(
  role: OrganizationRole,
  orgScopedRoles: OrganizationRole[]
): string {
  const orgRole = orgScopedRoles.find((candidate) => candidate.id === role.id)
  if (orgRole) return orgRole.name

  const baseRole = orgScopedRoles.find((candidate) => candidate.id === role.base_role_id)
  if (baseRole) return baseRole.name

  for (const knownRoleName of KNOWN_ORG_ROLE_NAMES) {
    if (role.name === knownRoleName || role.name.startsWith(`${knownRoleName}_`)) {
      return knownRoleName
    }
  }

  return role.name
}

export type MemberAccessScopeDisplay = {
  label: string
  projectNames: string[]
  isOrgWide: boolean
  expiryMeta: string | null
}

export function isTemporaryAccessGuestMember(
  member: OrganizationMember,
  roles: OrganizationRolesData | undefined
): boolean {
  const orgScopedRoles = roles?.org_scoped_roles ?? []
  const projectScopedRoles = roles?.project_scoped_roles ?? []

  for (const roleId of member.role_ids ?? []) {
    const projectRole = projectScopedRoles.find((role) => role.id === roleId)
    if (
      projectRole &&
      resolveOrganizationRoleDisplayName(projectRole, orgScopedRoles) === 'Read-only'
    ) {
      return true
    }

    const orgRole = orgScopedRoles.find((role) => role.id === roleId)
    if (orgRole?.name === 'Read-only') return true
  }

  return false
}

function memberHasProjectScopedReadOnlyRole(
  member: OrganizationMember,
  roles: OrganizationRolesData
) {
  const orgScopedRoles = roles.org_scoped_roles ?? []
  const projectScopedRoles = roles.project_scoped_roles ?? []

  return (member.role_ids ?? []).some((roleId) => {
    const projectRole = projectScopedRoles.find((role) => role.id === roleId)
    return (
      projectRole && resolveOrganizationRoleDisplayName(projectRole, orgScopedRoles) === 'Read-only'
    )
  })
}

/** External collaborator in Team: pending invite or accepted guest with read-only platform access. */
export function isExternalCollaboratorMember(
  member: OrganizationMember,
  roles: OrganizationRolesData | undefined,
  options?: { jitSummary?: ReturnType<typeof getMemberJitGrantSummary> | null }
): boolean {
  if (!roles) return false

  const orgScopedRoles = roles.org_scoped_roles ?? []
  const isReadOnlyGuest = isTemporaryAccessGuestMember(member, roles)
  const hasProjectScopedReadOnly = memberHasProjectScopedReadOnlyRole(member, roles)

  if (member.invited_id) {
    if (hasProjectScopedReadOnly) return true

    const scopedProjects = member.invited_role_scoped_projects ?? []
    if (isReadOnlyGuest && scopedProjects.length === 1) return true

    const orgHasReadOnly = orgScopedRoles.some((role) => role.name === 'Read-only')
    const hasOrgDeveloperRole = (member.role_ids ?? []).some((roleId) => {
      const orgRole = orgScopedRoles.find((role) => role.id === roleId)
      return orgRole?.name === 'Developer'
    })
    if (!orgHasReadOnly && hasOrgDeveloperRole && scopedProjects.length === 1) return true

    return false
  }

  if (hasProjectScopedReadOnly) return true

  if (!isReadOnlyGuest) return false

  const jitSummary = options?.jitSummary
  return Boolean(jitSummary && (jitSummary.status.active > 0 || jitSummary.status.expired > 0))
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

export function getMemberRoleNames(
  member: OrganizationMember,
  roles: OrganizationRolesData | undefined,
  options?: { isJitGuest?: boolean }
): string[] {
  if (options?.isJitGuest) {
    return [EXTERNAL_COLLABORATOR_ROLE_NAME]
  }

  const orgScopedRoles = roles?.org_scoped_roles ?? []
  const projectScopedRoles = roles?.project_scoped_roles ?? []

  const displayNames = (member.role_ids ?? [])
    .map((roleId) => {
      const role =
        orgScopedRoles.find((candidate) => candidate.id === roleId) ??
        projectScopedRoles.find((candidate) => candidate.id === roleId)

      if (!role) return undefined

      return resolveOrganizationRoleDisplayName(role, orgScopedRoles)
    })
    .filter((name): name is string => Boolean(name))

  return [...new Set(displayNames)]
}

export function formatMemberDatabaseExpiryMeta(
  jitSummary: NonNullable<ReturnType<typeof getMemberJitGrantSummary>>
): string | null {
  const { grants, status } = jitSummary

  if (status.active === 0 && status.expired === 0) return null

  if (status.active === 0 && status.expired > 0) {
    return 'Database access expired'
  }

  const expiryTimestamps = grants.flatMap((grant) =>
    grant.userRoles
      .map((role) => role.expires_at)
      .filter((expiresAt): expiresAt is number => typeof expiresAt === 'number')
  )

  if (expiryTimestamps.length === 0) {
    return 'Database access active'
  }

  const soonestExpiry = dayjs.unix(Math.min(...expiryTimestamps))
  if (!soonestExpiry.isValid()) return 'Database access active'

  if (soonestExpiry.isBefore(dayjs())) {
    return 'Database access expired'
  }

  const minutesLeft = soonestExpiry.diff(dayjs(), 'minute')
  if (minutesLeft < 60) {
    return `Database access expires in ${minutesLeft === 0 ? '<1m' : `${minutesLeft}m`}`
  }

  if (minutesLeft < 60 * 24) {
    const hoursLeft = Math.max(1, Math.round(minutesLeft / 60))
    return `Database access expires in ${hoursLeft}h`
  }

  return `Database access expires ${soonestExpiry.format('D MMM YYYY, h:mma')}`
}

export function getMemberAccessScopeDisplay({
  member,
  roles,
  orgProjects,
  hasProjectScopedRoles,
  jitSummary,
}: {
  member: OrganizationMember
  roles: OrganizationRolesData | undefined
  orgProjects: Array<{ ref: string; name: string }>
  hasProjectScopedRoles: boolean
  jitSummary: ReturnType<typeof getMemberJitGrantSummary>
}): MemberAccessScopeDisplay {
  const orgScopedRoles = roles?.org_scoped_roles ?? []
  const projectScopedRoles = roles?.project_scoped_roles ?? []
  const projectNames = new Set<string>()
  let isOrgWide = false

  if (member.invited_id && member.invited_role_scoped_projects?.length) {
    member.invited_role_scoped_projects.forEach((projectRef) => {
      const name = orgProjects.find((item) => item.ref === projectRef)?.name ?? projectRef
      projectNames.add(name)
    })
  } else {
    for (const roleId of member.role_ids ?? []) {
      const orgScopedRole = orgScopedRoles.find((role) => role.id === roleId)
      const projectScopedRole = projectScopedRoles.find((role) => role.id === roleId)
      const role = orgScopedRole ?? projectScopedRole

      if (!role) continue

      if (!hasProjectScopedRoles || role.projects.length === 0) {
        isOrgWide = true
        break
      }

      role.projects.forEach((project) => {
        const name = orgProjects.find((item) => item.ref === project.ref)?.name ?? project.ref
        projectNames.add(name)
      })
    }
  }

  let label: string
  if (isOrgWide) {
    label = hasProjectScopedRoles ? ALL_PROJECTS_ACCESS_SCOPE_LABEL : 'Organization'
  } else if (projectNames.size === 1) {
    label = [...projectNames][0] ?? '1 project'
  } else if (projectNames.size > 1) {
    label = `${projectNames.size} projects`
  } else {
    label = '—'
  }

  return {
    label,
    projectNames: [...projectNames],
    isOrgWide,
    expiryMeta: jitSummary ? formatMemberDatabaseExpiryMeta(jitSummary) : null,
  }
}
