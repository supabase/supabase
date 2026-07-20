'use client'

import { useBreakpoint } from 'common'

import { GridHeaderActions } from '@/components/interfaces/TableGridEditor/GridHeaderActions'
import { useTableEditorTableStateSnapshot } from '@/state/table-editor-table'

import { SortPopover } from './sort/SortPopover'
import { TableEditorQuickFilter } from './TableEditorQuickFilter'

export type TableEditorToolbarProps = {
  isRefetching: boolean
  tableQueriesEnabled?: boolean
}

export const TableEditorToolbar = ({
  isRefetching,
  tableQueriesEnabled = true,
}: TableEditorToolbarProps) => {
  const isMobile = useBreakpoint('md')
  const snap = useTableEditorTableStateSnapshot()

  return (
    <div
      data-testid="table-editor-toolbar"
      className="flex flex-wrap md:min-h-10 items-center bg-dash-sidebar border-b border-default md:border-none"
    >
      <div className="w-full flex items-center justify-between gap-2 pr-1.5 pt-1 md:pt-0">
        <TableEditorQuickFilter isRefetching={isRefetching} />

        {!isMobile && (
          <div className="hidden md:flex items-center gap-2 overflow-x-auto pr-1.5">
            <SortPopover tableQueriesEnabled={tableQueriesEnabled} />
            <GridHeaderActions table={snap.originalTable} isRefetching={isRefetching} />
          </div>
        )}
      </div>

      {isMobile && (
        <div className="flex items-center gap-2 overflow-x-auto px-1.5 py-1.5 w-full">
          <SortPopover tableQueriesEnabled={tableQueriesEnabled} />
          <GridHeaderActions table={snap.originalTable} isRefetching={isRefetching} />
        </div>
      )}
    </div>
  )
}
