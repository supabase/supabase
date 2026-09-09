import { screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

test('opens the selected row using its edit action', async () => {
  const rows = generateRows(2)
  const onEditRow = vi.fn()
  render(<Results rows={rows} onEditRow={onEditRow} />)
  await userEvent.click(screen.getAllByRole('button', { name: 'Edit row' })[1])
  expect(onEditRow).toHaveBeenCalledWith(rows[1])
})

test('supports keyboard activation and disables rows without an identity', async () => {
  const rows = generateRows(2)
  const onEditRow = vi.fn()
  render(<Results rows={rows} onEditRow={onEditRow} canEditRow={(row) => row.id === 0} />)
  const actions = screen.getAllByRole('button', { name: 'Edit row' })
  expect(actions[1]).toBeDisabled()
  actions[0].focus()
  await userEvent.keyboard('{Enter}')
  expect(onEditRow).toHaveBeenCalledWith(rows[0])
})

test('keeps ordinary result grids read-only', () => {
  render(<Results rows={generateRows(2)} />)
  expect(screen.queryByRole('button', { name: 'Edit row' })).not.toBeInTheDocument()
})

test('keeps result columns in place while editing becomes available or stays unavailable', () => {
  const rows = generateRows(1)
  const { rerender } = render(<Results rows={rows} reserveRowActions isLoadingRowActions />)
  const headers = () => screen.getAllByRole('columnheader').map((header) => header.textContent)

  expect(headers()).toEqual(['', 'id', 'name'])
  expect(screen.getByRole('img', { name: 'Checking row editability' })).toHaveClass(
    'animate-spin',
    'text-tertiary-foreground'
  )
  expect(screen.queryByRole('button', { name: 'Edit row' })).not.toBeInTheDocument()

  rerender(<Results rows={rows} reserveRowActions onEditRow={vi.fn()} />)
  expect(headers()).toEqual(['', 'id', 'name'])
  expect(screen.getByRole('button', { name: 'Edit row' })).toBeInTheDocument()
  expect(screen.queryByRole('img', { name: 'Checking row editability' })).not.toBeInTheDocument()

  rerender(<Results rows={rows} reserveRowActions />)
  expect(headers()).toEqual(['', 'id', 'name'])
  expect(screen.queryByRole('button', { name: 'Edit row' })).not.toBeInTheDocument()
  expect(screen.queryByRole('img', { name: 'Checking row editability' })).not.toBeInTheDocument()
})
