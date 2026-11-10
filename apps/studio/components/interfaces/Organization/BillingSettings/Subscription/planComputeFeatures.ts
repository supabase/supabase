import type { PricingInformation } from 'shared-data/plans'

import {
  COMPUTE_PLAN_LIMITS,
  type ComputeLimits,
} from '@/components/interfaces/Compute/Compute.limits'
import { formatSize } from '@/components/interfaces/Compute/Compute.utils'
import { formatVcpuHours } from '@/components/interfaces/Compute/ComputeUsage.utils'
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

const formatQuota = (limits: ComputeLimits) =>
  limits.vcpuHours === null
    ? 'Unmetered during the private alpha'
    : `${formatVcpuHours(limits.vcpuHours)} of Compute`

const formatConcurrency = (limits: ComputeLimits) =>
  limits.concurrentInstances === 1
    ? '1 concurrent instance'
    : `${limits.concurrentInstances?.toLocaleString()} concurrent instances`

const formatSizes = (limits: ComputeLimits) => limits.sizes.map(formatSize).join(', ')

const formatExposure = (limits: ComputeLimits) =>
  limits.canRunPrivateInstances
    ? 'Public and private instances'
    : 'Public instances, which suspend when idle'

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

  const quota =
    limits.vcpuHours === null || planId === 'free'
      ? formatQuota(limits)
      : `${formatQuota(limits)}, then pay as you go`

  return [
    [quota, ALPHA_NOTE],
    // A plan with no concurrency limit has nothing to say here, so it says nothing rather
    // than advertising that the number is undecided.
    ...(limits.concurrentInstances === null
      ? []
      : [[formatConcurrency(limits), 'Running at once per project']]),
    [formatSizes(limits), formatBurst(limits)],
    formatExposure(limits),
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
