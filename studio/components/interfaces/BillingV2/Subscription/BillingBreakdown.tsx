import clsx from 'clsx'
import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useUpcomingInvoiceQuery } from 'data/invoices/invoice-upcoming-query'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import {
  ProjectUsageResponse,
  UsageMetric,
  useProjectUsageQuery,
} from 'data/usage/project-usage-query'
import dayjs from 'dayjs'
import { USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import { formatBytes } from 'lib/helpers'
import { partition } from 'lodash'
import { useState } from 'react'
import { Alert, Button, Collapsible, IconAlertTriangle, IconChevronRight, IconInfo } from 'ui'
import { BILLING_BREAKDOWN_METRICS } from './Subscription.constants'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import Link from 'next/link'
import * as Tooltip from '@radix-ui/react-tooltip'

export interface BillingBreakdownProps {}

const BillingBreakdown = ({}: BillingBreakdownProps) => {
  const { ref: projectRef } = useParams()
  const snap = useSubscriptionPageStateSnapshot()
  const [showUsageFees, setShowUsageFees] = useState(false)
  const { data: usage, isLoading: isLoadingUsage } = useProjectUsageQuery({ projectRef })
  const { data: subscription, isLoading: isLoadingSubscription } = useProjectSubscriptionV2Query({
    projectRef,
  })
  const {
    data: upcomingInvoice,
    error: upcomingInvoiceError,
    isLoading: isLoadingUpcomingInvoice,
  } = useUpcomingInvoiceQuery({
    projectRef,
  })
  const billingCycleStart = dayjs.unix(subscription?.current_period_start ?? 0).utc()
  const billingCycleEnd = dayjs.unix(subscription?.current_period_end ?? 0).utc()

  const currentPlan = subscription?.plan
  const isUsageBillingEnabled = subscription?.usage_billing_enabled
  const [usageFees, fixedFees] = partition(upcomingInvoice?.lines ?? [], (item) => item.usage_based)
  const totalUsageFees = Number(usageFees.reduce((a, b) => a + b.amount, 0).toFixed(2))

  const largeNumberFormatter = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

  const hasExceededAnyLimits =
    isUsageBillingEnabled === false &&
    Object.values(usage ?? {})
      .map((metric) => {
        if (typeof metric !== 'object') return false
        if (metric.limit <= 0) return false
        if (metric.usage > metric.limit) return true
      })
      .includes(true)

  return (
    <div className="grid grid-cols-12 gap-6" id="breakdown">
      <div className="col-span-12 lg:col-span-5">
        <div className="sticky top-16">
          <p className="text-base">Billing breakdown</p>
          <p className="text-sm text-scale-1000">
            Current billing cycle: {billingCycleStart.format('MMM DD')} -{' '}
            {billingCycleEnd.format('MMM DD')}
          </p>
        </div>
      </div>
      {isLoadingSubscription ? (
        <div className="col-span-12 lg:col-span-7 space-y-2">
          <ShimmeringLoader />
          <ShimmeringLoader className="w-3/4" />
          <ShimmeringLoader className="w-1/2" />
        </div>
      ) : (
        <div className="col-span-12 lg:col-span-7 space-y-6">
          <p className="text-sm">Included usage summary</p>
          {isUsageBillingEnabled ? (
            <p className="text-sm text-scale-1000">
              Your plan includes a limited amount of usage. If the usage on your project exceeds
              these quotas, your subscription will be charged for the overages. It may take up to 24
              hours for usage stats to update.
            </p>
          ) : (
            <p className="text-sm text-scale-1000">
              Your plan includes a limited amount of usage. If the usage on your project exceeds
              these quotas, you may experience restrictions, as you are currently not billed for
              overages. It may take up to 24 hours for usage stats to update.
            </p>
          )}

          {hasExceededAnyLimits && (
            <Alert
              withIcon
              variant="danger"
              title="Your project's usage has exceeded its included quota"
              actions={[
                <Button
                  key="upgrade-button"
                  type="default"
                  className="ml-8"
                  onClick={() =>
                    snap.setPanelKey(
                      currentPlan?.id === 'free' ? 'subscriptionPlan' : 'costControl'
                    )
                  }
                >
                  {currentPlan?.id === 'free' ? 'Upgrade plan' : 'Change spend cap'}
                </Button>,
              ]}
            >
              Your project can become unresponsive or enter read only mode.{' '}
              {currentPlan?.id === 'free'
                ? 'Please upgrade to the Pro plan to ensure that your project remains available.'
                : 'Please disable spend cap to ensure that your project remains available.'}
            </Alert>
          )}

          {isLoadingUsage ? (
            <div className="col-span-7 space-y-2">
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          ) : (
            <div className="grid grid-cols-12">
              {BILLING_BREAKDOWN_METRICS.map((metric, i) => {
                const usageMeta =
                  (usage?.[metric.key as keyof ProjectUsageResponse] as UsageMetric) ?? undefined
                const usageRatio =
                  typeof usageMeta !== 'number'
                    ? (usageMeta?.usage ?? 0) / (usageMeta?.limit ?? 0)
                    : 0

                const hasLimit = usageMeta.limit > 0
                const usageCurrentLabel =
                  metric.units === 'bytes'
                    ? formatBytes(usageMeta.usage)
                    : usageMeta.usage?.toLocaleString()
                const usageLimitLabel =
                  metric.units === 'bytes'
                    ? formatBytes(usageMeta.limit)
                    : usageMeta.limit.toLocaleString()
                const usageLabel = `${usageCurrentLabel} ${hasLimit ? `of ${usageLimitLabel}` : ''}`
                const percentageLabel = `${(usageRatio * 100).toFixed(2)}%`

                const isApproachingLimit = hasLimit && usageRatio >= USAGE_APPROACHING_THRESHOLD
                const isExceededLimit = hasLimit && usageRatio >= 1

                const usageFee = subscription?.usage_fees?.find(
                  (item) => item.metric === metric.metric
                )

                return (
                  <div
                    key={metric.key}
                    className={clsx(
                      'col-span-12 md:col-span-6 space-y-4 py-4 border-scale-400',
                      i % 2 === 0 ? 'md:border-r md:pr-4' : 'md:pl-4',
                      i < BILLING_BREAKDOWN_METRICS.length - 2 && 'border-b'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <Link href={`/project/${projectRef}/settings/billing/usage#${metric.anchor}`}>
                        <a>
                          <div className="group flex items-center space-x-2">
                            <p className="text-sm text-scale-1100 group-hover:text-scale-1200 transition cursor-pointer">
                              {metric.name}
                            </p>
                            <IconChevronRight
                              strokeWidth={1.5}
                              size={16}
                              className="transition opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0"
                            />
                          </div>
                        </a>
                      </Link>
                      {isUsageBillingEnabled && hasLimit && usageFee && (
                        <Tooltip.Root delayDuration={0}>
                          <Tooltip.Trigger>
                            <div className="flex items-center">
                              <IconInfo
                                size={14}
                                strokeWidth={2}
                                className="hover:text-scale-1000"
                              />
                            </div>
                          </Tooltip.Trigger>
                          <Tooltip.Portal>
                            <Tooltip.Content side="bottom">
                              <Tooltip.Arrow className="radix-tooltip-arrow" />
                              <div
                                className={[
                                  'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                  'border border-scale-200',
                                ].join(' ')}
                              >
                                <div className="text-xs text-scale-1200">
                                  {usageFee.pricingStrategy === 'UNIT' ? (
                                    <div>
                                      <p>
                                        {largeNumberFormatter.format(
                                          usageFee.pricingOptions.freeUnits
                                        )}{' '}
                                        {metric.unitName} included
                                      </p>
                                      <p>
                                        then ${usageFee.pricingOptions.perUnitPrice} per{' '}
                                        {metric.unitName}
                                      </p>
                                    </div>
                                  ) : usageFee.pricingStrategy === 'PACKAGE' ? (
                                    <div>
                                      <p>
                                        {largeNumberFormatter.format(
                                          usageFee.pricingOptions.freeUnits
                                        )}{' '}
                                        included
                                      </p>

                                      <p>
                                        then ${usageFee.pricingOptions.packagePrice} per{' '}
                                        {largeNumberFormatter.format(
                                          usageFee.pricingOptions.packageSize!
                                        )}
                                      </p>
                                    </div>
                                  ) : null}
                                </div>
                              </div>
                            </Tooltip.Content>
                          </Tooltip.Portal>
                        </Tooltip.Root>
                      )}
                      {isUsageBillingEnabled === false &&
                        usageRatio >= USAGE_APPROACHING_THRESHOLD && (
                          <Tooltip.Root delayDuration={0}>
                            <Tooltip.Trigger asChild>
                              {isExceededLimit && !isUsageBillingEnabled ? (
                                <div className="flex items-center space-x-2 min-w-[115px] cursor-help">
                                  <IconAlertTriangle
                                    size={14}
                                    strokeWidth={2}
                                    className="text-red-900"
                                  />
                                  <p className="text-sm text-red-900">Exceeded limit</p>
                                </div>
                              ) : isApproachingLimit && !isUsageBillingEnabled ? (
                                <div className="flex items-center space-x-2 min-w-[115px] cursor-help">
                                  <IconAlertTriangle
                                    size={14}
                                    strokeWidth={2}
                                    className="text-amber-900"
                                  />
                                  <p className="text-sm text-amber-900">Approaching limit</p>
                                </div>
                              ) : null}
                            </Tooltip.Trigger>

                            <Tooltip.Portal>
                              <Tooltip.Content side="bottom">
                                <Tooltip.Arrow className="radix-tooltip-arrow" />
                                <div
                                  className={[
                                    'rounded bg-scale-100 py-1 px-2 leading-none shadow',
                                    'border border-scale-200',
                                  ].join(' ')}
                                >
                                  <p className="text-xs text-scale-1200">
                                    Exceeding your plans included usage will lead to restrictions to
                                    your project.
                                  </p>
                                  <p className="text-xs text-scale-1200">
                                    Upgrade to a usage-based plan or disable the spend cap to avoid
                                    restrictions.
                                  </p>
                                </div>
                              </Tooltip.Content>
                            </Tooltip.Portal>
                          </Tooltip.Root>
                        )}
                    </div>
                    {usageMeta.available_in_plan ? (
                      <SparkBar
                        type="horizontal"
                        // If the limit is 0, it means that the usage is unlimited and not billed
                        // By setting "1" as max, the bar is only filled if the metric has any usage
                        // This is only the case for Enterprise plans
                        max={usageMeta.limit || 1}
                        value={usageMeta.usage ?? 0}
                        barClass={
                          !hasLimit && usageMeta.usage > 0
                            ? 'bg-scale-1100'
                            : isExceededLimit && !isUsageBillingEnabled
                            ? 'bg-red-900'
                            : isApproachingLimit && !isUsageBillingEnabled
                            ? 'bg-amber-900'
                            : 'bg-scale-1100'
                        }
                        bgClass="bg-gray-300 dark:bg-gray-600"
                        labelBottom={usageLabel}
                        labelBottomClass="!text-scale-1000"
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
                      // [Joshen] Needs a better CTA here
                      <div className="flex items-center justify-between flex-grow">
                        <p className="text-sm text-scale-1000">Unavailable in your plan</p>
                        <Button type="default" onClick={() => snap.setPanelKey('subscriptionPlan')}>
                          Upgrade
                        </Button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          <p className="!mt-10 text-sm">Upcoming cost for next invoice</p>
          <p className="text-sm text-scale-1000">
            The following table shows your upcoming costs. Depending on your usage, the final amount
            may vary. Next invoice on{' '}
            <span className="text-scale-1100">{billingCycleEnd.format('MMM DD, YYYY')}</span>.
          </p>

          {isLoadingUpcomingInvoice ? (
            <div className="space-y-2">
              <ShimmeringLoader />
              <ShimmeringLoader className="w-3/4" />
              <ShimmeringLoader className="w-1/2" />
            </div>
          ) : upcomingInvoiceError !== null ? (
            <Alert
              withIcon
              variant="info"
              title="Failed to retrieve upcoming invoice details"
              actions={[
                <Link
                  key="contact-support"
                  href={`/support/new?ref=${projectRef}&category=dashboard_bug&subject=Unable%20to%20view%20upcoming%20invoice%20details`}
                >
                  <a>
                    <Button type="default" className="ml-4">
                      Contact support
                    </Button>
                  </a>
                </Link>,
              ]}
            >
              Try refreshing your browser, but if the issue persists, please reach out to us via
              support.
            </Alert>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="py-2 font-normal text-left text-sm text-scale-1000 w-1/2">Item</th>
                  <th className="py-2 font-normal text-left text-sm text-scale-1000">Count</th>
                  <th className="py-2 font-normal text-left text-sm text-scale-1000">Unit price</th>
                  <th className="py-2 font-normal text-right text-sm text-scale-1000">Price</th>
                </tr>
              </thead>
              <tbody>
                {fixedFees.map((item) => (
                  <tr key={item.description} className="border-b">
                    <td className="py-2 text-sm">{item.description ?? 'Unknown'}</td>
                    <td className="py-2 text-sm">{item.quantity}</td>
                    <td className="py-2 text-sm">
                      {item.unit_price === 0 ? 'FREE' : `$${item.unit_price}`}
                    </td>
                    <td className="py-2 text-sm text-right">${item.amount}</td>
                  </tr>
                ))}
              </tbody>

              {usageFees.length > 0 && (
                <Collapsible asChild open={showUsageFees} onOpenChange={setShowUsageFees}>
                  <tbody>
                    <Collapsible.Trigger asChild>
                      <tr
                        className="border-b cursor-pointer"
                        style={{ WebkitAppearance: 'initial' }}
                      >
                        <td className="py-2 text-sm flex items-center space-x-2">
                          <Button
                            type="text"
                            className="!px-1"
                            icon={
                              <IconChevronRight
                                className={clsx('transition', showUsageFees && 'rotate-90')}
                              />
                            }
                          />
                          <p>Usage items</p>
                        </td>
                        <td />
                        <td />
                        <td className="text-sm text-right">
                          {!showUsageFees ? `$${totalUsageFees}` : null}
                        </td>
                      </tr>
                    </Collapsible.Trigger>
                    <Collapsible.Content asChild>
                      <>
                        {usageFees.map((fee) => (
                          <tr className="border-b" key={fee.description}>
                            <td className="py-2 text-sm pl-8">{fee.description}</td>
                            <td className="py-2 text-sm"></td>
                            <td className="py-2 text-sm">
                              {fee.unit_price ? `$${fee.unit_price}` : null}
                            </td>
                            <td className="py-2 text-sm text-right">${fee.amount ?? 0}</td>
                          </tr>
                        ))}
                      </>
                    </Collapsible.Content>
                  </tbody>
                </Collapsible>
              )}

              <tbody>
                <tr>
                  <td className="py-2 text-sm">Total</td>
                  <td className="py-2 text-sm" />
                  <td className="py-2 text-sm" />
                  <td className="py-2 text-sm text-right">${upcomingInvoice?.amount_total ?? 0}</td>
                </tr>
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}

export default BillingBreakdown
