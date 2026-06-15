import { useParams } from 'common'
import { BarChart2, ListTree, Table } from 'lucide-react'
import { useCallback } from 'react'
import { toast } from 'sonner'
import { ToggleGroup, ToggleGroupItem } from 'ui'

import { ChartConfig } from './ChartConfig'
import { UtilityTabExplain } from './UtilityTabExplain'
import { UtilityTabResults } from './UtilityTabResults'
import { DownloadResultsButton } from '@/components/ui/DownloadResultsButton'
import { useContentUpsertMutation } from '@/data/content/content-upsert-mutation'
import { Snippet } from '@/data/content/sql-folders-query'
import { useTrack } from '@/lib/telemetry/track'
import { useSqlEditorV2StateSnapshot } from '@/state/sql-editor-v2'
import type { SqlSnippets } from '@/types'

export type SqlOutputView = 'table' | 'chart' | 'explain'

export type UtilityPanelProps = {
  id: string
  isExecuting?: boolean
  isExplainExecuting?: boolean
  isDebugging?: boolean
  isDisabled?: boolean
  executeExplainQuery: () => void
  onDebug: () => void
  buildDebugPrompt: () => string
  source: SqlSnippets.Source
  activeView?: SqlOutputView
  onActiveViewChange?: (view: SqlOutputView) => void
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
  onDebug,
  buildDebugPrompt,
  source,
  activeView = 'table',
  onActiveViewChange,
}: UtilityPanelProps) => {
  const { ref } = useParams()
  const track = useTrack()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const snippet = snapV2.snippets[id]?.snippet
  const result = snapV2.results[id]?.[0]

  const handleViewChange = (view: string) => {
    if (!view) return
    const nextView = view as SqlOutputView

    // When switching to the explain tab, trigger the explain query
    if (nextView === 'explain' && source === 'database') {
      executeExplainQuery()
    }
    onActiveViewChange?.(nextView)
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

  const onConfigChange = useCallback(
    (config: ChartConfig) => {
      if (!snippet?.content) return

      snapV2.updateSnippet({
        id,
        snippet: {
          content: {
            ...snippet.content,
            chart: config,
          },
        },
        skipSave: true,
      })

      if (!ref || !snippet.id) return

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
    },
    [id, ref, snippet, snapV2, upsertContent]
  )

  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex shrink-0 items-center justify-between gap-2 overflow-x-auto border-b p-1.5">
        <ToggleGroup
          type="single"
          value={activeView}
          onValueChange={handleViewChange}
          size="sm"
          variant="outline"
          className="flex items-center"
        >
          <ToggleGroupItem value="table" className="h-7 gap-1.5 px-3 text-xs" aria-label="Table">
            <Table size={14} strokeWidth={1.5} />
            Table
          </ToggleGroupItem>
          <ToggleGroupItem value="chart" className="h-7 gap-1.5 px-3 text-xs" aria-label="Chart">
            <BarChart2 size={14} strokeWidth={1.5} />
            Chart
          </ToggleGroupItem>
          <ToggleGroupItem
            value="explain"
            disabled={source === 'logs'}
            className="h-7 gap-1.5 px-3 text-xs"
            aria-label="Explain"
          >
            <ListTree size={14} strokeWidth={1.5} />
            Explain
          </ToggleGroupItem>
        </ToggleGroup>

        {result?.rows && (
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

      {activeView === 'table' && (
        <div className="grow min-h-0">
          <UtilityTabResults
            id={id}
            isExecuting={isExecuting}
            isDisabled={isDisabled}
            onDebug={onDebug}
            buildDebugPrompt={buildDebugPrompt}
            isDebugging={isDebugging}
          />
        </div>
      )}

      {activeView === 'explain' && (
        <div className="grow min-h-0">
          <UtilityTabExplain id={id} isExecuting={isExplainExecuting} />
        </div>
      )}

      {activeView === 'chart' && (
        <div className="grow min-h-0">
          <ChartConfig results={result} config={chartConfig} onConfigChange={onConfigChange} />
        </div>
      )}
    </div>
  )
}
