import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import relativeTime from 'dayjs/plugin/relativeTime'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import type { ComponentProps, Key, ReactNode } from 'react'
import { expect, test, vi } from 'vitest'

import { LogTable } from '@/components/interfaces/Settings/Logs/LogTable'
import { customRender as render } from '@/tests/lib/custom-render'

dayjs.extend(customParseFormat)
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(relativeTime)

vi.mock('next/router', () => import('next-router-mock'))

vi.mock('react-data-grid', async () => {
  const { createContext, useContext, useRef } = await import('react')

  type MockRow = Record<string, unknown>
  type MockColumn = {
    name?: string
    renderCell?: (props: { row: MockRow; rowIdx: number; isCellSelected: boolean }) => ReactNode
    renderHeaderCell?: (props: object) => ReactNode
  }
  // The subset of react-data-grid's `RenderRowProps` a custom row renderer reads, plus the
  // DOM props (onClick, onContextMenu, className, ...) the renderer forwards to the row element
  type MockRowProps = {
    row: MockRow
    rowIdx: number
    viewportColumns: MockColumn[]
    isRowSelected: boolean
    selectedCellIdx?: number
  } & ComponentProps<'div'>
  type SelectRowEvent = { row: MockRow; checked: boolean; isShiftClick: boolean }
  type MockDataGridProps = {
    columns: MockColumn[]
    rows: MockRow[]
    renderers?: {
      renderRow?: (key: Key, props: MockRowProps) => ReactNode
      noRowsFallback?: ReactNode
    }
    role?: string
    headerRowHeight?: number
    rowKeyGetter: (row: MockRow) => string
    selectedRows?: ReadonlySet<string>
    onSelectedRowsChange?: (selectedRows: Set<string>) => void
  }

  const RowSelectionContext = createContext<{
    isRowSelected: boolean
    onRowSelectionChange: (event: SelectRowEvent) => void
  }>({ isRowSelected: false, onRowSelectionChange: () => {} })

  // Mirrors react-data-grid's `Row`: renders the viewport columns and spreads the rest of
  // the props onto the row element, so only DOM props reach the DOM
  const MockRowRenderer = ({
    row,
    rowIdx,
    viewportColumns,
    isRowSelected,
    selectedCellIdx,
    ...props
  }: MockRowProps) => (
    <div role="row" {...props}>
      {viewportColumns.map((col, colIdx) => (
        <div key={colIdx} role="cell">
          {col.renderCell?.({ row, rowIdx, isCellSelected: false })}
        </div>
      ))}
    </div>
  )

  const MockDataGrid = ({
    columns,
    rows,
    renderers,
    role,
    headerRowHeight,
    rowKeyGetter,
    selectedRows,
    onSelectedRowsChange,
  }: MockDataGridProps) => {
    // Mirrors react-data-grid's own `selectRow`: the anchor is the last clicked row and a
    // shift-click applies the clicked row's new state to every row between the two
    const lastSelectedRowIdx = useRef(-1)

    const selectRow = ({ row, checked, isShiftClick }: SelectRowEvent) => {
      const nextSelectedRows = new Set<string>(selectedRows ?? [])
      const previousRowIdx = lastSelectedRowIdx.current
      const rowIdx = rows.indexOf(row)
      lastSelectedRowIdx.current = rowIdx

      const applyCheckedState = (targetRow: MockRow) => {
        if (checked) {
          nextSelectedRows.add(rowKeyGetter(targetRow))
        } else {
          nextSelectedRows.delete(rowKeyGetter(targetRow))
        }
      }

      applyCheckedState(row)

      if (isShiftClick && previousRowIdx !== -1 && previousRowIdx !== rowIdx) {
        const step = previousRowIdx < rowIdx ? 1 : -1
        for (let idx = previousRowIdx + step; idx !== rowIdx; idx += step) {
          applyCheckedState(rows[idx])
        }
      }

      onSelectedRowsChange?.(nextSelectedRows)
    }

    return (
      <div role={role ?? 'table'}>
        {headerRowHeight !== 0 && (
          <div role="row">
            {columns.map((col, colIdx) => (
              <div key={colIdx} role="columnheader">
                {col.renderHeaderCell ? col.renderHeaderCell({}) : col.name}
              </div>
            ))}
          </div>
        )}
        {rows.map((row, rowIdx) => {
          const rowProps: MockRowProps = {
            row,
            rowIdx,
            viewportColumns: columns,
            isRowSelected: selectedRows?.has(rowKeyGetter(row)) ?? false,
          }
          return (
            <RowSelectionContext.Provider
              key={rowIdx}
              value={{ isRowSelected: rowProps.isRowSelected, onRowSelectionChange: selectRow }}
            >
              {renderers?.renderRow ? (
                renderers.renderRow(rowKeyGetter(row), rowProps)
              ) : (
                <MockRowRenderer {...rowProps} />
              )}
            </RowSelectionContext.Provider>
          )
        })}
        {rows.length === 0 && renderers?.noRowsFallback}
      </div>
    )
  }

  return {
    default: MockDataGrid,
    Row: MockRowRenderer,
    useRowSelection: () => useContext(RowSelectionContext),
  }
})

