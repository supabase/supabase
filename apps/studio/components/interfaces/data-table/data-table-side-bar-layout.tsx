import { useDataTable } from 'components/interfaces/DataTableDemo/components/data-table/data-table-provider'
import * as React from 'react'
import { cn } from 'ui'

interface DataTableSideBarLayoutProps {
  children: React.ReactNode
  className?: string
  topBarHeight?: number
}

export function DataTableSideBarLayout({
  children,
  className,
  topBarHeight = 0,
}: DataTableSideBarLayoutProps) {
  const { table } = useDataTable()

  /**
   * https://tanstack.com/table/v8/docs/guide/column-sizing#advanced-column-resizing-performance
   * Instead of calling `column.getSize()` on every render for every header
   * and especially every data cell (very expensive),
   * we will calculate all column sizes at once at the root table level in a useMemo
   * and pass the column sizes down as CSS variables to the <table> element.
   */
  const columnSizeVars = React.useMemo(() => {
    const headers = table.getFlatHeaders()
    const colSizes: { [key: string]: string } = {}
    for (let i = 0; i < headers.length; i++) {
      const header = headers[i]!
      // REMINDER: replace "." with "-" to avoid invalid CSS variable name (e.g. "timing.dns" -> "timing-dns")
      colSizes[`--header-${header.id.replace('.', '-')}-size`] = `${header.getSize()}px`
      colSizes[`--col-${header.column.id.replace('.', '-')}-size`] = `${header.column.getSize()}px`
    }
    return colSizes
  }, [
    // TODO: check if we need this
    table.getState().columnSizingInfo,
    table.getState().columnSizing,
    table.getState().columnVisibility,
  ])

  return (
    <div
      className={cn('flex h-full min-h-screen w-full flex-col sm:flex-row', className)}
      style={
        {
          '--top-bar-height': `${topBarHeight}px`,
          ...columnSizeVars,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  )
}
