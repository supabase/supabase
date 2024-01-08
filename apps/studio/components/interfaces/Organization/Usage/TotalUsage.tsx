import { OrgSubscription } from 'data/subscriptions/types'
import SectionContent from './SectionContent'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import AlertError from 'components/ui/AlertError'
import { useMemo } from 'react'
import { useOrgUsageQuery } from 'data/usage/org-usage-query'
import BillingMetric from '../BillingSettings/BillingBreakdown/BillingMetric'
import { BILLING_BREAKDOWN_METRICS } from '../BillingSettings/BillingBreakdown/BillingBreakdown.constants'
import ComputeMetric from '../BillingSettings/BillingBreakdown/ComputeMetric'
import clsx from 'clsx'
import { ComputeUsageMetric, computeUsageMetricLabel } from 'data/analytics/org-daily-stats-query'

export interface ComputeProps {
  orgSlug: string
  projectRef?: string
  startDate: string | undefined
  endDate: string | undefined
  subscription: OrgSubscription | undefined
  currentBillingCycleSelected: boolean
}

const TotalUsage = ({
  orgSlug,
  projectRef,
  subscription,
  startDate,
  endDate,
  currentBillingCycleSelected,
}: ComputeProps) => {
  const isUsageBillingEnabled = subscription?.usage_billing_enabled

  const {
    data: usage,
    error: usageError,
    isLoading: isLoadingUsage,
    isError: isErrorUsage,
    isSuccess: isSuccessUsage,
  } = useOrgUsageQuery({
    orgSlug,
    projectRef,
    start: !currentBillingCycleSelected && startDate ? new Date(startDate) : undefined,
    end: !currentBillingCycleSelected && endDate ? new Date(endDate) : undefined,
  })

  // When the user filters by project ref or selects a custom timeframe, we only display usage+project breakdown, but no costs/limits
  const showRelationToSubscription = currentBillingCycleSelected && !projectRef

  const hasExceededAnyLimits =
    showRelationToSubscription &&
    Boolean(
      usage?.usages.find(
        (usageItem) =>
          // Filter out compute as compute has no quota and is always being charged for
          !usageItem.metric.startsWith('COMPUTE_') &&
          !usageItem.unlimited &&
          usageItem.usage > (usageItem?.pricing_free_units ?? 0)
      )
    )

  const sortedBillingMetrics = useMemo(() => {
    if (!usage) return BILLING_BREAKDOWN_METRICS

    return BILLING_BREAKDOWN_METRICS.slice().sort((a, b) => {
      const usageMetaA = usage.usages.find((x) => x.metric === a.key)
      const usageRatioA =
        typeof usageMetaA !== 'number'
          ? (usageMetaA?.usage ?? 0) / (usageMetaA?.pricing_free_units ?? 0)
          : 0

      const usageMetaB = usage.usages.find((x) => x.metric === b.key)
      const usageRatioB =
        typeof usageMetaB !== 'number'
          ? (usageMetaB?.usage ?? 0) / (usageMetaB?.pricing_free_units ?? 0)
          : 0

      return (
        // Sort unavailable features to bottom
        Number(usageMetaB?.available_in_plan) - Number(usageMetaA?.available_in_plan) ||
        // Sort high-usage features to top
        usageRatioB - usageRatioA
      )
    })
  }, [usage])

  const computeMetrics = (usage?.usages || [])
    .filter((it) => it.metric.startsWith('COMPUTE'))
    .map((it) => it.metric) as ComputeUsageMetric[]

  return (
    <div id="summary">
      <SectionContent
        section={{
          name: 'Usage Summary',
          description: isUsageBillingEnabled
            ? 'Your plan includes a limited amount of usage. If the usage on your organization exceeds these quotas, your subscription will be charged for the overages. It may take up to 24 hours for usage stats to update.'
            : 'Your plan includes a limited amount of usage. If the usage on your organization exceeds these quotas, you may experience restrictions, as you are currently not billed for overages. It may take up to 24 hours for usage stats to update.',
          links: [
            {
              name: 'How billing works',
              url: 'https://supabase.com/docs/guides/platform/org-based-billing',
            },
            {
              name: 'Supabase Plans',
              url: 'https://supabase.com/pricing',
            },
          ],
        }}
      >
        {isLoadingUsage && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        {isErrorUsage && <AlertError subject="Failed to retrieve usage data" error={usageError} />}

        {isSuccessUsage && subscription && (
          <div>
            {showRelationToSubscription && (
              <p className="text-sm">
                {!hasExceededAnyLimits ? (
                  <span>
                    You have not exceeded your{' '}
                    <span className="font-medium">{subscription?.plan.name}</span> plan quota in
                    this billing cycle.
                  </span>
                ) : hasExceededAnyLimits && subscription?.plan?.id === 'free' ? (
                  <span>
                    You have exceeded your{' '}
                    <span className="font-medium">{subscription?.plan.name}</span> plan quota in
                    this billing cycle. Upgrade your plan to continue using Supabase without
                    restrictions.
                  </span>
                ) : hasExceededAnyLimits &&
                  subscription?.usage_billing_enabled === false &&
                  subscription?.plan?.id === 'pro' ? (
                  <span>
                    You have exceeded your{' '}
                    <span className="font-medium">{subscription?.plan.name}</span> plan quota in
                    this billing cycle. Disable your spend cap to continue using Supabase without
                    restrictions.
                  </span>
                ) : hasExceededAnyLimits && subscription?.usage_billing_enabled === true ? (
                  <span>
                    You have exceeded your{' '}
                    <span className="font-medium">{subscription?.plan.name}</span> plan quota in
                    this billing cycle and will be charged for over-usage.
                  </span>
                ) : (
                  <span>
                    You have not exceeded your{' '}
                    <span className="font-medium">{subscription?.plan.name}</span> plan quota in
                    this billing cycle.
                  </span>
                )}
              </p>
            )}
            <div className="grid grid-cols-12 mt-3">
              {sortedBillingMetrics.map((metric, i) => {
                return (
                  <div
                    className={clsx(
                      'col-span-12 md:col-span-6 space-y-4 py-4 border-overlay',
                      i % 2 === 0 ? 'md:border-r md:pr-4' : 'md:pl-4',
                      'border-b'
                    )}
                    key={metric.key}
                  >
                    <BillingMetric
                      idx={i}
                      slug={orgSlug}
                      metric={metric}
                      usage={usage}
                      subscription={subscription!}
                      relativeToSubscription={showRelationToSubscription}
                    />
                  </div>
                )
              })}

              {computeMetrics.map((metric, i) => (
                <div
                  className={clsx(
                    'col-span-12 md:col-span-6 space-y-4 py-4 border-overlay',
                    i % 2 === 0 ? 'md:border-r md:pr-4' : 'md:pl-4'
                  )}
                  key={metric}
                >
                  <ComputeMetric
                    slug={orgSlug}
                    metric={{
                      key: metric,
                      name: computeUsageMetricLabel(metric) + ' Compute Hours' || metric,
                      units: 'hours',
                      anchor: 'compute',
                      category: 'Compute',
                      unitName: 'GB',
                    }}
                    relativeToSubscription={showRelationToSubscription}
                    usage={usage}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </SectionContent>
    </div>
  )
}

export default TotalUsage
