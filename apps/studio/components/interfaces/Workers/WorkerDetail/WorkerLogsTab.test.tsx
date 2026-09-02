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

const renderTab = () => customRender(<WorkerLogsTab workerName="embed" stream="requests" />)

describe('WorkerLogsTab', () => {
  it('does not render a method filter', () => {
    renderTab()

    expect(screen.queryByText('All methods')).not.toBeInTheDocument()
  })
})
