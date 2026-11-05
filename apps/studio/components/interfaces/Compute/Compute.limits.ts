import { COMPUTE_INSTANCE_SIZES } from './Compute.constants'
import type { OrgPlan } from '@/data/subscriptions/types'

export const COMPUTE_LIMITS_MODES = ['alpha', 'plans'] as const

export type ComputeLimitsMode = (typeof COMPUTE_LIMITS_MODES)[number]

export const DEFAULT_COMPUTE_LIMITS_MODE: ComputeLimitsMode = 'alpha'

/** `null` means no fixed limit. */
export interface ComputeLimits {
  activeHours: number | null
  deployments: number | null
  instances: number | null
}

// TODO: confirm the live instance cap with the workers-infra team. API fixtures use 100.
export const COMPUTE_ALPHA_LIMITS: ComputeLimits = {
  activeHours: null,
  deployments: null,
  instances: 2,
}

export const COMPUTE_PLAN_LIMITS: Record<OrgPlan['id'], ComputeLimits> = {
  free: { activeHours: 300, deployments: 1, instances: 1 },
  pro: { activeHours: 3000, deployments: 10, instances: 25 },
  team: { activeHours: 12000, deployments: 30, instances: 75 },
  platform: { activeHours: 12000, deployments: 30, instances: 75 },
  enterprise: { activeHours: null, deployments: null, instances: null },
}

export const COMPUTE_ALLOWANCE_WARNING_THRESHOLD = 0.8

export const COMPUTE_ALPHA_CONSTRAINTS = {
  sizes: COMPUTE_INSTANCE_SIZES,
  region: 'us-west-2',
  idleSuspendSeconds: 300,
  maxInstanceLifetimeHours: 8,
} as const

export const getComputeLimits = (
  mode: ComputeLimitsMode,
  planId: OrgPlan['id'] | undefined
): ComputeLimits => {
  if (mode === 'alpha') return COMPUTE_ALPHA_LIMITS
  if (planId === undefined || !(planId in COMPUTE_PLAN_LIMITS)) return COMPUTE_PLAN_LIMITS.free
  return COMPUTE_PLAN_LIMITS[planId]
}
