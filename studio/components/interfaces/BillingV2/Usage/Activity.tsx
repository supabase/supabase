import { useParams } from 'common'
import ShimmeringLoader from 'components/ui/ShimmeringLoader'
import SparkBar from 'components/ui/SparkBar'
import { useDailyStatsQuery } from 'data/analytics/daily-stats-query'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { useProjectUsageQuery } from 'data/usage/project-usage-query'
import { Button } from 'ui'
import BarChart from './BarChart'
import SectionContent from './SectionContent'
import SectionHeader from './SectionHeader'
import { generateUsageData } from './Usage.utils'

export interface ActivityProps {
  projectRef: string
}

const Activity = ({ projectRef }: ActivityProps) => {
  const { data: usage } = useProjectUsageQuery({ projectRef })
  const { data: subscription } = useProjectSubscriptionQuery({ projectRef })
  const { current_period_start, current_period_end } = subscription?.billing ?? {}
  const startDate = new Date((current_period_start ?? 0) * 1000).toISOString()
  const endDate = new Date((current_period_end ?? 0) * 1000).toISOString()

  const MAU_KEY = 'total_auth_billing_period_mau'
  const { monthly_active_users } = usage ?? {}
  const mauExcess = (monthly_active_users?.usage ?? 0) - (monthly_active_users?.limit ?? 0)
  const { data: mauData, isLoading: isLoadingMauData } = useDailyStatsQuery({
    projectRef,
    attribute: MAU_KEY,
    interval: '1d',
    startDate,
    endDate,
  })

  const ASSET_TRANSFORMATIONS_KEY = 'total_storage_image_render_count'
  const { storage_image_render_count } = usage ?? {}
  const assetTransformationExcess =
    (storage_image_render_count?.usage ?? 0) - (storage_image_render_count?.limit ?? 0)
  const { data: assetTransformationsData, isLoading: isLoadingAssetTransformationsData } =
    useDailyStatsQuery({
      projectRef,
      attribute: ASSET_TRANSFORMATIONS_KEY,
      interval: '1d',
      startDate,
      endDate,
    })

  const FUNC_INVOCATIONS_KEY = 'total_func_invocations'
  const { func_invocations } = usage ?? {}
  const funcInvocationsExcess = (func_invocations?.usage ?? 0) - (func_invocations?.limit ?? 0)
  const { data: funcInvocationsData, isLoading: isLoadingFuncInvocationsData } = useDailyStatsQuery(
    {
      projectRef,
      attribute: FUNC_INVOCATIONS_KEY,
      interval: '1d',
      startDate,
      endDate,
    }
  )

  return (
    <>
      <SectionHeader title="Activity" description="Some description here" />

      <SectionContent title="Monthly Active Users (MAU)" description="Some description here">
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
            hasQuota
            attribute={MAU_KEY}
            data={mauData?.data ?? []}
            yLimit={monthly_active_users?.limit ?? 0}
            yLeftMargin={18}
            yFormatter={(value) => value.toLocaleString()}
          />
        )}
      </SectionContent>

      <SectionContent title="Storage Image Transformations" description="Some description here">
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
              {storage_image_render_count?.limit === -1 ? (
                <p className="text-xs">None</p>
              ) : (
                <p className="text-xs">
                  {(storage_image_render_count?.limit ?? 0).toLocaleString()}
                </p>
              )}
            </div>
            <div className="flex items-center justify-between border-b py-1">
              <p className="text-xs text-scale-1000">Used</p>
              <p className="text-xs">{(storage_image_render_count?.usage ?? 0).toLocaleString()}</p>
            </div>
            <div className="flex items-center justify-between py-1">
              <p className="text-xs text-scale-1000">Extra volume used this month</p>
              <p className="text-xs">
                {((storage_image_render_count?.limit ?? 0) === -1 || assetTransformationExcess < 0
                  ? 0
                  : assetTransformationExcess
                ).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        {storage_image_render_count?.available_in_plan && (
          <>
            <div className="space-y-1">
              <p>Asset transformations over time</p>
              <p className="text-sm text-scale-1000">Some description here</p>
            </div>
            {isLoadingAssetTransformationsData ? (
              <div className="space-y-2">
                <ShimmeringLoader />
                <ShimmeringLoader className="w-3/4" />
                <ShimmeringLoader className="w-1/2" />
              </div>
            ) : (
              <BarChart
                hasQuota
                attribute={ASSET_TRANSFORMATIONS_KEY}
                data={assetTransformationsData?.data ?? []}
                yLimit={storage_image_render_count?.limit ?? 0}
              />
            )}
          </>
        )}
      </SectionContent>

      <SectionContent title="Edge Function Invocations" description="Some description here">
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
        {isLoadingFuncInvocationsData ? (
          <div className="space-y-2">
            <ShimmeringLoader />
            <ShimmeringLoader className="w-3/4" />
            <ShimmeringLoader className="w-1/2" />
          </div>
        ) : (
          <BarChart
            hasQuota
            attribute={FUNC_INVOCATIONS_KEY}
            data={funcInvocationsData?.data ?? []}
            unit={undefined}
            yLimit={func_invocations?.limit ?? 0}
            yLeftMargin={26}
            yFormatter={(value) => value.toLocaleString()}
          />
        )}
      </SectionContent>

      {/* Sample Chart */}
      <div className="border-b">
        <div className="1xl:px-28 mx-auto flex flex-col gap-10 px-5 lg:px-16 2xl:px-32 py-16">
          <div className="grid grid-cols-12">
            <div className="col-span-5">
              <div className="sticky top-16">
                <p className="text-base">Sample Chart</p>
                <p className="text-sm text-scale-1000">Some description here</p>
              </div>
            </div>
            <div className="col-span-7 space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm">Sample quota usage</p>
                  <Button type="default" size="tiny" onClick={() => {}}>
                    Upgrade project
                  </Button>
                </div>
                <SparkBar type="horizontal" barClass="bg-scale-1200" value={75} max={100} />
                <div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">
                      Included in {subscription?.tier.name.toLowerCase()}
                    </p>
                    <p className="text-xs">{(10000).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-between border-b py-1">
                    <p className="text-xs text-scale-1000">Used</p>
                    <p className="text-xs">0</p>
                  </div>
                  <div className="flex items-center justify-between py-1">
                    <p className="text-xs text-scale-1000">Extra volume used this month</p>
                    <p className="text-xs">0</p>
                  </div>
                </div>
              </div>
              <div className="space-y-1">
                <p>Sample usage over time</p>
                <p className="text-sm text-scale-1000">
                  Some description here to explain what this metric is about
                </p>
              </div>
              <BarChart
                hasQuota
                attribute="sample_data"
                data={generateUsageData('sample_data', 30)}
                yLimit={70}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default Activity
