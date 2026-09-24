import { useState } from 'react'
import {
  ResizableHandle,
  ResizablePanel,
  Tabs,
  TabsContent,
  TabsIndicator,
  TabsList,
  TabsTrigger,
} from 'ui'

import { LogDetail } from './components/LogDetail'
import { LogLevelDot } from './components/LogLevelDot'
import { ServiceFlowPanelControls } from './ServiceFlow/components/ServiceFlowPanelControls'
import { ColumnSchema } from './UnifiedLogs.schema'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import { getEventMessageDisplay } from './UnifiedLogs.utils'

interface ServiceFlowPanelProps {
  dock: 'bottom' | 'right'
  setDock: (value: 'bottom' | 'right') => void
  selectedRow?: ColumnSchema
  selectedRowKey: string
  searchParameters: QuerySearchParamsType
}

export function ServiceFlowPanel({
  dock,
  setDock,
  selectedRow,
  selectedRowKey,
  searchParameters,
}: ServiceFlowPanelProps) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!selectedRowKey || !selectedRow) return null

  const title =
    getEventMessageDisplay(selectedRow.log_type, selectedRow.event_message).message ||
    selectedRow.id

  return (
    <>
      <ResizableHandle withHandle />
      <ResizablePanel
        id="log-sidepanel"
        defaultSize={400}
        minSize={dock === 'bottom' ? 300 : 400}
        className="bg-dash-sidebar"
      >
        <div className="flex h-full flex-col overflow-hidden">
          <div className="flex min-w-0 items-center gap-6 px-4 py-2">
            <div className="flex min-w-0 flex-1 items-center gap-2">
              <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                <LogLevelDot level={selectedRow.level} />
              </div>
              <span
                className="min-w-0 flex-1 truncate heading-meta text-foreground"
                role="status"
                title={title}
              >
                {title}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <ServiceFlowPanelControls dock={dock} setDock={setDock} />
            </div>
          </div>
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col"
          >
            <TabsList className="shrink-0 gap-x-4 px-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="raw-json">Raw JSON</TabsTrigger>
              <TabsIndicator />
            </TabsList>
            {['overview', 'raw-json'].map((tab) => (
              <TabsContent
                key={`${tab}-${selectedRow.id}`}
                value={tab}
                className="mt-0 min-h-0 flex-1 overflow-auto"
              >
                <LogDetail row={selectedRow} tab={tab} searchParameters={searchParameters} />
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </ResizablePanel>
    </>
  )
}
