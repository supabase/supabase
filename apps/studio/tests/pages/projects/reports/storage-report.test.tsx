import { screen } from '@testing-library/react'

import { render } from '../../../helpers'
import { StorageReport } from 'pages/project/[ref]/reports/storage'

// [Joshen] Mock data for ApiReport is in __mocks__/hooks/useStorageReport
// I don't think this is an ideal set up as the mock data is not clear in this file itself
// But this is the method that worked for me after hours of wrangling with jest.spyOn and jest.mock
// which for some reason none of them worked when I was trying to mock the data within the file itself
// I'd be keen to see how we can do this better if anyone is more familiar to jest 🙏

test.skip(`Render static elements`, async () => {
  render(<StorageReport dehydratedState={{}} />)
  await screen.findByText('Request Caching')
  await screen.findByText(/Last 24 hours/)
})

test.skip('Render top cache misses', async () => {
  render(<StorageReport dehydratedState={{}} />)
  await screen.findAllByText('/storage/v1/object/public/videos/marketing/tabTableEditor.mp4')
  await screen.findAllByText('2')
})
