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
import dayjs from 'dayjs'
import Link from 'next/link'
import { Button, IconAlertTriangle } from 'ui'
import { USAGE_APPROACHING_THRESHOLD } from '../Billing.constants'
import UsageBarChart from './UsageBarChart'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'
import { USAGE_CATEGORIES } from './Usage.constants'
import { getUpgradeUrl } from './Usage.utils'
import { PRICING_TIER_PRODUCT_IDS } from 'lib/constants'
import { DataPoint } from 'data/analytics/constants'

export interface ActivityProps {
  projectRef: string
}

const Activity = ({ projectRef }: ActivityProps) => {
  const { data: usage } = useProjectUsageQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate =
    current_period_start !== undefined
      ? new Date(current_period_start * 1000).toISOString()
      : undefined
  const endDate =
    current_period_end !== undefined ? new Date(current_period_end * 1000).toISOString() : undefined
  const categoryMeta = USAGE_CATEGORIES.find((category) => category.key === 'activity')

  const upgradeUrl = getUpgradeUrl(projectRef, subscription)
  const isFreeTier = subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.FREE
  const isProTier = subscription?.tier.supabase_prod_id === PRICING_TIER_PRODUCT_IDS.PRO
  const exceededLimitStyle = isFreeTier || isProTier ? 'text-red-900' : 'text-amber-900'

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

        // [Joshen] Ideally this should come from the API imo, foresee some discrepancies
        const lastZeroValue = chartData.find(
          (x: any) => x.loopId > 0 && x[attribute.attribute] === 0
        )
        const lastKnownValue =
          lastZeroValue !== undefined && !chartMeta[attribute.key]?.hasNoData
            ? dayjs(lastZeroValue.period_start)
                .subtract(1, 'day')
                .format('DD MMM YYYY, HH:mma (ZZ)')
            : undefined

        return (
          <div id={attribute.anchor} key={attribute.key}>
            <SectionContent section={attribute} includedInPlan={usageMeta?.available_in_plan}>
              {usageMeta?.available_in_plan && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <p className="text-sm">{attribute.name} quota usage</p>
                        {usageRatio >= 1 ? (
                          <div className="flex items-center space-x-2 min-w-[115px]">
                            <IconAlertTriangle
                              size={14}
                              strokeWidth={2}
                              className={exceededLimitStyle}
                            />
                            <p className={`text-sm ${exceededLimitStyle}`}>Exceeded limit</p>
                          </div>
                        ) : usageRatio >= USAGE_APPROACHING_THRESHOLD ? (
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
                      {isFreeTier && (
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
                            ? 'bg-red-900'
                            : usageRatio >= USAGE_APPROACHING_THRESHOLD
                            ? 'bg-amber-900'
                            : 'bg-scale-1100'
                        )}
                        value={usageMeta?.usage ?? 0}
                        max={usageMeta?.limit ?? 0}
                      />
                    )}
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
                      <div className="flex items-center justify-between py-1">
                        <p className="text-xs text-scale-1000">Used</p>
                        <p className="text-xs">{(usageMeta?.usage ?? 0).toLocaleString()}</p>
                      </div>
                      {usageMeta.limit > 0 && (
                        <div className="flex items-center justify-between border-t py-1">
                          <p className="text-xs text-scale-1000">Extra volume used this month</p>
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
                    <p>{attribute.name} over time</p>
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
                  ) : (
                    <UsageBarChart
                      hasQuota
                      name={attribute.name}
                      unit={attribute.unit}
                      attribute={attribute.attribute}
                      data={chartData}
                      yLimit={usageMeta?.limit ?? 0}
                      yLeftMargin={chartMeta[attribute.key].margin}
                      yFormatter={(value) => value.toLocaleString()}
                      quotaWarningType={isFreeTier || isProTier ? 'danger' : 'warning'}
                    />
                  )}
                </>
              )}
            </SectionContent>
          </div>
        )
      })}
    </>
  )
}

export default Activity
