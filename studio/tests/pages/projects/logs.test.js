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

import { LogPage } from 'pages/project/[ref]/settings/logs/[type]'
import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {getToggleByText} from "../../helpers"

beforeEach(() => {
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

test('Refresh', async () => {
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
  get.mockResolvedValueOnce({ data }).mockResolvedValueOnce({ data: [] })
  render(<LogPage />)

  const row = screen.getByText(/happened/)
  fireEvent.click(row)
  await waitFor(() => screen.getByText(/my_key/))

  // simulate refresh
  await waitFor(() => userEvent.click(screen.getByText(/Refresh/)))
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
  await waitFor(
    () => {
      expect(get).toHaveBeenCalledWith(expect.stringContaining('where'))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('metadata.field'))
    },
    { timeout: 1000 }
  )

  await waitFor(() => screen.getByText(/happened/))
})
