import type { PricingInformation } from 'shared-data/plans'

import {
  COMPUTE_PLAN_LIMITS,
  type ComputeLimits,
} from '@/components/interfaces/Compute/Compute.limits'
import { formatSize } from '@/components/interfaces/Compute/Compute.utils'
import type { OrgPlan } from '@/data/subscriptions/types'

/**
 * Compute's lines in the plan comparison.
 *
 * Kept in Studio rather than in shared-data/plans.ts on purpose: that file also feeds the
 * public pricing page, and Compute is invite-only private alpha with pricing still being
 * validated. Move these into shared-data once the packaging is approved for publication.
 *
 * Derived from COMPUTE_PLAN_LIMITS so the bullets cannot drift from the gating they describe.
 */

const ALPHA_NOTE = 'Private alpha — available by invite'

const formatRuntime = (limits: ComputeLimits) =>
  limits.runtimeMinutes === null
    ? 'Unmetered during the private alpha'
    : `${limits.runtimeMinutes.toLocaleString()} minutes of Compute runtime`

const formatConcurrency = (limits: ComputeLimits) => {
  if (limits.concurrentWorkers === null) return 'Concurrent workers to be confirmed'
  return limits.concurrentWorkers === 1
    ? '1 concurrent worker'
    : `${limits.concurrentWorkers.toLocaleString()} concurrent workers`
}

const formatSizes = (limits: ComputeLimits) => limits.sizes.map(formatSize).join(', ')

const formatBurst = (limits: ComputeLimits) =>
  limits.burstTo === null
    ? 'Runs at its base size'
    : `Bursts to ${limits.burstTo.vcpu} vCPU / ${limits.burstTo.memoryGb} GB`

const formatInvocation = (limits: ComputeLimits) =>
  limits.maxInvocationMinutes === null
    ? 'Uncapped invocation duration'
    : `Up to ${limits.maxInvocationMinutes} minutes per invocation`

/**
 * Two bullets per plan: what you get, and how it is bounded. Deliberately no prices —
 * the rates are still being validated, so quoting one here would read as settled.
 */
const computeFeaturesForPlan = (planId: OrgPlan['id']): (string | string[])[] => {
  const limits = COMPUTE_PLAN_LIMITS[planId]
  if (limits === undefined) return []

  const runtime =
    limits.runtimeMinutes === null || planId === 'free'
      ? formatRuntime(limits)
      : `${formatRuntime(limits)}, then pay as you go`

  return [
    [runtime, ALPHA_NOTE],
    [formatConcurrency(limits), `${formatSizes(limits)} · ${formatBurst(limits)}`],
    formatInvocation(limits),
  ]
}

const PLAN_ID_BY_TIER: Record<PricingInformation['id'], OrgPlan['id']> = {
  tier_free: 'free',
  tier_pro: 'pro',
  tier_team: 'team',
  tier_enterprise: 'enterprise',
}

/** Appends Compute's lines to a plan from shared-data, leaving the original untouched. */
export const withComputeFeatures = (plan: PricingInformation): PricingInformation => {
  const planId = PLAN_ID_BY_TIER[plan.id]
  if (planId === undefined) return plan

  return { ...plan, features: [...plan.features, ...computeFeaturesForPlan(planId)] }
}

export const computeFeaturesFor = (planId: OrgPlan['id'] | undefined): (string | string[])[] =>
  planId === undefined ? [] : computeFeaturesForPlan(planId)
