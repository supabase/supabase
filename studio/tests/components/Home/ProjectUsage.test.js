import ProjectUsage from 'components/interfaces/Home/ProjectUsage'
import { render, waitFor, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
jest.mock('lib/common/fetch')
import { get } from 'lib/common/fetch'

// mock the router
jest.mock('next/router')
import { useRouter } from 'next/router'
useRouter.mockReturnValue({ query: { ref: '123' } })

beforeEach(() => {
  get.mockReset()
})

test('mounts correctly', async () => {
  get.mockImplementation((url) => {
    if (url.includes('usage')) return {}
    return {
      data: {
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
      },
    }
  })
  render(<ProjectUsage project="12345" />)
  await waitFor(() => screen.getByText('Statistics for past 24 hours'))
  await waitFor(() => screen.getByText(/123/))
  await waitFor(() => screen.getByText(/223/))
  await waitFor(() => screen.getByText(/323/))
  await waitFor(() => screen.getByText(/333/))
})

test.todo('dropdown options changes chart query')
