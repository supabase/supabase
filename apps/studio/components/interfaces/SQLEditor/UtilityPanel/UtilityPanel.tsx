import { useParams } from 'common'
import { BarChart2, Settings2, Table } from 'lucide-react'
import { toast } from 'sonner'
import { Popover, PopoverContent, PopoverTrigger, ToggleGroup, ToggleGroupItem } from 'ui'

import { ChartConfig, ChartSettings } from './ChartConfig'
import { UtilityTabLogsResults } from './UtilityTabLogsResults'
import { UtilityTabResults } from './UtilityTabResults'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { DownloadResultsButton } from '@/components/ui/DownloadResultsButton'
import { useContentUpsertMutation } from '@/data/content/content-upsert-mutation'
import { Snippet } from '@/data/content/sql-folders-query'
import { useTrack } from '@/lib/telemetry/track'
import { useNotebookEditorContext } from '@/state/notebook-editor-context'
import { useQueryExecutionSourceSnapshot } from '@/state/query-execution-source'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'

export type UtilityPanelProps = {
  id: string
  isExecuting?: boolean
  isDebugging?: boolean
  isDisabled?: boolean
  executeQuery: () => void
  onDebug: () => void
  buildDebugPrompt: () => string
  activeTab?: string
  onActiveTabChange?: (tab: string) => void
}

const DEFAULT_CHART_CONFIG: ChartConfig = {
  type: 'bar',
  cumulative: false,
  xKey: '',
  yKey: '',
  showLabels: false,
  showGrid: false,
}

export const UtilityPanel = ({
  id,
  isExecuting,
  isDebugging,
  isDisabled,
  executeQuery,
  onDebug,
  buildDebugPrompt,
  activeTab = 'results',
  onActiveTabChange,
}: UtilityPanelProps) => {
  const { ref } = useParams()
  const track = useTrack()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const querySourceState = useQueryExecutionSourceSnapshot()
  const notebookEditorContext = useNotebookEditorContext()
  const executionSource = notebookEditorContext?.querySource ?? querySourceState.executionSource
  const isLogsSource = executionSource === 'logs'

  const snippet = snapV2.snippets[id]?.snippet
  const result = isLogsSource ? snapV2.logsResults[id] : snapV2.results[id]?.[0]

  const { mutate: upsertContent } = useContentUpsertMutation({
    invalidateQueriesOnSuccess: false,
    // Optimistic update to the cache
    onMutate: async (newContentSnippet) => {
      const { payload } = newContentSnippet

      // No need to update the cache for non-SQL content
      if (payload.type !== 'sql') return
      if (!('chart' in payload.content)) return

      const newSnippet = {
        ...snippet,
        content: {
          ...snippet.content,
          chart: payload.content.chart,
        },
      }

      snapV2.updateSnippet({ id, snippet: newSnippet as unknown as Snippet })
    },
    onError: async (_err, _newContent, _context) => {
      toast.error(`Failed to update chart. Please try again.`)
    },
  })

  function getChartConfig() {
    if (notebookEditorContext) {
      return notebookEditorContext.chartConfig
    }

    if (!snippet || snippet.type !== 'sql') {
      return DEFAULT_CHART_CONFIG
    }

    if (!snippet.content?.chart) {
      return DEFAULT_CHART_CONFIG
    }

    return snippet.content.chart
  }

  const chartConfig = getChartConfig()
  const activeView = activeTab === 'chart' ? 'chart' : 'results'

  const handleViewChange = (view: string) => {
    if (view !== 'results' && view !== 'chart') return

    if (notebookEditorContext) {
      notebookEditorContext.onChartConfigChange({
        ...chartConfig,
        view: view === 'chart' ? 'chart' : 'table',
      })
    }

    onActiveTabChange?.(view)
  }

  function onConfigChange(config: ChartConfig) {
    if (notebookEditorContext) {
      notebookEditorContext.onChartConfigChange(config)
      return
    }

    if (!ref || !snippet?.id) return

    upsertContent({
      projectRef: ref,
      payload: {
        ...snippet,
        id: snippet.id,
        description: snippet.description || '',
        project_id: snippet.project_id || 0,
        content: {
          ...snippet.content,
          content_id: id,
          chart: config,
        },
      },
    })
  }

  return (
    <div className="flex h-full w-full flex-col">
      <div className="flex min-h-[42px] shrink-0 items-center justify-between gap-2 border-b px-4">
        <ToggleGroup
          type="single"
          value={activeView}
          onValueChange={handleViewChange}
          className="justify-start"
        >
          <ToggleGroupItem
            value="results"
            aria-label="Show table"
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <Table size={14} strokeWidth={1.5} />
            <span>Table</span>
          </ToggleGroupItem>
          <ToggleGroupItem
            value="chart"
            aria-label="Show chart"
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <BarChart2 size={14} strokeWidth={1.5} />
            <span>Chart</span>
          </ToggleGroupItem>
        </ToggleGroup>

        <div className="flex shrink-0 items-center gap-1">
          {result?.rows && !isLogsSource && (
            <DownloadResultsButton
              type="text"
              results={result.rows as any[]}
              fileName={`Supabase Snippet ${snippet?.name ?? 'Untitled query'}`}
              onDownloadAsCSV={() => track('sql_editor_result_download_csv_clicked')}
              onCopyAsMarkdown={() => track('sql_editor_result_copy_markdown_clicked')}
              onCopyAsJSON={() => track('sql_editor_result_copy_json_clicked')}
              onCopyAsCSV={() => track('sql_editor_result_copy_csv_clicked')}
            />
          )}

          {activeView === 'chart' && (
            <Popover modal={false}>
              <PopoverTrigger asChild>
                <ButtonTooltip
                  type="text"
                  className="px-1.5"
                  icon={<Settings2 size={14} strokeWidth={1.5} />}
                  tooltip={{ content: { side: 'bottom', text: 'Chart settings' } }}
                />
              </PopoverTrigger>
              <PopoverContent side="bottom" align="end" className="w-[280px] p-3">
                <ChartSettings
                  results={result}
                  config={chartConfig}
                  onConfigChange={onConfigChange}
                />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>

      <div className="min-h-0 flex-1">
        {activeView === 'chart' ? (
          <ChartConfig
            key={`${id}-chart`}
            results={result}
            config={chartConfig}
            isLoading={isExecuting}
          />
        ) : isLogsSource ? (
          <UtilityTabLogsResults id={id} isExecuting={isExecuting} onRun={executeQuery} />
        ) : (
          <UtilityTabResults
            id={id}
            isExecuting={isExecuting}
            isDisabled={isDisabled}
            onDebug={onDebug}
            buildDebugPrompt={buildDebugPrompt}
            isDebugging={isDebugging}
          />
        )}
      </div>
    </div>
  )
}
