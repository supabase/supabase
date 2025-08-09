import { screen, waitFor } from '@testing-library/react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { beforeEach, expect, test, vi } from 'vitest'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
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
