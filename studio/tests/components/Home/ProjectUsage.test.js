import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
jest.mock('lib/common/fetch')
import { get } from 'lib/common/fetch'

// mock the router
jest.mock('next/router')
import { useRouter } from 'next/router'
import { clickDropdown } from 'tests/helpers'
const mockPush = jest.fn()
useRouter.mockReturnValue({ query: { ref: '123' }, push: mockPush })

// need to wrap component with SWRConfig in order to clear cache between tests
// TODO: abstract out to global setup
import { SWRConfig } from 'swr'
const ProjectUsage = jest.fn()
ProjectUsage.mockImplementation((props) => {
  const Original = jest.requireActual('components/interfaces/Home/ProjectUsage').default
  // wrap with SWR to reset the cache each time
  return (
    <SWRConfig value={{ provider: () => new Map() }}>
      <Original {...props} />
    </SWRConfig>
  )
})

jest.mock('components/ui/Flag/Flag')
import Flag from 'components/ui/Flag/Flag'
Flag.mockImplementation(({ children }) => <>{children}</>)
jest.mock('hooks')
import { useFlag, useProjectSubscription } from 'hooks'
useFlag.mockReturnValue(true)
useProjectSubscription.mockReturnValue({
  subscription: undefined,
})

beforeEach(() => {
  get.mockReset()
  mockPush.mockReset()
})

const MOCK_CHART_DATA = {
  data: [
    {
      total_auth_requests: 123,
      total_realtime_requests: 223,
      total_storage_requests: 323,
      total_rest_requests: 333,
      timestamp: new Date().getTime() / 1000,
    },
  ],
  total: 123 + 223 + 323,
  totalAverage: 123 + 223 + 323,
  totalGrouped: {
    total_auth_requests: 123,
    total_realtime_requests: 223,
    total_storage_requests: 323,
    total_rest_requests: 333,
  },
}

test('mounts correctly', async () => {
  get.mockImplementation((url) => {
    if (url.includes('usage')) return {}
    if (url.includes('subscription')) return {}
    return { data: MOCK_CHART_DATA }
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
    if (url.includes('usage')) return {}
    return { data: MOCK_CHART_DATA }
  })
  render(<ProjectUsage project="12345" />)
  await waitFor(() => screen.getByText(/Statistics for past 24 hours/))
  await waitFor(() => screen.getAllByRole('button', { name: '24 hours' }))
  await waitFor(() => {
    expect(get).toHaveBeenCalledWith(expect.stringContaining('interval=hourly'))
  })
  // find button that has radix id
  const [btn] = screen.getAllByRole('button', { name: '24 hours' }).filter((e) => e.id)
  clickDropdown(btn)
  await waitFor(() => screen.getByText(/7 days/))
  await waitFor(() => screen.getByText(/60 minutes/))

  // simulate changing of dropdown
  userEvent.click(screen.getByText(/60 minutes/))
  await waitFor(() => screen.getByText(/Statistics for past 60 minutes/))
  expect(get).toHaveBeenCalledWith(expect.stringContaining('interval=minutely'))
})
