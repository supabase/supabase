import { useQueryClient } from '@tanstack/react-query'
import { useParams } from 'common'
import toast from 'react-hot-toast'

import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { contentKeys } from 'data/content/keys'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'
import { TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_ } from 'ui'
import { ChartConfig } from './ChartConfig'
import ResultsDropdown from './ResultsDropdown'
import UtilityActions from './UtilityActions'
import UtilityTabResults from './UtilityTabResults'

export type UtilityPanelProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  hasSelection: boolean
  prettifyQuery: () => void
  executeQuery: () => void
}

const DEFAULT_CHART_CONFIG = {
  type: 'bar',
  cumulative: false,
  xKey: '',
  yKey: '',
} as const

const UtilityPanel = ({
  id,
  isExecuting,
  isDisabled,
  hasSelection,
  prettifyQuery,
  executeQuery,
}: UtilityPanelProps) => {
  const snap = useSqlEditorStateSnapshot()
  const { ref } = useParams()
  const snippet = snap.snippets[id]?.snippet

  const queryKeys = contentKeys.list(ref)

  const upsertContent = useContentUpsertMutation({
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

      snap.updateSnippet(id, newSnippet)
    },
    onError: async (err, newContent, context) => {
      toast.error(`Failed to update chart. Please try again.`)
    },
  })
  const queryClient = useQueryClient()

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

  const result = snap.results[id]?.[0]

  function onConfigChange(config: ChartConfig) {
    if (!ref || !snippet.id) {
      return
    }

    upsertContent.mutateAsync({
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
      <TabsList_Shadcn_ className="flex justify-between gap-2 px-2">
        <div className="flex gap-4">
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="results">
            Results{' '}
            {!isExecuting &&
              (result?.rows ?? []).length > 0 &&
              `(${result.rows.length.toLocaleString()})`}
          </TabsTrigger_Shadcn_>
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="chart">
            Chart
          </TabsTrigger_Shadcn_>
        </div>
        <div className="flex gap-1 h-full items-center">
          {result && result.rows && <ResultsDropdown id={id} />}
          <UtilityActions
            id={id}
            isExecuting={isExecuting}
            isDisabled={isDisabled}
            hasSelection={hasSelection}
            prettifyQuery={prettifyQuery}
            executeQuery={executeQuery}
          />
        </div>
      </TabsList_Shadcn_>
      <TabsContent_Shadcn_ className="mt-0 h-full" value="results">
        <UtilityTabResults id={id} isExecuting={isExecuting} />
      </TabsContent_Shadcn_>
      <TabsContent_Shadcn_ className="mt-0 h-full" value="chart">
        <ChartConfig results={result} config={chartConfig} onConfigChange={onConfigChange} />
      </TabsContent_Shadcn_>
    </Tabs_Shadcn_>
  )
}

export default UtilityPanel
