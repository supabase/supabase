import dayjs from 'dayjs'
import { IPv4CidrRange, IPv6CidrRange } from 'ip-num'

import type {
  TemporaryAccessExpiryMode,
  TemporaryAccessGrantDraft,
  TemporaryAccessIpRangeDraft,
  TemporaryAccessMemberOption,
  TemporaryAccessRoleGrantDraft,
  TemporaryAccessRoleOption,
  TemporaryAccessStatus,
  TemporaryAccessStatusBadge,
  TemporaryAccessUserRule,
} from './TemporaryAccess.types'
import { SUPABASE_ROLES } from '@/components/interfaces/Database/Roles/Roles.constants'
import { type DatabaseRolesData, type PgRole } from '@/data/database-roles/database-roles-query'
import type { JitDbAccessMembersData } from '@/data/jit-db-access/jit-db-access-members-query'
import type { OrganizationMembersData } from '@/data/organizations/organization-members-query'
import type { ProjectMembersData } from '@/data/projects/project-members-query'

export function getRelativeDatetimeByMode(mode: TemporaryAccessExpiryMode) {
  if (mode === '1h') return dayjs().add(1, 'hour').toISOString()
  if (mode === '1d') return dayjs().add(1, 'day').toISOString()
  if (mode === '7d') return dayjs().add(7, 'day').toISOString()
  if (mode === '30d') return dayjs().add(30, 'day').toISOString()
  return ''
}

function inferExpiryMode(
  grant: Pick<TemporaryAccessRoleGrantDraft, 'hasExpiry'>
): TemporaryAccessExpiryMode {
  if (!grant.hasExpiry) return 'never'
  return 'custom'
}

export function createEmptyGrant(roleId: string): TemporaryAccessRoleGrantDraft {
  return {
    roleId,
    enabled: false,
    branchesOnly: false,
    expiryMode: '1h',
    hasExpiry: true,
    expiry: getRelativeDatetimeByMode('1h'),
    ipRanges: [createEmptyIpRange()],
  }
}

export function createEmptyIpRange(): TemporaryAccessIpRangeDraft {
  return { value: '' }
}

function parseIpRangeRows(value: TemporaryAccessIpRangeDraft[]) {
  return value.map((item) => item.value.trim()).filter((item) => item.length > 0)
}

function cloneIpRanges(ipRanges: TemporaryAccessIpRangeDraft[]) {
  return ipRanges.map((ipRange) => ({ ...ipRange }))
}

function cloneGrants(grants: TemporaryAccessRoleGrantDraft[]) {
  return grants.map((grant) => ({ ...grant, ipRanges: cloneIpRanges(grant.ipRanges) }))
}

export function createGrantDraft(roleIds: string[]): TemporaryAccessGrantDraft {
  return { memberId: '', grants: roleIds.map((roleId) => createEmptyGrant(roleId)) }
}

function mergeRoleIds(baseRoleIds: string[], extraRoleIds: string[]) {
  const seen = new Set<string>()
  const merged: string[] = []

  for (const roleId of [...baseRoleIds, ...extraRoleIds]) {
    if (seen.has(roleId)) continue
    seen.add(roleId)
    merged.push(roleId)
  }

  return merged
}

export function draftFromUserRule(
  rule: TemporaryAccessUserRule,
  baseRoleIds: string[]
): TemporaryAccessGrantDraft {
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
        ipRanges: cloneIpRanges(nextGrant.ipRanges),
      }
    }),
  }
}

