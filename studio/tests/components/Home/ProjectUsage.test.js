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
  get.mockResolvedValueOnce({
    data: { data: [{ auth: 123, realtime: 223, storage: 323 }] },
    total: 123 + 223 + 323,
    totalAverage: 123 + 223 + 323,
    totalGrouped: { auth: 123, realtime: 223, storage: 323 },
  })
  render(<ProjectUsage project="12345" />)
  await waitFor(() => screen.getByText('Statistics for past 24 hours'))
})

test.todo('dropdown options changes chart query')
