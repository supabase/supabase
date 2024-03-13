import { get } from 'lib/common/fetch'
import { render } from '../../../helpers'
import { waitFor, screen } from '@testing-library/react'
import { ApiReport } from 'pages/project/[ref]/reports/api-overview'
import userEvent from '@testing-library/user-event'

beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  get.mockImplementation(async (_url) => [{ result: [] }])
})

test(`static elements`, async () => {
  render(<ApiReport />)
  await screen.findByText('Total Requests')
  await screen.findByText('Response Errors')
  await screen.findByText('Response Speed')
  await screen.findByText('Network Traffic')
  await screen.findByText(/Last 24 hours/)
  await screen.findByText(/Custom/)
})

test('refresh button', async () => {
  render(<ApiReport />)
  await waitFor(() => expect(get).toBeCalled())
  get.mockReset()
  userEvent.click(await screen.findByText(/Refresh/))
  await waitFor(() => expect(get).toBeCalled())
})

test('append - api request routes', async () => {
  get.mockImplementation(async (url) => {
    if (decodeURIComponent(url).includes('request.path')) {
      return {
        result: [
          { path: 'mypath', method: 'GET', status_code: 200, search: 'some-query', count: 22 },
        ],
      }
    }
    return { result: [{ timestamp: new Date().toISOString(), count: 123 }] }
  })
  render(<ApiReport />)
  await waitFor(() => expect(get).toBeCalled())
  await screen.findAllByText(/mypath/)
  await screen.findAllByText(/GET/)
  await screen.findAllByText(/200/)
  await screen.findAllByText(/some\-query/)
  await screen.findAllByText(/22/)
})

test('append - error routes', async () => {
  get.mockImplementation(async (url) => {
    const uri = decodeURIComponent(url)
    if (uri.includes('400')) {
      return {
        result: [
          { path: 'mypath', method: 'GET', status_code: 200, search: 'some-query', count: 22 },
        ],
      }
    }
    return { result: [{ timestamp: new Date().toISOString(), count: 123 }] }
  })
  render(<ApiReport />)
  await waitFor(() => expect(get).toBeCalled())
  await screen.findAllByText(/mypath/)
  await screen.findAllByText(/GET/)
  await screen.findAllByText(/200/)
  await screen.findAllByText(/some\-query/)
  await screen.findAllByText(/22/)
})