const fakeMicroTimestamp = dayjs().unix() * 1000

const LOG_DATA = {
  id: 'some-uuid',
  timestamp: 1621323232312,
  event_message: 'event message',
  metadata: {
    my_key: 'something_value',
  },
}

test('can display log data', async () => {
  render(
    <>
      <LogTable projectRef="default" data={[LOG_DATA]} />
    </>
  )

  await screen.findAllByText(LOG_DATA.timestamp)
})

test('Shows total results', async () => {
  render(<LogTable projectRef="default" data={[LOG_DATA]} />)

  await screen.getByText(/results \(1\)/i)
})

test('can run if no queryType provided', async () => {
  const mockRun = vi.fn()

  render(
    <LogTable
      projectRef="projectRef"
      data={[
        {
          id: 'some-uuid',
          timestamp: 1621323232312,
          event_message: 'some event happened',
          metadata: {
            my_key: 'something_value',
          },
        },
      ]}
      onRun={mockRun}
    />
  )

  const run = await screen.findByText('Run')
  await userEvent.click(run)
  // expect(mockRun).toBeCalled()
})

test('can run if no queryType provided', async () => {
  const mockRun = vi.fn()

  render(
    <LogTable
      data={[
        {
          id: 'some-uuid',
          timestamp: 1621323232312,
          event_message: 'some event happened',
          metadata: {
            my_key: 'something_value',
          },
        },
      ]}
      projectRef="abcd"
      onRun={mockRun}
    />
  )

  const run = await screen.findByText('Run')
  await userEvent.click(run)
  // expect(mockRun).toBeCalled()
})

test('dedupes log lines with exact id', async () => {
  // chronological mode requires 4 columns
  render(
    <LogTable
      projectRef="projectRef"
      data={[
        {
          id: 'some-uuid',
          timestamp: 1621323232312,
          event_message: 'some event happened',
          metadata: {},
        },
        {
          id: 'some-uuid',
          timestamp: 1621323232312,
          event_message: 'some event happened',
          metadata: {},
        },
      ]}
    />
  )

  // should only have one element, this line will fail if there are >1 element
  await screen.findByText('timestamp')
})

test('can display standard preview table columns', async () => {
  render(
    <LogTable
      projectRef="ref"
      queryType="auth"
      data={[{ id: '12345', event_message: 'some event message', timestamp: fakeMicroTimestamp }]}
    />
  )
  await waitFor(() => screen.getByText(/some event message/))
  await expect(screen.findByText(/12345/)).rejects.toThrow()
  await expect(screen.findByText(fakeMicroTimestamp)).rejects.toThrow()
})

test("closes the selection if the selected row's data changes", async () => {
  const { rerender } = render(
    <LogTable
      projectRef="ref"
      queryType="auth"
      data={[{ id: '1', event_message: 'some event message', timestamp: fakeMicroTimestamp }]}
    />
  )
  const text = await screen.findByText(/some event message/)
  await userEvent.click(text)

  rerender(
    <LogTable
      projectRef="ref"
      queryType="auth"
      data={[{ id: '2', event_message: 'some other message', timestamp: fakeMicroTimestamp }]}
    />
  )
  await expect(screen.findByText(/some event message/)).rejects.toThrow()
  await screen.findByText(/some other message/)
})

