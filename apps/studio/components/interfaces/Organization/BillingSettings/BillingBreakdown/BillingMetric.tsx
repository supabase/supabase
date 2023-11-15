import * as Tooltip from '@radix-ui/react-tooltip'
import clsx from 'clsx'
import Link from 'next/link'

import { BILLING_BREAKDOWN_METRICS } from 'components/interfaces/Billing/Subscription/Subscription.constants'
import SparkBar from 'components/ui/SparkBar'
import { OrgSubscription } from 'data/subscriptions/org-subscription-query'
import { OrgUsageResponse } from 'data/usage/org-usage-query'
import { useOrgSettingsPageStateSnapshot } from 'state/organization-settings'
import { Button, IconAlertTriangle, IconChevronRight, IconInfo } from 'ui'
import { Metric, USAGE_APPROACHING_THRESHOLD } from './BillingBreakdown.constants'

export interface BillingMetricProps {
  idx: number
  slug?: string
  metric: Metric
  usage: OrgUsageResponse
  subscription: OrgSubscription
}

const BillingMetric = ({ idx, slug, metric, usage, subscription }: BillingMetricProps) => {
  const snap = useOrgSettingsPageStateSnapshot()
  const usageMeta = usage.usages.find((x) => x.metric === metric.key)
  const usageRatio =
    typeof usageMeta !== 'number'
      ? (usageMeta?.usage ?? 0) / (usageMeta?.pricing_free_units ?? 0)
      : 0

  const usageFee = subscription?.usage_fees?.find((item) => item.metric === metric.key)
  const isUsageBillingEnabled = subscription?.usage_billing_enabled
  const largeNumberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

  const hasLimit = !!usageMeta?.unlimited === false
  const isApproachingLimit = hasLimit && usageRatio >= USAGE_APPROACHING_THRESHOLD
  const isExceededLimit = hasLimit && usageRatio >= 1

  const usageCurrentLabel =
    metric.units === 'bytes'
      ? `${usageMeta?.usage?.toLocaleString() ?? 0} GB`
      : usageMeta?.usage?.toLocaleString()
  const usageLimitLabel =
    metric.units === 'bytes'
      ? `${usageMeta?.pricing_free_units ?? 0} GB`
      : usageMeta?.pricing_free_units?.toLocaleString()
  const percentageLabel = `${(usageRatio * 100).toFixed(2)}%`
  const usageLabel = `${usageCurrentLabel} ${hasLimit ? `of ${usageLimitLabel}` : ''}`

  return (
    <div
      className={clsx(
        'col-span-12 md:col-span-6 space-y-4 py-4 border-overlay',
        idx % 2 === 0 ? 'md:border-r md:pr-4' : 'md:pl-4',
        idx < BILLING_BREAKDOWN_METRICS.length - 3 && 'border-b'
      )}
    >
      <div className="flex items-center justify-between">
        <Link href={`/org/${slug}/usage#${metric.anchor}`}>
          <div className="group flex items-center space-x-2">
            <p className="text-sm text-foreground-light group-hover:text-foreground transition cursor-pointer">
              {metric.name}
            </p>
            <IconChevronRight
              strokeWidth={1.5}
              size={16}
              className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
            />
          </div>
        </Link>

        {isUsageBillingEnabled && hasLimit && usageFee && (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger>
              <div className="flex items-center">
                <IconInfo size={14} strokeWidth={2} className="hover:text-foreground-light" />
              </div>
            </Tooltip.Trigger>
            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background',
                  ].join(' ')}
                >
                  <div className="text-xs text-foreground">
                    {usageFee.pricingStrategy === 'UNIT' ? (
                      <div>
                        <p>
                          {largeNumberFormatter.format(usageFee.pricingOptions.freeUnits)}{' '}
                          {metric.unitName} included
                        </p>
                        <p>
                          then ${usageFee.pricingOptions.perUnitPrice} per {metric.unitName}
                        </p>
                      </div>
                    ) : usageFee.pricingStrategy === 'PACKAGE' ? (
                      <div>
                        <p>
                          {largeNumberFormatter.format(usageFee.pricingOptions.freeUnits)} included
                        </p>

                        <p>
                          then ${usageFee.pricingOptions.packagePrice} per{' '}
                          {largeNumberFormatter.format(usageFee.pricingOptions.packageSize!)}
                        </p>
                      </div>
                    ) : null}
                  </div>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}

        {!isUsageBillingEnabled && usageRatio >= USAGE_APPROACHING_THRESHOLD && (
          <Tooltip.Root delayDuration={0}>
            <Tooltip.Trigger asChild>
              {isExceededLimit && !isUsageBillingEnabled ? (
                <div className="flex items-center space-x-2 min-w-[115px] cursor-help">
                  <IconAlertTriangle size={14} strokeWidth={2} className="text-red-900" />
                  <p className="text-sm text-red-900">Exceeded limit</p>
                </div>
              ) : isApproachingLimit && !isUsageBillingEnabled ? (
                <div className="flex items-center space-x-2 min-w-[115px] cursor-help">
                  <IconAlertTriangle size={14} strokeWidth={2} className="text-amber-900" />
                  <p className="text-sm text-amber-900">Approaching limit</p>
                </div>
              ) : null}
            </Tooltip.Trigger>

            <Tooltip.Portal>
              <Tooltip.Content side="bottom">
                <Tooltip.Arrow className="radix-tooltip-arrow" />
                <div
                  className={[
                    'rounded bg-alternative py-1 px-2 leading-none shadow',
                    'border border-background',
                  ].join(' ')}
                >
                  <p className="text-xs text-foreground">
                    Exceeding your plans included usage will lead to restrictions to your project.
                  </p>
                  <p className="text-xs text-foreground">
                    Upgrade to a usage-based plan or disable the spend cap to avoid restrictions.
                  </p>
                </div>
              </Tooltip.Content>
            </Tooltip.Portal>
          </Tooltip.Root>
        )}
      </div>
      {usageMeta?.available_in_plan ? (
        <SparkBar
          type="horizontal"
          max={usageMeta.pricing_free_units || 1}
          value={usageMeta.usage ?? 0}
          barClass={
            !hasLimit && usageMeta.usage > 0
              ? 'bg-foreground-light'
              : isExceededLimit && !isUsageBillingEnabled
              ? 'bg-red-900'
              : isApproachingLimit && !isUsageBillingEnabled
              ? 'bg-amber-900'
              : 'bg-foreground-light'
          }
          bgClass="bg-overlay-hover"
          labelBottom={usageLabel}
          labelBottomClass="!text-foreground-light"
          labelTop={hasLimit ? percentageLabel : undefined}
          labelTopClass={
            !hasLimit
              ? ''
              : isExceededLimit && !isUsageBillingEnabled
              ? '!text-red-900'
              : isApproachingLimit && !isUsageBillingEnabled
              ? '!text-amber-900'
              : ''
          }
        />
      ) : (
        <div className="flex items-center justify-between flex-grow">
          <p className="text-sm text-foreground-light">Unavailable in your plan</p>
          <Button type="default" onClick={() => snap.setPanelKey('subscriptionPlan')}>
            Upgrade
          </Button>
        </div>
      )}
    </div>
  )
}

export default BillingMetric
