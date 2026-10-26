import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { Button } from 'ui'
import { afterEach, describe, expect, it, vi } from 'vitest'

import type { ColumnSchema } from '../UnifiedLogs.schema'
import { EmbeddedLogsTable } from './EmbeddedLogsTable'
import { customRender } from '@/tests/lib/custom-render'

const logs: ColumnSchema[] = ['first', 'second'].map((id, index) => ({
  id,
  log_type: 'edge function',
  event_message: `${id} message`,
  level: 'error',
  timestamp: 1_000_000 - index,
  date: new Date(1000 - index),
  method: 'POST',
  pathname: '/functions/v1/hello',
  status: 500,
}))

const row = (message: string) => within(screen.getByRole('table')).getByText(message).closest('tr')!

describe('EmbeddedLogsTable', () => {
  afterEach(() => localStorage.clear())

  it('renders logs without selection checkboxes', () => {
    customRender(<EmbeddedLogsTable rows={logs} isLoading={false} />)

    expect(row('first message')).toBeInTheDocument()
    expect(row('second message')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('hands the clicked log id to onRowClick without selecting the row', () => {
    const onRowClick = vi.fn()
    customRender(<EmbeddedLogsTable rows={logs} isLoading={false} onRowClick={onRowClick} />)

    fireEvent.click(row('second message'))

    expect(onRowClick).toHaveBeenCalledWith('second')
    expect(screen.queryAllByRole('row', { selected: true })).toHaveLength(0)
  })

  it('renders the footer below the rows instead of pagination', () => {
    customRender(
      <EmbeddedLogsTable rows={logs} isLoading={false} footer={<Button>View all logs</Button>} />
    )

    expect(screen.getByRole('button', { name: 'View all logs' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Load more' })).not.toBeInTheDocument()
    expect(screen.queryByText(/No more data to load/)).not.toBeInTheDocument()
  })

  it('reads saved columns from its own key when given one, not the Logs page key', async () => {
    localStorage.setItem('data-table-visibility', JSON.stringify({ method: false }))
    localStorage.setItem('edge-function-data-table-visibility', JSON.stringify({ pathname: false }))

    customRender(
      <EmbeddedLogsTable rows={logs} isLoading={false} columnPreferencesKey="edge-function" />
    )

    await waitFor(() => expect(screen.queryByText('/functions/v1/hello')).not.toBeInTheDocument())
    expect(screen.getAllByText('POST')).toHaveLength(2)
  })

  it('shows the empty state message when there are no logs', () => {
    customRender(
      <EmbeddedLogsTable rows={[]} isLoading={false} emptyStateMessage="No errors found" />
    )

    expect(screen.getByText('No errors found')).toBeInTheDocument()
  })
})
