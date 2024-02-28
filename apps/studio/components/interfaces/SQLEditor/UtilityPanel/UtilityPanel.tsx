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

  const flag = useFlag('showSQLEditorCharts')

  const [config, setConfig] = useState<ChartConfig>({
    type: 'bar',
    cumulative: false,
    xKey: '',
    yKey: '',
  })

  if (result?.error) {
    return <div>{result.error}</div>
  }

  return (
    <>
      <div className="h-full">
        <Tabs_Shadcn_ defaultValue={'results'} className="w-full h-full">
          <TabsList_Shadcn_ className="flex justify-between">
            <div>
              <TabsTrigger_Shadcn_ className="py-3" value="results">
                Results
              </TabsTrigger_Shadcn_>
              <TabsTrigger_Shadcn_ className="py-3" value="chart">
                Chart
              </TabsTrigger_Shadcn_>
            </div>
            <div className="flex gap-1 h-full">
              {result && result.rows && <ResultsDropdown id={id} isExecuting={isExecuting} />}
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
          {flag && (
            <TabsContent_Shadcn_ className="mt-0 h-full" value="chart">
              <ChartConfig results={result} config={config} onConfigChange={setConfig} />
            </TabsContent_Shadcn_>
          )}
        </Tabs_Shadcn_>
      </div>
    </>
  )
}

export default UtilityPanel
