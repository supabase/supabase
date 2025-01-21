import { X } from 'lucide-react'

import { useParams } from 'common'
import { isReadOnlySelect } from 'components/ui/AIAssistantPanel/AIAssistant.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DEFAULT_CHART_CONFIG, QueryBlock } from 'components/ui/QueryBlock/QueryBlock'
import { AnalyticsInterval } from 'data/analytics/constants'
import { useContentIdQuery } from 'data/content/content-id-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { Dashboards, SqlSnippets } from 'types'
import { ChartConfig } from '../../SQLEditor/UtilityPanel/ChartConfig'
import { ChartBlock } from './ChartBlock'

interface ReportBlockProps {
  item: Dashboards.Chart
  startDate: string
  endDate: string
  interval: AnalyticsInterval
  disableUpdate: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  onUpdateChart: (config: Partial<ChartConfig>) => void
}

export const ReportBlock = ({
  item,
  startDate,
  endDate,
  interval,
  disableUpdate,
  onRemoveChart,
  onUpdateChart,
}: ReportBlockProps) => {
  const { ref: projectRef } = useParams()
  const state = useDatabaseSelectorStateSnapshot()

  const isSnippet = item.attribute.startsWith('snippet_')

  const { data } = useContentIdQuery(
    { projectRef, id: item.id },
    { enabled: isSnippet && !!item.id }
  )
  const sql = isSnippet ? (data?.content as SqlSnippets.Content)?.sql : undefined
  const chartConfig = { ...DEFAULT_CHART_CONFIG, ...(item.chartConfig ?? {}) }
  const isReadOnlySQL = isReadOnlySelect(sql ?? '')

  return (
    <>
      {isSnippet ? (
        <QueryBlock
          runQuery
          isChart
          draggable
          disableRunIfMutation
          id={item.id}
          label={item.label}
          chartConfig={chartConfig}
          sql={sql}
          maxHeight={232}
          queryHeight={232}
          actions={
            <ButtonTooltip
              type="text"
              icon={<X />}
              className="w-7 h-7"
              onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
              tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
            />
          }
          onUpdateChartConfig={onUpdateChart}
          noResultPlaceholder={
            <div className="flex flex-col gap-y-1 items-center justify-center h-full px-4 w-full">
              {isReadOnlySQL ? (
                <>
                  <p className="text-xs text-foreground-light">No results returned from query</p>
                  <p className="text-xs text-foreground-lighter text-center">
                    Results from the SQL query can be viewed as a table or chart here
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs text-foreground-light">SQL query is not readonly</p>
                  <p className="text-xs text-foreground-lighter text-center">
                    Queries that involve any mutation will not be run or rendered in reports
                  </p>
                </>
              )}
            </div>
          }
        />
      ) : (
        <ChartBlock
          draggable
          startDate={startDate}
          endDate={endDate}
          interval={interval}
          attribute={item.attribute}
          provider={item.provider}
          maxHeight={232}
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
      )}
    </>
  )
}
