import type { OrgPlan } from '@/data/subscriptions/types'

/**
 * Compute usage figures are experimental while the product is in alpha. Allowances and
 * weights below are placeholders so the usage surfaces have something to render — they
 * are not the final packaging, and nothing here is billed today.
 */

/**
 * Size-weighted compute units. A 4gb-2vcpu instance draws twice the resources of the
 * default 2gb-1vcpu, so an hour on it counts twice toward usage.
 */
export const COMPUTE_UNIT_WEIGHTS: Record<string, number> = {
  '2gb-1vcpu': 1,
  '4gb-2vcpu': 2,
}

export const DEFAULT_COMPUTE_UNIT_WEIGHT = 1

/** Active hours included per billing cycle, by plan. `null` means no fixed allowance. */
export const COMPUTE_ACTIVE_HOURS_ALLOWANCE: Record<string, number | null> = {
  free: 50,
  pro: 500,
  team: 2000,
  enterprise: null,
}

export const DEFAULT_COMPUTE_ACTIVE_HOURS_ALLOWANCE = 50

/** The point at which the burn-down starts warning, as a fraction of the allowance. */
export const COMPUTE_ALLOWANCE_WARNING_THRESHOLD = 0.8

export const getComputeActiveHoursAllowance = (
  planId: OrgPlan['id'] | undefined
): number | null => {
  if (planId === undefined) return DEFAULT_COMPUTE_ACTIVE_HOURS_ALLOWANCE
  if (!(planId in COMPUTE_ACTIVE_HOURS_ALLOWANCE)) return DEFAULT_COMPUTE_ACTIVE_HOURS_ALLOWANCE
  return COMPUTE_ACTIVE_HOURS_ALLOWANCE[planId]
}

export const getComputeUnitWeight = (size: string): number =>
  COMPUTE_UNIT_WEIGHTS[size] ?? DEFAULT_COMPUTE_UNIT_WEIGHT
