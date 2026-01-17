import { BarChart2 } from 'lucide-react'
import { useMemo } from 'react'

import Panel from 'components/ui/Panel'
import { DataPoint } from 'data/analytics/constants'
import { PricingMetric, type OrgDailyUsageResponse } from 'data/analytics/org-daily-stats-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from 'lib/constants'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'
import { SectionContent } from './SectionContent'
import { dailyUsageToDataPoints } from './Usage.utils'
import UsageBarChart from './UsageBarChart'

export interface ComputeProps {
  orgDailyStats: OrgDailyUsageResponse | undefined
  isLoadingOrgDailyStats: boolean
}

const ActiveCompute = ({ orgDailyStats, isLoadingOrgDailyStats }: ComputeProps) => {
  const { billingAll } = useIsFeatureEnabled(['billing:all'])

  const chartData: DataPoint[] = dailyUsageToDataPoints(
    orgDailyStats,
    (metric) => metric === PricingMetric.ACTIVE_COMPUTE_HOURS
  )

  const notAllValuesZero = useMemo(() => {
    return chartData.some(
      (dataPoint) =>
        dataPoint['active_compute_hours'] && Number(dataPoint['active_compute_hours']) > 0
    )
  }, [chartData])

  return (
    <div id="active-compute" className="scroll-my-12">
      <SectionContent
        section={{
          name: 'Active Compute Hours',
          description:
            'Amount of active compute hours your projects on scale-to-zero instances consumed. Projects on scale-to-zero instances automatically scale down after a 15m inactivity period.',
          links: billingAll
            ? [
                {
                  name: 'Learn more',
                  url: `${DOCS_URL}/guides/integrations/supabase-for-platforms#pico-compute-instance`,
                },
              ]
            : [],
        }}
      >
        {isLoadingOrgDailyStats && <GenericSkeletonLoader />}

        {!isLoadingOrgDailyStats && (
          <>
            <div className="space-y-1">
              {chartData.length > 0 && (
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <p className="text-sm">Active Compute Hours usage</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between border-b last:border-b-0 py-1 last:py-0">
                <p className="text-sm text-foreground-light">
                  Active Compute Hours usage in period
                </p>
                <p className="text-sm">
                  {chartData.reduce(
                    (prev, cur) => prev + ((cur['active_compute_hours'] as number) ?? 0),
                    0
                  )}{' '}
                  hours
                </p>
              </div>
            </div>

            {chartData.length > 0 && notAllValuesZero ? (
              <UsageBarChart
                name={`Active Compute Hours usage`}
                unit={'hours'}
                attributes={[{ key: 'active_compute_hours', color: 'blue' }]}
                data={chartData}
                yMin={24}
              />
            ) : (
              <Panel>
                <Panel.Content>
                  <div className="flex flex-col items-center justify-center">
                    <BarChart2 className="text-foreground-light mb-2" />
                    <p className="text-sm">No data in period</p>
                    <p className="text-sm text-foreground-light">May take up to one hour to show</p>
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

export default ActiveCompute
