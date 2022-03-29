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
import { useFlag } from 'hooks'
useFlag.mockReturnValue(true)

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
  render(<LogsExplorerPage />)
  fireEvent.click(await screen.findByText(/some-event-happened/))
  await screen.findByText(/my_key/)
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

  // should trigger query
  userEvent.click(await screen.findByText('Run'))
  await waitFor(
    () => {
      expect(get).toHaveBeenCalledWith(expect.stringContaining(encodeURI('\n')))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('sql='))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('select'))
      expect(get).toHaveBeenCalledWith(expect.stringContaining('edge_logs'))
      expect(get).not.toHaveBeenCalledWith(expect.stringContaining('where'))
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
