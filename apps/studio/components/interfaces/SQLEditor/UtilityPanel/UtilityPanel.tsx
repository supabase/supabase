import { useParams } from 'common'
import { toast } from 'sonner'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

import { ChartConfig } from './ChartConfig'
import { SqlResultsSummary } from './SqlResultsSummary'
import { UtilityTabExplain } from './UtilityTabExplain'
import { UtilityTabResults } from './UtilityTabResults'
import { DownloadResultsButton } from '@/components/ui/DownloadResultsButton'
import { useContentUpsertMutation } from '@/data/content/content-upsert-mutation'
import { Snippet } from '@/data/content/sql-folders-query'
import { useTrack } from '@/lib/telemetry/track'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'

export type UtilityPanelProps = {
  id: string
  isExecuting?: boolean
  isExplainExecuting?: boolean
  isDebugging?: boolean
  isDisabled?: boolean
  executeExplainQuery: () => void
  showExplainTab?: boolean
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
  executeExplainQuery,
  showExplainTab = true,
  onDebug,
  buildDebugPrompt,
  activeTab = 'results',
  onActiveTabChange,
}: UtilityPanelProps) => {
  const { ref } = useParams()
  const track = useTrack()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const sessionSnap = useSqlEditorSessionSnapshot()

  const snippet = snapV2.snippets[id]?.snippet
  const result = sessionSnap.results[id]?.[0]
  const showResultsSummary =
    (activeTab === 'results' || activeTab === 'chart') &&
    result?.rows !== undefined &&
    !isExecuting &&
    !result.error

  const handleTabChange = (tab: string) => {
    // When switching to the explain tab, trigger the explain query
    if (tab === 'explain') {
      executeExplainQuery()
    }
    onActiveTabChange?.(tab)
  }

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
    if (!snippet || snippet.type !== 'sql') {
      return DEFAULT_CHART_CONFIG
    }

    if (!snippet.content?.chart) {
      return DEFAULT_CHART_CONFIG
    }

    return snippet.content.chart
  }

  const chartConfig = getChartConfig()

  function onConfigChange(config: ChartConfig) {
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
      <div className="flex min-h-[42px] shrink-0 items-center justify-between gap-2 overflow-x-auto border-b pl-3 pr-2">
        <TabsList_Shadcn_ className="h-auto gap-4 border-b-0 p-0">
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="results">
            <span className="translate-y-px">Results</span>
          </TabsTrigger_Shadcn_>
          {showExplainTab && (
            <TabsTrigger_Shadcn_ className="py-3 text-xs" value="explain">
              <span className="translate-y-px">Explain</span>
            </TabsTrigger_Shadcn_>
          )}
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="chart">
            <span className="translate-y-px">Chart</span>
          </TabsTrigger_Shadcn_>
        </TabsList_Shadcn_>

        <div className="flex min-w-0 items-center gap-x-3">
          {showResultsSummary && (
            <SqlResultsSummary rowCount={result.rows.length} autoLimit={result.autoLimit} />
          )}

          {result?.rows && (
            <DownloadResultsButton
              results={result.rows as any[]}
              fileName={`Supabase Snippet ${snippet.name}`}
              align="end"
              onDownloadAsCSV={() => track('sql_editor_result_download_csv_clicked')}
              onCopyAsMarkdown={() => track('sql_editor_result_copy_markdown_clicked')}
              onCopyAsJSON={() => track('sql_editor_result_copy_json_clicked')}
              onCopyAsCSV={() => track('sql_editor_result_copy_csv_clicked')}
            />
          )}
        </div>
      </div>

      <TabsContent_Shadcn_ asChild value="results" className="mt-0 grow">
        <UtilityTabResults
          id={id}
          isExecuting={isExecuting}
          isDisabled={isDisabled}
          onDebug={onDebug}
          buildDebugPrompt={buildDebugPrompt}
          isDebugging={isDebugging}
        />
      </TabsContent_Shadcn_>

      {showExplainTab && (
        <TabsContent_Shadcn_ asChild value="explain" className="mt-0 grow">
          <UtilityTabExplain id={id} isExecuting={isExplainExecuting} />
        </TabsContent_Shadcn_>
      )}

      <TabsContent_Shadcn_ asChild value="chart" className="mt-0 grow">
        <ChartConfig results={result} config={chartConfig} onConfigChange={onConfigChange} />
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}
