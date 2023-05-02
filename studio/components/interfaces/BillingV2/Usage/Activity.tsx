import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import BarChart from './BarChart'
import SparkBar from 'components/ui/SparkBar'
import { formatBytes } from 'lib/helpers'
import { Button } from 'ui'
import { generateUsageData } from './Usage.utils'

const Activity = () => {
  const { ref } = useParams()
  const { data: usage } = useProjectUsageQuery({ projectRef: ref })
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef: ref })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate = new Date((current_period_start ?? 0) * 1000).toISOString()
  const endDate = new Date((current_period_end ?? 0) * 1000).toISOString()

  // [JOSHEN TODO] Attribute needs to change after confirming with team o11y if this is implemented
  const { monthly_active_users } = usage ?? {}
  const mauExcess = (monthly_active_users?.usage ?? 0) - (monthly_active_users?.limit ?? 0)
  const { data: mauData, isLoading: isLoadingMauData } = useDailyStatsQuery({
    projectRef: ref,
    attribute: 'total_auth_billing_period_mau',
    interval: '1d',
    startDate,
    endDate,
  })

  const { storage_image_render_count } = usage ?? {}
  const assetTransformationExcess =
    (storage_image_render_count?.usage ?? 0) - (storage_image_render_count?.limit ?? 0)

  const { func_invocations } = usage ?? {}
  const funcInvocationsExcess = (func_invocations?.usage ?? 0) - (func_invocations?.limit ?? 0)

  return (
    <>
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="sticky top-16">
            <p className="text-base">Activity</p>
            <p className="text-sm text-scale-1000">Some description here</p>
          </div>
        </div>
      </div>

      {/* MONTHLY ACTIVE USERS - need to fix if no value yet (API will return period_start as 0 in first data point) */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">Monthly Active Users (MAU)</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    Monthly active users {subscription?.tier.key.toLowerCase()} quota usage
                  </p>
                  <Button type="default" size="tiny" onClick={() => {}}>
                    Upgrade project
                  </Button>
                </div>
                <SparkBar
                  type="horizontal"
                  barClass="bg-scale-1200"
                  value={monthly_active_users?.usage ?? 0}
                  max={monthly_active_users?.limit ?? 0}
                />
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.tier.name.toLowerCase()}
                    </p>
                    <p className="text-xs">{(monthly_active_users?.limit ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">Used</p>
                    <p className="text-xs">{(monthly_active_users?.usage ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">Extra volume used this month</p>
                    <p className="text-xs">{(mauExcess < 0 ? 0 : mauExcess).toLocaleString()}</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p>Monthly active users over time</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
              {isLoadingMauData ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              ) : (
                <BarChart
                  attribute="total_auth_billing_period_mau"
                  data={mauData?.data ?? []}
                  unit={undefined}
                  yDomain={[0, 100]}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ASSET TRANSFORMATIONS - need to show actual data */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">Asset Transformations</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    Asset transformations {subscription?.tier.key.toLowerCase()} quota usage
                  </p>
                  <Button type="default" size="tiny" onClick={() => {}}>
                    Upgrade project
                  </Button>
                </div>
                <SparkBar
                  type="horizontal"
                  barClass="bg-scale-1200"
                  value={storage_image_render_count?.usage ?? 0}
                  max={storage_image_render_count?.limit ?? 0}
                />
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.tier.name.toLowerCase()}
                    </p>
                    <p className="text-xs">
                      {(storage_image_render_count?.limit ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">Used</p>
                    <p className="text-xs">
                      {(storage_image_render_count?.usage ?? 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">Extra volume used this month</p>
                    <p className="text-xs">
                      {(assetTransformationExcess < 0
                        ? 0
                        : assetTransformationExcess
                      ).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p>Asset transformations over time</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
              {isLoadingMauData ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              ) : (
                <BarChart
                  attribute="disk_io_budget"
                  data={generateUsageData('disk_io_budget', 30)}
                  unit={undefined}
                  yDomain={[0, 100]}
                  reference={{
                    value: 65,
                    label: 'FREE QUOTA',
                    x: 60,
                    y: 49,
                    width: 200,
                    height: 24,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDGE FUNCTIONS INVOCATIONS - need to show actual data */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">Edge Function Invocations</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">
                    Edge function invocations {subscription?.tier.key.toLowerCase()} quota usage
                  </p>
                  <Button type="default" size="tiny" onClick={() => {}}>
                    Upgrade project
                  </Button>
                </div>
                <SparkBar
                  type="horizontal"
                  barClass="bg-scale-1200"
                  value={func_invocations?.usage ?? 0}
                  max={func_invocations?.limit ?? 0}
                />
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.tier.name.toLowerCase()}
                    </p>
                    <p className="text-xs">{(func_invocations?.limit ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">Used</p>
                    <p className="text-xs">{(func_invocations?.usage ?? 0).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">Extra volume used this month</p>
                    <p className="text-xs">
                      {(funcInvocationsExcess < 0 ? 0 : funcInvocationsExcess).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p>Edge function invocations over time</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
              {isLoadingMauData ? (
                <div className="space-y-2">
                  <ShimmeringLoader />
                  <ShimmeringLoader className="w-3/4" />
                  <ShimmeringLoader className="w-1/2" />
                </div>
              ) : (
                <BarChart
                  attribute="disk_io_budget"
                  data={generateUsageData('disk_io_budget', 30)}
                  unit={undefined}
                  yDomain={[0, 100]}
                  reference={{
                    value: 65,
                    label: 'FREE QUOTA',
                    x: 60,
                    y: 49,
                    width: 200,
                    height: 24,
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Activity
