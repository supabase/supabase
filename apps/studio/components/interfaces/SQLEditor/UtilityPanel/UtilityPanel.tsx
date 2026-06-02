import { useParams } from 'common'
import { toast } from 'sonner'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

import { ChartConfig } from './ChartConfig'
import { UtilityActions } from './UtilityActions'
import { UtilityTabExplain } from './UtilityTabExplain'
import { UtilityTabLogsResults } from './UtilityTabLogsResults'
import { UtilityTabResults } from './UtilityTabResults'
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
  isExplainExecuting?: boolean
  isDebugging?: boolean
  isDisabled?: boolean
  hasSelection: boolean
  prettifyQuery: () => void
  executeQuery: () => void
  executeExplainQuery: () => void
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
  isExplainExecuting,
  isDebugging,
  isDisabled,
  hasSelection,
  prettifyQuery,
  executeQuery,
  executeExplainQuery,
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

  const handleTabChange = (tab: string) => {
    if (tab === 'explain' && !isLogsSource) {
      executeExplainQuery()
    }

    if (notebookEditorContext && (tab === 'chart' || tab === 'results')) {
      notebookEditorContext.onChartConfigChange({
        ...chartConfig,
        view: tab === 'chart' ? 'chart' : 'table',
      })
    }

    onActiveTabChange?.(tab)
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
    <Tabs_Shadcn_
      value={activeTab}
      onValueChange={handleTabChange}
      className="w-full h-full flex flex-col"
    >
      <TabsList_Shadcn_ className="flex justify-between gap-2 px-4 overflow-x-auto min-h-[42px]">
        <div className="flex items-center gap-4">
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="results">
            <span className="translate-y-px">Results</span>
          </TabsTrigger_Shadcn_>
          {!isLogsSource && (
            <TabsTrigger_Shadcn_ className="py-3 text-xs" value="explain">
              <span className="translate-y-px">Explain</span>
            </TabsTrigger_Shadcn_>
          )}
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="chart">
            <span className="translate-y-px">Chart</span>
          </TabsTrigger_Shadcn_>

          {result?.rows && !isLogsSource && (
            <DownloadResultsButton
              type="text"
              results={result.rows as any[]}
              fileName={`Supabase Snippet ${snippet.name}`}
              onDownloadAsCSV={() => track('sql_editor_result_download_csv_clicked')}
              onCopyAsMarkdown={() => track('sql_editor_result_copy_markdown_clicked')}
              onCopyAsJSON={() => track('sql_editor_result_copy_json_clicked')}
              onCopyAsCSV={() => track('sql_editor_result_copy_csv_clicked')}
            />
          )}
        </div>

        <UtilityActions
          id={id}
          isExecuting={isExecuting}
          isDisabled={isDisabled}
          hasSelection={hasSelection}
          prettifyQuery={prettifyQuery}
          executeQuery={executeQuery}
        />
      </TabsList_Shadcn_>

      <TabsContent_Shadcn_ asChild value="results" className="mt-0 grow">
        {isLogsSource ? (
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
      </TabsContent_Shadcn_>

      {!isLogsSource && (
        <TabsContent_Shadcn_ asChild value="explain" className="mt-0 grow">
          <UtilityTabExplain id={id} isExecuting={isExplainExecuting} />
        </TabsContent_Shadcn_>
      )}

      <TabsContent_Shadcn_ value="chart" className="mt-0 flex min-h-0 flex-1 flex-col">
        <ChartConfig
          key={`${id}-chart`}
          results={result}
          config={chartConfig}
          onConfigChange={onConfigChange}
        />
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}
