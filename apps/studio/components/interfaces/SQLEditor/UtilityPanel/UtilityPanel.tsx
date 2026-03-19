import { useFlag, useParams } from 'common'
import { DownloadResultsButton } from 'components/ui/DownloadResultsButton'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { Snippet } from 'data/content/sql-folders-query'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { toast } from 'sonner'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { Tabs_Shadcn_, TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_ } from 'ui'

import { ChartConfig } from './ChartConfig'
import UtilityActions from './UtilityActions'
import { UtilityTabExplain } from './UtilityTabExplain'
import UtilityTabResults from './UtilityTabResults'

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

const UtilityPanel = ({
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
  const { data: org } = useSelectedOrganizationQuery()
  const snapV2 = useSqlEditorV2StateSnapshot()
  const showPrettyExplain = useFlag('ShowPrettyExplain')

  const snippet = snapV2.snippets[id]?.snippet
  const result = snapV2.results[id]?.[0]

  const handleTabChange = (tab: string) => {
    // When switching to the explain tab, trigger the explain query
    if (tab === 'explain') {
      executeExplainQuery()
    }
    onActiveTabChange?.(tab)
  }

  const { mutate: sendEvent } = useSendEventMutation()

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
    onError: async (err, newContent, context) => {
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
      <TabsList_Shadcn_ className="flex justify-between gap-2 px-4 overflow-x-auto min-h-[42px]">
        <div className="flex items-center gap-4">
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="results">
            <span className="translate-y-[1px]">Results</span>
          </TabsTrigger_Shadcn_>
          {/* Only show Explain tab if ShowPrettyExplain flag is on */}
          {showPrettyExplain && (
            <TabsTrigger_Shadcn_ className="py-3 text-xs" value="explain">
              <span className="translate-y-[1px]">Explain</span>
            </TabsTrigger_Shadcn_>
          )}
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="chart">
            <span className="translate-y-[1px]">Chart</span>
          </TabsTrigger_Shadcn_>
          {result?.rows && (
            <DownloadResultsButton
              type="text"
              results={result.rows as any[]}
              fileName={`Supabase Snippet ${snippet.name}`}
              onDownloadAsCSV={() =>
                sendEvent({
                  action: 'sql_editor_result_download_csv_clicked',
                  groups: { project: ref ?? '', organization: org?.slug ?? '' },
                })
              }
              onCopyAsMarkdown={() => {
                sendEvent({
                  action: 'sql_editor_result_copy_markdown_clicked',
                  groups: { project: ref ?? '', organization: org?.slug ?? '' },
                })
              }}
              onCopyAsJSON={() => {
                sendEvent({
                  action: 'sql_editor_result_copy_json_clicked',
                  groups: { project: ref ?? '', organization: org?.slug ?? '' },
                })
              }}
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
      <TabsContent_Shadcn_ asChild value="results" className="mt-0 flex-grow">
        <UtilityTabResults
          id={id}
          isExecuting={isExecuting}
          isDisabled={isDisabled}
          onDebug={onDebug}
          buildDebugPrompt={buildDebugPrompt}
          isDebugging={isDebugging}
        />
      </TabsContent_Shadcn_>

      {/* Only render Explain tab content if ShowPrettyExplain flag is on */}
      {showPrettyExplain && (
        <TabsContent_Shadcn_ asChild value="explain" className="mt-0 flex-grow">
          <UtilityTabExplain id={id} isExecuting={isExplainExecuting} />
        </TabsContent_Shadcn_>
      )}

      <TabsContent_Shadcn_ asChild value="chart" className="mt-0 flex-grow">
        <ChartConfig results={result} config={chartConfig} onConfigChange={onConfigChange} />
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}

export default UtilityPanel
