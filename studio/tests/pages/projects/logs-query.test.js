import { get } from 'lib/common/fetch'
import { useRouter } from 'next/router'
import { LogsExplorerPage } from 'pages/project/[ref]/logs/explorer/index'
import { render } from 'tests/helpers'
import { waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { logDataFixture } from '../../fixtures'
import { clickDropdown } from 'tests/helpers'
import dayjs from 'dayjs'
import { useProjectSubscriptionQuery } from 'data/subscriptions/project-subscription-query'
import { useParams } from 'hooks'

const defaultRouterMock = () => {
  const router = jest.fn()
  router.query = { ref: '123' }
  router.push = jest.fn()
  router.pathname = 'logs/path'
  return router
}

beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  useRouter.mockReset()
  const routerReturnValue = defaultRouterMock()
  useRouter.mockReturnValue(routerReturnValue)

  useParams.mockReset()
  useParams.mockReturnValue(routerReturnValue.query)
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
  useParams.mockReturnValue(router.query)
  render(<LogsExplorerPage />)
  // should populate editor with the query param
  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(expect.stringContaining('sql=some_query'), expect.anything())
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
  useParams.mockReturnValue(router.query)
  render(<LogsExplorerPage />)
  // should populate editor with the query param
  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(start.toISOString())),
      expect.anything()
    )
    expect(get).toHaveBeenCalledWith(
      expect.stringContaining(encodeURIComponent(end.toISOString())),
      expect.anything()
    )
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
      expect(get).toHaveBeenCalledWith(expect.stringContaining(encodeURI('\n')), expect.anything())
      expect(get).toHaveBeenCalledWith(expect.stringContaining('sql='), expect.anything())
      expect(get).toHaveBeenCalledWith(expect.stringContaining('select'), expect.anything())
      expect(get).toHaveBeenCalledWith(expect.stringContaining('edge_logs'), expect.anything())
      expect(get).toHaveBeenCalledWith(
        expect.stringContaining('iso_timestamp_start'),
        expect.anything()
      )
      expect(get).not.toHaveBeenCalledWith(
        expect.stringContaining('iso_timestamp_end'),
        expect.anything()
      ) // should not have an end date
      expect(get).not.toHaveBeenCalledWith(expect.stringContaining('where'), expect.anything())
      expect(get).not.toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('limit 123')),
        expect.anything()
      )
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

test('query warnings', async () => {
  const router = defaultRouterMock()
  router.query = {
    ...router.query,
    q: 'some_query',
    its: dayjs().subtract(10, 'days').toISOString(),
    ite: dayjs().toISOString(),
  }
  useRouter.mockReturnValue(router)
  useParams.mockReturnValue(router.query)
  render(<LogsExplorerPage />)
  await screen.findByText('1 warning')
})

describe.each(['FREE', 'PRO', 'TEAM', 'ENTERPRISE'])('upgrade modal for %s', (key) => {
  beforeEach(() => {
    useProjectSubscriptionQuery.mockReturnValue({
      data: {
        tier: {
          supabase_prod_id: `tier_${key.toLocaleLowerCase()}`,
          key,
        },
      },
    })
  })
  test('based on query params', async () => {
    const router = defaultRouterMock()
    router.query = {
      ...router.query,
      q: 'some_query',
      its: dayjs().subtract(5, 'month').toISOString(),
      ite: dayjs().toISOString(),
    }
    useRouter.mockReturnValue(router)
    useParams.mockReturnValue(router.query)
    render(<LogsExplorerPage />)
    await screen.findByText(/Log retention/) // assert modal title is present
  })

  test('based on datepicker helpers', async () => {
    render(<LogsExplorerPage />)
    // click on the dropdown
    clickDropdown(await screen.findByText('Last 24 hours'))
    userEvent.click(await screen.findByText('Last 3 days'))

    // only free tier will show modal
    if (key === 'FREE') {
      await screen.findByText('Log retention') // assert modal title is present
    } else {
      await expect(screen.findByText('Log retention')).rejects.toThrow()
    }
  })
})
