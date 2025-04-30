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
        'h-full w-full flex-col sm:sticky sm:top-0 sm:max-h-screen sm:min-h-screen sm:min-w-52 sm:max-w-52 sm:self-start md:min-w-72 md:max-w-72',
        'group-data-[expanded=false]/controls:hidden',
        'hidden sm:flex'
      )}
    >
      <div className="border-b border-border bg-background p-2 md:sticky md:top-0">
        <div className="flex h-[46px] items-center justify-between gap-3">
          <p className="px-2 font-medium text-foreground">Filters</p>
          <div>{table.getState().columnFilters.length ? <DataTableResetButton /> : null}</div>
        </div>
      </div>
      <div className="flex-1 p-2 sm:overflow-y-scroll">
        <DataTableFilterControls />
      </div>
      <div className="border-t border-border bg-background p-4 md:sticky md:bottom-0">
        <SocialsFooter />
      </div>
    </div>
  )
}
