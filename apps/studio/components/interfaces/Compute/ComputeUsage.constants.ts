import type { OrgPlan } from '@/data/subscriptions/types'

/**
 * Compute usage allowances are experimental while the product is in alpha. The figures below
 * are placeholders so the usage surfaces have something to measure against — they are not the
 * final packaging, and nothing here is billed today.
 *
 * A "compute" is one deployment (what `supabase compute new` creates). Each one runs one or
 * more instances. Usage is counted on the instances: how many are declared, how long they stay
 * alive, and the vCPU and memory their size reserves while they do.
 */

/** Active hours included per billing cycle, by plan. `null` means no fixed allowance. */
export const COMPUTE_ACTIVE_HOURS_ALLOWANCE: Record<string, number | null> = {
  free: 50,
  pro: 500,
  team: 2000,
  platform: 2000,
  enterprise: null,
}

export const DEFAULT_COMPUTE_ACTIVE_HOURS_ALLOWANCE = 50

/** Compute deployments included per plan. `null` means no fixed limit. */
export const COMPUTE_DEPLOYMENT_ALLOWANCE: Record<string, number | null> = {
  free: 1,
  pro: 5,
  team: 15,
  platform: 15,
  enterprise: null,
}

export const DEFAULT_COMPUTE_DEPLOYMENT_ALLOWANCE = 1

/** Instances included per plan, summed across every deployment. `null` means no fixed limit. */
export const COMPUTE_INSTANCE_ALLOWANCE: Record<string, number | null> = {
  free: 1,
  pro: 10,
  team: 25,
  platform: 25,
  enterprise: null,
}

export const DEFAULT_COMPUTE_INSTANCE_ALLOWANCE = 1

/** The point at which a meter starts warning, as a fraction of the allowance. */
export const COMPUTE_ALLOWANCE_WARNING_THRESHOLD = 0.8

const lookup = (
  table: Record<string, number | null>,
  fallback: number,
  planId: OrgPlan['id'] | undefined
): number | null => {
  if (planId === undefined) return fallback
  if (!(planId in table)) return fallback
  return table[planId]
}

export const getComputeActiveHoursAllowance = (planId: OrgPlan['id'] | undefined) =>
  lookup(COMPUTE_ACTIVE_HOURS_ALLOWANCE, DEFAULT_COMPUTE_ACTIVE_HOURS_ALLOWANCE, planId)

export const getComputeDeploymentAllowance = (planId: OrgPlan['id'] | undefined) =>
  lookup(COMPUTE_DEPLOYMENT_ALLOWANCE, DEFAULT_COMPUTE_DEPLOYMENT_ALLOWANCE, planId)

export const getComputeInstanceAllowance = (planId: OrgPlan['id'] | undefined) =>
  lookup(COMPUTE_INSTANCE_ALLOWANCE, DEFAULT_COMPUTE_INSTANCE_ALLOWANCE, planId)
