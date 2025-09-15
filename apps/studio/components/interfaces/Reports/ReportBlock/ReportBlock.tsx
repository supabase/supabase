import { X } from 'lucide-react'

import { useParams } from 'common'
import { ChartConfig } from 'components/interfaces/SQLEditor/UtilityPanel/ChartConfig'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DEFAULT_CHART_CONFIG, QueryBlock } from 'components/ui/QueryBlock/QueryBlock'
import { AnalyticsInterval } from 'data/analytics/constants'
import { useContentIdQuery } from 'data/content/content-id-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { Dashboards, SqlSnippets } from 'types'
import { Button, cn } from 'ui'
import ShimmeringLoader from 'ui-patterns/ShimmeringLoader'
import { DEPRECATED_REPORTS } from '../Reports.constants'
import { ChartBlock } from './ChartBlock'
import { DeprecatedChartBlock } from './DeprecatedChartBlock'

interface ReportBlockProps {
  item: Dashboards.Chart
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  disableUpdate: boolean
  isRefreshing: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  onUpdateChart: ({
    chart,
    chartConfig,
  }: {
    chart?: Partial<Dashboards.Chart>
    chartConfig?: Partial<ChartConfig>
  }) => void
}

export const ReportBlock = ({
  item,
  startDate,
  endDate,
  interval,
  disableUpdate,
  isRefreshing,
  onRemoveChart,
  onUpdateChart,
}: ReportBlockProps) => {
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()

  const isSnippet = item.attribute.startsWith('snippet_')

  const { data, error, isLoading, isError } = useContentIdQuery(
    { projectRef, id: item.id },
    {
      enabled: isSnippet && !!item.id,
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchIntervalInBackground: false,
      retry: (failureCount: number) => {
        if (failureCount >= 2) return false
        return true
      },
    }
  )
  const sql = isSnippet ? (data?.content as SqlSnippets.Content)?.sql : undefined
  const chartConfig = { ...DEFAULT_CHART_CONFIG, ...(item.chartConfig ?? {}) }
  const isDeprecatedChart = DEPRECATED_REPORTS.includes(item.attribute)
  const snippetMissing = error?.message.includes('Content not found')

  return (
    <>
      {isSnippet ? (
        <QueryBlock
          id={item.id}
          label={item.label}
          chartConfig={chartConfig}
          sql={sql}
          actions={
            !isLoading && (
              <ButtonTooltip
                type="text"
                icon={<X />}
                className="w-7 h-7"
                onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
                tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
              />
            )
          }
          onUpdateChartConfig={onUpdateChart}
        />
      ) : isDeprecatedChart ? (
        <DeprecatedChartBlock
          attribute={item.attribute}
          label={`${item.label}${projectRef !== state.selectedDatabaseId ? (item.provider === 'infra-monitoring' ? ' of replica' : ' on project') : ''}`}
          actions={
            !disableUpdate ? (
              <ButtonTooltip
                type="text"
                icon={<X />}
                className="w-7 h-7"
                onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
                tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
              />
            ) : null
          }
        />
      ) : (
        <ChartBlock
          startDate={startDate}
          endDate={endDate}
          interval={interval}
          attribute={item.attribute}
          provider={item.provider}
          defaultChartStyle={item.chart_type}
          maxHeight={176}
          label={`${item.label}${projectRef !== state.selectedDatabaseId ? (item.provider === 'infra-monitoring' ? ' of replica' : ' on project') : ''}`}
          actions={
            !disableUpdate ? (
              <ButtonTooltip
                type="text"
                icon={<X />}
                className="w-7 h-7"
                onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
                tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
              />
            ) : null
          }
          onUpdateChartConfig={onUpdateChart}
        />
      )}
    </>
  )
}
