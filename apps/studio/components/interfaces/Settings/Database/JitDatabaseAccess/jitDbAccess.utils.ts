import { type DatabaseRolesData, type PgRole } from 'data/database-roles/database-roles-query'
import type { JitDbAccessMembersData } from 'data/jit-db-access/jit-db-access-members-query'
import type { OrganizationMembersData } from 'data/organizations/organization-members-query'
import type { ProjectMembersData } from 'data/projects/project-members-query'
import dayjs from 'dayjs'

import type {
  JitExpiryMode,
  JitMemberOption,
  JitRoleGrantDraft,
  JitRoleOption,
  JitStatus,
  JitStatusBadge,
  JitUserRule,
  JitUserRuleDraft,
} from './jitDbAccess.types'

export function getRelativeDatetimeByMode(mode: JitExpiryMode) {
  if (mode === '1h') return dayjs().add(1, 'hour').toISOString()
  if (mode === '1d') return dayjs().add(1, 'day').toISOString()
  if (mode === '7d') return dayjs().add(7, 'day').toISOString()
  if (mode === '30d') return dayjs().add(30, 'day').toISOString()
  return ''
}

export function inferExpiryMode(grant: Pick<JitRoleGrantDraft, 'hasExpiry'>): JitExpiryMode {
  if (!grant.hasExpiry) return 'never'
  return 'custom'
}

export function createEmptyGrant(roleId: string): JitRoleGrantDraft {
  return {
    roleId,
    enabled: false,
    expiryMode: '1h',
    hasExpiry: true,
    expiry: getRelativeDatetimeByMode('1h'),
    hasIpRestriction: false,
    ipRanges: '',
  }
}

export function createEmptyGrants(roleIds: string[]) {
  return roleIds.map((roleId) => createEmptyGrant(roleId))
}

export function cloneGrants(grants: JitRoleGrantDraft[]) {
  return grants.map((grant) => ({ ...grant }))
}

export function createDraft(roleIds: string[]): JitUserRuleDraft {
  return { memberId: '', grants: createEmptyGrants(roleIds) }
}

export function mergeRoleIds(baseRoleIds: string[], extraRoleIds: string[]) {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const roleId of [...baseRoleIds, ...extraRoleIds]) {
    if (seen.has(roleId)) continue
    seen.add(roleId)
    merged.push(roleId)
  }

  return merged
}

export function draftFromRule(rule: JitUserRule, baseRoleIds: string[]): JitUserRuleDraft {
  const byRoleId = new Map(rule.grants.map((grant) => [grant.roleId, grant]))
  const mergedRoleIds = mergeRoleIds(
    baseRoleIds,
    rule.grants.map((grant) => grant.roleId)
  )

  return {
    memberId: rule.memberId,
    grants: mergedRoleIds.map((roleId) => {
      const nextGrant = {
        ...createEmptyGrant(roleId),
        ...(byRoleId.get(roleId) ?? {}),
      }

      return {
        ...nextGrant,
        expiryMode: inferExpiryMode(nextGrant),
      }
    }),
  }
}

export function computeStatusFromGrants(grants: JitRoleGrantDraft[]): JitStatus {
  const enabledGrants = grants.filter((grant) => grant.enabled)

  let active = 0
  let expired = 0
  let activeIp = 0
  let expiredIp = 0

  enabledGrants.forEach((grant) => {
    const hasIp = grant.hasIpRestriction && grant.ipRanges.trim().length > 0

    if (!grant.hasExpiry || !grant.expiry) {
      active += 1
      if (hasIp) activeIp += 1
      return
    }

    const isExpired = dayjs(grant.expiry).isValid() && dayjs(grant.expiry).isBefore(dayjs())

    if (isExpired) {
      expired += 1
      if (hasIp) expiredIp += 1
      return
    }

    active += 1
    if (hasIp) activeIp += 1
  })

  return { active, expired, activeIp, expiredIp }
}

export function getJitStatusDisplay(status: JitStatus): { badges: JitStatusBadge[] } {
  const { active, expired, activeIp } = status
  const badges: JitStatusBadge[] = []

  if (active > 0) {
    const label = activeIp > 0 ? `${active} active · ${activeIp} IP` : `${active} active`
    badges.push({ label, variant: 'success' })
  }

  if (expired > 0) {
    badges.push({ label: `${expired} expired`, variant: 'default' })
  }

  return { badges }
}

export function toUnixSeconds(datetimeIso: string) {
  const value = dayjs(datetimeIso)
  if (!value.isValid()) return undefined
  return value.unix()
}

