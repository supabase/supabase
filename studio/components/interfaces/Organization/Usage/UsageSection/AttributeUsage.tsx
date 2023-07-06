import * as Tooltip from '@radix-ui/react-tooltip'
import clsx from 'clsx'
import Link from 'next/link'

import AlertError from 'components/ui/AlertError'
import Panel from 'components/ui/Panel'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { OrgSubscription } from 'data/subscriptions/org-subscription-query'
import { OrgUsageResponse, UsageMetric } from 'data/usage/org-usage-query'
import { USAGE_APPROACHING_THRESHOLD } from 'lib/constants'
import { ResponseError } from 'types'
import { Button, IconAlertTriangle, IconBarChart2 } from 'ui'
import SectionContent from '../SectionContent'
import { CategoryAttribute } from '../Usage.constants'
import {
  ChartTooltipValueFormatter,
  ChartYFormatterCompactNumber,
  getUpgradeUrl,
} from '../Usage.utils'
import UsageBarChart from '../UsageBarChart'
import { ChartMeta } from './UsageSection'
import { useMemo } from 'react'

export interface AttributeUsageProps {
  slug: string
  projectRef?: string
  attribute: CategoryAttribute
  usage?: OrgUsageResponse
  usageMeta?: UsageMetric
  chartMeta: ChartMeta
  subscription?: OrgSubscription

  error: ResponseError | null
  isLoading: boolean
  isError: boolean
  isSuccess: boolean

  currentBillingCycleSelected: boolean
}