enum QueryType {
  Functions = 'functions',
  Api = 'api',
  Auth = 'auth',
}
test.each([
  {
    queryType: QueryType.Functions,
    data: [
      {
        event_message: 'This is a error log\n',
        event_type: 'log',
        function_id: '001b0b08-331c-403e-810c-a2004b03a019',
        level: 'error',
        timestamp: 1659545029083869,
        id: '3475cf6f-2929-4296-ab44-ce2c17069937',
      },
    ],
    includes: [/ERROR/],
    excludes: ['undefined', 'null'],
  },
  {
    queryType: QueryType.Functions,
    data: [
      {
        event_message: 'This is a uncaughtExceptop\n',
        event_type: 'uncaughtException',
        function_id: '001b0b08-331c-403e-810c-a2004b03a019',
        timestamp: 1659545029083869,
        id: '4475cf6f-2929-4296-ab44-ce2c17069937',
        level: undefined,
      },
    ],
    includes: [/uncaughtException/],
    excludes: [/ERROR/],
  },
  {
    queryType: QueryType.Api,
    data: [
      {
        event_message: 'This is a uncaughtException\n',
        path: 'this-is-some-path',
        method: 'POST',
        status_code: 500,
        timestamp: 1659545029083869,
        id: '4475cf6f-2929-4296-ab44-ce2c17069937',
      },
    ],
    includes: [/POST/, 'this-is-some-path'],
    excludes: [],
  },
  {
    queryType: QueryType.Auth,
    data: [
      {
        event_message: JSON.stringify({ msg: 'some message', path: '/auth-path', level: 'info' }),
        msg: 'some message',
        path: '/auth-path',
        level: 'info',
        timestamp: 1659545029083869,
        id: '4475cf6f-2929-4296-ab44-ce2c17069937',
      },
    ],
    includes: [/auth\-path/, /some message/, /INFO/],
    excludes: [/\{/, /\}/],
  },
])('table col renderer for $queryType', async ({ queryType, data, includes, excludes }) => {
  render(<LogTable projectRef="ref" queryType={queryType} data={data} />)

  await Promise.all([
    ...includes.map((text) => screen.findByText(text)),
    ...excludes.map((text) => expect(screen.findByText(text)).rejects.toThrow()),
  ])
})

test('error message handling', async () => {
  // Render LogTable with error as a string
  render(<LogTable projectRef="ref" error={'some error message'} />)

  expect(screen.getByText(`some error message`)).toBeTruthy()

  // Rerender LogTable with error as null
  render(<LogTable projectRef="ref" error={null} />)
  // Add any additional assertions if LogTable behaves differently when error is null
})

test('no results message handling', async () => {
  render(<LogTable projectRef="ref" data={[]} />)
  await screen.findByText(/No results/)
  await screen.findByText(/Try another search/)
})

test('custom error message: Resources exceeded during query execution', async () => {
  const errorFromLogflare = {
    error: {
      code: 400,
      errors: [
        {
          domain: 'global',
          message:
            'Resources exceeded during query execution: The query could not be executed in the allotted memory. Peak usage: 122% of limit.\nTop memory consumer(s):\n  ORDER BY operations: 99%\n  other/unattributed: 1%\n',
          reason: 'resourcesExceeded',
        },
      ],
      message:
        'Resources exceeded during query execution: The query could not be executed in the allotted memory. Peak usage: 122% of limit.\nTop memory consumer(s):\n  ORDER BY operations: 99%\n  other/unattributed: 1%\n',
      status: 'INVALID_ARGUMENT',
    },
  }

  // logs explorer, custom query
  const { rerender } = render(<LogTable projectRef="ref" error={errorFromLogflare} />)

  // prompt user to reduce selected tables
  await screen.findByText(/This query requires too much memory to be executed/)
  await screen.findByText(
    /Avoid selecting entire objects and instead select specific keys using dot notation/
  )

  // previewer, prompt to reduce time range
  rerender(<LogTable projectRef="ref" queryType="api" error={errorFromLogflare} />)
  await screen.findByText(/This query requires too much memory to be executed/)
  await screen.findByText(/Avoid querying across a large datetime range/)
  await screen.findByText(/Please contact support if this error persists/)
})

