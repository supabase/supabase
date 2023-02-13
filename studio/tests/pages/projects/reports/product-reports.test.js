import { get, post } from 'lib/common/fetch'
import { render } from '../../../helpers'
import { fireEvent, waitFor, screen } from '@testing-library/react'
import { ApiReport } from 'pages/project/[ref]/reports/api-overview'
import { AuthReport } from 'pages/project/[ref]/reports/auth'
import userEvent from '@testing-library/user-event'
import { StorageReport } from 'pages/project/[ref]/reports/storage'

beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  post.mockReset()
  get.mockImplementation(async (_url) => [{ data: [] }])
  post.mockResolvedValue([])
})

describe.each([
  { Page: ApiReport, contains: ['API'] },
  { Page: AuthReport, contains: ['Auth'] },
  { Page: StorageReport, contains: ['Storage'] },
])('$Page rendering', ({ Page, contains }) => {
  test(`contains ${contains}`, async () => {
    render(<Page />)
    contains.forEach((word) => {
      expect(screen.findByText(word)).resolves.toBeTruthy()
    })
  })
  test('static elements', async () => {
    render(<Page />)
    await screen.findByText(/Last 7 days/)
    await screen.findAllByText(/Refresh/)
  })

  test('changing date range triggers query refresh', async () => {
    render(<Page />)
    await waitFor(() => expect(get).toBeCalled())
    get.mockReset()
    const refresh = await screen.findByText(/Refresh/)
    fireEvent.click(refresh)
    const calls = get.mock.calls.concat(post.mock.calls)
    expect(calls.length).toBeGreaterThan(0)
  })
})