function isAssignableJitRole(role: PgRole) {
  return (
    role.canLogin &&
    !role.isSuperuser &&
    !role.name.startsWith('pg_') &&
    (!role.name.startsWith('supabase_') || role.name === 'supabase_read_only_user') &&
    !['pgbouncer', 'authenticator'].includes(role.name)
  )
}

function serializeAllowedNetworks(roleObj: {
  allowed_networks?: {
    allowed_cidrs?: Array<{ cidr: string }>
    allowed_cidrs_v6?: Array<{ cidr: string }>
  }
}) {
  const cidrs = roleObj.allowed_networks?.allowed_cidrs?.map((item) => item.cidr) ?? []
  const cidrsV6 = roleObj.allowed_networks?.allowed_cidrs_v6?.map((item) => item.cidr) ?? []
  return [...cidrs, ...cidrsV6]
}

export function getAssignableJitRoleOptions(
  databaseRoles?: DatabaseRolesData | null
): JitRoleOption[] {
  return (
    databaseRoles
      ?.filter(isAssignableJitRole)
      .map((role) => ({ id: role.name, label: role.name }))
      .sort((a, b) => a.label.localeCompare(b.label)) ?? []
  )
}

export function getJitMemberOptions(
  organizationMembers?: OrganizationMembersData | null,
  projectMembers?: ProjectMembersData | null
): JitMemberOption[] {
  const byId = new Map<string, JitMemberOption>()

  for (const member of organizationMembers ?? []) {
    const id = member.gotrue_id ?? member.primary_email
    if (!id) continue

    byId.set(id, {
      id,
      email: member.primary_email ?? id,
      name: member.username || undefined,
    })
  }

  for (const member of projectMembers ?? []) {
    const id = member.user_id ?? member.primary_email
    if (!id) continue

    byId.set(id, {
      id,
      email: member.primary_email ?? byId.get(id)?.email ?? id,
      name: member.username ?? byId.get(id)?.name,
    })
  }

  return Array.from(byId.values()).sort((a, b) => a.email.localeCompare(b.email))
}

export function mapJitMembersToUserRules(
  jitMembers: JitDbAccessMembersData | undefined,
  projectMembers: ProjectMembersData | undefined,
  roleOptions: JitRoleOption[]
): JitUserRule[] {
  const memberMap = new Map((projectMembers ?? []).map((member) => [member.user_id, member]))
  const baseRoleIds = roleOptions.map((role) => role.id)

  return (jitMembers ?? []).map((item) => {
    const mappedMember = memberMap.get(item.user_id)
    const assignedRoles: JitRoleGrantDraft[] = (item.user_roles ?? []).map((roleObj) => {
      const expiresAt = typeof roleObj.expires_at === 'number' ? roleObj.expires_at : undefined
      const hasExpiry = typeof expiresAt === 'number'
      const allowedNetworks = serializeAllowedNetworks(roleObj)

      return {
        ...createEmptyGrant(roleObj.role),
        roleId: roleObj.role,
        enabled: true,
        hasExpiry,
        expiryMode: hasExpiry ? 'custom' : 'never',
        expiry: hasExpiry ? new Date(expiresAt * 1000).toISOString() : '',
        hasIpRestriction: allowedNetworks.length > 0,
        ipRanges: allowedNetworks.join(', '),
      }
    })

    const assignedByRoleId = new Map(assignedRoles.map((grant) => [grant.roleId, grant]))
    const allRoleIds = mergeRoleIds(
      baseRoleIds,
      assignedRoles.map((grant) => grant.roleId)
    )
    const grants = allRoleIds.map((roleId) => ({
      ...createEmptyGrant(roleId),
      ...(assignedByRoleId.get(roleId) ?? {}),
      roleId,
    }))

    const email = mappedMember?.primary_email ?? item.user_id
    const name = mappedMember?.username ?? undefined

    return {
      id: item.user_id,
      memberId: item.user_id,
      email,
      name,
      grants: cloneGrants(grants),
      status: computeStatusFromGrants(grants),
    }
  })
}

export function serializeDraftRolesForGrantMutation(draft: JitUserRuleDraft) {
  return draft.grants
    .filter((grant) => grant.enabled)
    .map((grant) => {
      const expires_at = grant.hasExpiry ? toUnixSeconds(grant.expiry) : undefined

      // TODO(DEPR-366): IP restrictions are shown in the UI but not yet supported by the
      // SEC-462 write payload, so only role + optional expiry are sent here.
      return {
        role: grant.roleId,
        ...(typeof expires_at === 'number' ? { expires_at } : {}),
      }
    })
}