const createLogRow = (index: number) => ({
  id: `log-id-${index}`,
  timestamp: fakeMicroTimestamp - index,
  event_message: `event message ${index}`,
})

const MULTI_SELECT_LOGS = Array.from({ length: 6 }, (_, index) => createLogRow(index))

const getRowCheckboxes = () => screen.getAllByRole('checkbox')

const expectCheckedIndexes = (checkedIndexes: number[]) => {
  const checkboxes = getRowCheckboxes()
  checkboxes.forEach((checkbox, index) => {
    expect(checkbox.getAttribute('aria-checked')).toBe(
      checkedIndexes.includes(index) ? 'true' : 'false'
    )
  })
}

const shiftClick = async (user: ReturnType<typeof userEvent.setup>, element: Element) => {
  await user.keyboard('{Shift>}')
  await user.click(element)
  await user.keyboard('{/Shift}')
}

test('shift-click selects the range between the anchor row and the clicked row', async () => {
  const user = userEvent.setup()
  render(<LogTable projectRef="projectRef" data={MULTI_SELECT_LOGS} />)

  const checkboxes = getRowCheckboxes()
  expect(checkboxes).toHaveLength(MULTI_SELECT_LOGS.length)

  await user.click(checkboxes[1])
  await shiftClick(user, getRowCheckboxes()[4])

  expectCheckedIndexes([1, 2, 3, 4])
  await screen.findByText('4 rows selected')
})

test('shift-click without an anchor toggles only the clicked row', async () => {
  const user = userEvent.setup()
  render(<LogTable projectRef="projectRef" data={MULTI_SELECT_LOGS} />)

  await shiftClick(user, getRowCheckboxes()[3])

  expectCheckedIndexes([3])
  await screen.findByText('1 row selected')
})

test('shift-click on a selected row deselects back to the anchor, leaving the anchor checked', async () => {
  const user = userEvent.setup()
  render(<LogTable projectRef="projectRef" data={MULTI_SELECT_LOGS} />)

  await user.click(getRowCheckboxes()[1])
  await shiftClick(user, getRowCheckboxes()[4])
  expectCheckedIndexes([1, 2, 3, 4])

  // Row 4 is now the anchor and is never modified, so only it stays checked
  await shiftClick(user, getRowCheckboxes()[1])

  expectCheckedIndexes([4])
  await screen.findByText('1 row selected')
})

test('clicking a checked row again clears the selection', async () => {
  const user = userEvent.setup()
  render(<LogTable projectRef="projectRef" data={MULTI_SELECT_LOGS} />)

  await user.click(getRowCheckboxes()[2])
  expectCheckedIndexes([2])
  await screen.findByText('1 row selected')

  await user.click(getRowCheckboxes()[2])

  expectCheckedIndexes([])
  await waitFor(() => expect(screen.queryByText(/rows? selected/)).toBeNull())
})

test('checkbox clicks stay inside the checkbox column while a row click clears the selection', async () => {
  const user = userEvent.setup()
  const onSelectedLogChange = vi.fn()
  render(
    <LogTable
      projectRef="projectRef"
      data={MULTI_SELECT_LOGS}
      onSelectedLogChange={onSelectedLogChange}
    />
  )

  await user.click(getRowCheckboxes()[1])
  await shiftClick(user, getRowCheckboxes()[3])

  expectCheckedIndexes([1, 2, 3])
  await screen.findByText('3 rows selected')
  // Checking rows only closes the side panel (`null`), it never opens one for a log
  expect(onSelectedLogChange).not.toHaveBeenCalledWith(
    expect.objectContaining({ id: expect.any(String) })
  )

  const dataRows = screen
    .getAllByRole('row')
    .filter((row) => within(row).queryByRole('checkbox') !== null)
  await user.click(dataRows[4])

  expect(onSelectedLogChange).toHaveBeenCalledWith(
    expect.objectContaining({ id: MULTI_SELECT_LOGS[4].id })
  )
  expectCheckedIndexes([])
  await waitFor(() => expect(screen.queryByText(/rows? selected/)).toBeNull())
})