export function computeStatusFromGrants(
  grants: TemporaryAccessRoleGrantDraft[]
): TemporaryAccessStatus {
  const enabledGrants = grants.filter((grant) => grant.enabled)

  let active = 0
  let expired = 0
  let activeIp = 0
  let expiredIp = 0

  enabledGrants.forEach((grant) => {
    const hasIp = parseIpRangeRows(grant.ipRanges).length > 0

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

export function getMinutesUntilExpiry(grants: TemporaryAccessRoleGrantDraft[]): number | null {
  const enabledWithExpiry = grants.filter(
    (grant) => grant.enabled && grant.hasExpiry && grant.expiry && dayjs(grant.expiry).isValid()
  )

  if (enabledWithExpiry.length === 0) return null

  const soonest = enabledWithExpiry.reduce((earliest, grant) => {
    const grantExpiry = dayjs(grant.expiry)
    return grantExpiry.isBefore(earliest) ? grantExpiry : earliest
  }, dayjs(enabledWithExpiry[0].expiry))

  if (soonest.isBefore(dayjs())) return 0

  return Math.max(0, soonest.diff(dayjs(), 'minute'))
}

function formatBadgeLabel(raw: string, showCount: boolean): string {
  if (showCount) return raw
  return raw
    .replace(/^\d+\s/, '')
    .replace(/·\s*\d+\s/g, '· ')
    .replace(/^./, (c) => c.toUpperCase())
}

export function getTemporaryAccessStatusDisplay(status: TemporaryAccessStatus): {
  badges: TemporaryAccessStatusBadge[]
} {
  const { active, expired, activeIp } = status
  const badges: TemporaryAccessStatusBadge[] = []
  const showCount = (active > 0 ? 1 : 0) + (expired > 0 ? 1 : 0) > 1

  if (active > 0) {
    const raw = activeIp > 0 ? `${active} active · ${activeIp} IP` : `${active} active`
    badges.push({ label: formatBadgeLabel(raw, showCount), variant: 'success' })
  }

  if (expired > 0) {
    const raw = `${expired} expired`
    badges.push({ label: formatBadgeLabel(raw, showCount), variant: 'default' })
  }

  return { badges }
}

function toUnixSeconds(datetimeIso: string) {
  const value = dayjs(datetimeIso)
  if (!value.isValid()) return undefined
  return value.unix()
}

function isValidCidr(value: string) {
  try {
    if (value.includes(':')) {
      IPv6CidrRange.fromCidr(value)
      return true
    }

    IPv4CidrRange.fromCidr(value)
    return true
  } catch {
    return false
  }
}

export function getInvalidIpRangeRows(value: TemporaryAccessIpRangeDraft[]) {
  return parseIpRangeRows(value).filter((cidr) => !isValidCidr(cidr))
}

/** Built-in Postgres roles always offered for temporary database access. */
export const BUILTIN_TEMPORARY_ACCESS_ROLE_NAMES = ['postgres', 'supabase_read_only_user'] as const

function isBuiltinTemporaryAccessRole(roleName: string) {
  return (BUILTIN_TEMPORARY_ACCESS_ROLE_NAMES as readonly string[]).includes(roleName)
}

/** User-created roles shown under "Other database roles" on Database → Roles. */
function isUserManagedCustomRole(roleName: string) {
  return (
    !isBuiltinTemporaryAccessRole(roleName) &&
    !(SUPABASE_ROLES as readonly string[]).includes(roleName) &&
    !roleName.startsWith('pg_')
  )
}

function isAssignableTemporaryAccessRole(role: PgRole) {
  // postgres is a superuser in Postgres but is a first-class JIT grant target in Studio
  if (isBuiltinTemporaryAccessRole(role.name)) {
    return role.canLogin
  }

  return (
    role.canLogin &&
    !role.isSuperuser &&
    !role.name.startsWith('pg_') &&
    (!role.name.startsWith('supabase_') || role.name === 'supabase_read_only_user') &&
    !['pgbouncer', 'authenticator'].includes(role.name)
  )
}

export function getUnassignableTemporaryAccessRoleReason(role: PgRole): string | null {
  if (isAssignableTemporaryAccessRole(role)) return null

  if (!role.canLogin) return 'login disabled'
  if (role.isSuperuser && !isBuiltinTemporaryAccessRole(role.name)) return 'superuser'
  if (role.name.startsWith('pg_')) return 'system role'
  if (role.name.startsWith('supabase_')) return 'reserved Supabase role'
  if (['pgbouncer', 'authenticator'].includes(role.name)) return 'not grantable'

  return 'not grantable'
}

export function getHiddenCustomTemporaryAccessRoles(
  databaseRoles?: DatabaseRolesData | null
): Array<{ name: string; reason: string }> {
  return (databaseRoles ?? [])
    .filter((role) => isUserManagedCustomRole(role.name))
    .filter((role) => !isAssignableTemporaryAccessRole(role))
    .map((role) => ({
      name: role.name,
      reason: getUnassignableTemporaryAccessRoleReason(role) ?? 'not grantable',
    }))
}

export function getTemporaryAccessHiddenRolesDescription(
  databaseRoles?: DatabaseRolesData | null
): string | null {
  return formatHiddenTemporaryAccessRolesMessage(getHiddenCustomTemporaryAccessRoles(databaseRoles))
}

export function formatHiddenTemporaryAccessRolesMessage(
  hiddenRoles: Array<{ name: string; reason: string }>
): string | null {
  if (hiddenRoles.length === 0) return null

  const roleList = hiddenRoles.map((role) => `${role.name} (${role.reason})`).join(', ')

  if (hiddenRoles.length === 1) {
    return `1 custom role is not shown for temporary access: ${roleList}.`
  }

  return `${hiddenRoles.length} custom roles are not shown for temporary access: ${roleList}.`
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

export function getAssignableTemporaryAccessRoleOptions(
  databaseRoles?: DatabaseRolesData | null
): TemporaryAccessRoleOption[] {
  const fromApi =
    databaseRoles
      ?.filter(isAssignableTemporaryAccessRole)
      .map((role) => ({ id: role.name, label: role.name })) ?? []

  const seen = new Set(fromApi.map((role) => role.id))
  const builtins = BUILTIN_TEMPORARY_ACCESS_ROLE_NAMES.filter((name) => !seen.has(name)).map(
    (name) => ({ id: name, label: name })
  )

  return [...fromApi, ...builtins].sort((a, b) => a.label.localeCompare(b.label))
}

export function getTemporaryAccessMemberOptions(
  organizationMembers?: OrganizationMembersData | null,
  projectMembers?: ProjectMembersData | null
): TemporaryAccessMemberOption[] {
  const byId = new Map<string, TemporaryAccessMemberOption>()

  for (const member of organizationMembers ?? []) {
    if (!member.gotrue_id) continue

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
  roleOptions: TemporaryAccessRoleOption[]
): TemporaryAccessUserRule[] {
  const memberMap = new Map((projectMembers ?? []).map((member) => [member.user_id, member]))
  const baseRoleIds = roleOptions.map((role) => role.id)

  return (jitMembers ?? []).map((item) => {
    const mappedMember = memberMap.get(item.user_id)
    const assignedRoles: TemporaryAccessRoleGrantDraft[] = (item.user_roles ?? []).map(
      (roleObj) => {
        const roleWithBranchRestriction = roleObj as typeof roleObj & { branches_only?: boolean }
        const expiresAt = typeof roleObj.expires_at === 'number' ? roleObj.expires_at : undefined
        const hasExpiry = typeof expiresAt === 'number'
        const allowedNetworks = serializeAllowedNetworks(roleObj)

        return {
          ...createEmptyGrant(roleObj.role),
          roleId: roleObj.role,
          enabled: true,
          branchesOnly: roleWithBranchRestriction.branches_only ?? false,
          hasExpiry,
          expiryMode: hasExpiry ? 'custom' : 'never',
          expiry: hasExpiry ? new Date(expiresAt * 1000).toISOString() : '',
          ipRanges:
            allowedNetworks.length > 0
              ? allowedNetworks.map((cidr) => ({ value: cidr }))
              : [createEmptyIpRange()],
        }
      }
    )

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

export function computeStatusFromApiRoles(
  userRoles: Array<{ role: string; expires_at?: number }>
): TemporaryAccessStatus {
  const grants = userRoles.map((roleObj) => {
    const expiresAt = typeof roleObj.expires_at === 'number' ? roleObj.expires_at : undefined
    const hasExpiry = typeof expiresAt === 'number'

    return {
      ...createEmptyGrant(roleObj.role),
      roleId: roleObj.role,
      enabled: true,
      hasExpiry,
      expiryMode: hasExpiry ? ('custom' as const) : ('never' as const),
      expiry: hasExpiry ? new Date(expiresAt * 1000).toISOString() : '',
    }
  })

  return computeStatusFromGrants(grants)
}

export function getJitGrantHoldersForPostgresRole({
  jitMembers,
  roleName,
  memberEmailByUserId,
}: {
  jitMembers: JitDbAccessMembersData | undefined
  roleName: string
  memberEmailByUserId?: Map<string, string>
}) {
  return (jitMembers ?? [])
    .map((item) => {
      const matchingGrants = (item.user_roles ?? []).filter((grant) => grant.role === roleName)
      if (matchingGrants.length === 0) return null

      const nowUnix = dayjs().unix()
      const hasActiveGrant = matchingGrants.some(
        (grant) => typeof grant.expires_at !== 'number' || grant.expires_at > nowUnix
      )

      return {
        userId: item.user_id,
        email: memberEmailByUserId?.get(item.user_id) ?? item.user_id,
        grantCount: matchingGrants.length,
        hasActiveGrant,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
}

export function serializeDraftRolesForGrantMutation(draft: TemporaryAccessGrantDraft) {
  const serializeAllowedNetworksFromDraft = (value: TemporaryAccessIpRangeDraft[]) => {
    const cidrs = parseIpRangeRows(value)
    if (cidrs.length === 0) return undefined

    const allowed_cidrs = cidrs.filter((cidr) => !cidr.includes(':')).map((cidr) => ({ cidr }))
    const allowed_cidrs_v6 = cidrs.filter((cidr) => cidr.includes(':')).map((cidr) => ({ cidr }))

    return {
      ...(allowed_cidrs.length > 0 ? { allowed_cidrs } : {}),
      ...(allowed_cidrs_v6.length > 0 ? { allowed_cidrs_v6 } : {}),
    }
  }

  return draft.grants
    .filter((grant) => grant.enabled)
    .map((grant) => {
      const expires_at = grant.hasExpiry ? toUnixSeconds(grant.expiry) : undefined
      const allowed_networks = serializeAllowedNetworksFromDraft(grant.ipRanges)
      return {
        role: grant.roleId,
        ...(grant.branchesOnly ? { branches_only: true } : {}),
        ...(typeof expires_at === 'number' ? { expires_at } : {}),
        ...(allowed_networks ? { allowed_networks } : {}),
      }
    })
}

// Backward-compatible aliases
export const createDraft = createGrantDraft
export const draftFromRule = draftFromUserRule
export const getAssignableJitRoleOptions = getAssignableTemporaryAccessRoleOptions
export const getJitMemberOptions = getTemporaryAccessMemberOptions
export const getJitStatusDisplay = getTemporaryAccessStatusDisplay
