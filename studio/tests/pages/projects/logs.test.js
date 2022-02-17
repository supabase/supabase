// mock the fetch function
jest.mock('lib/common/fetch')
import { get } from 'lib/common/fetch'

// mock the settings layout
jest.mock('components/layouts', () => ({
  SettingsLayout: jest.fn().mockImplementation(({ children }) => <div>{children}</div>),
}))

// mock mobx
jest.mock('mobx-react-lite')
import { observer } from 'mobx-react-lite'
observer.mockImplementation((v) => v)

// mock the router
jest.mock('next/router')
import { useRouter } from 'next/router'
const router = jest.fn()
router.query = { ref: '123', type: 'auth' }
router.push = jest.fn()
router.pathname = 'logs/path'
useRouter.mockReturnValue(router)

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
jest.mock('pages/project/[ref]/settings/logs/[type]')
import { LogPage } from 'pages/project/[ref]/settings/logs/[type]'
LogPage.mockImplementation((props) => {
  const Page = jest.requireActual('pages/project/[ref]/settings/logs/[type]').LogPage
  // wrap with SWR to reset the cache each time
  return (
    <SWRConfig
      value={{
        provider: () => new Map(),
        shouldRetryOnError: false,
      }}
    >
      <Page {...props} />
    </SWRConfig>
  )
})

import { render, fireEvent, waitFor, screen, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { clickDropdown, getToggleByText } from '../../helpers'
import { wait } from '@testing-library/user-event/dist/utils'
import { find } from 'lodash'
import { logDataFixture } from '../../fixtures'
beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
})
test('can display log data and metadata', async () => {
  const data = [
    logDataFixture({
      event_message: 'some event happened',
      metadata: {
        my_key: 'something_value',
      },
    }),
  ]
  get.mockResolvedValue({ data })
  render(<LogPage />)

  await waitFor(() => screen.getByText(/happened/))
  const row = screen.getByText(/happened/)
  fireEvent.click(row)
  await waitFor(() => screen.getByText(/my_key/))
  await waitFor(() => screen.getByText(/something_value/))
})

test('Refreshpage', async () => {
  const data = [
    logDataFixture({
      event_message: 'some event happened',
      metadata: {
        my_key: 'something_value',
      },
    }),
  ]
  get.mockImplementation((url) => {
    if (url.includes('count')) return { count: 0 }
    return { data }
  })
  render(<LogPage />)
  await waitFor(() => screen.getByText(/happened/))
  get.mockResolvedValueOnce({ data: [] })
  const row = screen.getByText(/happened/)
  fireEvent.click(row)
  await waitFor(() => screen.getByText(/my_key/))

  // simulate refresh
  userEvent.click(screen.getByText(/Refresh/))
  // when log line unmounts and it was focused, should close focus panel
  await waitFor(() => screen.queryByText(/my_key/) === null, { timeout: 1000 })
  await waitFor(() => screen.queryByText(/happened/) === null, { timeout: 1000 })
})

test('Search will trigger a log refresh', async () => {
  get.mockImplementation((url) => {
    if (url.includes('search_query') && url.includes('something')) {
      return {
        data: [logDataFixture({ event_message: 'some event happened' })],
      }
    }
    return { data: [] }
  })
  render(<LogPage />)

  userEvent.type(screen.getByPlaceholderText(/Search/), 'something')
  userEvent.click(screen.getByTitle('Go'))

  await waitFor(
    () => {
      expect(get).toHaveBeenCalledWith(expect.stringContaining('search_query'))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('something'))

      // updates router query params
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

  await waitFor(() => screen.getByText(/happened/), { timeout: 1000 })
})

test('poll count for new messages', async () => {
  get.mockImplementation((url) => {
    if (url.includes('count')) {
      return { data: [{ count: 125 }] }
    }
    return {
      data: [logDataFixture({ event_message: 'something happened' })],
    }
  })
  render(<LogPage />)
  await waitFor(() => screen.queryByText(/happened/) === null)
  // should display new logs count
  await waitFor(() => screen.getByText(/125/))

  userEvent.click(screen.getByText(/Refresh/))
  await waitFor(() => screen.queryByText(/125/) === null)
  await waitFor(() => screen.getByText(/happened/))
})

test('where clause will trigger a log refresh', async () => {
  get.mockImplementation((url) => {
    if (url.includes('where') && url.includes('something')) {
      return {
        data: [logDataFixture({ event_message: 'some event happened' })],
      }
    }
    return { data: [] }
  })
  const { container } = render(<LogPage />)
  // fill search bar with some value, should be ignored when in custom mode
  userEvent.type(screen.getByPlaceholderText(/Search/), 'search_value')
  userEvent.click(screen.getByTitle('Go'))
  // clear mock calls, for clean assertions
  get.mockClear()

  let editor = container.querySelector('.monaco-editor')
  expect(editor).toBeFalsy()
  // TODO: abstract this out into a toggle selection helper
  const toggle = getToggleByText(/via query/)
  expect(toggle).toBeTruthy()
  userEvent.click(toggle)
  await waitFor(() => {
    editor = container.querySelector('.monaco-editor')
    expect(editor).toBeTruthy()
  })
  editor = container.querySelector('.monaco-editor')
  userEvent.type(editor, 'metadata.field = something')
  userEvent.click(screen.getByText('Run'))
  await waitFor(
    () => {
      expect(get).toHaveBeenCalledWith(expect.stringContaining('where'))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('metadata.field'))

      // updates router query params
      expect(router.push).toHaveBeenCalledWith(
        expect.objectContaining({
          pathname: expect.any(String),
          query: expect.objectContaining({
            q: expect.stringContaining('something'),
          }),
        })
      )

      // should ignore search bar value
      expect(get).not.toHaveBeenCalledWith(expect.stringContaining('search_value'))
    },
    { timeout: 1000 }
  )

  await waitFor(() => screen.getByText(/happened/))
})

