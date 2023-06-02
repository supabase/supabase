import clsx from 'clsx'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import {
  ProjectUsageResponse,
  UsageMetric,
  useProjectUsageQuery,
} from 'data/usage/project-usage-query'
import dayjs from 'dayjs'
import Link from 'next/link'
import { Button, IconAlertTriangle } from 'ui'
import { USAGE_APPROACHING_THRESHOLD } from '../Billing.constants'
import UsageBarChart from './UsageBarChart'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'
import { USAGE_CATEGORIES } from './Usage.constants'
import { ChartYFormatterCompactNumber, getUpgradeUrlFromV2Subscription } from './Usage.utils'
import { DataPoint } from 'data/analytics/constants'
import Panel from 'components/ui/Panel'
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useMemo } from 'react'

export interface ActivityProps {
  projectRef: string
}

const Activity = ({ projectRef }: ActivityProps) => {
  const { data: usage } = useProjectUsageQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionV2Query({ projectRef })
  const { current_period_start, current_period_end } = subscription ?? {}

  const startDate = useMemo(() => {
    return current_period_start ? new Date(current_period_start * 1000).toISOString() : undefined
  }, [current_period_start])

  const endDate = useMemo(() => {
    const periodEndDate = current_period_end ? new Date(current_period_end * 1000) : undefined
    // If end date is in future, set end date to now
    if (periodEndDate && dayjs(periodEndDate).isAfter(dayjs())) {
      const yesterday = dayjs(new Date()).subtract(1, 'day')

      /**
       * Currently, daily-stats data is only available a day later, so we'll use yesterday as end date, as otherwise the current day would just show up with "0" values
       *
       * We are actively working on removing this restriction on the data-eng/LF side and can remove this workaround once that's done
       */
      const newEndDate = yesterday.isAfter(dayjs(startDate)) ? yesterday : new Date()

      // LF seems to have an issue with the milliseconds, causes infinite loading sometimes
      return newEndDate.toISOString().slice(0, -5) + 'Z'
    } else if (periodEndDate) {
      return periodEndDate.toISOString()
    }
  }, [current_period_end, startDate])

  const categoryMeta = USAGE_CATEGORIES.find((category) => category.key === 'activity')

  const upgradeUrl = getUpgradeUrlFromV2Subscription(projectRef, subscription)

  const usageBasedBilling = subscription?.usage_billing_enabled
  const exceededLimitStyle = !usageBasedBilling ? 'text-red-900' : 'text-amber-900'

  const { data: mauData, isLoading: isLoadingMauData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_auth_billing_period_mau',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: mauSSOData, isLoading: isLoadingMauSSOData } = useDailyStatsQuery({
    projectRef,
    attribute: 'total_auth_billing_period_sso_mau',
    interval: '1d',
    startDate,
    endDate,
  })

  const { data: assetTransformationsData, isLoading: isLoadingAssetTransformationsData } =
    useDailyStatsQuery({
      projectRef,
      attribute: 'total_storage_image_render_count',
      interval: '1d',
      startDate,
      endDate,
    })

  const { data: funcInvocationsData, isLoading: isLoadingFuncInvocationsData } = useDailyStatsQuery(
    {
      projectRef,
      attribute: 'total_func_invocations',
      interval: '1d',
      startDate,
      endDate,
    }
  )

  const { data: realtimeMessagesData, isLoading: isLoadingRealtimeMessagesData } =
    useDailyStatsQuery({
      projectRef,
      attribute: 'total_realtime_message_count',
      interval: '1d',
      startDate,
      endDate,
    })

  const { data: realtimeConnectionsData, isLoading: isLoadingRealtimeConnectionsData } =
    useDailyStatsQuery({
      projectRef,
      attribute: 'total_realtime_peak_connection',
      interval: '1d',
      startDate,
      endDate,
    })

  const chartMeta: {
    [key: string]: { data: DataPoint[]; margin: number; isLoading: boolean; hasNoData: boolean }
  } = {
    monthly_active_users: {
      data: mauData?.data ?? [],
      margin: 18,
      isLoading: isLoadingMauData,
      hasNoData: mauData?.hasNoData ?? false,
    },
    monthly_active_sso_users: {
      data: mauSSOData?.data ?? [],
      margin: 20,
      isLoading: isLoadingMauSSOData,
      hasNoData: mauSSOData?.hasNoData ?? false,
    },
    storage_image_render_count: {
      data: assetTransformationsData?.data ?? [],
      margin: 0,
      isLoading: isLoadingMauSSOData,
      hasNoData: assetTransformationsData?.hasNoData ?? false,
    },
    func_invocations: {
      data: funcInvocationsData?.data ?? [],
      margin: 26,
      isLoading: isLoadingFuncInvocationsData,
      hasNoData: funcInvocationsData?.hasNoData ?? false,
    },
    realtime_message_count: {
      data: realtimeMessagesData?.data ?? [],
      margin: 38,
      isLoading: isLoadingRealtimeMessagesData,
      hasNoData: realtimeMessagesData?.hasNoData ?? false,
    },
    realtime_peak_connection: {
      data: realtimeConnectionsData?.data ?? [],
      margin: 0,
      isLoading: isLoadingRealtimeConnectionsData,
      hasNoData: realtimeConnectionsData?.hasNoData ?? false,
    },
  }

  if (categoryMeta === undefined) return null

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
            <SectionContent section={attribute} includedInPlan={usageMeta?.available_in_plan}>
              {usageMeta?.available_in_plan ? (
                <>
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
                            <IconAlertTriangle
                              size={14}
                              strokeWidth={2}
                              className="text-amber-900"
                            />
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
                    {usageMeta.limit > 0 && (
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
                        {usageMeta?.limit === -1 ? (
                          <p className="text-xs">None</p>
                        ) : usageMeta?.limit === 0 ? (
                          <p className="text-xs">Unlimited</p>
                        ) : (
                          <p className="text-xs">{(usageMeta?.limit ?? 0).toLocaleString()}</p>
                        )}
                      </div>
                      <div className="flex items-center justify-between py-1">
                        <p className="text-xs text-scale-1000">
                          {attribute.chartPrefix || 'Used '}in period
                        </p>
                        <p className="text-xs">{(usageMeta?.usage ?? 0).toLocaleString()}</p>
                      </div>
                      {usageMeta.limit > 0 && (
                        <div className="flex items-center justify-between border-t py-1">
                          <p className="text-xs text-scale-1000">Overage in period</p>
                          <p className="text-xs">
                            {((usageMeta?.limit ?? 0) === -1 || usageExcess < 0
                              ? 0
                              : usageExcess
                            ).toLocaleString()}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <p>{attribute.name} per day</p>
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
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <p>No data</p>
                          <p className="text-sm text-scale-1000">
                            No {notAllValuesZero ? 'data' : 'usage'} in period
                          </p>
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
                      <Link href={`/project/${projectRef}/settings/billing/subscription`}>
                        <a>
                          <Button type="primary">Upgrade plan</Button>
                        </a>
                      </Link>
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

export default Activity
