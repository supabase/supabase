// mock the fetch function
jest.mock('lib/common/fetch')
import { get } from 'lib/common/fetch'

// mock the settings layout
jest.mock('components/layouts', () => ({
  LogsExplorerLayout: jest.fn().mockImplementation(({ children }) => <div>{children}</div>),
}))

// mock mobx
jest.mock('mobx-react-lite')
import { observer } from 'mobx-react-lite'
observer.mockImplementation((v) => v)

// mock the router
jest.mock('next/router')
import { useRouter } from 'next/router'
const defaultRouterMock = () => {
  const router = jest.fn()
  router.query = { ref: '123' }
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
import { useStore, useFlag } from 'hooks'
useFlag.mockReturnValue(true)
useStore.mockImplementation(() => ({
  ui: { profile: { id: 1 } },
  content: {
    addRecentLogSqlSnippet: jest.fn(),
  },
}))

jest.mock('hooks')
import { useProjectSubscription } from 'hooks'
useProjectSubscription = jest.fn((ref) => ({
  subscription: {
    tier: {
      supabase_prod_id: 'tier_free',
    },
  },
}))

import { SWRConfig } from 'swr'
import { LogsExplorerPage as Page } from 'pages/project/[ref]/logs-explorer/index'
const LogsExplorerPage = (props) => (
  <SWRConfig
    value={{
      provider: () => new Map(),
      shouldRetryOnError: false,
    }}
  >
    <Page {...props} />
  </SWRConfig>
)

import { render, fireEvent, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { logDataFixture } from '../../fixtures'
import { clickDropdown } from 'tests/helpers'
import dayjs from 'dayjs'
beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  useRouter.mockReset()
  useRouter.mockReturnValue(defaultRouterMock())
})
test('can display log data', async () => {
  get.mockResolvedValue({
    result: [
      logDataFixture({
        id: 'some-event-happened',
        metadata: {
          my_key: 'something_value',
        },
      }),
    ],
  })
  const { container } = render(<LogsExplorerPage />)
  let editor = container.querySelector('.monaco-editor')
  await waitFor(() => {
    editor = container.querySelector('.monaco-editor')
    expect(editor).toBeTruthy()
  })
  // type new query
  userEvent.type(editor, 'select \ncount(*) as my_count \nfrom edge_logs')

  userEvent.click(await screen.findByText(/Run/))
  const row = await screen.findByText('some-event-happened')
  userEvent.click(row)
  await screen.findByText(/something_value/)
})

test('q= query param will populate the query input', async () => {
  const router = defaultRouterMock()
  router.query = { ...router.query, type: 'api', q: 'some_query' }
  useRouter.mockReturnValue(router)
  render(<LogsExplorerPage />)
  // should populate editor with the query param
  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(expect.stringContaining('sql=some_query'))
  })
})

test('ite= and its= query param will populate the datepicker', async () => {
  const router = defaultRouterMock()
  const start = dayjs().subtract(1, 'day')
  const end = dayjs()
  router.query = {
    ...router.query,
    type: 'api',
    q: 'some_query',
    its: start.toISOString(),
    ite: end.toISOString(),
  }
  useRouter.mockReturnValue(router)
  render(<LogsExplorerPage />)
  // should populate editor with the query param
  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(start.toISOString()))
    )
    expect(get).toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent(end.toISOString())))
  })
})

test('custom sql querying', async () => {
  get.mockImplementation((url) => {
    if (url.includes('sql=') && url.includes('select')) {
      return {
        result: [
          {
            my_count: 12345,
          },
        ],
      }
    }
    return { result: [] }
  })
  const { container } = render(<LogsExplorerPage />)
  let editor = container.querySelector('.monaco-editor')
  expect(editor).toBeTruthy()

  // type into the query editor
  await waitFor(() => {
    editor = container.querySelector('.monaco-editor')
    expect(editor).toBeTruthy()
  })
  editor = container.querySelector('.monaco-editor')
  // type new query
  userEvent.type(editor, 'select \ncount(*) as my_count \nfrom edge_logs')

  // run query by button
  userEvent.click(await screen.findByText('Run'))

  // run query by editor
  userEvent.type(editor, '\nlimit 123{ctrl}{enter}')
  await waitFor(
    () => {
      expect(get).toHaveBeenCalledWith(expect.stringContaining(encodeURI('\n')))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('sql='))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('select'))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('edge_logs'))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('iso_timestamp_start'))
      expect(get).not.toHaveBeenCalledWith(expect.stringContaining('iso_timestamp_end')) // should not have an end date
      expect(get).not.toHaveBeenCalledWith(expect.stringContaining('where'))
      expect(get).not.toHaveBeenCalledWith(expect.stringContaining(encodeURIComponent('limit 123')))
    },
    { timeout: 1000 }
  )

  await screen.findByText(/my_count/) //column header
  const rowValue = await screen.findByText(/12345/) // row value

  // clicking on the row value should not show log selection panel
  userEvent.click(rowValue)
  await expect(screen.findByText(/Metadata/)).rejects.toThrow()

  // should not see chronological features
  await expect(screen.findByText(/Load older/)).rejects.toThrow()
})

test('datepicker interaction updates query params', async () => {
  render(<LogsExplorerPage />)
  clickDropdown(await screen.findByText(/Last day/))
  userEvent.click(await screen.findByText(/Last 3 days/))

  const router = useRouter()
  expect(router.push).toBeCalledWith(
    expect.objectContaining({
      query: expect.objectContaining({
        its: expect.any(String),
      }),
    })
  )
})

test('query warnings', async () => {
  const router = defaultRouterMock()
  router.query = {
    ...router.query,
    q: 'some_query',
    its: dayjs().subtract(10, 'days').toISOString(),
    ite: dayjs().toISOString(),
  }
  useRouter.mockReturnValue(router)
  render(<LogsExplorerPage />)
  await screen.findByText('1 warning')
})
