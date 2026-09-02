import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

import { WorkerLogsTab } from './WorkerLogsTab'
import { customRender } from '@/tests/lib/custom-render'

vi.mock('@tanstack/react-query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@tanstack/react-query')>()),
  useQuery: () => ({
    data: [],
    isPending: false,
    isError: false,
    isFetching: false,
    refetch: vi.fn(),
  }),
}))

vi.mock('../WorkerCommandLine', () => ({
  WorkerCommandLine: () => <div />,
}))

vi.mock('@/components/interfaces/Settings/Logs/Logs.DatePickers', () => ({
  LogsDatePicker: () => <div />,
}))

vi.mock('@/components/interfaces/Settings/Logs/LogTable', () => ({
  LogTable: () => <div />,
}))

const renderTab = (stream: 'requests' | 'output') =>
  customRender(<WorkerLogsTab workerName="embed" stream={stream} />)

describe('WorkerLogsTab', () => {
  it('shows the method filter for invocation logs', () => {
    renderTab('requests')

    expect(screen.getByText('All methods')).toBeVisible()
  })

  it('hides the method filter for non-request logs', () => {
    renderTab('output')

    expect(screen.queryByText('All methods')).not.toBeInTheDocument()
  })
})
