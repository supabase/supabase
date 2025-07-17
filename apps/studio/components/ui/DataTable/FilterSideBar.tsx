import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useUnifiedLogsPreview } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
import { useFlag } from 'hooks/ui/useFlag'
import { Button, cn, ResizablePanel } from 'ui'
import { FeaturePreviewSidebarPanel } from '../FeaturePreviewSidebarPanel'
import { DateRangeDisabled } from './DataTable.types'
import { DataTableFilterControls } from './DataTableFilters/DataTableFilterControls'
import { DataTableResetButton } from './DataTableResetButton'
import { useDataTable } from './providers/DataTableProvider'

interface FilterSideBarProps {
  dateRangeDisabled?: DateRangeDisabled
}

export function FilterSideBar({ dateRangeDisabled }: FilterSideBarProps) {
  const router = useRouter()
  const { ref } = useParams()
  const { table } = useDataTable()

  const isUnifiedLogsPreviewAvailable = useFlag('unifiedLogs')
  const { disable: disableUnifiedLogs } = useUnifiedLogsPreview()

  const handleGoBackToOldLogs = () => {
    disableUnifiedLogs()
    router.push(`/project/${ref}/logs/explorer`)
  }

  return (
    <ResizablePanel
      order={1}
      maxSize={33}
      defaultSize={1}
      id="panel-left"
      className={cn(
        'flex flex-col w-full',
        'min-w-64 max-w-[32rem]',
        'group-data-[expanded=false]/controls:hidden',
        'hidden sm:flex'
      )}
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
      </div>
    </ResizablePanel>
  )
}
