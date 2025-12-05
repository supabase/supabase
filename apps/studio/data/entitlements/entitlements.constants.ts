import type { components } from 'api-types'

export type FeatureKey =
  components['schemas']['ListEntitlementsResponse']['entitlements'][number]['feature']['key']

export const Feature = {
  INSTANCES_COMPUTE_AVAILABLE_SIZES: 'instances.compute_update_available_sizes',
  STORAGE_MAX_FILE_SIZE: 'storage.max_file_size',
  SECURITY_AUDIT_LOGS_DAYS: 'security.audit_logs_days',
  LOG_RETENTION_DAYS: 'log.retention_days',
  CUSTOM_DOMAIN: 'custom_domain',
  IPV4: 'ipv4',
  PITR_AVAILABLE_VARIANTS: 'pitr.available_variants',
  LOG_DRAINS: 'log_drains',
  BRANCHING_LIMIT: 'branching_limit',
  BRANCHING_PERSISTENT: 'branching_persistent',
  AUTH_MFA_PHONE: 'auth.mfa_phone',
  AUTH_HOOKS: 'auth.hooks',
} as const satisfies Record<string, FeatureKey>

export type Feature = (typeof Feature)[keyof typeof Feature]
