import { screen } from '@testing-library/react'
import { test } from 'vitest'

import { ApiReport } from 'pages/project/[ref]/reports/api-overview'
import { customRender } from 'tests/lib/custom-render'

test(`Render static elements`, async () => {
  customRender(<ApiReport dehydratedState={{}} />)
  await screen.findByText('Total Requests')
  await screen.findByText('Response Errors')
  await screen.findByText('Response Speed')
  await screen.findByText('Network Traffic')
  await screen.findByText(/Last 10 minutes/)
  await screen.findByText(/Add filter/)
  await screen.findByText(/All Requests/)
})
