import { useMemo, useState } from 'react'
import ResultsDropdown from './ResultsDropdown'
import UtilityActions from './UtilityActions'
import UtilityTabResults from './UtilityTabResults'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

import { TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_ } from 'ui'
import { ChartConfig } from './ChartConfig'
import { useFlag } from 'hooks'
import { useContentUpsertMutation } from 'data/content/content-upsert-mutation'
import { useRouter } from 'next/router'
import { useContentQuery } from 'data/content/content-query'
import { useParams } from 'common'

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
  const { data, isLoading } = useContentQuery(ref)
  const upsertContent = useContentUpsertMutation()
  const snippet = snap.snippets[id]?.snippet

  const chartConfig = useMemo(() => {
    const contentItem = data?.content.find((i) => i.id === id)
    if (!contentItem || contentItem.type !== 'sql') {
      return DEFAULT_CHART_CONFIG
    }
    return contentItem.content.chart || DEFAULT_CHART_CONFIG
  }, [data?.content, id])

  const result = snap.results[id]?.[0]

  const showCharts = useFlag('showSQLEditorCharts')

  async function onConfigChange(config: ChartConfig) {
    if (!ref) {
      return
    }

    await upsertContent.mutateAsync({
      projectRef: ref,
      payload: {
        ...snippet,
        id: snippet.id || '',
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
    <Tabs_Shadcn_ defaultValue="results" className="w-full h-full">
      <TabsList_Shadcn_ className="flex justify-between px-2">
        <div>
          <TabsTrigger_Shadcn_ className="py-3 text-xs" value="results">
            Results{' '}
            {!isExecuting &&
              (result?.rows ?? []).length > 0 &&
              `(${result.rows.length.toLocaleString()})`}
          </TabsTrigger_Shadcn_>
          {showCharts && (
            <TabsTrigger_Shadcn_ className="py-3 text-xs" value="chart">
              Chart
            </TabsTrigger_Shadcn_>
          )}
        </div>
        <div className="flex gap-1 h-full">
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
      {showCharts && (
        <TabsContent_Shadcn_ className="mt-0 h-full" value="chart">
          <ChartConfig results={result} config={chartConfig} onConfigChange={onConfigChange} />
        </TabsContent_Shadcn_>
      )}
    </Tabs_Shadcn_>
  )
}

export default UtilityPanel
