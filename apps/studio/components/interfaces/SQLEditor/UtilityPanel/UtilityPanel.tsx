import { useState } from 'react'
import ResultsDropdown from './ResultsDropdown'
import UtilityActions from './UtilityActions'
import UtilityTabResults from './UtilityTabResults'
import { useSqlEditorStateSnapshot } from 'state/sql-editor'

import { TabsContent_Shadcn_, TabsList_Shadcn_, TabsTrigger_Shadcn_, Tabs_Shadcn_ } from 'ui'
import { ChartConfig } from './ChartConfig'
import { useFlag } from 'hooks'

export type UtilityPanelProps = {
  id: string
  isExecuting?: boolean
  isDisabled?: boolean
  hasSelection: boolean
  prettifyQuery: () => void
  executeQuery: () => void
}

const UtilityPanel = ({
  id,
  isExecuting,
  isDisabled,
  hasSelection,
  prettifyQuery,
  executeQuery,
}: UtilityPanelProps) => {
  const snap = useSqlEditorStateSnapshot()
  const result = snap.results[id]?.[0]

  const showCharts = useFlag('showSQLEditorCharts')

  const [config, setConfig] = useState<ChartConfig>({
    type: 'bar',
    cumulative: false,
    xKey: '',
    yKey: '',
  })

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
          <ChartConfig results={result} config={config} onConfigChange={setConfig} />
        </TabsContent_Shadcn_>
      )}
    </Tabs_Shadcn_>
  )
}

export default UtilityPanel
