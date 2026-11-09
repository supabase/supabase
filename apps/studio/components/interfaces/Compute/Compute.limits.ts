import { COMPUTE_INSTANCE_SIZES } from './Compute.constants'
import type { OrgPlan } from '@/data/subscriptions/types'

export const COMPUTE_LIMITS_MODES = ['alpha', 'plans'] as const

export type ComputeLimitsMode = (typeof COMPUTE_LIMITS_MODES)[number]

export const DEFAULT_COMPUTE_LIMITS_MODE: ComputeLimitsMode = 'alpha'

export type ComputeInstanceSize = (typeof COMPUTE_INSTANCE_SIZES)[number]

/**
 * Packaging comes from the pricing RFC. The included quota is the same on every plan; tiers
 * differ by concurrency, the burst ceiling, and whether a single invocation is capped.
 *
 * The quota is denominated in vCPU-minutes rather than wall-clock runtime so that it matches
 * the dimension overage is priced on. A size-blind runtime quota hands a 4gb-2vcpu instance
 * twice the resource for the same allowance, which is both a subsidy and an undefined
 * boundary — you cannot say where overage starts without knowing what the included minutes
 * consumed. At the 1 vCPU base size the two are numerically identical, so the RFC's "500"
 * carries over untouched.
 *
 * GB-hours are not a second quota: every size, the burst ceiling and the AWS baseline
 * reservation all sit at a fixed 2 GB per vCPU, so memory cannot diverge from CPU. If a size
 * with a different ratio ever ships, this becomes a normalised unit — consume
 * `max(vcpu / 1, gb / 2)` per minute — rather than gaining a second field.
 *
 * `null` means no fixed limit.
 */
export interface ComputeLimits {
  /** Included vCPU-minutes per billing cycle, across all instances. */
  vcpuMinutes: number | null
  /**
   * Instances that may run at once, per project. Scoped to the project because that is where
   * the API enforces it — compute_instance_limit_exceeded is a per-project 403 — and because
   * the vCPU-minute quota is already the org-wide bound on consumption. This is a capacity
   * grant, not a consumption one: a plan can hold far more concurrency than its quota could
   * feed, which is the point of having both.
   */
  concurrentInstances: number | null
  /**
   * Whether the plan may run private instances. Private instances never suspend, so one of them
   * drains the included quota in a matter of hours and keeps costing us after that. Public
   * instances suspend on idle, which is what makes a small quota viable.
   */
  canRunPrivateInstances: boolean
  /** Sizes the plan may deploy. */
  sizes: readonly ComputeInstanceSize[]
  /** Ceiling a running instance may burst to. `null` means it stays at its base size. */
  burstTo: { vcpu: number; memoryGb: number } | null
  /** Cap on a single invocation. `null` means uncapped. */
  maxInvocationMinutes: number | null
}

/** Every plan starts here; the RFC quotes one base size for both free and paid. */
const BASE_SIZE: ComputeInstanceSize = '2gb-1vcpu'

/**
 * RFC: included quota is 500 minutes per month, on free and paid alike. Read as vCPU-minutes,
 * which is the same figure at the 1 vCPU base size.
 */
export const COMPUTE_INCLUDED_VCPU_MINUTES = 500

/** RFC: paid plans burst from the base size up to 4 vCPU / 8 GB. */
const PAID_BURST_CEILING = { vcpu: 4, memoryGb: 8 }

/**
 * RFC: "Max Duration per Invocation: 5-10 minutes" on free. Taking the upper bound — the
 * narrower end would gate workloads the RFC has not actually ruled out.
 */
const FREE_MAX_INVOCATION_MINUTES = 10

// TODO: confirm the live instance cap with the instances-infra team. API fixtures use 100.
export const COMPUTE_ALPHA_LIMITS: ComputeLimits = {
  vcpuMinutes: null,
  concurrentInstances: 2,
  canRunPrivateInstances: true,
  sizes: COMPUTE_INSTANCE_SIZES,
  burstTo: PAID_BURST_CEILING,
  maxInvocationMinutes: null,
}

/**
 * Concurrency is a placeholder. The RFC leaves it open — "# Concurrent Instances to be decided
 * each tier" — so these are working numbers chosen to be plausible, not agreed ones. They
 * climb roughly an order of magnitude per tier and stay under the unverified per-project
 * platform ceiling of 100.
 */
export const COMPUTE_PLAN_LIMITS: Record<OrgPlan['id'], ComputeLimits> = {
  free: {
    vcpuMinutes: COMPUTE_INCLUDED_VCPU_MINUTES,
    concurrentInstances: 1,
    // A private instance never suspends, so one would drain the included quota in hours.
    canRunPrivateInstances: false,
    sizes: [BASE_SIZE],
    burstTo: null,
    maxInvocationMinutes: FREE_MAX_INVOCATION_MINUTES,
  },
  pro: {
    vcpuMinutes: COMPUTE_INCLUDED_VCPU_MINUTES,
    concurrentInstances: 10,
    canRunPrivateInstances: true,
    sizes: COMPUTE_INSTANCE_SIZES,
    burstTo: PAID_BURST_CEILING,
    maxInvocationMinutes: null,
  },
  team: {
    vcpuMinutes: COMPUTE_INCLUDED_VCPU_MINUTES,
    concurrentInstances: 50,
    canRunPrivateInstances: true,
    sizes: COMPUTE_INSTANCE_SIZES,
    burstTo: PAID_BURST_CEILING,
    maxInvocationMinutes: null,
  },
  platform: {
    vcpuMinutes: COMPUTE_INCLUDED_VCPU_MINUTES,
    concurrentInstances: 50,
    canRunPrivateInstances: true,
    sizes: COMPUTE_INSTANCE_SIZES,
    burstTo: PAID_BURST_CEILING,
    maxInvocationMinutes: null,
  },
  enterprise: {
    vcpuMinutes: COMPUTE_INCLUDED_VCPU_MINUTES,
    concurrentInstances: null,
    canRunPrivateInstances: true,
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

/** Included quota in vCPU-hours, for comparison against an hours-based rollup. */
export const includedVcpuHours = (limits: ComputeLimits): number | null =>
  limits.vcpuMinutes === null ? null : limits.vcpuMinutes / 60

/** How much wall-clock runtime the quota buys at a given size. */
export const includedRuntimeMinutesForSize = (
  limits: ComputeLimits,
  vcpuPerInstance: number
): number | null =>
  limits.vcpuMinutes === null || vcpuPerInstance <= 0 ? null : limits.vcpuMinutes / vcpuPerInstance

export const canPlanDeploySize = (limits: ComputeLimits, size: string): boolean =>
  limits.sizes.some((allowed) => allowed === size)

export const canPlanDeployAccess = (limits: ComputeLimits, access: string): boolean =>
  access === 'private' ? limits.canRunPrivateInstances : true
