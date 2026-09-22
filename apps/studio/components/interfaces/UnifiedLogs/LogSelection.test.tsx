import { QueryClient } from '@tanstack/react-query'
import { ColumnDef, getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQueryStates } from 'nuqs'
import { ResizablePanelGroup } from 'ui'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { generateDynamicColumns } from './components/Columns'
import { ServiceFlowPanelControls } from './ServiceFlow/components/ServiceFlowPanelControls'
import { ServiceFlowPanel } from './ServiceFlowPanel'
import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import { ColumnSchema } from './UnifiedLogs.schema'
import { DataTableInfinite } from '@/components/ui/DataTable/DataTableInfinite'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { RowSelectionModifiers } from '@/components/ui/DataTable/rowSelection.utils'
import { useTableRowSelection } from '@/components/ui/DataTable/useTableRowSelection'
import { miscKeys } from '@/data/misc/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

// jsdom has no layout; keep the real virtualizer and supply viewport/row sizes.
beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'offsetHeight', 'get').mockImplementation(function (
    this: HTMLElement
  ) {
    return this.tagName === 'TR' ? 30 : 300
  })
  vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(1000)
  vi.spyOn(HTMLElement.prototype, 'clientHeight', 'get').mockReturnValue(300)
  vi.spyOn(HTMLElement.prototype, 'scrollHeight', 'get').mockImplementation(function (
    this: HTMLElement
  ) {
    return Number(this.querySelector('table')?.getAttribute('aria-rowcount') ?? 10) * 30 + 36
  })
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (
    this: HTMLElement
  ) {
    return {
      x: 0,
      y: 0,
      top: 0,
      left: 0,
      right: 1000,
      bottom: 300,
      width: 1000,
      height: this.tagName === 'TR' ? 30 : 300,
      toJSON: () => ({}),
    }
  })
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
    configurable: true,
    value: function (this: HTMLElement, options: ScrollToOptions) {
      if (typeof options === 'object' && this.scrollTop !== (options.top ?? 0)) {
        this.scrollTop = options.top ?? 0
        fireEvent.scroll(this)
      }
    },
  })
})
afterEach(() => Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo'))

const logs: ColumnSchema[] = ['first', 'second', 'third', 'fourth'].map((id) => ({
  id,
  log_type: 'realtime',
  event_message: id,
  level: 'success',
  timestamp: 1000000,
  date: new Date(1000),
  method: null,
  pathname: null,
  status: null,
}))
const { columns: defaultColumns } = generateDynamicColumns({ data: logs })

function SelectionHarness({
  scope = 'logs',
  showPanel = false,
  data = logs,
  columns = defaultColumns,
}: {
  scope?: string
  showPanel?: boolean
  data?: ColumnSchema[]
  columns?: ColumnDef<ColumnSchema>[]
}) {
  const [searchParameters] = useQueryStates(SEARCH_PARAMS_PARSER)
  const { selection, selectRow, clearSelection } = useTableRowSelection({ scope })
  const table = useReactTable({
    data,
    columns,
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    state: { rowSelection: selection.selected },
  })
  const selectedRows = table.getSelectedRowModel().rows
  const activeId =
    selectedRows.find((row) => row.id === selection.activeId)?.id ?? selectedRows.at(-1)?.id
  const onSelectRow = (id: string, modifiers?: RowSelectionModifiers) =>
    selectRow(
      data.map((row) => row.id),
      id,
      modifiers
    )
  return (
    <DataTableProvider
      table={table}
      columns={columns}
      filterFields={[]}
      error={null}
      isError={false}
      isLoading={false}
      isFetching={false}
      isLoadingCounts={false}
      openRowId={activeId}
      rowSelection={selection.selected}
      onSelectRow={onSelectRow}
      setOpenRowId={(id) => (id ? onSelectRow(id) : clearSelection())}
    >
      <DataTableInfinite
        columns={columns}
        fetchNextPage={vi.fn()}
        setColumnOrder={vi.fn()}
        setColumnVisibility={vi.fn()}
      />
      {activeId && !showPanel && <ServiceFlowPanelControls dock="right" setDock={vi.fn()} />}
      {activeId && showPanel && (
        <ResizablePanelGroup orientation="horizontal">
          <ServiceFlowPanel
            dock="right"
            setDock={vi.fn()}
            selectedRows={selectedRows.map((row) => row.original)}
            searchParameters={searchParameters}
          />
        </ResizablePanelGroup>
      )}
    </DataTableProvider>
  )
}
const row = (message: string) => within(screen.getByRole('table')).getByText(message).closest('tr')!
const selected = () => screen.getAllByRole('row', { selected: true }).map((element) => element.id)

describe('log row selection', () => {
  it('unifies row clicks, additive clicks, and checkbox toggles', () => {
    customRender(<SelectionHarness />)
    fireEvent.click(row('first'))
    expect(selected()).toEqual(['first'])
    expect(within(row('first')).getByRole('checkbox')).toBeChecked()
    fireEvent.click(row('third'), { metaKey: true })
    expect(selected()).toEqual(['first', 'third'])
    fireEvent.click(within(row('second')).getByRole('checkbox'))
    expect(selected()).toEqual(['first', 'second', 'third'])
    fireEvent.click(within(row('first')).getByRole('checkbox'))
    expect(selected()).toEqual(['second', 'third'])
    fireEvent.click(row('fourth'))
    expect(selected()).toEqual(['fourth'])
  })

  it('only rerenders cells in rows whose selection changed', () => {
    const renderCell = vi.fn(({ row }: { row: { id: string } }) => row.id)
    const columns = defaultColumns.map((column) =>
      'accessorKey' in column && column.accessorKey === 'event_message'
        ? { ...column, cell: renderCell }
        : column
    )
    customRender(<SelectionHarness columns={columns} />)
    renderCell.mockClear()
    fireEvent.click(row('first'))
    expect(renderCell.mock.calls.map(([{ row }]) => row.id)).toEqual(['first'])
    renderCell.mockClear()
    fireEvent.click(row('third'))
    expect(renderCell.mock.calls.map(([{ row }]) => row.id)).toEqual(['first', 'third'])
  })

  it('supports shift-click ranges and extends and shrinks with the keyboard', () => {
    customRender(<SelectionHarness />)
    fireEvent.click(row('second'))
    fireEvent.click(row('fourth'), { shiftKey: true })
    expect(selected()).toEqual(['second', 'third', 'fourth'])
    fireEvent.keyDown(document, { key: 'ArrowUp', code: 'ArrowUp', shiftKey: true })
    fireEvent.keyUp(document, { key: 'ArrowUp', code: 'ArrowUp', shiftKey: true })
    expect(selected()).toEqual(['second', 'third'])
    fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown', shiftKey: true })
    fireEvent.keyUp(document, { key: 'ArrowDown', code: 'ArrowDown', shiftKey: true })
    expect(selected()).toEqual(['second', 'third', 'fourth'])
    fireEvent.keyDown(document, { key: 'ArrowUp', code: 'ArrowUp' })
    fireEvent.keyUp(document, { key: 'ArrowUp', code: 'ArrowUp' })
    expect(selected()).toEqual(['third'])
  })

  it('navigates beyond the rendered window without mounting all loaded rows', async () => {
    const data = Array.from({ length: 500 }, (_, index) => ({
      ...logs[0],
      id: `log-${index}`,
      event_message: `message-${index}`,
    }))
    customRender(<SelectionHarness data={data} />)
    expect(screen.getAllByRole('checkbox').length).toBeLessThan(40)
    expect(screen.queryByText('message-100')).not.toBeInTheDocument()
    const lastVisibleIndex = screen.getAllByRole('checkbox').length - 1
    const targetIndex = lastVisibleIndex + 3
    expect(screen.queryByText(`message-${targetIndex}`)).not.toBeInTheDocument()
    act(() => row(`message-${lastVisibleIndex}`).focus())
    fireEvent.keyDown(row(`message-${lastVisibleIndex}`), { key: 'Enter' })
    for (let index = 0; index < 3; index++) {
      await act(async () => {
        fireEvent.keyDown(document, { key: 'ArrowDown', code: 'ArrowDown' })
        fireEvent.keyUp(document, { key: 'ArrowDown', code: 'ArrowDown' })
        await new Promise(requestAnimationFrame)
      })
    }
    await waitFor(() => expect(row(`message-${targetIndex}`)).toHaveFocus())
    expect(selected()).toEqual([`log-${targetIndex}`])
    expect(screen.getAllByRole('checkbox').length).toBeLessThan(40)
    fireEvent.keyDown(document, { key: 'ArrowUp', code: 'ArrowUp', shiftKey: true })
    fireEvent.keyUp(document, { key: 'ArrowUp', code: 'ArrowUp', shiftKey: true })
    expect(selected()).toEqual([`log-${targetIndex - 1}`, `log-${targetIndex}`])
  })

  it('supports keyboard activation and clears on closing or changing filters', () => {
    const { rerender } = customRender(<SelectionHarness />)
    fireEvent.keyDown(row('first'), { key: 'Enter' })
    expect(selected()).toEqual(['first'])
    fireEvent.keyDown(row('third'), { key: ' ', ctrlKey: true })
    expect(selected()).toEqual(['first', 'third'])
    fireEvent.click(screen.getByRole('button', { name: 'Clear selection' }))
    expect(screen.queryAllByRole('row', { selected: true })).toHaveLength(0)
    fireEvent.click(row('second'))
    rerender(<SelectionHarness scope="new-filters" />)
    expect(screen.queryAllByRole('row', { selected: true })).toHaveLength(0)
  })
})

describe('selected log details', () => {
  function renderPanel(data = logs) {
    addAPIMock({
      method: 'get',
      path: '/platform/projects/:ref',
      response: {
        cloud_provider: 'AWS',
        db_host: 'db.default.supabase.co',
        high_availability: false,
        id: 1,
        inserted_at: '2026-01-01T00:00:00Z',
        integration_source: null,
        is_branch_enabled: false,
        is_physical_backups_enabled: false,
        name: 'Test project',
        organization_id: 1,
        ref: 'default',
        region: 'us-east-1',
        restUrl: 'https://default.supabase.co',
        status: 'ACTIVE_HEALTHY',
        subscription_id: 'subscription-1',
        updated_at: '2026-01-01T00:00:00Z',
        connectionString: 'postgresql://postgres:password@localhost:5432/postgres',
      },
    })
    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), { disabled_features: [] })
    return customRender(<SelectionHarness showPanel data={data} />, { queryClient })
  }

  it('bounds large previews while copying the complete selection', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    const data = Array.from({ length: 50 }, (_, index) => ({
      ...logs[0],
      id: `log-${index}`,
      event_message: `message-${index}`,
    }))
    renderPanel(data)
    fireEvent.click(row('message-0'))
    fireEvent.scroll(screen.getByRole('table').parentElement!, { target: { scrollTop: 1250 } })
    fireEvent.click(row('message-49'), { shiftKey: true })
    expect(screen.getByRole('status')).toHaveTextContent('50 logs selected')
    const preview = screen.getByRole('region', { name: 'Selected logs JSON' })
    expect(preview).toHaveTextContent('Preview shortened')
    expect(preview).not.toHaveTextContent('message-49')
    await user.click(screen.getByRole('button', { name: 'Copy selected logs' }))
    expect(JSON.parse(copy.mock.calls[0][0])).toHaveLength(50)
    expect(JSON.parse(copy.mock.calls[0][0])[49].id).toBe('log-49')
  })

  it('bounds large raw JSON rendering while copying the full log', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    const data = [{ ...logs[0], metadata: { message: 'x'.repeat(120_000), end: 'complete-log' } }]
    renderPanel(data)
    await user.click(row('first'))
    await user.click(screen.getByRole('tab', { name: 'Raw JSON' }))
    const detail = screen.getByRole('tabpanel')
    expect(detail).toHaveTextContent('Preview shortened')
    expect(detail).not.toHaveTextContent('complete-log')
    await user.click(screen.getByRole('button', { name: 'Copy log as JSON' }))
    expect(JSON.parse(copy.mock.calls[0][0]).metadata.end).toBe('complete-log')
  })

  it('keeps the active detail tab while navigating to a different log', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(row('first'))
    await user.click(screen.getByRole('tab', { name: 'Raw JSON' }))
    await user.click(screen.getByRole('button', { name: 'Next log' }))
    expect(screen.getByRole('tab', { name: 'Raw JSON' })).toHaveAttribute('aria-selected', 'true')
    const detail = screen.getByRole('tabpanel')
    expect(detail).toHaveTextContent('second')
    expect(detail).not.toHaveTextContent('first')
  })

  it('offers both tabs for a log without a specialized overview', async () => {
    const user = userEvent.setup()
    renderPanel()
    await user.click(row('first'))
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('event_message')).toBeVisible()
    expect(screen.getByRole('button', { name: 'Copy selected logs' })).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'Raw JSON' }))
    expect(screen.getByRole('button', { name: 'Copy log as JSON' })).toBeVisible()
    await user.click(screen.getByRole('tab', { name: 'Overview' }))
    expect(screen.getByText('event_message')).toBeVisible()
  })

  it('shows and copies JSON directly for multiple logs and restores single-log tabs', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    renderPanel()
    fireEvent.click(row('first'))
    expect(screen.getByRole('status')).toHaveTextContent('first')
    fireEvent.click(row('third'), { metaKey: true })
    expect(screen.getByRole('status')).toHaveTextContent('2 logs selected')
    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
    const json = screen.getByRole('region', { name: 'Selected logs JSON' })
    expect(json).toHaveTextContent('first')
    expect(json).toHaveTextContent('third')
    expect(json).not.toHaveTextContent('second')
    expect(screen.getByRole('button', { name: 'Explain with AI' })).not.toHaveAttribute(
      'aria-haspopup'
    )
    expect(screen.getByRole('button', { name: 'Copy selected logs' }).textContent?.trim()).toBe('')
    const copyButton = screen.getByRole('button', { name: 'Copy selected logs' })
    expect(copyButton).not.toHaveAttribute('aria-haspopup')
    await user.click(copyButton)
    expect(copy).toHaveBeenCalledOnce()
    expect(JSON.parse(copy.mock.calls[0][0])).toEqual(
      JSON.parse(JSON.stringify([logs[0], logs[2]]))
    )
    await user.click(row('second'))
    expect(screen.getByRole('status')).toHaveTextContent('second')
    expect(screen.getByRole('tab', { name: 'Overview' })).toBeVisible()
    expect(screen.getByRole('tab', { name: 'Raw JSON' })).toBeVisible()
  })
})
