import { useFlag, useParams } from 'common'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useEffect } from 'react'
import { Button, cn, ResizablePanel, usePanelRef } from 'ui'

import { FeaturePreviewSidebarPanel } from '../FeaturePreviewSidebarPanel'
import { DateRangeDisabled } from './DataTable.types'
import { DataTableFilterControls } from './DataTableFilters/DataTableFilterControls'
import { DataTableResetButton } from './DataTableResetButton'
import { useDataTable } from './providers/DataTableProvider'
import { useUnifiedLogsPreview } from '@/components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { LOG_DRAIN_TYPES } from '@/components/interfaces/LogDrains/LogDrains.constants'

interface FilterSideBarProps {
  isFilterBarOpen: boolean
  setIsFilterBarOpen: React.Dispatch<React.SetStateAction<boolean>>
  dateRangeDisabled?: DateRangeDisabled
}

export function FilterSideBar({
  isFilterBarOpen,
  setIsFilterBarOpen,
  dateRangeDisabled,
}: FilterSideBarProps) {
  const router = useRouter()
  const { ref } = useParams()
  const { table } = useDataTable()

  const isUnifiedLogsPreviewAvailable = useFlag('unifiedLogs')
  const { disable: disableUnifiedLogs } = useUnifiedLogsPreview()

  const handleGoBackToOldLogs = () => {
    disableUnifiedLogs()
    router.push(`/project/${ref}/logs/explorer`)
  }

  const panelRef = usePanelRef()

  useEffect(() => {
    if (isFilterBarOpen) {
      panelRef.current?.expand()
    } else {
      panelRef.current?.collapse()
    }
  }, [isFilterBarOpen, panelRef])

  return (
    <ResizablePanel
      panelRef={panelRef}
      maxSize={512}
      minSize={256}
      id="panel-left"
      collapsible
      onResize={(size) => {
        if (size.inPixels === 0) {
          setIsFilterBarOpen(false)
        } else if (!isFilterBarOpen) {
          setIsFilterBarOpen(true)
        }
      }}
      className={cn('flex flex-col w-full')}
    >
      <div className="border-b border-border px-4 md:top-0">
        <div className="flex h-[48px] items-center justify-between gap-3">
          <p className="text-foreground text-lg">Logs</p>
          {table.getState().columnFilters.length ? <DataTableResetButton /> : null}
        </div>
      </div>

      <div className="flex-1 p-2 sm:overflow-y-scroll">
        {isUnifiedLogsPreviewAvailable && (
          <FeaturePreviewSidebarPanel
            className="mx-2 mt-2 mb-3"
            title="Go back to old logs"
            description="Use the traditional interface"
            actions={
              <Button type="default" size="tiny" onClick={handleGoBackToOldLogs}>
                Switch back
              </Button>
            }
          />
        )}
        <DataTableFilterControls dateRangeDisabled={dateRangeDisabled} />
        <FeaturePreviewSidebarPanel
          className="mx-2 my-4"
          title="Capture your logs"
          description="Send logs to your preferred observability or storage platform."
          illustration={
            <div className="flex items-center gap-4">
              {LOG_DRAIN_TYPES.filter((t) =>
                ['datadog', 'sentry', 'webhook', 'loki'].includes(t.value)
              ).map((type) =>
                React.cloneElement(type.icon, { height: 20, width: 20, key: type.value })
              )}
            </div>
          }
          actions={
            <Button asChild type="default">
              <Link href={`/project/${ref}/settings/log-drains`}>Go to Log Drains</Link>
            </Button>
          }
        />
      </div>
    </ResizablePanel>
  )
}
