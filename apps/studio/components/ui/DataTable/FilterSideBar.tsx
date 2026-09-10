import { useParams } from 'common'
import Link from 'next/link'
import { parseAsString, useQueryState } from 'nuqs'
import { cloneElement, Dispatch, SetStateAction, useEffect } from 'react'
import { Badge, Button, cn, ResizablePanel, usePanelRef } from 'ui'

import { FeaturePreviewSidebarPanel } from '../FeaturePreviewSidebarPanel'
import { DateRangeDisabled } from './DataTable.types'
import { DataTableFilterControls } from './DataTableFilters/DataTableFilterControls'
import { DataTableResetButton } from './DataTableResetButton'
import { useDataTable } from './providers/DataTableProvider'
import { LOG_DRAIN_TYPES } from '@/components/interfaces/LogDrains/LogDrains.constants'
import { UserLogFilterControl } from '@/components/interfaces/UnifiedLogs/components/UserLogFilterControl'
import { UnifiedLogsBanner } from '@/components/interfaces/UnifiedLogs/UnifiedLogsBanner'

interface FilterSideBarProps {
  isFilterBarOpen: boolean
  setIsFilterBarOpen: Dispatch<SetStateAction<boolean>>
  dateRangeDisabled?: DateRangeDisabled
}

export function FilterSideBar({
  isFilterBarOpen,
  setIsFilterBarOpen,
  dateRangeDisabled,
}: FilterSideBarProps) {
  const { ref } = useParams()
  const { table } = useDataTable()
  const [user, setUser] = useQueryState('user', parseAsString)

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
      minSize={256}
      defaultSize={265}
      maxSize={512}
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
      <div className="flex shrink-0 items-center justify-between gap-3 px-4 pt-5">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <h4 className="truncate text-lg text-foreground">Logs</h4>
          <Badge variant="default">Beta</Badge>
        </div>
        {table.getState().columnFilters.length || user ? (
          <DataTableResetButton onReset={() => setUser(null)} />
        ) : null}
      </div>

      <UnifiedLogsBanner />

      <div className="flex-1 p-2 sm:overflow-y-scroll">
        <DataTableFilterControls
          dateRangeDisabled={dateRangeDisabled}
          itemsAfter={{ level: <UserLogFilterControl /> }}
        />
        <FeaturePreviewSidebarPanel
          className="mx-2 my-4"
          title="Capture your logs"
          description="Send logs to your preferred observability or storage platform."
          illustration={
            <div className="flex items-center gap-4">
              {LOG_DRAIN_TYPES.filter((t) =>
                ['datadog', 'sentry', 'webhook', 'loki'].includes(t.value)
              ).map((type) => cloneElement(type.icon, { height: 20, width: 20, key: type.value }))}
            </div>
          }
          actions={
            <Button asChild variant="default">
              <Link href={`/project/${ref}/settings/log-drains`}>Go to Log Drains</Link>
            </Button>
          }
        />
      </div>
    </ResizablePanel>
  )
}
