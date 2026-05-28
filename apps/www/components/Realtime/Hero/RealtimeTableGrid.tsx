'use client'

import { memo } from 'react'
import DataGrid, { type Column, type RenderCellProps } from 'react-data-grid'
import { Checkbox, cn } from 'ui'

import { DemoGridCell } from './DemoGridCell'
import { DemoGridProvider } from './demoGridContext'
import { GridColumnHeader } from './GridColumnHeader'
import {
  HERO_GRID_HEIGHT,
  HERO_HEADER_HEIGHT,
  HERO_ROW_COUNT,
  HERO_ROW_HEIGHT,
  USER_TABLE_COLUMNS,
  type UserRow,
} from './mockUserTableData'
import type { CellFocusPayload } from './types'

type RealtimeTableGridProps = {
  rows: UserRow[]
  focusedCells: Record<string, CellFocusPayload>
}

const SELECT_COLUMN: Column<UserRow> = {
  key: 'select',
  name: '',
  width: 70,
  resizable: false,
  frozen: true,
  headerCellClass: 'border-default border-r border-b',
  cellClass: 'border-default border-r',
  renderHeaderCell: () => (
    <div className="flex h-full w-full items-center justify-center px-2">
      <Checkbox disabled checked={false} aria-label="Select all rows" />
    </div>
  ),
  renderCell: () => (
    <div className="flex h-full w-full items-center justify-center gap-1 px-1">
      <Checkbox disabled checked={false} aria-label="Select row" />
    </div>
  ),
}

const DATA_COLUMNS: Column<UserRow>[] = USER_TABLE_COLUMNS.map((col) => ({
  key: col.key,
  name: col.name,
  minWidth: col.minWidth,
  width: col.width,
  resizable: false,
  headerCellClass: 'border-default border-r border-b p-0!',
  cellClass: 'p-0!',
  renderHeaderCell: () => (
    <GridColumnHeader name={col.name} format={col.format} isPrimaryKey={col.isPrimaryKey} />
  ),
  renderCell: (props: RenderCellProps<UserRow>) => <DemoGridCell {...props} />,
}))

const GRID_COLUMNS: Column<UserRow>[] = [SELECT_COLUMN, ...DATA_COLUMNS]

const ROW_CLASS_BASE =
  'bg-dash-sidebar [&>.rdg-cell]:border-box [&>.rdg-cell]:outline-hidden [&>.rdg-cell]:shadow-none [&>.rdg-cell]:border-secondary [&>.rdg-cell:not(:last-child)]:border-r'
const ROW_CLASS_WITH_BORDER = `${ROW_CLASS_BASE} [&>.rdg-cell]:border-b`

function RealtimeTableGridInner({ rows, focusedCells }: RealtimeTableGridProps) {
  const rowClass = (_row: UserRow, idx: number) =>
    idx === HERO_ROW_COUNT - 1 ? ROW_CLASS_BASE : ROW_CLASS_WITH_BORDER

  return (
    <DemoGridProvider focusedCells={focusedCells}>
      <div
        className="sb-grid realtime-hero-grid relative w-full"
        style={{ height: HERO_GRID_HEIGHT }}
      >
        <DataGrid
          className="grow border-t-0 bg-dash-canvas"
          rowHeight={HERO_ROW_HEIGHT}
          headerRowHeight={HERO_HEADER_HEIGHT}
          columns={GRID_COLUMNS}
          rows={rows}
          rowKeyGetter={(row) => row.id}
          rowClass={rowClass}
        />
      </div>
    </DemoGridProvider>
  )
}

export const RealtimeTableGrid = memo(RealtimeTableGridInner)
