import { screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import Results from '@/components/interfaces/SQLEditor/UtilityPanel/Results'
import { customRender as render } from '@/tests/lib/custom-render'

let contextMenuMountCount = 0

vi.mock('ui', async () => {
  const actual = await vi.importActual<typeof import('ui')>('ui')
  return {
    ...actual,
    ContextMenu_Shadcn_: (props: any) => {
      contextMenuMountCount++
      return <actual.ContextMenu_Shadcn_ {...props} />
    },
  }
})

vi.mock('react-data-grid', () => ({
  default: ({ columns, rows }: any) => (
    <div role="table">
      <div role="row">
        {columns.map((col: any, colIdx: number) => (
          <div key={colIdx} role="columnheader">
            {col.renderHeaderCell ? col.renderHeaderCell({}) : col.name}
          </div>
        ))}
      </div>
      {rows.map((row: any, rowIdx: number) => (
        <div key={rowIdx} role="row">
          {columns.map((col: any, colIdx: number) => (
            <div key={colIdx} role="cell">
              {col.renderCell?.({ row, rowIdx, isCellSelected: false })}
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
