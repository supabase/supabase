import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SectionHeader from './SectionHeader'
import { CategoryMetaKey, USAGE_CATEGORIES } from './Usage.constants'
import {
  ProjectUsageResponse,
  UsageMetric,
  useProjectUsageQuery,
} from 'data/usage/project-usage-query'
import { DataPoint } from 'data/analytics/constants'
import SectionContent from './SectionContent'
import { Button, IconAlertTriangle, IconBarChart2 } from 'ui'
import { USAGE_APPROACHING_THRESHOLD } from '../Billing.constants'
import Link from 'next/link'
import SparkBar from 'components/ui/SparkBar'
import clsx from 'clsx'
import { ProjectSubscriptionResponse } from 'data/subscriptions/project-subscription-v2-query'
import { ChartYFormatterCompactNumber, getUpgradeUrlFromV2Subscription } from './Usage.utils'
import { formatBytes } from 'lib/helpers'
import UsageBarChart from './UsageBarChart'
import Panel from 'components/ui/Panel'

interface UsageSectionProps {
  projectRef: string
  categoryKey: CategoryMetaKey
  subscription: ProjectSubscriptionResponse | undefined
  chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean; hasNoData: boolean }
  }
}

const UsageSection = ({ projectRef, categoryKey, chartMeta, subscription }: UsageSectionProps) => {
  const { data: usage } = useProjectUsageQuery({ projectRef })
  const categoryMeta = USAGE_CATEGORIES.find((category) => category.key === categoryKey)

  if (!categoryMeta) return null

  const usageBasedBilling = subscription?.usage_billing_enabled
  const exceededLimitStyle = !usageBasedBilling ? 'text-red-900' : 'text-amber-900'

  const upgradeUrl = getUpgradeUrlFromV2Subscription(projectRef, subscription)

  return (
    <>
      <SectionHeader title={categoryMeta.name} description={categoryMeta.description} />

      {categoryMeta.attributes.map((attribute) => {
        const usageMeta = usage?.[attribute.key as keyof ProjectUsageResponse] as UsageMetric
        const usageRatio =
          typeof usageMeta !== 'number' ? (usageMeta?.usage ?? 0) / (usageMeta?.limit ?? 0) : 0
        const usageExcess = (usageMeta?.usage ?? 0) - (usageMeta?.limit ?? 0)

        const chartData = chartMeta[attribute.key]?.data ?? []

        const notAllValuesZero = chartData.some(
          (dataPoint) => Number(dataPoint[attribute.attribute]) !== 0
        )

        return (
          <div id={attribute.anchor} key={attribute.key}>
            <SectionContent section={attribute}>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm">{attribute.name} usage</p>
                    {!usageBasedBilling && usageRatio >= 1 ? (
                      <div className="flex items-center space-x-2 min-w-[115px]">
                        <IconAlertTriangle
                          size={14}
                          strokeWidth={2}
                          className={exceededLimitStyle}
                        />
                        <p className={`text-sm ${exceededLimitStyle}`}>Exceeded limit</p>
                      </div>
                    ) : !usageBasedBilling && usageRatio >= USAGE_APPROACHING_THRESHOLD ? (
                      <div className="flex items-center space-x-2 min-w-[115px]">
                        <IconAlertTriangle size={14} strokeWidth={2} className="text-amber-900" />
                        <p className="text-sm text-amber-900">Approaching limit</p>
                      </div>
                    ) : null}
                  </div>

                  {!usageBasedBilling && usageRatio >= USAGE_APPROACHING_THRESHOLD && (
                    <Link href={upgradeUrl}>
                      <a>
                        <Button type="default" size="tiny">
                          Upgrade project
                        </Button>
                      </a>
                    </Link>
                  )}
                </div>
                {usageMeta?.limit > 0 && (
                  <SparkBar
                    type="horizontal"
                    barClass={clsx(
                      usageRatio >= 1
                        ? usageBasedBilling
                          ? 'bg-amber-900'
                          : 'bg-red-900'
                        : usageRatio >= USAGE_APPROACHING_THRESHOLD
                        ? 'bg-amber-900'
                        : 'bg-scale-1100'
                    )}
                    bgClass="bg-gray-300 dark:bg-gray-600"
                    value={usageMeta?.usage ?? 0}
                    max={usageMeta?.limit || 1}
                  />
                )}
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.plan?.name.toLowerCase()} plan
                    </p>
                    <p className="text-xs">
                      {attribute.unit === 'bytes'
                        ? formatBytes(usageMeta?.limit ?? 0)
                        : (usageMeta?.limit ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">
                      {attribute.chartPrefix || 'Used '}in period
                    </p>
                    <p className="text-xs">
                      {attribute.unit === 'bytes'
                        ? formatBytes(usageMeta?.usage ?? 0)
                        : (usageMeta?.usage ?? 0).toLocaleString()}
                    </p>
                  </div>
                  {usageMeta?.limit > 0 && (
                    <div className="flex items-center justify-between border-t py-1">
                      <p className="text-xs text-scale-1000">Overage in period</p>
                      <p className="text-xs">
                        {usageExcess < 0
                          ? attribute.unit === 'bytes'
                            ? formatBytes(0)
                            : 0
                          : attribute.unit === 'bytes'
                          ? formatBytes(usageExcess)
                          : usageExcess.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {attribute.additionalInfo?.(subscription, usage)}

              <div className="space-y-1">
                <p>
                  {attribute.chartPrefix || ''}
                  {attribute.name} per day
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
              ) : chartData.length > 1 && notAllValuesZero ? (
                <UsageBarChart
                  name={`${attribute.chartPrefix || ''}${attribute.name}`}
                  unit={attribute.unit}
                  attribute={attribute.attribute}
                  data={chartData}
                  yLeftMargin={chartMeta[attribute.key].margin}
                  yFormatter={(value) => ChartYFormatterCompactNumber(value, attribute.unit)}
                />
              ) : (
                <Panel>
                  <Panel.Content>
                    <div className="flex flex-col items-center justify-center">
                      <IconBarChart2 className="text-scale-1100 mb-2" />
                      <p className='text-sm'>No data in period</p>
                      <p className="text-sm text-scale-1000">
                        May take up to 24 hours to show
                      </p>
                    </div>
                  </Panel.Content>
                </Panel>
              )}
            </SectionContent>
          </div>
        )
      })}
    </>
  )
}

export default UsageSection
