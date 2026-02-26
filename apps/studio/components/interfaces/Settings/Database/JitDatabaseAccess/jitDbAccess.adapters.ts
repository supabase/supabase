import { type DatabaseRolesData, type PgRole } from 'data/database-roles/database-roles-query'
import type { JitDbAccessMembersData } from 'data/jit-db-access/jit-db-access-members-query'
import type { OrganizationMembersData } from 'data/organizations/organization-members-query'
import type { ProjectMembersData } from 'data/projects/project-members-query'

import type {
  JitMemberOption,
  JitRoleGrantDraft,
  JitRoleOption,
  JitUserRule,
  JitUserRuleDraft,
} from './jitDbAccess.types'
import {
  cloneGrants,
  computeStatusFromGrants,
  createEmptyGrant,
  mergeRoleIds,
  toUnixSeconds,
} from './jitDbAccess.utils'

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

      // TODO(DEPR-366): IP restrictions are prototype-only in the UI for now and are not sent to
      // the SEC-462 backend payload until API support is available.
      void grant.hasIpRestriction
      void grant.ipRanges

      return {
        role: grant.roleId,
        ...(typeof expires_at === 'number' ? { expires_at } : {}),
      }
    })
}
