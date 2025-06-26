import { CSSProperties, ReactNode, useMemo } from 'react'

import { cn } from 'ui'
import { useDataTable } from './providers/DataTableProvider'

interface DataTableSideBarLayoutProps {
  children: ReactNode
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
  const columnSizeVars = useMemo(() => {
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
      className={cn('flex flex-row w-full h-full', className)}
      // topBarHeight is the height of the chart and search bar, and 64px is the height of the top bar
      style={{ '--top-bar-height': `${topBarHeight + 64}px`, ...columnSizeVars } as CSSProperties}
    >
      {children}
    </div>
  )
}
