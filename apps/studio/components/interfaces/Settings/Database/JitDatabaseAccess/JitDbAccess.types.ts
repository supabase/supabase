export type JitExpiryMode = '1h' | '1d' | '7d' | '30d' | 'custom' | 'never'

export type JitStatus = {
  active: number
  expired: number
  activeIp: number
  expiredIp: number
}

export type JitStatusBadge = {
  label: string
  variant: 'default' | 'success' | 'warning'
}

export type JitMemberOption = {
  id: string
  email: string
  name?: string
}

export type JitRoleOption = {
  id: string
  label: string
}

export type JitRoleGrantDraft = {
  roleId: string
  enabled: boolean
  expiryMode: JitExpiryMode
  hasExpiry: boolean
  expiry: string
  hasIpRestriction: boolean
  ipRanges: string
}

export type JitUserRuleDraft = {
  memberId: string
  grants: JitRoleGrantDraft[]
}

export type JitUserRule = {
  id: string
  memberId: string
  email: string
  name?: string
  grants: JitRoleGrantDraft[]
  status: JitStatus
}

export type SheetMode = 'add' | 'edit'
