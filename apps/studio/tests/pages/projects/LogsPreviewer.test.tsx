import { renderHook, screen, waitFor } from '@testing-library/react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { expect, test, vi } from 'vitest'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { customRender, customRenderHook } from 'tests/lib/custom-render'
import userEvent from '@testing-library/user-event'

import useLogsPreview from 'hooks/analytics/useLogsPreview'

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

test.skip('search loads with whatever is on the URL', async () => {
  customRender(
    <LogsPreviewer queryType="api" projectRef="default" tableName={LogsTableName.EDGE} />
  )

  await waitFor(() => {
    expect(screen.getByTestId('logs-table')).toBeInTheDocument()
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

  const loadOlder = await waitFor(() => screen.getByRole('button', { name: /Load older/i }))

  loadOlder.onclick = vi.fn()

  await userEvent.click(loadOlder)

  expect(loadOlder.onclick).toHaveBeenCalled()
})
