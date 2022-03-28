// mock the fetch function
jest.mock('lib/common/fetch')
import { get } from 'lib/common/fetch'

// mock mobx
jest.mock('mobx-react-lite')
import { observer } from 'mobx-react-lite'
observer.mockImplementation((v) => v)

// mock the router
jest.mock('next/router')
import { useRouter } from 'next/router'
const defaultRouterMock = () => {
  const router = jest.fn()
  router.query = {}
  router.push = jest.fn()
  router.pathname = 'logs/path'
  return router
}
useRouter.mockReturnValue(defaultRouterMock())

// mock monaco editor
jest.mock('@monaco-editor/react')
import Editor, { useMonaco } from '@monaco-editor/react'
Editor = jest.fn()
Editor.mockImplementation((props) => {
  return (
    <textarea className="monaco-editor" onChange={(e) => props.onChange(e.target.value)}></textarea>
  )
})
useMonaco.mockImplementation((v) => v)

// mock usage flags
jest.mock('components/ui/Flag/Flag')
import Flag from 'components/ui/Flag/Flag'
Flag.mockImplementation(({ children }) => <>{children}</>)
jest.mock('hooks')
import { useFlag } from 'hooks'
useFlag.mockReturnValue(true)

import { SWRConfig } from 'swr'
jest.mock('components/interfaces/Settings/Logs/LogsPreviewer')
import LogsPreviewer from 'components/interfaces/Settings/Logs/LogsPreviewer'
LogsPreviewer.mockImplementation((props) => {
  const Comp = jest.requireActual('components/interfaces/Settings/Logs/LogsPreviewer').default
  // wrap with SWR to reset the cache each time
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        shouldRetryOnError: false,
      }}
    >
      <Comp {...props} />
    </SWRConfig>
  )
})

import { render, fireEvent, waitFor, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getToggleByText } from '../../helpers'
import { wait } from '@testing-library/user-event/dist/utils'
import { logDataFixture } from '../../fixtures'
import { LogsTableName } from 'components/interfaces/Settings/Logs'
beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  useRouter.mockReset()
  useRouter.mockReturnValue(defaultRouterMock())
})
test('can display log data and metadata', async () => {
  get.mockResolvedValue({
    result: [
      logDataFixture({
        id: 'some-event-happened-id',
        metadata: {
          my_key: 'something_value',
        },
      }),
    ],
  })
  render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)
  fireEvent.click(await screen.findByText(/some-event-happened-id/))
  await screen.findByText(/my_key/)
  await screen.findByText(/something_value/)
})

test('Refresh page', async () => {
  get.mockImplementation((url) => {
    if (url.includes('count')) return { result: { count: 0 } }
    return {
      result: [
        logDataFixture({
          id: 'some-event-id',
          metadata: { my_key: 'something_value' },
        }),
      ],
    }
  })
  render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)

  const row = await screen.findByText(/some-event-id/)
  fireEvent.click(row)
  await screen.findByText(/my_key/)
})

test('Search will trigger a log refresh', async () => {
  get.mockImplementation((url) => {
    if (url.includes('something')) {
      return {
        result: [logDataFixture({ id: 'some-event-id' })],
      }
    }
    return { result: [] }
  })
  render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)

  userEvent.type(screen.getByPlaceholderText(/Search events/), 'something{enter}')

  await waitFor(
    () => {
      expect(get).toHaveBeenCalledWith(expect.stringContaining('something'))

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
  await screen.findByText(/some-event-id/)
})

test('poll count for new messages', async () => {
  get.mockImplementation((url) => {
    if (url.includes('count')) {
      return { result: [{ count: 125 }] }
    }
    return {
      result: [logDataFixture({ id: 'some-uuid123' })],
    }
  })
  render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)
  await waitFor(() => screen.queryByText(/some-uuid123/) === null)
  // should display new logs count
  await waitFor(() => screen.getByText(/125/))

  userEvent.click(screen.getByText(/Refresh/))
  await waitFor(() => screen.queryByText(/125/) === null)
  await screen.findByText(/some-uuid123/)
})

