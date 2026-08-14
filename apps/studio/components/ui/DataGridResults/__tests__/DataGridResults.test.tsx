import { screen } from '@testing-library/react'
import { type ComponentProps } from 'react'
import { type CalculatedColumn } from 'react-data-grid'
import { expect, test, vi } from 'vitest'

import { type ResultRow } from '../DataGridResults.utils'
import { DataGridResults as Results } from '../index'
import { customRender as render } from '@/tests/lib/custom-render'

let contextMenuMountCount = 0

vi.mock('ui', async () => {
  const actual = await vi.importActual<typeof import('ui')>('ui')
  return {
    ...actual,
    ContextMenu: (props: ComponentProps<typeof actual.ContextMenu>) => {
      contextMenuMountCount++
      return <actual.ContextMenu {...props} />
    },
  }
})

vi.mock('react-data-grid', () => ({
  default: ({
    columns,
    rows,
  }: {
    columns: CalculatedColumn<ResultRow>[]
    rows: readonly ResultRow[]
  }) => (
    <div role="table">
      <div role="row">
        {columns.map((col, colIdx) => (
          <div key={colIdx} role="columnheader">
            {col.renderHeaderCell
              ? col.renderHeaderCell({
                  column: col,
                  sortDirection: undefined,
                  priority: undefined,
                  tabIndex: -1,
                })
              : col.name}
          </div>
        ))}
      </div>
      {rows.map((row, rowIdx) => (
        <div key={rowIdx} role="row">
          {columns.map((col, colIdx) => (
            <div key={colIdx} role="cell">
              {col.renderCell?.({
                column: col,
                row,
                rowIdx,
                isCellEditable: false,
                tabIndex: -1,
                onRowChange: () => {},
              })}
            </div>
          ))}
        </div>
      ))}
    </div>
  ),
}))

function generateRows(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    name: `row-${i}`,
  }))
}

test('renders a single context menu regardless of row count', () => {
  contextMenuMountCount = 0
  const rows = generateRows(100)
  render(<Results rows={rows} />)

  expect(contextMenuMountCount).toBe(1)
})

test('shows empty state when no rows provided', () => {
  render(<Results rows={[]} />)
  expect(screen.getByText('Success. No rows returned')).toBeTruthy()
})
