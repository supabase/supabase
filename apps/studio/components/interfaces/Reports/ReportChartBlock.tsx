import { X } from 'lucide-react'

import { useParams } from 'common'
import ChartHandler from 'components/to-be-cleaned/Charts/ChartHandler'
import { isReadOnlySelect } from 'components/ui/AIAssistantPanel/AIAssistant.utils'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { DEFAULT_CHART_CONFIG, QueryBlock } from 'components/ui/QueryBlock/QueryBlock'
import { useContentIdQuery } from 'data/content/content-id-query'
import { useDatabaseSelectorStateSnapshot } from 'state/database-selector'
import { Dashboards, SqlSnippets } from 'types'
import { ChartConfig } from '../SQLEditor/UtilityPanel/ChartConfig'

const ChartGrip = () => (
  <div className="absolute inset-x-0 top-3 grid-item-drag-handle ">
    <div className="flex justify-around">
      <div className="flex h-3 w-24 cursor-move flex-col space-y-2">
        <div className="hidden h-3 w-full border-4 border-dotted border-green-900 opacity-50 transition-all hover:opacity-100 group-hover:block" />
      </div>
    </div>
  </div>
)

interface ReportChartBlockProps {
  item: Dashboards.Chart
  startDate: string
  endDate: string
  interval: string
  disableUpdate: boolean
  onRemoveChart: ({ metric }: { metric: { key: string } }) => void
  onUpdateChart: (config: Partial<ChartConfig>) => void
}

export const ReportChartBlock = ({
  item,
  startDate,
  endDate,
  interval,
  disableUpdate,
  onRemoveChart,
  onUpdateChart,
}: ReportChartBlockProps) => {
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
            isReadOnlySQL ? (
              <div className="border-t flex flex-col gap-y-1 items-center justify-center h-full">
                <p className="text-xs text-foreground-light">SQL query is not readonly</p>
                <p className="text-xs text-foreground-lighter">
                  Queries that involve any mutation will not be run or rendered in reports
                </p>
              </div>
            ) : (
              <div className="border-t flex flex-col gap-y-1 items-center justify-center h-full">
                <p className="text-xs text-foreground-light">No results returned from query</p>
                <p className="text-xs text-foreground-lighter">
                  Results from the SQL query can be viewed as a table or chart here
                </p>
              </div>
            )
          }
        />
      ) : (
        <div className="h-full bg-surface-100 border-overlay group relative rounded border px-6 py-4 shadow-sm hover:border-green-900">
          <ChartHandler
            startDate={startDate}
            endDate={endDate}
            interval={interval}
            attribute={item.attribute}
            provider={item.provider}
            label={`${item.label}${projectRef !== state.selectedDatabaseId ? (item.provider === 'infra-monitoring' ? ' of replica' : ' on project') : ''}`}
            customDateFormat={'MMM D, YYYY'}
          >
            {!disableUpdate && (
              <ButtonTooltip
                type="text"
                icon={<X />}
                className="ml-2 px-1"
                onClick={() => onRemoveChart({ metric: { key: item.attribute } })}
                tooltip={{ content: { side: 'bottom', text: 'Remove chart' } }}
              />
            )}
          </ChartHandler>
          <ChartGrip />
        </div>
      )}
    </>
  )
}
