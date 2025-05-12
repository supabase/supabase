'use client'

import { DataTableFilterControls } from 'components/interfaces/DataTableDemo/components/data-table/data-table-filter-controls'
import { useDataTable } from 'components/interfaces/DataTableDemo/components/data-table/data-table-provider'
import { DataTableResetButton } from 'components/interfaces/DataTableDemo/components/data-table/data-table-reset-button'
import { SocialsFooter } from 'components/interfaces/DataTableDemo/infinite/_components/socials-footer'
import { cn } from 'ui'

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
      <div className="border-b border-border bg-background p-2 md:top-0">
        <div className="flex h-[46px] items-center justify-between gap-3">
          <p className="px-2 font-medium text-foreground">Filters</p>
          <div>{table.getState().columnFilters.length ? <DataTableResetButton /> : null}</div>
        </div>
      </div>
      <div className="flex-1 p-2 sm:overflow-y-scroll">
        <DataTableFilterControls />
      </div>
      {/* <div className="border-t border-border bg-background p-4 md:bottom-0">
        <SocialsFooter />
      </div> */}
    </div>
  )
}
