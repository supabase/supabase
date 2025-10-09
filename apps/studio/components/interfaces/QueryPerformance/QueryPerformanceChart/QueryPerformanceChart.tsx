import { useState, useMemo, useEffect, useCallback } from 'react'

import {
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
  Button,
} from 'ui'
import { QUERY_PERFORMANCE_CHART_TABS } from './QueryPerformanceChart.constants'

export const QueryPerformanceChart = () => {
  const [selectedMetric, setSelectedMetric] = useState('query_latency')

  return (
    <div className="bg-surface-200 border-t h-[800px]">
      <Tabs_Shadcn_
        value={selectedMetric}
        onValueChange={(value) => setSelectedMetric(value as string)}
        className="w-full"
      >
        <TabsList_Shadcn_ className="flex justify-start rounded-none gap-x-4 border-b !mt-0 pt-0 px-6">
          {QUERY_PERFORMANCE_CHART_TABS.map((tab) => (
            <TabsTrigger_Shadcn_
              key={tab.id}
              value={tab.id}
              className="flex items-center gap-2 text-xs py-3 border-b-[1px] font-mono uppercase"
            >
              {tab.label}
            </TabsTrigger_Shadcn_>
          ))}
        </TabsList_Shadcn_>

        <TabsContent_Shadcn_ value={selectedMetric} className="bg-surface-100 mt-0 h-inherit">
          <div>Chart here...</div>
        </TabsContent_Shadcn_>
      </Tabs_Shadcn_>
    </div>
  )
}
