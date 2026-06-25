import dayjs from 'dayjs'

import { ALL_PROJECTS_ACCESS_SCOPE_LABEL } from './TeamAccessScope.utils'
import type { PendingInvitationAccessGrant } from '@/components/interfaces/TemporaryAccess/TemporaryAccess.types'
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

function memberHasOrgScopedRoleName(
  member: OrganizationMember,
  roles: OrganizationRolesData,
  roleName: string
) {
  const orgScopedRoles = roles.org_scoped_roles ?? []

  return (member.role_ids ?? []).some((roleId) => {
    const orgRole = orgScopedRoles.find((role) => role.id === roleId)
    return orgRole?.name === roleName
  })
}

function getPendingInviteProjectScopeCount(
  member: OrganizationMember,
  roles: OrganizationRolesData
) {
  const projectRefs = new Set<string>()

  if (member.invited_role_scoped_projects?.length) {
    member.invited_role_scoped_projects.forEach((projectRef) => projectRefs.add(projectRef))
    return projectRefs.size
  }

  const projectScopedRoles = roles.project_scoped_roles ?? []
  for (const roleId of member.role_ids ?? []) {
    const projectRole = projectScopedRoles.find((role) => role.id === roleId)
    projectRole?.projects.forEach((project) => projectRefs.add(project.ref))
  }

  return projectRefs.size
}

/** External collaborator in Team: pending invite or accepted guest with read-only platform access. */
export function isExternalCollaboratorMember(
  member: OrganizationMember,
  roles: OrganizationRolesData | undefined,
  options?: { jitSummary?: ReturnType<typeof getMemberJitGrantSummary> | null }
): boolean {
  if (!roles) return false

  const orgScopedRoles = roles.org_scoped_roles ?? []
  const hasProjectScopedReadOnly = memberHasProjectScopedReadOnlyRole(member, roles)

  if (member.invited_id) {
    if (member.invited_is_external_collaborator) return true

    // Standard Read-only / Developer / Admin invites use org-scoped role ids.
    if (memberHasOrgScopedRoleName(member, roles, 'Read-only')) return false
    if (memberHasOrgScopedRoleName(member, roles, 'Owner')) return false
    if (memberHasOrgScopedRoleName(member, roles, 'Administrator')) return false

    const scopedProjects = member.invited_role_scoped_projects ?? []
    const orgHasReadOnly = orgScopedRoles.some((role) => role.name === 'Read-only')
    if (memberHasOrgScopedRoleName(member, roles, 'Developer')) {
      // Free/Pro fallback when org Read-only is absent from /roles.
      return !orgHasReadOnly && scopedProjects.length === 1
    }

    // External collaborators are always single-project; multi-project pending invites are team members.
    if (!hasProjectScopedReadOnly) return false

    return getPendingInviteProjectScopeCount(member, roles) === 1
  }

  const jitSummary = options?.jitSummary
  const hasJitGrants = Boolean(
    jitSummary && (jitSummary.status.active > 0 || jitSummary.status.expired > 0)
  )
  if (!hasJitGrants || !hasProjectScopedReadOnly) return false

  // Internal Read-only members keep org-scoped role ids even when scoped to projects.
  const hasOrgScopedReadOnlyRole = (member.role_ids ?? []).some((roleId) => {
    const orgRole = orgScopedRoles.find((role) => role.id === roleId)
    return orgRole?.name === 'Read-only'
  })

  return !hasOrgScopedReadOnlyRole
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

function formatRelativeExpirySubtext(seconds: number): string {
  const presetLabels: Record<number, string> = {
    [60 * 60]: '1 hour expiry',
    [60 * 60 * 24]: '1 day expiry',
    [60 * 60 * 24 * 7]: '7 day expiry',
    [60 * 60 * 24 * 30]: '30 day expiry',
  }

  if (presetLabels[seconds]) return presetLabels[seconds]

  if (seconds < 60 * 60) {
    const minutes = Math.max(1, Math.round(seconds / 60))
    return `${minutes} minute${minutes === 1 ? '' : 's'} expiry`
  }

  if (seconds < 60 * 60 * 24) {
    const hours = Math.max(1, Math.round(seconds / 3600))
    return `${hours} hour${hours === 1 ? '' : 's'} expiry`
  }

  const days = Math.max(1, Math.round(seconds / (60 * 60 * 24)))
  return `${days} day${days === 1 ? '' : 's'} expiry`
}

export function formatPendingGuestAccessExpiryMeta(
  pendingAccessGrant: PendingInvitationAccessGrant | undefined
): string | null {
  const roles = pendingAccessGrant?.roles ?? []
  const relativeDurations = roles
    .map((role) => role.expires_after_seconds)
    .filter((seconds): seconds is number => typeof seconds === 'number')
  const absoluteExpiries = roles
    .map((role) => role.expires_at)
    .filter((expiresAt): expiresAt is number => typeof expiresAt === 'number')

  if (relativeDurations.length > 0) {
    return formatRelativeExpirySubtext(Math.min(...relativeDurations))
  }

  if (absoluteExpiries.length > 0) {
    const soonestExpiry = dayjs.unix(Math.min(...absoluteExpiries))
    if (soonestExpiry.isValid()) {
      return `Expires ${soonestExpiry.format('D MMM YYYY')}`
    }
  }

  return null
}

export function getPendingGuestAccessTooltip(
  pendingAccessGrant: PendingInvitationAccessGrant | undefined
): string {
  const expirySubtext = formatPendingGuestAccessExpiryMeta(pendingAccessGrant)

  if (expirySubtext?.endsWith(' expiry')) {
    const duration = expirySubtext.replace(/ expiry$/, '')
    return `This guest has not joined yet. ${duration} access starts when they accept the invitation.`
  }

  if (expirySubtext?.startsWith('Expires ')) {
    return `This guest has not joined yet. Access is set to ${expirySubtext.toLowerCase()} once they accept.`
  }

  return 'This guest has not joined yet. Database access starts when they accept the invitation.'
}

export function getMemberAccessScopeDisplay({
  member,
  roles,
  orgProjects,
  hasProjectScopedRoles,
  jitSummary,
  isPendingExternalCollaborator = false,
  isExternalCollaborator = false,
}: {
  member: OrganizationMember
  roles: OrganizationRolesData | undefined
  orgProjects: Array<{ ref: string; name: string }>
  hasProjectScopedRoles: boolean
  jitSummary: ReturnType<typeof getMemberJitGrantSummary>
  isPendingExternalCollaborator?: boolean
  /** Accepted temporary guests only — org members may have stale JIT rows from testing. */
  isExternalCollaborator?: boolean
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
    expiryMeta: isPendingExternalCollaborator
      ? formatPendingGuestAccessExpiryMeta(member.invited_pending_access_grant)
      : isExternalCollaborator && jitSummary
        ? formatMemberDatabaseExpiryMeta(jitSummary)
        : null,
  }
}
