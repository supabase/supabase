import { BarChart2 } from 'lucide-react'
import { useMemo } from 'react'

import Panel from 'components/ui/Panel'
import { GenericSkeletonLoader } from 'components/ui/ShimmeringLoader'
import { DataPoint } from 'data/analytics/constants'
import {
  ComputeUsageMetric,
  computeUsageMetricLabel,
  type OrgDailyUsageResponse,
} from 'data/analytics/org-daily-stats-query'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { DOCS_URL } from 'lib/constants'
import { SectionContent } from './SectionContent'
import { Attribute, AttributeColor } from './Usage.constants'
import UsageBarChart from './UsageBarChart'
import { dailyUsageToDataPoints } from './Usage.utils'

export interface ComputeProps {
  orgDailyStats: OrgDailyUsageResponse | undefined
  isLoadingOrgDailyStats: boolean
}

const Compute = ({ orgDailyStats, isLoadingOrgDailyStats }: ComputeProps) => {
  const allAttributeKeys = Object.values(ComputeUsageMetric).map((it) => it.toLowerCase())

  const { billingAll } = useIsFeatureEnabled(['billing:all'])

  const chartData: DataPoint[] = dailyUsageToDataPoints(orgDailyStats, (metric) =>
    metric.toString().startsWith('COMPUTE')
  )

  const COMPUTE_TO_COLOR: Record<ComputeUsageMetric, AttributeColor> = {
    [ComputeUsageMetric.COMPUTE_HOURS_BRANCH]: 'blue',
    [ComputeUsageMetric.COMPUTE_HOURS_XS]: 'white',
    [ComputeUsageMetric.COMPUTE_HOURS_SM]: 'green',
    [ComputeUsageMetric.COMPUTE_HOURS_MD]: 'dark-green',
    [ComputeUsageMetric.COMPUTE_HOURS_L]: 'yellow',
    [ComputeUsageMetric.COMPUTE_HOURS_XL]: 'dark-yellow',
    [ComputeUsageMetric.COMPUTE_HOURS_2XL]: 'orange',
    [ComputeUsageMetric.COMPUTE_HOURS_4XL]: 'dark-orange',
    [ComputeUsageMetric.COMPUTE_HOURS_8XL]: 'red',
    [ComputeUsageMetric.COMPUTE_HOURS_12XL]: 'dark-red',
    [ComputeUsageMetric.COMPUTE_HOURS_16XL]: 'purple',
    [ComputeUsageMetric.COMPUTE_HOURS_24XL]: 'purple',
    [ComputeUsageMetric.COMPUTE_HOURS_24XL_OPTIMIZED_CPU]: 'purple',
    [ComputeUsageMetric.COMPUTE_HOURS_24XL_OPTIMIZED_MEMORY]: 'purple',
    [ComputeUsageMetric.COMPUTE_HOURS_24XL_HIGH_MEMORY]: 'purple',
    [ComputeUsageMetric.COMPUTE_HOURS_48XL]: 'purple',
    [ComputeUsageMetric.COMPUTE_HOURS_48XL_OPTIMIZED_CPU]: 'purple',
    [ComputeUsageMetric.COMPUTE_HOURS_48XL_OPTIMIZED_MEMORY]: 'purple',
    [ComputeUsageMetric.COMPUTE_HOURS_48XL_HIGH_MEMORY]: 'purple',
  }

  const attributes: Attribute[] = Object.keys(ComputeUsageMetric).map((it) => ({
    key: it.toLowerCase(),
    color: COMPUTE_TO_COLOR[it as ComputeUsageMetric] || 'white',
    name: computeUsageMetricLabel(it as ComputeUsageMetric),
  }))

  const attributeKeysWithData = useMemo(() => {
    return allAttributeKeys.filter((attributeKey) => chartData.some((data) => data[attributeKey]))
  }, [chartData])

  const notAllValuesZero = useMemo(() => {
    return attributeKeysWithData.length > 0
  }, [attributeKeysWithData])

  return (
    <div id="compute" className="scroll-my-12">
      <SectionContent
        section={{
          name: 'Compute Hours',
          description:
            'Amount of hours your projects were active. Each project is a dedicated server and database.\nPaid plans come with $10 in Compute Credits to cover one project running on Micro Compute or parts of any compute add-on.\nBilling is based on the sum of Compute Hours used. Paused projects do not count towards usage.',
          links: billingAll
            ? [
                {
                  name: 'Compute Add-ons',
                  url: `${DOCS_URL}/guides/platform/compute-add-ons`,
                },
                {
                  name: 'Usage-billing for Compute',
                  url: `${DOCS_URL}/guides/platform/manage-your-usage/compute`,
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
                    <p className="text-sm">Compute Hours usage</p>
                  </div>
                </div>
              )}

              {attributeKeysWithData.map((key) => (
                <div
                  key={key}
                  className="flex items-center justify-between border-b last:border-b-0 py-1 last:py-0"
                >
                  <p className="text-sm text-foreground-light">
                    <span className="font-medium">
                      {computeUsageMetricLabel(key.toUpperCase() as ComputeUsageMetric)}
                    </span>{' '}
                    Compute Hours usage in period
                  </p>
                  <p className="text-sm">
                    {chartData.reduce((prev, cur) => prev + ((cur[key] as number) ?? 0), 0)} hours
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-1">
              <p className="text-sm">Compute Hours usage per day</p>
              <p className="text-sm text-foreground-light">The data refreshes every hour.</p>
            </div>

            {chartData.length > 0 && notAllValuesZero ? (
              <UsageBarChart
                name={`Compute Hours usage`}
                unit={'hours'}
                attributes={attributes}
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

export default Compute
