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
import { CodeBlock } from 'ui-patterns/CodeBlock'

import { LogDetail } from './components/LogDetail'
import { LogLevelDot } from './components/LogLevelDot'
import { LogSelectionActions } from './LogSelectionActions'
import { ServiceFlowPanelControls } from './ServiceFlow/components/ServiceFlowPanelControls'
import { getLogDataForMetadataVisibility } from './ServiceFlowPanel.utils'
import { ColumnSchema } from './UnifiedLogs.schema'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import { getEventMessageDisplay, getRawLogData } from './UnifiedLogs.utils'
import { ShortcutBadge } from '@/components/ui/ShortcutBadge'
import { useIsFeatureEnabled } from '@/hooks/misc/useIsFeatureEnabled'
import { SHORTCUT_IDS } from '@/state/shortcuts/registry'

interface ServiceFlowPanelProps {
  dock: 'bottom' | 'right'
  setDock: (value: 'bottom' | 'right') => void
  selectedRows: ColumnSchema[]
  searchParameters: QuerySearchParamsType
}

export function ServiceFlowPanel({
  dock,
  setDock,
  selectedRows,
  searchParameters,
}: ServiceFlowPanelProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const hasMultiple = selectedRows.length > 1
  const selectedRow = selectedRows[0]
  const title = hasMultiple
    ? `${selectedRows.length} logs selected`
    : getEventMessageDisplay(selectedRow?.log_type ?? '', selectedRow?.event_message).message ||
      selectedRow?.id
  const { logsMetadata } = useIsFeatureEnabled(['logs:metadata'])
  const selectedJson = selectedRows.map((row) =>
    getLogDataForMetadataVisibility(getRawLogData(row), logsMetadata)
  )

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
              {!hasMultiple && (
                <div className="flex h-4 w-4 shrink-0 items-center justify-center">
                  <LogLevelDot level={selectedRow?.level} />
                </div>
              )}
              <span
                className="min-w-0 flex-1 truncate heading-meta text-foreground"
                role="status"
                title={title}
              >
                {title}
              </span>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <LogSelectionActions rows={selectedRows} />
              <ServiceFlowPanelControls dock={dock} setDock={setDock} />
            </div>
          </div>
          {hasMultiple ? (
            <div
              className="min-h-0 flex-1 overflow-auto"
              role="region"
              aria-label="Selected logs JSON"
            >
              <CodeBlock
                language="json"
                hideCopy
                wrapperClassName="!overflow-visible bg-surface-100/50 [&_pre]:!bg-surface-100/50"
                className="rounded-none border-none !overflow-x-visible [&_code]:!leading-tight [&_pre]:!leading-tight"
              >
                {JSON.stringify(selectedJson, null, 2)}
              </CodeBlock>
            </div>
          ) : (
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
                  key={`${tab}-${selectedRow?.id}`}
                  value={tab}
                  className="mt-0 min-h-0 flex-1 overflow-auto"
                >
                  {selectedRow && (
                    <LogDetail row={selectedRow} tab={tab} searchParameters={searchParameters} />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
          <div className="flex shrink-0 flex-wrap items-center gap-2 border-t px-4 py-2 text-xs text-foreground-lighter">
            <ShortcutBadge shortcutId={SHORTCUT_IDS.UNIFIED_LOGS_EXTEND_PREV_ROW} />
            <ShortcutBadge shortcutId={SHORTCUT_IDS.UNIFIED_LOGS_EXTEND_NEXT_ROW} />
            <span>Extend selection</span>
          </div>
        </div>
      </ResizablePanel>
    </>
  )
}
