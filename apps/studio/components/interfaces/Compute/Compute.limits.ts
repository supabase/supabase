import { COMPUTE_INSTANCE_SIZES } from './Compute.constants'
import type { OrgPlan } from '@/data/subscriptions/types'

export const COMPUTE_LIMITS_MODES = ['alpha', 'plans'] as const

export type ComputeLimitsMode = (typeof COMPUTE_LIMITS_MODES)[number]

export const DEFAULT_COMPUTE_LIMITS_MODE: ComputeLimitsMode = 'alpha'

/** `null` means no fixed limit. */
export interface ComputeLimits {
  vcpuHours: number | null
  gbHours: number | null
  deployments: number | null
  instances: number | null
}

// TODO: confirm the live instance cap with the workers-infra team. API fixtures use 100.
export const COMPUTE_ALPHA_LIMITS: ComputeLimits = {
  vcpuHours: null,
  gbHours: null,
  deployments: null,
  instances: 2,
}

export const COMPUTE_PLAN_LIMITS: Record<OrgPlan['id'], ComputeLimits> = {
  free: { vcpuHours: 50, gbHours: 100, deployments: 1, instances: 1 },
  pro: { vcpuHours: 1000, gbHours: 2000, deployments: 10, instances: 25 },
  team: { vcpuHours: 4000, gbHours: 8000, deployments: 30, instances: 75 },
  platform: { vcpuHours: 4000, gbHours: 8000, deployments: 30, instances: 75 },
  enterprise: { vcpuHours: null, gbHours: null, deployments: null, instances: null },
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
