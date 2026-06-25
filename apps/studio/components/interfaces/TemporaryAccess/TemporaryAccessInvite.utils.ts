import type {
  PendingInvitationAccessGrant,
  PendingInvitationRoleGrant,
  TemporaryAccessGrantDraft,
  TemporaryAccessIpRangeDraft,
  TemporaryAccessRoleGrantDraft,
} from './TemporaryAccess.types'
import {
  createEmptyGrant,
  createGrantDraft,
  getInvalidIpRangeRows,
  getRelativeDatetimeByMode,
} from './TemporaryAccess.utils'

/** Form-only role id — maps to Read-only org role + pending JIT grant on invite. */
export const EXTERNAL_COLLABORATOR_ROLE_ID = '__external_collaborator__' as const

export const EXTERNAL_COLLABORATOR_ROLE_NAME = 'External collaborator'

export const EXTERNAL_COLLABORATOR_ROLE_DESCRIPTION =
  'Project-scoped guest with minimal Studio access and temporary database connections.'

const EXPIRY_MODE_TO_SECONDS: Record<'1h' | '1d' | '7d' | '30d', number> = {
  '1h': 60 * 60,
  '1d': 60 * 60 * 24,
  '7d': 60 * 60 * 24 * 7,
  '30d': 60 * 60 * 24 * 30,
}

export function isExternalCollaboratorRole(roleId: string) {
  return roleId === EXTERNAL_COLLABORATOR_ROLE_ID
}

export function createInviteGuestGrantDraft(roleIds: string[]): TemporaryAccessGrantDraft {
  const draft = createGrantDraft(roleIds)

  return {
    ...draft,
    grants: draft.grants.map((grant) => {
      if (grant.roleId !== 'supabase_read_only_user') return grant

      return {
        ...grant,
        enabled: true,
        hasExpiry: true,
        expiryMode: '1h',
        expiry: getRelativeDatetimeByMode('1h'),
      }
    }),
  }
}

function serializeAllowedNetworksFromDraft(value: TemporaryAccessIpRangeDraft[]) {
  const cidrs = value
    .map((row) => row.value.trim())
    .filter(Boolean)
    .filter((cidr) => !getInvalidIpRangeRows([{ value: cidr }]).includes(cidr))

  if (cidrs.length === 0) return undefined

  const allowed_cidrs = cidrs.filter((cidr) => !cidr.includes(':')).map((cidr) => ({ cidr }))
  const allowed_cidrs_v6 = cidrs.filter((cidr) => cidr.includes(':')).map((cidr) => ({ cidr }))

  return {
    ...(allowed_cidrs.length > 0 ? { allowed_cidrs } : {}),
    ...(allowed_cidrs_v6.length > 0 ? { allowed_cidrs_v6 } : {}),
  }
}

function toUnixSeconds(datetimeIso: string) {
  const timestamp = Math.floor(new Date(datetimeIso).getTime() / 1000)
  return Number.isFinite(timestamp) ? timestamp : undefined
}

export function serializeInviteGrantsForPendingPayload(
  draft: TemporaryAccessGrantDraft
): PendingInvitationRoleGrant[] {
  return draft.grants
    .filter((grant) => grant.enabled)
    .map((grant) => {
      const allowed_networks = serializeAllowedNetworksFromDraft(grant.ipRanges)
      const base = {
        role: grant.roleId,
        ...(grant.branchesOnly ? { branches_only: true } : {}),
        ...(allowed_networks ? { allowed_networks } : {}),
      }

      if (!grant.hasExpiry || grant.expiryMode === 'never') {
        return base
      }

      if (grant.expiryMode === 'custom') {
        const expires_at = toUnixSeconds(grant.expiry)
        if (typeof expires_at !== 'number') {
          throw new Error(`Invalid expiry for role ${grant.roleId}`)
        }
        return { ...base, expires_at }
      }

      const expires_after_seconds = EXPIRY_MODE_TO_SECONDS[grant.expiryMode]
      if (!expires_after_seconds) {
        throw new Error(`Invalid expiry mode for role ${grant.roleId}`)
      }

      return { ...base, expires_after_seconds }
    })
}

export function validateGuestAccessGrants(grants: TemporaryAccessRoleGrantDraft[]) {
  const enabledGrants = grants.filter((grant) => grant.enabled)

  if (enabledGrants.length === 0) {
    return 'Select at least one Postgres role.'
  }

  for (const grant of enabledGrants) {
    if (grant.expiryMode === 'never') {
      return 'External collaborators must have an expiry.'
    }

    if (grant.hasExpiry && grant.expiryMode === 'custom' && !grant.expiry) {
      return 'Select an expiry date for custom access duration.'
    }

    const invalidCidrs = getInvalidIpRangeRows(grant.ipRanges)
    if (invalidCidrs.length > 0) {
      return `Invalid IP range: ${invalidCidrs[0]}`
    }
  }

  return null
}

export function buildPendingInvitationAccessGrant(
  projectRef: string,
  guestAccess: TemporaryAccessGrantDraft
): PendingInvitationAccessGrant {
  const validationError = validateGuestAccessGrants(guestAccess.grants)
  if (validationError) throw new Error(validationError)

  const roles = serializeInviteGrantsForPendingPayload(guestAccess)
  if (roles.length === 0) throw new Error('Select at least one Postgres role.')

  return {
    project_ref: projectRef,
    roles,
  }
}

export function mergeGuestGrantsWithRoleIds(
  current: TemporaryAccessGrantDraft,
  roleIds: string[]
): TemporaryAccessGrantDraft {
  if (roleIds.length === 0) {
    return { memberId: '', grants: [] }
  }

  const assignedByRoleId = new Map(current.grants.map((grant) => [grant.roleId, grant]))

  return {
    memberId: '',
    grants: roleIds.map((roleId) => {
      const existing = assignedByRoleId.get(roleId)
      return existing ?? createEmptyGrant(roleId)
    }),
  }
}
