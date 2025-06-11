import { cn } from 'ui'
import { DataTableFilterControls } from './DataTableFilters/DataTableFilterControls'
import { DataTableResetButton } from './DataTableResetButton'
import { useDataTable } from './providers/DataTableProvider'

export function FilterSideBar() {
  const { table } = useDataTable()

  return (
    <div
      className={cn(
        'flex flex-col w-72',
        'group-data-[expanded=false]/controls:hidden',
        'hidden sm:flex'
      )}
    >
      <div className="border-b border-border bg-background px-2 md:top-0">
        <div className="flex h-[48px] items-center justify-between gap-3">
          <p className="px-2 font-medium text-foreground">Filters</p>
          <div>{table.getState().columnFilters.length ? <DataTableResetButton /> : null}</div>
        </div>
      </div>
      <div className="flex-1 p-2 sm:overflow-y-scroll">
        <DataTableFilterControls />
      </div>
    </div>
  )
}
