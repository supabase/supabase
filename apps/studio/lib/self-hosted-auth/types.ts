import type { components } from '@/data/api'

export type GoTrueConfigResponse = components['schemas']['GoTrueConfigResponse']

export interface SelfHostedAuthCapabilities {
  users: boolean
  policies: boolean
  urlConfiguration: boolean
  emails: boolean
  providers: boolean
  multiFactor: boolean
  sessions: boolean
  rateLimits: boolean
  attackProtection: boolean
  authHooks: boolean
  auditLogs: boolean
  oauthApps: boolean
  oauthServer: boolean
  passkeys: boolean
  performance: boolean
}

export interface SelfHostedAuthApplyStatus {
  status: 'healthy' | 'unhealthy' | 'applying' | 'rollback_failed' | 'rollback_success'
  revision: string
  appliedAt: string
  authContainer: string
  health: 'healthy' | 'unhealthy' | 'unknown'
}

export interface AuthManagerUpdatePayload {
  changedFields: string[]
  secretFieldsChanged: string[]
  revision: string
  result: 'success' | 'failed'
}
