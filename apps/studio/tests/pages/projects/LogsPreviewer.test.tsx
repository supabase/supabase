import { screen, waitFor } from '@testing-library/react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { expect, test, vi } from 'vitest'
import { LogsTableName } from 'components/interfaces/Settings/Logs/Logs.constants'
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
import { customRender } from 'tests/lib/custom-render'
import userEvent from '@testing-library/user-event'

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

vi.mock('lib/gotrue', () => ({
  auth: { onAuthStateChange: vi.fn() },
}))

test('search loads with whatever is on the URL', async () => {
  customRender(
    <LogsPreviewer queryType="api" projectRef="default" tableName={LogsTableName.EDGE} />
  )
})

// sanity check to make sure msw is working
test('logs tests load with msw data', async () => {
  customRender(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)

  // wait 3 seconds
  await new Promise((resolve) => setTimeout(resolve, 3000))

  expect(await screen.findByText('event message test')).toBeInTheDocument()
})

test.skip('can toggle log event chart', async () => {
  customRender(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)

  // wait for the logs to load first
  await waitFor(() => {
    expect(screen.getByTestId('logs-bar-chart')).toBeInTheDocument()
  })

  const toggle = screen.getByRole('button', { name: /Chart/i })
  await userEvent.click(toggle)

  await waitFor(() => {
    expect(screen.getByTestId('logs-bar-chart')).not.toBeInTheDocument()
  })

  await userEvent.click(toggle)

  await waitFor(() => {
    expect(screen.getByTestId('logs-bar-chart')).toBeInTheDocument()
  })
})

test.skip('can write on the search bar', async () => {
  customRender(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)

  const searchBar = screen.getByPlaceholderText(/Search/i)

  await userEvent.type(searchBar, 'test')

  expect(searchBar).toHaveValue('test')
})

test.skip('can click load more', async () => {
  customRender(<LogsPreviewer queryType="api" projectRef="123" tableName={LogsTableName.EDGE} />)

  const loadMore = screen.getByRole('button', { name: /Load more/i })

  await userEvent.click(loadMore)

  expect(loadMore).toHaveBeenCalled()
})
