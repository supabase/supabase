import { prettyDOM, screen } from '@testing-library/react'

import { ApiReport } from 'pages/project/[ref]/reports/api-overview'
import { render } from '../../../helpers'

test(`Render static elements`, async () => {
  render(<ApiReport dehydratedState={{}} />)
  await screen.findByText('Total Requests')
  await screen.findByText('Response Errors')
  await screen.findByText('Response Speed')
  await screen.findByText('Network Traffic')
  await screen.findByText(/Last 24 hours/)
  await screen.findByText(/Add filter/)
  await screen.findByText(/All Requests/)
})
