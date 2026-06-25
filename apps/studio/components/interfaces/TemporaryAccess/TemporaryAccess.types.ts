export type TemporaryAccessExpiryMode = '1h' | '1d' | '7d' | '30d' | 'custom' | 'never'

export type TemporaryAccessStatus = {
  active: number
  expired: number
  activeIp: number
  expiredIp: number
}

export type TemporaryAccessStatusBadge = {
  label: string
  variant: 'default' | 'success' | 'warning'
}

export type TemporaryAccessMemberOption = {
  id: string
  email: string
  name?: string
}

export type TemporaryAccessRoleOption = {
  id: string
  label: string
}

export type TemporaryAccessIpRangeDraft = {
  value: string
}

export type TemporaryAccessRoleGrantDraft = {
  roleId: string
  enabled: boolean
  branchesOnly: boolean
  expiryMode: TemporaryAccessExpiryMode
  hasExpiry: boolean
  expiry: string
  ipRanges: TemporaryAccessIpRangeDraft[]
}

export type TemporaryAccessGrantDraft = {
  memberId: string
  grants: TemporaryAccessRoleGrantDraft[]
}

export type TemporaryAccessUserRule = {
  id: string
  memberId: string
  email: string
  name?: string
  grants: TemporaryAccessRoleGrantDraft[]
  status: TemporaryAccessStatus
}

export type TemporaryAccessGrantSheetMode = 'add' | 'edit'

/** How expiry is interpreted in the Manage database access sheet vs invite flow. */
export type TemporaryAccessExpiryContext = 'on_grant' | 'on_accept'

/**
 * Grant payload stored on invitation and applied when the invitee accepts.
 * Preset durations use expires_after_seconds (relative to accept).
 * Custom picker uses expires_at (absolute wall-clock time).
 */
export type PendingInvitationRoleGrant = {
  role: string
  expires_at?: number
  expires_after_seconds?: number
  branches_only?: boolean
  allowed_networks?: {
    allowed_cidrs?: Array<{ cidr: string }>
    allowed_cidrs_v6?: Array<{ cidr: string }>
  }
}

export type PendingInvitationAccessGrant = {
  project_ref: string
  roles: PendingInvitationRoleGrant[]
}

export type TemporaryAccessProjectGrant = {
  projectRef: string
  projectName: string
  userRoles: Array<{
    role: string
    expires_at?: number
    branches_only?: boolean
    allowed_networks?: {
      allowed_cidrs?: Array<{ cidr: string }>
      allowed_cidrs_v6?: Array<{ cidr: string }>
    }
  }>
}

// Backward-compatible aliases for JitDatabaseAccess re-exports
export type JitExpiryMode = TemporaryAccessExpiryMode
export type JitStatus = TemporaryAccessStatus
export type JitStatusBadge = TemporaryAccessStatusBadge
export type JitMemberOption = TemporaryAccessMemberOption
export type JitRoleOption = TemporaryAccessRoleOption
export type JitIpRangeDraft = TemporaryAccessIpRangeDraft
export type JitRoleGrantDraft = TemporaryAccessRoleGrantDraft
export type JitUserRuleDraft = TemporaryAccessGrantDraft
export type JitUserRule = TemporaryAccessUserRule
export type SheetMode = TemporaryAccessGrantSheetMode
