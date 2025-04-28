import { findByText, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { useRouter } from 'next/router'
import { expect, test, vi } from 'vitest'

dayjs.extend(utc)

import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { render } from '../../helpers'

// [Joshen] There's gotta be a much better way to mock these things so that it applies for ALL tests
// Since these are easily commonly used things across all pages/components that we might be testing for
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    useParams: vi.fn().mockReturnValue({}),
    useIsLoggedIn: vi.fn(),
    isBrowser: false,
    LOCAL_STORAGE_KEYS: (actual as any).LOCAL_STORAGE_KEYS,
  }
})
vi.mock('lib/gotrue', () => ({
  auth: { onAuthStateChange: vi.fn() },
}))

test.skip('Search will trigger a log refresh', async () => {
  render(<LogsPreviewer projectRef="123" queryType="auth" />)

  await userEvent.type(screen.getByPlaceholderText(/Search events/), 'something{enter}')

  await waitFor(
    () => {
      // updates router query params
      const router = useRouter()
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: expect.any(String),
          query: expect.objectContaining({
            s: expect.stringContaining('something'),
          }),
        })
      )
    },
    { timeout: 1500 }
  )
  const table = await screen.findByRole('table')
  await findByText(table, /some-message/, { selector: '*' }, { timeout: 1500 })
})

test.skip('poll count for new messages', async () => {
  render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)
  await waitFor(() => screen.queryByText(/200/) === null)
  // should display new logs count
  await waitFor(() => screen.getByText(/999/))

  // Refresh button only exists with the queryType param, which no longer shows the id column
  await userEvent.click(screen.getByTitle('refresh'))
  await waitFor(() => screen.queryByText(/999/) === null)
  await screen.findByText(/200/)
})

test.skip('stop polling for new count on error', async () => {
  render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)
  await waitFor(() => screen.queryByText(/some-uuid123/) === null)
  // should display error
  await screen.findByText(/some logflare error/)
  // should not load refresh counts if no data from main query
  await expect(screen.findByText(/999/)).rejects.toThrowError()
})

test.skip('log event chart', async () => {
  render(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)

  await waitFor(() => screen.queryByText(/some-uuid123/) === null)
})
