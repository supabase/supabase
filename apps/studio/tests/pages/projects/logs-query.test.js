import { fireEvent, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import dayjs from 'dayjs'
import { get } from 'lib/common/fetch'
import { useRouter } from 'next/router'

import { useParams, IS_PLATFORM } from 'common'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { LogsExplorerPage } from 'pages/project/[ref]/logs/explorer/index'
import { clickDropdown, render } from 'tests/helpers'
import { logDataFixture } from '../../fixtures'

// [Joshen] Am temporarily commenting out the breaking tests due to:
// "TypeError: _fetch.get.mockReset is not a function" error from Jest
// just so we get our jest unit/UI tests up and running first
// Need to figure out how to mock the "get" method from lib/common/fetch properly

const defaultRouterMock = () => {
  const router = jest.fn()
  router.query = { ref: '123' }
  router.push = jest.fn()
  router.pathname = 'logs/path'
  return router
}
useRouter.mockReturnValue(defaultRouterMock())

jest.mock('common', () => ({
  IS_PLATFORM: true,
  useParams: jest.fn().mockReturnValue({}),
  useIsLoggedIn: jest.fn(),
}))
jest.mock('lib/gotrue', () => ({
  auth: { onAuthStateChange: jest.fn() },
}))

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
  // 'api/organizations'
  get.mockImplementation((url) => {
    if (url.includes('api/organizations')) {
      return [{ id: 1, slug: 'test', name: 'Test' }]
    } else if (url.includes('logs.all')) {
      return {
        result: [logDataFixture({ id: 'some-event-happened', event_message: 'something_value' })],
      }
    }
  })

  const { container } = render(<LogsExplorerPage />)
  let editor = container.querySelector('.monaco-editor')
  await waitFor(() => {
    editor = container.querySelector('.monaco-editor')
    expect(editor).toBeTruthy()
  })

  // type new query
  userEvent.type(editor, 'select \ncount(*) as my_count \nfrom edge_logs')
  await screen.findByText(/Save query/)
  const button = await screen.findByTitle('run-logs-query')
  userEvent.click(button)
  const row = await screen.findByText(/timestamp/)
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

test.skip('custom sql querying', async () => {
  get.mockImplementation((url) => {
    if (url.includes('sql=') && url.includes('select')) {
      return { result: [{ my_count: 12345 }] }
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
      // [Joshen] These expects are failing due to multiple RQ hooks on the page level
      // which I'm thinking maybe we avoid testing the entire page, but test components
      // In this case "get" has been called with /api/organizations due to useSelectedOrganizations()
      expect(get).toHaveBeenCalledWith(expect.stringContaining(encodeURI('\n')), expect.anything())
      expect(get).toHaveBeenCalledWith(expect.stringContaining('sql='), expect.anything())
      expect(get).toHaveBeenCalledWith(expect.stringContaining('select'), expect.anything())
      expect(get).toHaveBeenCalledWith(expect.stringContaining('edge_logs'), expect.anything())
      expect(get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('my_count')),
        expect.anything()
      )
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

test.skip('bug: can edit query after selecting a log', async () => {
  get.mockImplementation((url) => {
    if (url.includes('sql=') && url.includes('select') && !url.includes('limit 222')) {
      return {
        result: [{ my_count: 12345 }],
      }
    }
    return { result: [] }
  })
  const { container } = render(<LogsExplorerPage />)
  // run default query
  userEvent.click(await screen.findByText('Run'))
  const rowValue = await screen.findByText(/12345/) // row value
  // open up an show selection panel
  await userEvent.click(rowValue)
  await screen.findByText('Copy')

  // change the query
  let editor = container.querySelector('.monaco-editor')
  // type new query
  userEvent.click(editor)
  userEvent.type(editor, ' something')
  userEvent.type(editor, '\nsomething{ctrl}{enter}')
  userEvent.click(await screen.findByText('Run'))

  // [Joshen] These expects are failing due to multiple RQ hooks on the page level
  await waitFor(
    () => {
      expect(get).toHaveBeenCalledWith(
        expect.stringContaining(encodeURIComponent('something')),
        expect.anything()
      )
    },
    { timeout: 1000 }
  )

  // closes the selection panel
  await expect(screen.findByText('Copy')).rejects.toThrow()
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

test('field reference', async () => {
  render(<LogsExplorerPage />)
  userEvent.click(await screen.findByText('Field Reference'))
  await screen.findByText('metadata.request.cf.asOrganization')
})

describe.each(['free', 'pro', 'team', 'enterprise'])('upgrade modal for %s', (key) => {
  beforeEach(() => {
    useOrgSubscriptionQuery.mockReturnValue({
      data: {
        plan: {
          id: key,
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
    clickDropdown(screen.getByText('Last hour'))
    await waitFor(async () => {
      const option = await screen.findByText('Last 3 days')
      fireEvent.click(option)
    })
    // only free plan will show modal
    if (key === 'free') {
      await screen.findByText('Log retention') // assert modal title is present
    } else {
      await expect(screen.findByText('Log retention')).rejects.toThrow()
    }
  })
})
