import clsx from 'clsx'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import {
  ProjectUsageResponse,
  UsageMetric,
  useProjectUsageQuery,
} from 'data/usage/project-usage-query'
import { Button, IconAlertTriangle } from 'ui'
import { USAGE_APPROACHING_THRESHOLD } from '../Billing.constants'
import BarChart from './BarChart'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'
import { USAGE_CATEGORIES } from './Usage.constants'

export interface ActivityProps {
  projectRef: string
}

const Activity = ({ projectRef }: ActivityProps) => {
  const { data: usage } = useProjectUsageQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate = new Date((current_period_start ?? 0) * 1000).toISOString()
  const endDate = new Date((current_period_end ?? 0) * 1000).toISOString()
  const categoryMeta = USAGE_CATEGORIES.find((category) => category.key === 'activity')

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

  const chartMeta: any = {
    monthly_active_users: {
      isLoading: isLoadingMauData,
      data: mauData?.data ?? [],
      margin: 18,
    },
    monthly_active_sso_users: {
      isLoading: isLoadingMauSSOData,
      data: mauSSOData?.data ?? [],
      margin: 20,
    },
    storage_image_render_count: {
      isLoading: isLoadingAssetTransformationsData,
      data: assetTransformationsData?.data ?? [],
      margin: 0,
    },
    func_invocations: {
      isLoading: isLoadingFuncInvocationsData,
      data: funcInvocationsData?.data ?? [],
      margin: 26,
    },
    realtime_message_count: {
      isLoading: isLoadingRealtimeMessagesData,
      data: realtimeMessagesData?.data ?? [],
      margin: 38,
    },
    realtime_peak_connection: {
      isLoading: isLoadingRealtimeConnectionsData,
      data: realtimeConnectionsData?.data ?? [],
      margin: 0,
    },
  }

  if (categoryMeta === undefined) return null

  return (
    <>
      <SectionHeader title="Activity" description="Some description here" />

      {categoryMeta.attributes.map((attribute) => {
        const usageMeta = usage?.[attribute.key as keyof ProjectUsageResponse] as UsageMetric
        const usageRatio =
          typeof usageMeta !== 'number' ? (usageMeta?.usage ?? 0) / (usageMeta?.limit ?? 0) : 0
        const usageExcess = (usageMeta?.usage ?? 0) - (usageMeta?.limit ?? 0)

        return (
          <SectionContent
            key={attribute.key}
            title={attribute.name}
            description={attribute.description}
            includedInPlan={usageMeta.available_in_plan}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm">
                    {attribute.name} {subscription?.tier.key.toLowerCase()} quota usage
                  </p>
                  {usageRatio >= 1 ? (
                    <div className="flex items-center space-x-2 min-w-[115px]">
                      <IconAlertTriangle size={14} strokeWidth={2} className="text-red-900" />
                      <p className="text-sm text-red-900">Exceeded limit</p>
                    </div>
                  ) : usageRatio >= USAGE_APPROACHING_THRESHOLD ? (
                    <div className="flex items-center space-x-2 min-w-[115px]">
                      <IconAlertTriangle size={14} strokeWidth={2} className="text-amber-900" />
                      <p className="text-sm text-red-900">Reaching limit</p>
                    </div>
                  ) : null}
                </div>
                <Button type="default" size="tiny" onClick={() => {}}>
                  Upgrade project
                </Button>
              </div>
              <SparkBar
                type="horizontal"
                barClass={clsx(
                  usageRatio >= 1
                    ? 'bg-red-900'
                    : usageRatio >= USAGE_APPROACHING_THRESHOLD
                    ? 'bg-amber-900'
                    : 'bg-scale-1100'
                )}
                value={usageMeta?.usage ?? 0}
                max={usageMeta?.limit ?? 0}
              />
              <div>
                <div className="flex items-center justify-between border-b py-1">
                  <p className="text-xs text-scale-1000">
                    Included in {subscription?.tier.name.toLowerCase()}
                  </p>
                  {usageMeta?.limit === -1 ? (
                    <p className="text-xs">None</p>
                  ) : (
                    <p className="text-xs">{(usageMeta?.limit ?? 0).toLocaleString()}</p>
                  )}
                </div>
                <div className="flex items-center justify-between border-b py-1">
                  <p className="text-xs text-scale-1000">Used</p>
                  <p className="text-xs">{(usageMeta?.usage ?? 0).toLocaleString()}</p>
                </div>
                <div className="flex items-center justify-between py-1">
                  <p className="text-xs text-scale-1000">Extra volume used this month</p>
                  <p className="text-xs">
                    {((usageMeta?.limit ?? 0) === -1 || usageExcess < 0
                      ? 0
                      : usageExcess
                    ).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            {usageMeta.available_in_plan && (
              <>
                <div className="space-y-1">
                  <p>{attribute.name} over time</p>
                  <p className="text-sm text-scale-1000">{attribute.chartDescription}</p>
                </div>
                {chartMeta[attribute.key].isLoading ? (
                  <div className="space-y-2">
                    <ShimmeringLoader />
                    <ShimmeringLoader className="w-3/4" />
                    <ShimmeringLoader className="w-1/2" />
                  </div>
                ) : (
                  <BarChart
                    hasQuota
                    attribute={attribute.attribute}
                    data={chartMeta[attribute.key]?.data ?? []}
                    yLimit={usageMeta?.limit ?? 0}
                    yLeftMargin={chartMeta[attribute.key].margin}
                    yFormatter={(value) => value.toLocaleString()}
                  />
                )}
              </>
            )}
          </SectionContent>
        )
      })}
    </>
  )
}

export default Activity
