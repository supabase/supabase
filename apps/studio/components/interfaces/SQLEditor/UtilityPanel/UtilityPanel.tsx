import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

import { useParams } from 'common'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { contentKeys } from 'data/content/keys'
import { Snippet } from 'data/content/sql-folders-query'
import { useSqlEditorV2StateSnapshot } from 'state/sql-editor-v2'
import { TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_ } from 'ui'
import { ChartConfig } from './ChartConfig'
import ResultsDropdown from './ResultsDropdown'
import UtilityActions from './UtilityActions'
import UtilityTabResults from './UtilityTabResults'

export type UtilityPanelProps = {
  id: string
  isExecuting?: boolean
  isDebugging?: boolean
  isDisabled?: boolean
  hasSelection: boolean
  prettifyQuery: () => void
  executeQuery: () => void
  onDebug: () => void
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
  isDebugging,
  isDisabled,
  hasSelection,
  prettifyQuery,
  executeQuery,
  onDebug,
}: UtilityPanelProps) => {
  const { ref } = useParams()
  const queryClient = useQueryClient()
  const snapV2 = useSqlEditorV2StateSnapshot()

  const snippet = snapV2.snippets[id]?.snippet
  const queryKeys = contentKeys.list(ref)
  const result = snapV2.results[id]?.[0]

  const { mutate: upsertContent } = useContentUpsertMutation({
    invalidateQueriesOnSuccess: false,
    // Optimistic update to the cache
    onMutate: async (newContentSnippet) => {
      const { payload } = newContentSnippet

      // No need to update the cache for non-SQL content
      if (payload.type !== 'sql') return
      if (!('chart' in payload.content)) return

      // Cancel any existing queries so that the new content is fetched
      await queryClient.cancelQueries(queryKeys)

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

    if (!snippet.content.chart) {
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
    <Tabs_Shadcn_ defaultValue="results" className="w-full h-full flex flex-col">
      <TabsList_Shadcn_ className="flex justify-between gap-2 px-2 overflow-x-auto min-h-[42px]">
        <div className="flex items-center gap-4">
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="results">
            <span className="translate-y-[1px]">Results</span>
          </TabsTrigger_Shadcn_>
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="chart">
            <span className="translate-y-[1px]">Chart</span>
          </TabsTrigger_Shadcn_>
          {result?.rows && <ResultsDropdown id={id} />}
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
          isDebugging={isDebugging}
        />
      </TabsContent_Shadcn_>

      <TabsContent_Shadcn_ asChild value="chart" className="mt-0 flex-grow">
        <ChartConfig results={result} config={chartConfig} onConfigChange={onConfigChange} />
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}

export default UtilityPanel
