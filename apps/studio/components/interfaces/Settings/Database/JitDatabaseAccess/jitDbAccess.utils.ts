import dayjs from 'dayjs'

import type {
  JitExpiryMode,
  JitRoleGrantDraft,
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
