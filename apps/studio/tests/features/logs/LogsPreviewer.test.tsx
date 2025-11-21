import { screen, waitFor } from '@testing-library/react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import {
  LogsPreviewer,
  calculateBarClickTimeRange,
} from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { customRender, customRenderHook } from 'tests/lib/custom-render'
import userEvent from '@testing-library/user-event'

import useLogsPreview from 'hooks/analytics/useLogsPreview'
import { LOGS_API_MOCKS } from './logs.mocks'
import { addAPIMock } from 'tests/lib/msw'

dayjs.extend(utc)

vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    useParams: vi.fn().mockReturnValue({}),
    useIsLoggedIn: vi.fn(),
    isBrowser: false,
    LOCAL_STORAGE_KEYS: (actual as any).LOCAL_STORAGE_KEYS,
    ...(actual as any),
  }
})

vi.mock('lib/gotrue', async (importOriginal) => ({
  ...(await importOriginal()),
  auth: { onAuthStateChange: vi.fn() },
}))

beforeEach(() => {
  addAPIMock({
    method: 'get',
    path: '/platform/projects/:ref/analytics/endpoints/logs.all',
    response: LOGS_API_MOCKS,
  })
})

test('search loads with whatever is on the URL', async () => {
  customRender(
    <LogsPreviewer queryType="api" projectRef="default" tableName={LogsTableName.EDGE} />,
    {
      nuqs: {
        searchParams: {
          s: 'test-search-box-value',
        },
      },
    }
  )

  await waitFor(() => {
    expect(screen.getByRole('textbox')).toHaveValue('test-search-box-value')
  })

  await waitFor(() => {
    expect(screen.getByRole('textbox')).not.toHaveValue('WRONGVALUE!🪿')
  })
})

test('useLogsPreview returns data from MSW', async () => {
  const { result } = customRenderHook(() =>
    useLogsPreview({
      projectRef: 'default',
      table: LogsTableName.EDGE,
    })
  )

  await waitFor(() => {
    expect(result.current.isLoading).toBe(false)
  })

  await waitFor(() => {
    expect(result.current.logData.length).toBeGreaterThan(0)
  })

  expect(result.current.logData).toEqual(LOGS_API_MOCKS.result)
})

test('LogsPreviewer renders the expected data from the API', async () => {
  customRender(
    <LogsPreviewer queryType="api" projectRef="default" tableName={LogsTableName.EDGE} />
  )

  await waitFor(() => {
    expect(screen.getByRole('table')).toBeInTheDocument()
  })

  const firstLogEventMessage = LOGS_API_MOCKS.result[0].event_message

  await waitFor(() => {
    expect(screen.getAllByText(firstLogEventMessage)[0]).toBeInTheDocument()
  })
})

test('can toggle log event chart', async () => {
  customRender(
    <LogsPreviewer queryType="api" projectRef="default" tableName={LogsTableName.EDGE} />
  )

  expect(screen.getByRole('button', { name: /Chart/i })).toBeInTheDocument()

  await waitFor(() => {
    expect(screen.getByTestId('logs-bar-chart')).toBeInTheDocument()
  })

  await userEvent.click(screen.getByRole('button', { name: /Chart/i }))

  await waitFor(() => {
    expect(screen.queryByTestId('logs-bar-chart')).not.toBeInTheDocument()
  })
})

test('can click load older', async () => {
  customRender(
    <LogsPreviewer queryType="api" projectRef="default" tableName={LogsTableName.EDGE} />
  )

  const loadOlder = await waitFor(
    async () => await screen.findByRole('button', { name: /Load older/i }),
    { timeout: 10000 }
  )

  loadOlder.onclick = vi.fn()

  await userEvent.click(loadOlder)

  expect(loadOlder.onclick).toHaveBeenCalled()
})

