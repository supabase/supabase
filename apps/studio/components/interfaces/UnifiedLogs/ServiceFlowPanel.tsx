import { useFlag } from 'common'
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
import { LogStepSummary } from './components/LogTimeline'
import { LogTimestampHeader, RequestTimeline } from './components/RequestTimeline'
import { LogSelectionActions } from './LogSelectionActions'
import {
  LogPanelCloseButton,
  LogPanelNavigation,
} from './ServiceFlow/components/ServiceFlowPanelControls'
import { getLogDataForMetadataVisibility } from './ServiceFlowPanel.utils'
import { ColumnSchema } from './UnifiedLogs.schema'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import { getEventMessageDisplay, getRawLogData } from './UnifiedLogs.utils'
import { JsonCodeBlock } from '@/components/ui/JsonCodeBlock'
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
  // A log opened from the timeline, remembered against the row it was opened from
  const [openedLog, setOpenedLog] = useState<{ fromId: string; log: ColumnSchema } | null>(null)
  const isRequestTimelineEnabled = !!useFlag('otelUnifiedLogs')
  const hasMultiple = selectedRows.length > 1
  const selectedRow = selectedRows[0]
  const activeLog =
    (openedLog && openedLog.fromId === selectedRow?.id ? openedLog.log : undefined) ?? selectedRow
  const showTimeline = isRequestTimelineEnabled && selectedRow?.log_type !== 'compute'
  const tabs = ['overview', 'raw-json', ...(showTimeline ? ['timeline'] : [])]
  const currentTab = tabs.includes(activeTab) ? activeTab : 'overview'
  const title = hasMultiple
    ? `${selectedRows.length} logs selected`
    : getEventMessageDisplay(activeLog?.log_type ?? '', activeLog?.event_message).message ||
      activeLog?.id

  const handleSelectTimelineLog = (log: ColumnSchema) => {
    if (!selectedRow) return
    setOpenedLog(log.id === selectedRow.id ? null : { fromId: selectedRow.id, log })
    setActiveTab('overview')
  }
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
          <div className="flex min-w-0 items-start gap-3 px-4 pb-2 pt-3">
            <div className="flex min-w-0 flex-1" role="status" title={title}>
              {!hasMultiple && activeLog ? (
                <LogStepSummary log={activeLog} />
              ) : (
                <span className="truncate text-sm leading-5 text-foreground">{title}</span>
              )}
            </div>
            <div className="flex h-5 shrink-0 items-center gap-1">
              <LogSelectionActions rows={hasMultiple || !activeLog ? selectedRows : [activeLog]} />
              <LogPanelCloseButton />
            </div>
          </div>
          {hasMultiple ? (
            <div
              className="min-h-0 flex-1 overflow-auto"
              role="region"
              aria-label="Selected logs JSON"
            >
              <JsonCodeBlock>{JSON.stringify(selectedJson, null, 2)}</JsonCodeBlock>
            </div>
          ) : (
            <Tabs
              value={currentTab}
              onValueChange={setActiveTab}
              className="flex min-h-0 flex-1 flex-col"
            >
              <TabsList className="shrink-0 gap-x-4 px-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="raw-json">Raw JSON</TabsTrigger>
                {showTimeline && <TabsTrigger value="timeline">Timeline</TabsTrigger>}
                <TabsIndicator />
              </TabsList>
              {tabs.map((tab) => (
                <TabsContent
                  // Keyed to the selected row, not the open log, so opening a log from
                  // the timeline keeps its expanded steps
                  key={`${tab}-${selectedRow?.id}`}
                  value={tab}
                  className="mt-0 min-h-0 flex-1 overflow-auto"
                >
                  {tab === 'timeline' && selectedRow && activeLog && (
                    <RequestTimeline
                      row={selectedRow}
                      activeLog={activeLog}
                      onSelectLog={handleSelectTimelineLog}
                    />
                  )}
                  {(tab === 'overview' || tab === 'raw-json') && activeLog && (
                    <LogDetail
                      row={activeLog}
                      tab={tab}
                      searchParameters={searchParameters}
                      overviewHeader={<LogTimestampHeader log={activeLog} />}
                    />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
          <div className="flex shrink-0 items-center gap-2 border-t px-4 py-1.5 text-xs text-foreground-lighter">
            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
              <ShortcutBadge shortcutId={SHORTCUT_IDS.UNIFIED_LOGS_EXTEND_PREV_ROW} />
              <ShortcutBadge shortcutId={SHORTCUT_IDS.UNIFIED_LOGS_EXTEND_NEXT_ROW} />
              <span>Extend selection</span>
            </div>
            <LogPanelNavigation dock={dock} setDock={setDock} />
          </div>
        </div>
      </ResizablePanel>
    </>
  )
}
