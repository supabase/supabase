import { useHotKey } from 'hooks/ui/useHotKey'
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { ReactNode, useMemo } from 'react'
import { Button, Tooltip, TooltipContent, TooltipTrigger } from 'ui'

import { formatCompactNumber } from './DataTable.utils'
import { DataTableFilterControlsDrawer } from './DataTableFilters/DataTableFilterControlsDrawer'
import { DataTableResetButton } from './DataTableResetButton'
import { DataTableViewOptions } from './DataTableViewOptions'
import { Kbd } from './primitives/Kbd'
import { useDataTable } from './providers/DataTableProvider'

interface DataTableToolbarProps {
  renderActions?: () => ReactNode
  isFilterBarOpen: boolean
  setIsFilterBarOpen: React.Dispatch<React.SetStateAction<boolean>>
}

export function DataTableToolbar({
  renderActions,
  isFilterBarOpen,
  setIsFilterBarOpen,
}: DataTableToolbarProps) {
  const { table, isLoading, columnFilters } = useDataTable()
  const filters = table.getState().columnFilters

  useHotKey(() => setIsFilterBarOpen((prev) => !prev), 'b')

  const rows = useMemo(
    () => ({
      total: table.getCoreRowModel().rows.length,
      filtered: table.getFilteredRowModel().rows.length,
    }),
    [isLoading, columnFilters]
  )

  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="tiny"
              type="default"
              icon={isFilterBarOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
              onClick={() => setIsFilterBarOpen((prev) => !prev)}
              className="hidden sm:flex"
            >
              <span className="hidden md:block">{isFilterBarOpen ? 'Hide' : 'Show'} Controls</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>
              Toggle controls with{' '}
              <Kbd className="ml-1 text-muted-foreground group-hover:text-accent-foreground">
                <span className="mr-1">⌘</span>
                <span>B</span>
              </Kbd>
            </p>
          </TooltipContent>
        </Tooltip>
        <div className="block sm:hidden">
          <DataTableFilterControlsDrawer />
        </div>
        <div>
          <p className="hidden text-sm text-muted-foreground sm:block">
            <span className="font-mono font-medium">{formatCompactNumber(rows.filtered)}</span> of{' '}
            <span className="font-mono font-medium">{formatCompactNumber(rows.total)}</span> row(s){' '}
            <span className="sr-only sm:not-sr-only">filtered</span>
          </p>
          <p className="block text-sm text-muted-foreground sm:hidden">
            <span className="font-mono font-medium">{formatCompactNumber(rows.filtered)}</span>{' '}
            row(s)
          </p>
        </div>
      </div>
      <div className="ml-auto flex items-center gap-2">
        {filters.length ? <DataTableResetButton /> : null}
        {renderActions?.()}
        <DataTableViewOptions />
      </div>
    </div>
  )
}