describe('calculateBarClickTimeRange', () => {
  const clickedTime = '2024-01-15T12:30:00.000Z'

  test('uses 15-second range for time ranges less than 2 minutes', () => {
    const rangeStart = '2024-01-15T12:00:00.000Z'
    const rangeEnd = '2024-01-15T12:01:30.000Z' // 1.5 minutes

    const result = calculateBarClickTimeRange(rangeStart, rangeEnd, clickedTime)

    expect(result.start).toBe('2024-01-15T12:29:52.500Z') // 7.5 seconds before
    expect(result.end).toBe('2024-01-15T12:30:07.500Z') // 7.5 seconds after
  })

  test('uses 2-minute range for time ranges between 2 minutes and 1 hour', () => {
    const rangeStart = '2024-01-15T12:00:00.000Z'
    const rangeEnd = '2024-01-15T12:30:00.000Z' // 30 minutes

    const result = calculateBarClickTimeRange(rangeStart, rangeEnd, clickedTime)

    expect(result.start).toBe('2024-01-15T12:29:00.000Z') // 1 minute before
    expect(result.end).toBe('2024-01-15T12:31:00.000Z') // 1 minute after
  })

  test('uses 5-minute range for time ranges between 1 and 12 hours', () => {
    const rangeStart = '2024-01-15T10:00:00.000Z'
    const rangeEnd = '2024-01-15T14:00:00.000Z' // 4 hours

    const result = calculateBarClickTimeRange(rangeStart, rangeEnd, clickedTime)

    expect(result.start).toBe('2024-01-15T12:27:30.000Z') // 2.5 minutes before
    expect(result.end).toBe('2024-01-15T12:32:30.000Z') // 2.5 minutes after
  })

  test('uses 1-hour range for time ranges 12 hours or more', () => {
    const rangeStart = '2024-01-15T00:00:00.000Z'
    const rangeEnd = '2024-01-15T24:00:00.000Z' // 24 hours

    const result = calculateBarClickTimeRange(rangeStart, rangeEnd, clickedTime)

    expect(result.start).toBe('2024-01-15T12:00:00.000Z') // 30 minutes before
    expect(result.end).toBe('2024-01-15T13:00:00.000Z') // 30 minutes after
  })

  test('handles edge case of exactly 2 minutes range', () => {
    const rangeStart = '2024-01-15T12:00:00.000Z'
    const rangeEnd = '2024-01-15T12:02:00.000Z' // exactly 2 minutes

    const result = calculateBarClickTimeRange(rangeStart, rangeEnd, clickedTime)

    expect(result.start).toBe('2024-01-15T12:29:00.000Z') // 1 minute before
    expect(result.end).toBe('2024-01-15T12:31:00.000Z') // 1 minute after
  })

  test('handles edge case of exactly 1 hour range', () => {
    const rangeStart = '2024-01-15T12:00:00.000Z'
    const rangeEnd = '2024-01-15T13:00:00.000Z' // exactly 1 hour

    const result = calculateBarClickTimeRange(rangeStart, rangeEnd, clickedTime)

    expect(result.start).toBe('2024-01-15T12:27:30.000Z') // 2.5 minutes before
    expect(result.end).toBe('2024-01-15T12:32:30.000Z') // 2.5 minutes after
  })

  test('handles edge case of exactly 12 hours range', () => {
    const rangeStart = '2024-01-15T00:00:00.000Z'
    const rangeEnd = '2024-01-15T12:00:00.000Z' // exactly 12 hours

    const result = calculateBarClickTimeRange(rangeStart, rangeEnd, clickedTime)

    expect(result.start).toBe('2024-01-15T12:00:00.000Z') // 30 minutes before
    expect(result.end).toBe('2024-01-15T13:00:00.000Z') // 30 minutes after
  })

  test('handles different clicked timestamps correctly', () => {
    const rangeStart = '2024-01-15T00:00:00.000Z'
    const rangeEnd = '2024-01-15T24:00:00.000Z' // 24 hours
    const differentClickedTime = '2024-01-15T06:15:30.000Z'

    const result = calculateBarClickTimeRange(rangeStart, rangeEnd, differentClickedTime)

    expect(result.start).toBe('2024-01-15T05:45:30.000Z') // 30 minutes before
    expect(result.end).toBe('2024-01-15T06:45:30.000Z') // 30 minutes after
  })
})