test('s= query param will populate the search bar', async () => {
  useRouter.mockReturnValueOnce({
    query: { ref: '123', type: 'api', s: 'someSearch' },
    push: jest.fn(),
  })
  render(<LogPage />)
  // should populate search input with the search param
  screen.getByDisplayValue('someSearch')
  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(expect.stringContaining('search_query=someSearch'))
  })
})

test('q= query param will populate the query input', async () => {
  useRouter.mockReturnValueOnce({
    query: { ref: '123', type: 'api', q: 'some_query', s: 'someSearch' },
    push: jest.fn(),
  })
  render(<LogPage />)
  // should populate editor with the query param
  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(expect.stringContaining('where=some_query'))
  })

  // query takes precedence of search queryparam
  expect(() => !screen.queryByDisplayValue(/someSearch/))
})

test('te= query param will populate the timestamp from input', async () => {
  // get time 20 mins before
  const newDate = new Date()
  newDate.setMinutes(new Date().getMinutes() - 20)
  const isoString = newDate.toISOString()
  const unixMicro = newDate.getTime() * 1000 //microseconds

  useRouter.mockReturnValueOnce({
    query: { ref: '123', type: 'api', te: unixMicro },
    push: jest.fn(),
  })
  render(<LogPage />)

  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining(`timestamp_end=${encodeURIComponent(unixMicro)}`)
    )
  })
  userEvent.click(await screen.findByText('Custom'))
  await screen.findByDisplayValue(isoString)
})
test('custom sql querying', async () => {
  get.mockImplementation((url) => {
    if (url.includes('sql=') && url.includes('select')) {
      return {
        data: [
          {
            my_count: 12345,
          },
        ],
      }
    }
    return { data: [] }
  })
  const { container } = render(<LogPage />)
  let editor = container.querySelector('.monaco-editor')
  expect(editor).toBeFalsy()
  // TODO: abstract this out into a toggle selection helper
  const toggle = getToggleByText(/via query/)
  expect(toggle).toBeTruthy()
  userEvent.click(toggle)

  // type into the query editor
  await waitFor(() => {
    editor = container.querySelector('.monaco-editor')
    expect(editor).toBeTruthy()
  })
  editor = container.querySelector('.monaco-editor')
  userEvent.type(editor, 'select \ncount(*) as my_count \nfrom edge_logs')
  // should show sandbox warning alert
  await waitFor(() => screen.getByText(/restricted to a 7 day querying window/))

  // should trigger query
  userEvent.click(screen.getByText('Run'))
  await waitFor(
    () => {
      expect(get).not.toHaveBeenCalledWith(expect.stringContaining(encodeURI('\n')))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('sql='))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('select'))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('edge_logs'))
      expect(get).not.toHaveBeenCalledWith(expect.stringContaining('where'))
    },
    { timeout: 1000 }
  )

  await waitFor(() => screen.getByText(/my_count/)) //column header
  await waitFor(() => screen.getByText(/12345/)) // row value

  // clicking on the row value should not show log selection panel
  userEvent.click(screen.getByText(/12345/))
  await expect(screen.findByText(/Metadata/)).rejects.toThrow()

  // should not see chronological features
  await expect(screen.findByText(/Load older/)).rejects.toThrow()
})

test('load older btn will fetch older logs', async () => {
  get.mockImplementation((url) => {
    if (url.includes('count')) {
      return {}
    }
    return {
      data: [logDataFixture({ event_message: 'first event' })],
    }
  })
  render(<LogPage />)
  // should display first log but not second
  await waitFor(() => screen.getByText('first event'))
  expect(() => screen.getByText('second event')).toThrow()

  get.mockResolvedValueOnce({
    data: [logDataFixture({ event_message: 'second event' })],
  })
  // should display first and second log
  userEvent.click(screen.getByText('Load older'))
  await waitFor(() => screen.getByText('first event'))
  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(expect.stringContaining('timestamp_end=1'))
  })
  await waitFor(() => screen.getByText('second event'))
})

test('bug: load older btn does not error out when previous page is empty', async () => {
  // bugfix for https://sentry.io/organizations/supabase/issues/2903331460/?project=5459134&referrer=slack
  get.mockImplementation((url) => {
    if (url.includes('count')) {
      return {}
    }
    return { data: [] }
  })
  render(<LogPage />)

  userEvent.click(screen.getByText('Load older'))
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
  render(<LogPage />)
  await screen.findByText('Events')
  const toggle = getToggleByText(/Show event chart/)
  userEvent.click(toggle)
  await expect(screen.findByText('Events')).rejects.toThrow()
})
