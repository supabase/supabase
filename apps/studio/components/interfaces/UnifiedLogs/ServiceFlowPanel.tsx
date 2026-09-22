import { useDeferredValue } from 'react'
import { cn, ResizableHandle, ResizablePanel } from 'ui'

import { LogLevelDot } from './components/LogLevelDot'
import { SelectedLogDetails } from './components/SelectedLogDetails'
import { LogSelectionActions } from './LogSelectionActions'
import { ServiceFlowPanelControls } from './ServiceFlow/components/ServiceFlowPanelControls'
import { ColumnSchema } from './UnifiedLogs.schema'
import { QuerySearchParamsType } from './UnifiedLogs.types'
import { getEventMessageDisplay } from './UnifiedLogs.utils'
import { ShortcutBadge } from '@/components/ui/ShortcutBadge'
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
  const deferredRows = useDeferredValue(selectedRows)
  const isUpdating = deferredRows !== selectedRows
  const hasMultiple = selectedRows.length > 1
  const selectedRow = selectedRows[0]
  const title = hasMultiple
    ? `${selectedRows.length} logs selected`
    : getEventMessageDisplay(selectedRow?.log_type ?? '', selectedRow?.event_message).message ||
      selectedRow?.id

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
          <div
            className={cn('flex min-h-0 flex-1 flex-col', isUpdating && 'opacity-60')}
            aria-busy={isUpdating}
            inert={isUpdating}
          >
            <SelectedLogDetails rows={deferredRows} searchParameters={searchParameters} />
          </div>
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
