import { useRouter } from 'next/router'

import { useParams } from 'common'
import { useUnifiedLogsControl } from 'components/interfaces/App/FeaturePreview/FeaturePreviewContext'
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
  const { table } = useDataTable()
  const router = useRouter()
  const { ref } = useParams()
  const unifiedLogsPreviewAvailable = useFlag('unifiedLogsPreviewAvailable')
  const { isEnabled: unifiedLogsPreview, disable: disableUnifiedLogs } = useUnifiedLogsControl()

  // Only show the box if the feature preview is available and currently enabled
  const showGoBackBox = unifiedLogsPreviewAvailable && unifiedLogsPreview

  const handleGoBackToOldLogs = () => {
    // Disable the unified logs preview using the helper
    disableUnifiedLogs()

    // Redirect to old logs
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
      <div className="border-b border-border px-2 md:top-0">
        <div className="flex h-[48px] items-center justify-between gap-3">
          <p className="px-2 text-foreground text-lg">Logs</p>
          <div>{table.getState().columnFilters.length ? <DataTableResetButton /> : null}</div>
        </div>
      </div>

      {showGoBackBox && (
        <FeaturePreviewSidebarPanel
          className="mx-4 mt-4 mb-4"
          title="Go back to old logs"
          description="Use the traditional interface."
          actions={
            <Button type="default" size="tiny" onClick={handleGoBackToOldLogs}>
              Switch back
            </Button>
          }
        />
      )}
      <div className="flex-1 p-2 sm:overflow-y-scroll">
        <DataTableFilterControls dateRangeDisabled={dateRangeDisabled} />
      </div>
    </ResizablePanel>
  )
}
