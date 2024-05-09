import { screen } from '@testing-library/react'

import { ApiReport } from 'pages/project/[ref]/reports/api-overview'
import { render } from '../../../helpers'

test(`Render static elements`, async () => {
  render(<ApiReport />)
  await screen.findByText('Total Requests')
  await screen.findByText('Response Errors')
  await screen.findByText('Response Speed')
  await screen.findByText('Network Traffic')
  await screen.findByText(/Last 24 hours/)
  await screen.findByText(/Add filter/)
  await screen.findByText(/All Requests/)
})

test('Render Total Requests section', async () => {
  render(<ApiReport />)
  await screen.findAllByText('/rest/v1/')
  await screen.findAllByText('GET')
  await screen.findAllByText('200')
})

test('Render Response Errors section', async () => {
  render(<ApiReport />)
  await screen.findAllByText('/auth/v1/user')
  await screen.findAllByText('GET')
  await screen.findAllByText('403')
})
