import { QueryClient } from '@tanstack/react-query'
import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import { fireEvent, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useQueryStates } from 'nuqs'
import { ResizablePanelGroup } from 'ui'
import { describe, expect, it, vi } from 'vitest'

import { generateDynamicColumns } from './components/Columns'
import { LogSelectionActions } from './LogSelectionActions'
import { ServiceFlowPanelControls } from './ServiceFlow/components/ServiceFlowPanelControls'
import { ServiceFlowPanel } from './ServiceFlowPanel'
import { SEARCH_PARAMS_PARSER } from './UnifiedLogs.constants'
import { ColumnSchema } from './UnifiedLogs.schema'
import { DataTableInfinite } from '@/components/ui/DataTable/DataTableInfinite'
import { DataTableProvider } from '@/components/ui/DataTable/providers/DataTableProvider'
import { RowSelectionModifiers } from '@/components/ui/DataTable/rowSelection.utils'
import { useTableRowSelection } from '@/components/ui/DataTable/useTableRowSelection'
import { mapUnifiedLogRow } from '@/data/logs/unified-logs.utils'
import { miscKeys } from '@/data/misc/keys'
import { customRender } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

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
const { columns } = generateDynamicColumns({ data: logs })

function SelectionHarness({
  scope = 'logs',
  showPanel = false,
}: {
  scope?: string
  showPanel?: boolean
}) {
  const [searchParameters] = useQueryStates(SEARCH_PARAMS_PARSER)
  const { selection, selectRow, clearSelection } = useTableRowSelection({ scope })
  const table = useReactTable({
    data: logs,
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
      logs.map((row) => row.id),
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
  it.each([1788424716876000, '2026-09-03T09:58:36.876000'])(
    'enables actions and copies mapped logs with timestamp %s',
    async (timestamp) => {
      const user = userEvent.setup()
      const copy = vi.spyOn(navigator.clipboard, 'writeText')
      const row = mapUnifiedLogRow({
        id: 'mapped-log',
        log_type: 'realtime',
        timestamp,
        event_message: 'Connection opened',
        method: null,
        pathname: null,
        status: '200',
        level: null,
        log_count: null,
        logs: null,
      })
      renderPanel(<LogSelectionActions rows={[row]} />)

      expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Copy selected logs' })).toBeEnabled()
      expect(screen.getByRole('button', { name: 'Explain with AI' })).not.toHaveAttribute(
        'aria-disabled',
        'true'
      )
      await user.click(screen.getByRole('button', { name: 'Copy selected logs' }))
      expect(JSON.parse(copy.mock.calls[0][0])).toEqual([
        expect.objectContaining({ id: 'mapped-log', timestamp, log_count: null, status: '200' }),
      ])
    }
  )

  it('disables copy and AI actions when a selected log is invalid', async () => {
    const user = userEvent.setup()
    const copy = vi.spyOn(navigator.clipboard, 'writeText')
    renderPanel(<LogSelectionActions rows={[{ ...logs[0], timestamp: Infinity }]} />)

    expect(screen.getByRole('alert')).toHaveTextContent('Selected logs contain invalid data')
    expect(screen.getByRole('button', { name: 'Copy selected logs' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Explain with AI' })).toHaveAttribute(
      'aria-disabled',
      'true'
    )
    await user.click(screen.getByRole('button', { name: 'Copy selected logs' }))
    expect(copy).not.toHaveBeenCalled()
  })

  it.each([false, true])(
    'copies selected logs with metadata visibility %s',
    async (metadataVisible) => {
      const user = userEvent.setup()
      const copy = vi.spyOn(navigator.clipboard, 'writeText')
      const rows = [
        {
          ...logs[0],
          event_message: undefined,
          metadata: { source: 'worker_guest_logs' },
          raw_log_data: {
            event_message: 'Worker failed',
            metadata: { request_id: 'request-id' },
          },
        },
        { ...logs[1], log_type: 'compute' as const, metadata: { host: 'compute-host' } },
      ]
      renderPanel(<LogSelectionActions rows={rows} />, metadataVisible)

      await user.click(screen.getByRole('button', { name: 'Copy selected logs' }))

      expect(copy).toHaveBeenCalledOnce()
      expect(JSON.parse(copy.mock.calls[0][0])).toEqual(
        JSON.parse(
          JSON.stringify([
            {
              ...rows[0],
              event_message: '',
              metadata: metadataVisible ? rows[0].metadata : undefined,
              raw_log_data: {
                event_message: 'Worker failed',
                metadata: metadataVisible ? { request_id: 'request-id' } : undefined,
              },
            },
            {
              id: rows[1].id,
              timestamp: rows[1].timestamp,
              event_message: rows[1].event_message,
              metadata: metadataVisible ? rows[1].metadata : undefined,
            },
          ])
        )
      )
      expect(rows[0]).toMatchObject({
        raw_log_data: { metadata: { request_id: 'request-id' } },
      })
    }
  )

  function renderPanel(children = <SelectionHarness showPanel />, metadataVisible = true) {
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
    queryClient.setQueryData(miscKeys.enabledFeaturesOverride(), {
      disabled_features: metadataVisible ? [] : ['logs:metadata'],
    })
    return customRender(children, { queryClient })
  }

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
