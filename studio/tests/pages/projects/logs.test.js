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
useRouter.mockReturnValue({ query: { ref: '123', type: 'auth' } })

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

jest.mock('components/ui/Flag/Flag')
import Flag from 'components/ui/Flag/Flag'
Flag.mockImplementation(({ children }) => <>{children}</>)

import { SWRConfig } from 'swr'
jest.mock('pages/project/[ref]/settings/logs/[type]')
import { LogPage } from 'pages/project/[ref]/settings/logs/[type]'
LogPage.mockImplementation((props) => {
  const Page = jest.requireActual('pages/project/[ref]/settings/logs/[type]').LogPage
  // wrap with SWR to reset the cache each time
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      <Page {...props} />
    </SWRConfig>
  )
})

import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { getToggleByText } from '../../helpers'

beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
})
test('can display log data and metadata', async () => {
  const data = [
    {
      id: 'seome-uuid',
      timestamp: 1621323232312,
      event_message: 'some event happened',
      metadata: {
        my_key: 'something_value',
      },
    },
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
    {
      id: 'some-uuid',
      timestamp: 1621323232312,
      event_message: 'some event happened',
      metadata: {
        my_key: 'something_value',
      },
    },
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
        data: [
          {
            id: 'some-uuid',
            timestamp: 1621323232312,
            event_message: 'some event happened',
            metadata: {},
          },
        ],
      }
    }
    return { data: [] }
  })
  render(<LogPage />)

  userEvent.type(screen.getByPlaceholderText(/Search/), 'something')
  userEvent.click(screen.getByText('Go'))

  await waitFor(
    () => {
      expect(get).toHaveBeenCalledWith(expect.stringContaining('search_query'))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('something'))
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
      data: [
        {
          id: 'some-uuid',
          timestamp: 1621323232312,
          event_message: 'some event happened',
          metadata: {},
        },
      ],
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
        data: [
          {
            id: 'some-uuid',
            timestamp: 1621323232312,
            event_message: 'some event happened',
            metadata: {},
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
    },
    { timeout: 1000 }
  )

  await waitFor(() => screen.getByText(/happened/))
})

test('load older btn will fetch older logs', async () => {
  get.mockImplementation((url) => {
    if (url.includes('count')) {
      return {}
    }
    return {
      data: [
        {
          id: 'some-uuid',
          timestamp: 1621323232312,
          event_message: 'first event',
          metadata: {},
        },
      ],
    }
  })
  render(<LogPage />)
  // should display first log but not second
  await waitFor(() => screen.getByText('first event'))
  expect(() => screen.getByText('second event')).toThrow()

  get.mockResolvedValueOnce({
    data: [
      {
        id: 'some-uuid2',
        timestamp: 1621323232310,
        event_message: 'second event',
        metadata: {},
      },
    ],
  })
  // should display first and second log
  userEvent.click(screen.getByText('Load older'))
  await waitFor(() => screen.getByText('first event'))
  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(expect.stringContaining('timestamp_end=1'))
  })
  await waitFor(() => screen.getByText('second event'))
})
