import { PanelLeftClose } from 'lucide-react'
import { ReactNode, useMemo } from 'react'

import { useHotKey } from 'hooks/ui/useHotKey'
import { Button, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from 'ui'
import { formatCompactNumber } from './DataTable.utils'
import { DataTableFilterControlsDrawer } from './DataTableFilters/DataTableFilterControlsDrawer'
import { DataTableResetButton } from './DataTableResetButton'
import { DataTableViewOptions } from './DataTableViewOptions'
import { Kbd } from './primitives/Kbd'
import { useControls } from './providers/ControlsProvider'
import { useDataTable } from './providers/DataTableProvider'

interface DataTableToolbarProps {
  renderActions?: () => ReactNode
}

export function DataTableToolbar({ renderActions }: DataTableToolbarProps) {
  const { table, isLoading, columnFilters } = useDataTable()
  const { open, setOpen } = useControls()
  const filters = table.getState().columnFilters

  useHotKey(() => setOpen((prev) => !prev), 'b')

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
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="tiny"
                type="outline"
                icon={<PanelLeftClose />}
                onClick={() => setOpen((prev) => !prev)}
                className="hidden sm:flex"
              >
                <span className="hidden md:block">{open ? 'Hide' : 'Show'} Controls</span>
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
        </TooltipProvider>
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