const AttributeUsage = ({
  slug,
  projectRef,
  attribute,
  usage,
  usageMeta,
  chartMeta,
  subscription,

  error,
  isLoading,
  isError,
  isSuccess,
  currentBillingCycleSelected,
}: AttributeUsageProps) => {
  const upgradeUrl = getUpgradeUrl(slug ?? '', subscription)
  const usageRatio = (usageMeta?.usage ?? 0) / (usageMeta?.pricing_free_units ?? 0)
  const usageExcess = (usageMeta?.usage ?? 0) - (usageMeta?.pricing_free_units ?? 0)
  const usageBasedBilling = subscription?.usage_billing_enabled
  const exceededLimitStyle = !usageBasedBilling ? 'text-red-900' : 'text-amber-900'

  const chartData = useMemo(() => chartMeta[attribute.key]?.data ?? [], [attribute.key, chartMeta])

  const showUsageWarning =
    currentBillingCycleSelected &&
    usageBasedBilling === false &&
    usageRatio >= USAGE_APPROACHING_THRESHOLD

  const notAllValuesZero = useMemo(() => {
    return (
      attribute.attributes
        ?.map((attr) => {
          return chartData.some((dataPoint) => Number(dataPoint[attr.key]) !== 0)
        })
        .some((x) => !!x) ?? false
    )
  }, [attribute.attributes, chartData])

  return (
    <div id={attribute.anchor}>
      <SectionContent section={attribute}>
        {isLoading && (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        )}

        {isError && <AlertError subject="Failed to retrieve usage data" error={error} />}

        {isSuccess && (
          <>
            {usageMeta?.available_in_plan ? (
              <>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <p className="text-sm">{attribute.name} usage</p>
                      {showUsageWarning && (
                        <Tooltip.Root delayDuration={0}>
                          <Tooltip.Trigger asChild>
                            {usageRatio >= 1 ? (
                              <div className="flex items-center space-x-2 min-w-[115px] cursor-help">
                                <IconAlertTriangle
                                  size={14}
                                  strokeWidth={2}
                                  className={exceededLimitStyle}
                                />
                                <p className={`text-sm ${exceededLimitStyle}`}>Exceeded limit</p>
                              </div>
                            ) : (
                              usageRatio >= USAGE_APPROACHING_THRESHOLD && (
                                <div className="flex items-center space-x-2 min-w-[115px] cursor-help">
                                  <IconAlertTriangle
                                    size={14}
                                    strokeWidth={2}
                                    className="text-amber-900"
                                  />
                                  <p className="text-sm text-amber-900">Approaching limit</p>
                                </div>
                              )
                            )}
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

                    {showUsageWarning && (
                      <Link href={upgradeUrl}>
                        <a className="pb-1">
                          <Button type="default" size="tiny">
                            {subscription?.plan?.id === 'free'
                              ? 'Upgrade plan'
                              : 'Change spend cap'}
                          </Button>
                        </a>
                      </Link>
                    )}
                  </div>

                  {projectRef === undefined &&
                    currentBillingCycleSelected &&
                    !usageMeta.unlimited && (
                      <SparkBar
                        type="horizontal"
                        barClass={clsx(
                          usageRatio >= 1
                            ? usageBasedBilling
                              ? 'bg-scale-1100'
                              : 'bg-red-900'
                            : usageBasedBilling === false &&
                              usageRatio >= USAGE_APPROACHING_THRESHOLD
                            ? 'bg-amber-900'
                            : 'bg-scale-1100'
                        )}
                        bgClass="bg-gray-300 dark:bg-gray-600"
                        value={usageMeta?.usage ?? 0}
                        max={usageMeta?.pricing_free_units || 1}
                      />
                    )}

                  {projectRef === undefined && (
                    <div>
                      <div className="flex items-center justify-between border-b py-1">
                        <p className="text-xs text-scale-1000">
                          Included in {subscription?.plan?.name.toLowerCase()} plan
                        </p>
                        {usageMeta.unlimited ? (
                          <p className="text-xs">Unlimited</p>
                        ) : (
                          <p className="text-xs">
                            {attribute.unit === 'bytes'
                              ? `${usageMeta.pricing_free_units ?? 0} GB`
                              : (usageMeta.pricing_free_units ?? 0).toLocaleString()}
                          </p>
                        )}
                      </div>
                      {currentBillingCycleSelected && (
                        <div className="flex items-center justify-between py-1">
                          <p className="text-xs text-scale-1000">
                            {attribute.chartPrefix || 'Used '} in period
                          </p>
                          <p className="text-xs">
                            {attribute.unit === 'bytes'
                              ? `${usageMeta?.usage ?? 0} GB`
                              : (usageMeta?.usage ?? 0).toLocaleString()}
                          </p>
                        </div>
                      )}
                      {currentBillingCycleSelected && (usageMeta?.pricing_free_units ?? 0) > 0 && (
                        <div className="flex items-center justify-between border-t py-1">
                          <p className="text-xs text-scale-1000">Overage in period</p>
                          <p className="text-xs">
                            {(usageMeta?.pricing_free_units ?? 0) === -1 || usageExcess < 0
                              ? `0${attribute.unit === 'bytes' ? ' GB' : ''}`
                              : attribute.unit === 'bytes'
                              ? `${usageExcess} GB`
                              : usageExcess.toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {attribute.additionalInfo?.(usage)}

                <div className="space-y-1">
                  <p className="text-sm">
                    {attribute.chartPrefix || ''} {attribute.name} per day
                  </p>
                  {attribute.chartDescription.split('\n').map((paragraph, idx) => (
                    <p key={`para-${idx}`} className="text-sm text-scale-1000">
                      {paragraph}
                    </p>
                  ))}
                </div>
                {chartMeta[attribute.key].isLoading ? (
                  <div className="space-y-2">
                    <ShimmeringLoader />
                    <ShimmeringLoader className="w-3/4" />
                    <ShimmeringLoader className="w-1/2" />
                  </div>
                ) : chartData.length > 0 && notAllValuesZero ? (
                  <UsageBarChart
                    name={`${attribute.chartPrefix || ''}${attribute.name}`}
                    unit={attribute.unit}
                    attributes={attribute.attributes}
                    data={chartData}
                    yLeftMargin={chartMeta[attribute.key].margin}
                    yFormatter={(value) => ChartYFormatterCompactNumber(value, attribute.unit)}
                    tooltipFormatter={(value) => ChartTooltipValueFormatter(value, attribute.unit)}
                  />
                ) : (
                  <Panel>
                    <Panel.Content>
                      <div className="flex flex-col items-center justify-center">
                        <IconBarChart2 className="text-scale-1100 mb-2" />
                        <p className="text-sm">No data in period</p>
                        <p className="text-sm text-scale-1000">May take up to 24 hours to show</p>
                      </div>
                    </Panel.Content>
                  </Panel>
                )}
              </>
            ) : (
              <Panel>
                <Panel.Content>
                  <div className="flex w-full items-center flex-col justify-center space-y-2 md:flex-row md:justify-between">
                    <div className="space-y-1">
                      <p className="text-sm">Not included in plan</p>
                      <div>
                        <p className="text-sm text-scale-1100">
                          You need to be on a higher plan in order to use this feature.
                        </p>
                      </div>
                    </div>
                    <Link href={upgradeUrl}>
                      <a>
                        <Button type="primary">Upgrade plan</Button>
                      </a>
                    </Link>
                  </div>
                </Panel.Content>
              </Panel>
            )}
          </>
        )}
      </SectionContent>
    </div>
  )
}

export default AttributeUsage
