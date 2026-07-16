import { useParams } from 'common'
import { toast } from 'sonner'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'

import { ChartConfig } from './ChartConfig'
import { UtilityTabResults } from './UtilityTabResults'
import { DownloadResultsButton } from '@/components/ui/DownloadResultsButton'
import { useContentUpsertMutation } from '@/data/content/content-upsert-mutation'
import { Snippet } from '@/data/content/sql-folders-query'
import { useTrack } from '@/lib/telemetry/track'
import { useSqlEditorSessionSnapshot } from '@/state/sql-editor/sql-editor-session-state'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor/sql-editor-state'

export type UtilityPanelProps = {
  id: string
  isExecuting?: boolean
  isDebugging?: boolean
  isDisabled?: boolean
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
    <Tabs
      value={activeTab}
      onValueChange={onActiveTabChange}
      className="w-full h-full flex flex-col"
    >
      <TabsList className="flex justify-between gap-2 px-4 overflow-x-auto min-h-[42px]">
        <div className="flex items-center gap-4">
          <TabsTrigger className="py-3 text-xs" value="results">
            <span className="translate-y-px">Results</span>
          </TabsTrigger>
          <TabsTrigger className="py-3 text-xs" value="chart">
            <span className="translate-y-px">Chart</span>
          </TabsTrigger>
        </div>

        <div className="flex items-center gap-4">
          {result?.rows !== undefined && !isExecuting && (
            <Tooltip>
              <TooltipTrigger>
                <p className="text-xs">
                  <span className="text-foreground">
                    {result.rows.length} row{result.rows.length === 1 ? '' : 's'}
                  </span>
                  <span className="text-foreground-lighter ml-1">
                    {result.autoLimit !== undefined && `(Limited to only ${result.autoLimit} rows)`}
                  </span>
                </p>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="flex flex-col gap-y-1">
                  <span>
                    Results are automatically limited to preserve browser performance, in particular
                    if your query returns an exceptionally large number of rows.
                  </span>
                  <span className="text-foreground-light">
                    You may change or remove this limit from the toolbar above.
                  </span>
                </p>
              </TooltipContent>
            </Tooltip>
          )}

          {result?.rows && (
            <DownloadResultsButton
              variant="text"
              results={result.rows as any[]}
              fileName={`Supabase Snippet ${snippet?.name ?? 'Results'}`}
              onDownloadAsCSV={() => track('sql_editor_result_download_csv_clicked')}
              onCopyAsMarkdown={() => track('sql_editor_result_copy_markdown_clicked')}
              onCopyAsJSON={() => track('sql_editor_result_copy_json_clicked')}
              onCopyAsCSV={() => track('sql_editor_result_copy_csv_clicked')}
            />
          )}
        </div>
      </TabsList>

      <TabsContent asChild value="results" className="mt-0 grow">
        <UtilityTabResults
          id={id}
          isExecuting={isExecuting}
          isDisabled={isDisabled}
          onDebug={onDebug}
          buildDebugPrompt={buildDebugPrompt}
          isDebugging={isDebugging}
        />
      </TabsContent>

      <TabsContent asChild value="chart" className="mt-0 grow">
        <ChartConfig results={result} config={chartConfig} onConfigChange={onConfigChange} />
      </TabsContent>
    </Tabs>
  )
}