test('s= query param will populate the search bar', async () => {
  const router = defaultRouterMock()
  router.query = { ...router.query, s: 'someSearch' }
  useRouter.mockReturnValue(router)
  render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)
  // should populate search input with the search param
  await screen.findByDisplayValue('someSearch')
  expect(get).toHaveBeenCalledWith(expect.stringContaining('someSearch'))
})

test('te= query param will populate the timestamp to input', async () => {
  // get time 20 mins before
  const newDate = new Date()
  newDate.setMinutes(new Date().getMinutes() - 20)
  const isoString = newDate.toISOString()
  const unixMicro = newDate.getTime() * 1000 //microseconds
  const router = defaultRouterMock()
  router.query = { ...router.query, te: unixMicro }
  useRouter.mockReturnValue(router)
  render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)

  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining(`timestamp_end=${encodeURIComponent(unixMicro)}`)
    )
  })
  userEvent.click(await screen.findByText('Custom'))
  expect(get).toHaveBeenCalledWith(expect.stringContaining('timestamp_end=' + unixMicro))
})
test('ts= query param will populate the timestamp from input', async () => {
  // get time 20 mins before
  const newDate = new Date()
  newDate.setMinutes(new Date().getMinutes() - 20)
  const unixMicro = newDate.getTime() * 1000 //microseconds
  const router = defaultRouterMock()
  router.query = { ...router.query, ts: unixMicro }
  useRouter.mockReturnValue(router)
  render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)

  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining(`timestamp_start=${encodeURIComponent(unixMicro)}`)
    )
  })
  userEvent.click(await screen.findByText('Custom'))
  await screen.findByText(new RegExp(newDate.getFullYear()))
  await screen.findByText(/Apply/)
  expect(get).toHaveBeenCalledWith(expect.stringContaining('timestamp_start=' + unixMicro))
})

test('load older btn will fetch older logs', async () => {
  get.mockImplementation((url) => {
    if (url.includes('count')) {
      return {}
    }
    return {
      result: [logDataFixture({ id: 'first event' })],
    }
  })
  render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)
  // should display first log but not second
  await waitFor(() => screen.getByText('first event'))
  await expect(screen.findByText('second event')).rejects.toThrow()

  get.mockResolvedValueOnce({
    result: [logDataFixture({ id: 'second event' })],
  })
  // should display first and second log
  userEvent.click(await screen.findByText('Load older'))
  await screen.findByText('first event')
  await screen.findByText('second event')
  expect(get).toHaveBeenCalledWith(expect.stringContaining('timestamp_end='))
})

test('bug: load older btn does not error out when previous page is empty', async () => {
  // bugfix for https://sentry.io/organizations/supabase/issues/2903331460/?project=5459134&referrer=slack
  get.mockImplementation((url) => {
    if (url.includes('count')) {
      return {}
    }
    return { result: [] }
  })
  render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)

  userEvent.click(await screen.findByText('Load older'))
  // NOTE: potential race condition, since we are asserting that something DOES NOT EXIST
  // wait for 500s to make sure all ui logic is complete
  // need to wrap in act because internal react state is changing during this time.
  await act(async () => await wait(100))

  // clicking load older multiple times should not give error
  await waitFor(() => {
    expect(screen.queryByText(/Sorry/)).toBeNull()
    expect(screen.queryByText(/An error occured/)).toBeNull()
    expect(screen.queryByText(/undefined/)).toBeNull()
  })
})

test('log event chart hide', async () => {
  render(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)
  await screen.findByText('Events')
  const toggle = await screen.findByText(/Event chart/)
  userEvent.click(toggle)
  await expect(screen.findByText('Events')).rejects.toThrow()
})

test('bug: nav backwards with params change results in ui changing', async () => {
  // bugfix for https://sentry.io/organizations/supabase/issues/2903331460/?project=5459134&referrer=slack
  get.mockImplementation((url) => {
    if (url.includes('count')) {
      return {}
    }
    return { data: [] }
  })
  const { container, rerender } = render(
    <LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />
  )

  await expect(screen.findByDisplayValue('simple-query')).rejects.toThrow()

  const router = defaultRouterMock()
  router.query = { ...router.query, s: 'simple-query' }
  useRouter.mockReturnValue(router)
  rerender(<LogsPreviewer projectRef="123" tableName={LogsTableName.EDGE} />)

  await screen.findByDisplayValue('simple-query')
})
