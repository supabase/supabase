import { screen } from '@testing-library/react'
import { beforeAll, test, vi } from 'vitest'

import { ApiReport } from 'pages/project/[ref]/reports/api-overview'
import { render } from 'tests/helpers'

// [Joshen] Mock data for ApiReport is in __mocks__/hooks/useApiReport
// I don't think this is an ideal set up as the mock data is not clear in this file itself
// But this is the method that worked for me after hours of wrangling with jest.spyOn and jest.mock
// which for some reason none of them worked when I was trying to mock the data within the file itself
// I'd be keen to see how we can do this better if anyone is more familiar to jest 🙏

beforeAll(() => {
  vi.mock('nuqs', async () => {
    let queryValue = 'example'
    return {
      useQueryState: () => [queryValue, (v: string) => (queryValue = v)],
      parseAsBoolean: {
        withDefault: () => true,
      },
    }
  })
})

test(`Render static elements`, async () => {
  render(<ApiReport dehydratedState={{}} />)
  await screen.findByText('Total Requests')
  await screen.findByText('Response Errors')
  await screen.findByText('Response Speed')
  await screen.findByText('Network Traffic')
  await screen.findByText(/Last 10 minutes/)
  await screen.findByText(/Add filter/)
  await screen.findByText(/All Requests/)
})
