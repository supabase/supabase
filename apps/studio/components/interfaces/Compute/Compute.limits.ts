import { COMPUTE_INSTANCE_SIZES } from './Compute.constants'
import type { OrgPlan } from '@/data/subscriptions/types'

export const COMPUTE_LIMITS_MODES = ['alpha', 'plans'] as const

export type ComputeLimitsMode = (typeof COMPUTE_LIMITS_MODES)[number]

export const DEFAULT_COMPUTE_LIMITS_MODE: ComputeLimitsMode = 'alpha'

export type ComputeInstanceSize = (typeof COMPUTE_INSTANCE_SIZES)[number]

/**
 * Packaging comes from the pricing RFC. The included quota is runtime — minutes a worker
 * spends running, across all workers — and it is the same on every plan. Tiers differ by
 * concurrency, the burst ceiling, and whether a single invocation is capped. vCPU-hours and
 * GB-hours are the dimensions overage is priced on, not separate quotas, so they are not
 * capped here.
 *
 * `null` means no fixed limit.
 */
export interface ComputeLimits {
  /** Included runtime minutes per billing cycle, across all workers. */
  runtimeMinutes: number | null
  /** Workers that may run at once. */
  concurrentWorkers: number | null
  /** Sizes the plan may deploy. */
  sizes: readonly ComputeInstanceSize[]
  /** Ceiling a running instance may burst to. `null` means it stays at its base size. */
  burstTo: { vcpu: number; memoryGb: number } | null
  /** Cap on a single invocation. `null` means uncapped. */
  maxInvocationMinutes: number | null
}

/** Every plan starts here; the RFC quotes one base size for both free and paid. */
const BASE_SIZE: ComputeInstanceSize = '2gb-1vcpu'

/** RFC: included quota is 500 minutes per month, on free and paid alike. */
export const COMPUTE_INCLUDED_RUNTIME_MINUTES = 500

/** RFC: paid plans burst from the base size up to 4 vCPU / 8 GB. */
const PAID_BURST_CEILING = { vcpu: 4, memoryGb: 8 }

/**
 * RFC: "Max Duration per Invocation: 5-10 minutes" on free. Taking the upper bound — the
 * narrower end would gate workloads the RFC has not actually ruled out.
 */
const FREE_MAX_INVOCATION_MINUTES = 10

// TODO: confirm the live instance cap with the workers-infra team. API fixtures use 100.
export const COMPUTE_ALPHA_LIMITS: ComputeLimits = {
  runtimeMinutes: null,
  concurrentWorkers: 2,
  sizes: COMPUTE_INSTANCE_SIZES,
  burstTo: PAID_BURST_CEILING,
  maxInvocationMinutes: null,
}

/**
 * TODO: the RFC leaves paid concurrency open — "# Concurrent Workers to be decided each tier
 * (or no limit if capacity is not a concern)". Modelled as no limit until that is settled,
 * rather than inventing a number that would read as decided.
 */
export const COMPUTE_PLAN_LIMITS: Record<OrgPlan['id'], ComputeLimits> = {
  free: {
    runtimeMinutes: COMPUTE_INCLUDED_RUNTIME_MINUTES,
    concurrentWorkers: 1,
    sizes: [BASE_SIZE],
    burstTo: null,
    maxInvocationMinutes: FREE_MAX_INVOCATION_MINUTES,
  },
  pro: {
    runtimeMinutes: COMPUTE_INCLUDED_RUNTIME_MINUTES,
    concurrentWorkers: null,
    sizes: COMPUTE_INSTANCE_SIZES,
    burstTo: PAID_BURST_CEILING,
    maxInvocationMinutes: null,
  },
  team: {
    runtimeMinutes: COMPUTE_INCLUDED_RUNTIME_MINUTES,
    concurrentWorkers: null,
    sizes: COMPUTE_INSTANCE_SIZES,
    burstTo: PAID_BURST_CEILING,
    maxInvocationMinutes: null,
  },
  platform: {
    runtimeMinutes: COMPUTE_INCLUDED_RUNTIME_MINUTES,
    concurrentWorkers: null,
    sizes: COMPUTE_INSTANCE_SIZES,
    burstTo: PAID_BURST_CEILING,
    maxInvocationMinutes: null,
  },
  enterprise: {
    runtimeMinutes: COMPUTE_INCLUDED_RUNTIME_MINUTES,
    concurrentWorkers: null,
    sizes: COMPUTE_INSTANCE_SIZES,
    burstTo: PAID_BURST_CEILING,
    maxInvocationMinutes: null,
  },
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

/** Included runtime expressed in hours, for comparison against an hours-based rollup. */
export const includedRuntimeHours = (limits: ComputeLimits): number | null =>
  limits.runtimeMinutes === null ? null : limits.runtimeMinutes / 60

export const canPlanDeploySize = (limits: ComputeLimits, size: string): boolean =>
  limits.sizes.some((allowed) => allowed === size)
