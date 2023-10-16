import { waitFor, screen } from '@testing-library/react'
import { clickDropdown, render } from '../../helpers'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { get } from 'lib/common/fetch'
import useFillTimeseriesSorted from 'hooks/analytics/useFillTimeseriesSorted'

// TODO: abstract out to global setup
const ProjectUsage = jest.fn()
ProjectUsage.mockImplementation((props) => {
  const Original = jest.requireActual('components/interfaces/Home/ProjectUsage').default

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      // ✅ no more errors on the console for tests
      error: process.env.NODE_ENV === 'test' ? () => {} : console.error,
    },
  })

  // wrap with QueryClient to reset the cache each time
  return (
    <QueryClientProvider client={queryClient}>
      <Original {...props} />
    </QueryClientProvider>
  )
})

jest.mock('data/subscriptions/project-subscription-v2-query')
import { useProjectSubscriptionV2Query } from 'data/subscriptions/project-subscription-v2-query'
import { useIsFeatureEnabled } from 'hooks'

beforeEach(() => {
  useIsFeatureEnabled.mockReset()
  useIsFeatureEnabled.mockReturnValue({
    projectAuthAll: true,
    projectStorageAll: true,
  })
})

useProjectSubscriptionV2Query.mockReturnValue({
  data: undefined,
})

beforeEach(() => {
  get.mockReset()
})

const MOCK_CHART_DATA = {
  result: [
    {
      total_auth_requests: 123,
      total_realtime_requests: 223,
      total_storage_requests: 323,
      total_rest_requests: 333,
      timestamp: new Date().toISOString(),
    },
  ],
}

// This hook is globally mocked, so you don't need to call `jest.mock` first - but the tests
// for this component need this mock data returned
useFillTimeseriesSorted.mockReturnValue(MOCK_CHART_DATA.result)

test('mounts correctly', async () => {
  get.mockImplementation((url) => {
    if (decodeURIComponent(url).includes('usage.api-counts')) {
      return MOCK_CHART_DATA
    }
    return {}
  })
  render(<ProjectUsage project="12345" />)
  await waitFor(() => screen.getByText(/Statistics for past 24 hours/))
  await waitFor(() => screen.getByText(/123/))
  await waitFor(() => screen.getByText(/223/))
  await waitFor(() => screen.getByText(/323/))
  await waitFor(() => screen.getByText(/333/))
})

test('dropdown options changes chart query', async () => {
  get.mockImplementation((url) => {
    if (decodeURIComponent(url).includes('usage.api-counts')) {
      return MOCK_CHART_DATA
    }
    return {}
  })
  render(<ProjectUsage project="12345" />)
  await waitFor(() => screen.getByText(/Statistics for past 24 hours/))
  await waitFor(() => screen.getAllByRole('button', { name: '24 hours' }))
  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(expect.stringContaining('interval=hourly'), expect.anything())
  })
  // find button that has radix id
  const [btn] = screen.getAllByRole('button', { name: '24 hours' }).filter((e) => e.id)
  clickDropdown(btn)
  await waitFor(() => screen.getByText(/7 days/))
  await waitFor(() => screen.getByText(/60 minutes/))

  // simulate changing of dropdown
  userEvent.click(screen.getByText(/60 minutes/))
  await waitFor(() => screen.getByText(/Statistics for past 60 minutes/))
  expect(get).toHaveBeenCalledWith(expect.stringContaining('interval=minutely'), expect.anything())
})
