import { screen } from '@testing-library/react'
import { beforeAll, test, vi } from 'vitest'

import { ApiReport } from 'pages/project/[ref]/reports/api-overview'
import { render } from '../../../helpers'

// [Joshen] Mock data for ApiReport is in __mocks__/hooks/useApiReport
// I don't think this is an ideal set up as the mock data is not clear in this file itself
// But this is the method that worked for me after hours of wrangling with jest.spyOn and jest.mock
// which for some reason none of them worked when I was trying to mock the data within the file itself
// I'd be keen to see how we can do this better if anyone is more familiar to jest 🙏

// Mock the common module to provide useParams with a project ref
vi.mock('common', async (importOriginal) => {
  const actual = await importOriginal()

  return {
    useParams: vi.fn().mockReturnValue({ ref: 'test-project-ref' }),
    isBrowser: false,
    useIsLoggedIn: vi.fn(),
    LOCAL_STORAGE_KEYS: (actual as any).LOCAL_STORAGE_KEYS,
  }
})

// Mock gotrue library
vi.mock('lib/gotrue', () => ({
  auth: { onAuthStateChange: vi.fn() },
}))

// Mock project detail query
vi.mock('data/projects/project-detail-query', async () => {
  return {
    useProjectDetailQuery: vi.fn().mockReturnValue({
      data: {
        id: 1,
        ref: 'test-project-ref',
        name: 'Test Project',
        status: 'ACTIVE_HEALTHY',
        postgrestStatus: 'ONLINE',
      },
      isLoading: false,
    }),
  }
})

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
  await screen.findByText(/Last 60 minutes/)
  await screen.findByText(/Add filter/)
  await screen.findByText(/All Requests/)
})
