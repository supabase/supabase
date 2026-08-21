import type { ReactNode } from 'react'
import type { ChartConfig } from 'ui'
import {
  Chart,
  ChartCard,
  ChartContent,
  ChartHeader,
  ChartLine,
  ChartLoadingState,
  type ChartLineProps,
} from 'ui-patterns/Chart'

import { EdgeFunctionChartEmptyState } from './EdgeFunctionChartEmptyState'
import type { EdgeFunctionChartDatum } from './EdgeFunctionOverview.utils'

interface EdgeFunctionTimeSeriesChartCardProps {
  data: EdgeFunctionChartDatum[]
  dateTimeFormat: string
  isLoading: boolean
  isError: boolean
  emptyTitle: string
  emptyDescription?: string
  metrics: ReactNode
  dataKey: string
  dataKeys?: string[]
  config: ChartConfig
  tooltipDetails?: ChartLineProps['tooltipDetails']
  referenceLines?: ChartLineProps['referenceLines']
  yAxisProps?: ChartLineProps['YAxisProps']
  className?: string
}

export const EdgeFunctionTimeSeriesChartCard = ({
  data,
  dateTimeFormat,
  isLoading,
  isError,
  emptyTitle,
  emptyDescription,
  metrics,
  dataKey,
  dataKeys,
  config,
  tooltipDetails,
  referenceLines,
  yAxisProps,
  className,
}: EdgeFunctionTimeSeriesChartCardProps) => {
  return (
    <Chart isLoading={isLoading} className={className}>
      <ChartCard>
        <ChartHeader align="start">{metrics}</ChartHeader>
        <ChartContent
          isEmpty={isError || data.length === 0}
          emptyState={
            <EdgeFunctionChartEmptyState title={emptyTitle} description={emptyDescription} />
          }
          loadingState={<ChartLoadingState />}
        >
          <div className="h-40">
            <ChartLine
              data={data}
              dataKey={dataKey}
              dataKeys={dataKeys}
              DateTimeFormat={dateTimeFormat}
              isFullHeight
              showYAxis
              config={config}
              tooltipDetails={tooltipDetails}
              referenceLines={referenceLines}
              YAxisProps={yAxisProps}
            />
          </div>
        </ChartContent>
      </ChartCard>
    </Chart>
  )
}
