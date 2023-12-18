import { get } from 'lib/common/fetch'
import { render } from '../../../helpers'
import { waitFor, screen } from '@testing-library/react'
import { StorageReport } from 'pages/project/[ref]/reports/storage'
import userEvent from '@testing-library/user-event'

beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  get.mockImplementation(async (_url) => [{ result: [] }])
})

test(`static elements`, async () => {
  render(<StorageReport />)
  await screen.findByText('Request Caching')
  await screen.findByText(/Last 24 hours/)
  await screen.findByText(/Custom/)
})

test('refresh button', async () => {
  render(<StorageReport />)
  await waitFor(() => expect(get).toBeCalled())
  get.mockReset()
  userEvent.click(await screen.findByText(/Refresh/))
  await waitFor(() => expect(get).toBeCalled())
})

test('append - top cache misses', async () => {
  get.mockImplementation(async (url) => {
    if (decodeURIComponent(url).includes('misses')) {
      return {
        result: [{ path: 'mypath', search: 'some-query', count: 22 }],
      }
    }
    return { result: [{ timestamp: new Date().toISOString(), miss_count: 123, hit_count: 123 }] }
  })
  render(<StorageReport />)
  await waitFor(() => expect(get).toBeCalled())
  await screen.findAllByText(/mypath/)
  await screen.findAllByText(/some\-query/)
  await screen.findAllByText(/22/)
})
