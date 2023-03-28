import { get } from 'lib/common/fetch'
import { render } from '../../../helpers'
import { waitFor, screen } from '@testing-library/react'
import { ApiReport } from 'pages/project/[ref]/reports/api-overview'
import userEvent from '@testing-library/user-event'

beforeEach(() => {
  // reset mocks between tests
  get.mockReset()
  get.mockImplementation(async (_url) => [{ data: [] }])
})

test(`static elements`, async () => {
  render(<ApiReport />)
  await screen.findByText('Total Requests')
  await screen.findByText('Response Errors')
  await screen.findByText('Response Speed')
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
