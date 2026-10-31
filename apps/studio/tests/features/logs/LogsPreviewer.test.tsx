import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { beforeEach, describe, expect, test, vi } from 'vitest'

import { LOGS_API_MOCKS } from './logs.mocks'
import { LogsTableName } from '@/components/interfaces/Settings/Logs/Logs.constants'
import { calculateBarClickTimeRange } from '@/components/interfaces/Settings/Logs/LogsBarChart.utils'
import { LogsPreviewer } from '@/components/interfaces/Settings/Logs/LogsPreviewer'
import useLogsPreview from '@/hooks/analytics/useLogsPreview'
import { customRender, customRenderHook } from '@/tests/lib/custom-render'
import { addAPIMock } from '@/tests/lib/msw'

vi.mock('@/components/interfaces/Settings/Logs/LogTable', () => ({
  LogTable: ({ data }: { data: any[] }) => (
    <div data-testid="log-table-mock">
      {data.map((row) => (
        <div key={row.id} data-testid="log-row">
          {row.event_message}
        </div>
      ))}
    </div>
  ),
}))

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

vi.mock('@/lib/gotrue', async (importOriginal) => ({
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
})

test('useLogsPreview returns data from MSW', async () => {
  const { result } = customRenderHook(() =>
    useLogsPreview({
      projectRef: 'default',
      table: LogsTableName.EDGE,
    })
  )

  await waitFor(() => {
    expect(result.current.logData.length).toBeGreaterThan(0)
  })
  expect(result.current.logData).toEqual(LOGS_API_MOCKS.result)
})

test('LogsPreviewer passes API data to LogTable and offers loading older logs', async () => {
  customRender(
    <LogsPreviewer queryType="api" projectRef="default" tableName={LogsTableName.EDGE} />
  )

  const firstLogEventMessage = LOGS_API_MOCKS.result[0].event_message

  await waitFor(() => {
    expect(screen.getAllByText(firstLogEventMessage)[0]).toBeInTheDocument()
  })
  expect(await screen.findByRole('button', { name: /Load older/i })).toBeEnabled()
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

test('loads its/ite from the URL into the date picker and opens without crashing', async () => {
  const its = dayjs('2024-01-15T12:00:00.000Z')
  const ite = dayjs('2024-01-15T12:02:00.000Z')

  customRender(
    <LogsPreviewer queryType="api" projectRef="default" tableName={LogsTableName.EDGE} />,
    { nuqs: { searchParams: { its: its.toISOString(), ite: ite.toISOString() } } }
  )

  const label = `${its.format('DD MMM, HH:mm')} - ${ite.format('DD MMM, HH:mm')}`
  await userEvent.click(await screen.findByText(label))
  expect(await screen.findByText('Apply')).toBeInTheDocument()
})

describe('calculateBarClickTimeRange', () => {
  const clickedTime = '2024-01-15T12:30:00.000Z'

  test.each([
    {
      range: 'under 2 minutes uses a 15-second window',
      rangeStart: '2024-01-15T12:00:00.000Z',
      rangeEnd: '2024-01-15T12:01:30.000Z',
      start: '2024-01-15T12:29:52.500Z',
      end: '2024-01-15T12:30:07.500Z',
    },
    {
      range: 'exactly 2 minutes uses a 2-minute window',
      rangeStart: '2024-01-15T12:00:00.000Z',
      rangeEnd: '2024-01-15T12:02:00.000Z',
      start: '2024-01-15T12:29:00.000Z',
      end: '2024-01-15T12:31:00.000Z',
    },
    {
      range: 'between 2 minutes and 1 hour uses a 2-minute window',
      rangeStart: '2024-01-15T12:00:00.000Z',
      rangeEnd: '2024-01-15T12:30:00.000Z',
      start: '2024-01-15T12:29:00.000Z',
      end: '2024-01-15T12:31:00.000Z',
    },
    {
      range: 'exactly 1 hour uses a 5-minute window',
      rangeStart: '2024-01-15T12:00:00.000Z',
      rangeEnd: '2024-01-15T13:00:00.000Z',
      start: '2024-01-15T12:27:30.000Z',
      end: '2024-01-15T12:32:30.000Z',
    },
    {
      range: 'between 1 and 12 hours uses a 5-minute window',
      rangeStart: '2024-01-15T10:00:00.000Z',
      rangeEnd: '2024-01-15T14:00:00.000Z',
      start: '2024-01-15T12:27:30.000Z',
      end: '2024-01-15T12:32:30.000Z',
    },
    {
      range: 'exactly 12 hours uses a 1-hour window',
      rangeStart: '2024-01-15T00:00:00.000Z',
      rangeEnd: '2024-01-15T12:00:00.000Z',
      start: '2024-01-15T12:00:00.000Z',
      end: '2024-01-15T13:00:00.000Z',
    },
    {
      range: 'over 12 hours uses a 1-hour window',
      rangeStart: '2024-01-15T00:00:00.000Z',
      rangeEnd: '2024-01-15T24:00:00.000Z',
      start: '2024-01-15T12:00:00.000Z',
      end: '2024-01-15T13:00:00.000Z',
    },
  ])('a range $range centred on the clicked time', ({ rangeStart, rangeEnd, start, end }) => {
    expect(calculateBarClickTimeRange(rangeStart, rangeEnd, clickedTime)).toMatchObject({
      start,
      end,
    })
  })

  test('centres the window on whichever timestamp was clicked', () => {
    const result = calculateBarClickTimeRange(
      '2024-01-15T00:00:00.000Z',
      '2024-01-15T24:00:00.000Z',
      '2024-01-15T06:15:30.000Z'
    )

    expect(result).toMatchObject({
      start: '2024-01-15T05:45:30.000Z',
      end: '2024-01-15T06:45:30.000Z',
    })
  })
})
